import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LogEventCode, LogSource, LogStatus } from '../../src/shared/logging/log_contract'
import DebugLog from '../../client/src/library/debug_log'

function installElectronApi(methodMap: Record<string, unknown>) {
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    writable: true,
    value: methodMap,
  })
}

describe('frontend structured logging', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(async () => {
    await DebugLog.flush()
    vi.useRealTimers()
  })

  it('batches IPC start and terminal records after 500ms and propagates one trace id', async () => {
    const appendBatch = vi.fn().mockResolvedValue({ acceptedCount: 2 })
    const getConfig = vi.fn().mockResolvedValue({
      request: {
        cookie: 'secret-cookie',
      },
      responseBody: 'private-response',
    })
    installElectronApi({
      'append-frontend-log-batch': appendBatch,
      'get-common-config': getConfig,
    })

    await DebugLog.invokeElectronApi('get-common-config')
    expect(appendBatch).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(500)

    expect(appendBatch).toHaveBeenCalledTimes(1)
    const payload = appendBatch.mock.calls[0][0]
    expect(payload.records).toHaveLength(2)
    expect(payload.records.map((record: any) => record.eventCode)).toEqual([
      LogEventCode.FRONTEND_IPC_START,
      LogEventCode.FRONTEND_IPC_SUCCESS,
    ])
    expect(payload.records.map((record: any) => record.status)).toEqual([LogStatus.START, LogStatus.SUCCESS])
    expect(payload.records.every((record: any) => record.source === LogSource.FRONTEND)).toBe(true)
    expect(payload.records[0].traceId).toBe(payload.records[1].traceId)
    expect(payload.records[1].details.response).toEqual({
      type: 'object',
      keys: ['request', 'responseBody'],
      dataType: 'undefined',
    })
    expect(JSON.stringify(payload.records[1])).not.toContain('secret-cookie')
    expect(JSON.stringify(payload.records[1])).not.toContain('private-response')
    expect(getConfig.mock.calls[0][0]).toEqual({
      __zhihuhelpTraceId: payload.records[0].traceId,
    })
  })

  it('flushes errors immediately without recording the passive log IPC recursively', async () => {
    const appendBatch = vi.fn().mockResolvedValue({ acceptedCount: 2 })
    const openDevtools = vi.fn().mockRejectedValue(new Error('failed'))
    installElectronApi({
      'append-frontend-log-batch': appendBatch,
      'open-devtools': openDevtools,
    })

    await expect(DebugLog.invokeElectronApi('open-devtools')).rejects.toThrow('failed')

    expect(appendBatch).toHaveBeenCalledTimes(1)
    const payload = appendBatch.mock.calls[0][0]
    expect(payload.records).toHaveLength(2)
    expect(payload.records[1]).toMatchObject({
      eventCode: LogEventCode.FRONTEND_IPC_FAILURE,
      status: LogStatus.FAILURE,
    })
    expect(payload.records.some((record: any) => record.details?.channel === 'append-frontend-log-batch')).toBe(false)
  })

  it('flushes at 20 records and keeps each serialized record within 64 KiB', async () => {
    const appendBatch = vi.fn().mockResolvedValue({ acceptedCount: 20 })
    installElectronApi({
      'append-frontend-log-batch': appendBatch,
    })

    for (let index = 0; index < 19; index++) {
      DebugLog.append({
        level: 'info',
        channel: 'test',
        message: `record-${index}`,
      })
    }
    expect(appendBatch).not.toHaveBeenCalled()

    DebugLog.append({
      level: 'info',
      channel: 'test',
      message: 'record-19',
      details: {
        cookie: 'secret-cookie',
        longText: 'x'.repeat(100_000),
      },
    })

    expect(appendBatch).toHaveBeenCalledTimes(1)
    const payload = appendBatch.mock.calls[0][0]
    expect(payload.records).toHaveLength(20)
    expect(payload.records[19].details.cookie).toBe('[REDACTED]')
    for (const record of payload.records) {
      expect(new TextEncoder().encode(JSON.stringify(record)).byteLength).toBeLessThanOrEqual(64 * 1024)
    }
  })

  it('keeps a rejected batch in the in-memory fallback when the backend accepts zero records', async () => {
    const appendBatch = vi.fn().mockResolvedValue({ acceptedCount: 0 })
    installElectronApi({
      'append-frontend-log-batch': appendBatch,
    })
    DebugLog.append({ level: 'error', channel: 'test', message: 'must survive' })
    await vi.runAllTimersAsync()

    expect(appendBatch).toHaveBeenCalledTimes(1)
    expect(DebugLog.getFailedRecordCount()).toBeGreaterThan(0)
  })
})
