import {
  createStructuredLogRecord,
  LOG_SCHEMA_VERSION,
  LogEventCode,
  LogLevel,
  LogSource,
  LogStage,
  LogStatus,
  sanitizeLogValue,
  serializeLogError,
} from '../../src/shared/logging/log_contract'
import { describe, expect, it } from 'vitest'

describe('structured log contract', () => {
  it('adds schema, timestamp, event code and backend source defaults', () => {
    const record = createStructuredLogRecord(
      {
        level: LogLevel.INFO,
        stage: LogStage.FETCH,
        status: LogStatus.START,
        message: 'fetch started',
        traceId: 'trace-1',
        runId: 'run-1',
        jobId: 'job-1',
      },
      '2026-08-08T01:02:03.000Z',
    )

    expect(record).toMatchObject({
      schemaVersion: LOG_SCHEMA_VERSION,
      triggerAt: '2026-08-08T01:02:03.000Z',
      eventCode: LogEventCode.FETCH_START,
      source: LogSource.BACKEND,
      traceId: 'trace-1',
      runId: 'run-1',
      jobId: 'job-1',
    })
  })

  it('recursively redacts secrets, response content, query strings and long text', () => {
    const circular: Record<string, unknown> = {
      cookie: 'd_c0=secret-cookie',
      nested: {
        Authorization: 'Bearer secret-token',
        accessToken: 'camel-secret',
        cookieContent: 'cookie-secret',
        xZse96: 'signature-secret',
        requestHeaders: { custom: 'secret-header' },
        responseBody: { payload: 'private-object-body' },
        responseData: ['private-array-body'],
        url: 'https://www.zhihu.com/api/v4/test?token=secret',
        description: 'x'.repeat(800),
      },
    }
    circular.self = circular

    const sanitized = sanitizeLogValue(circular) as Record<string, any>
    expect(sanitized.cookie).toBe('[REDACTED]')
    expect(sanitized.nested.Authorization).toBe('[REDACTED]')
    expect(sanitized.nested.requestHeaders).toBe('[REDACTED]')
    expect(sanitized.nested.responseBody).toBe('[REDACTED]')
    expect(sanitized.nested.responseData).toBe('[REDACTED]')
    expect(sanitized.nested.accessToken).toBe('[REDACTED]')
    expect(sanitized.nested.cookieContent).toBe('[REDACTED]')
    expect(sanitized.nested.xZse96).toBe('[REDACTED]')
    expect(sanitized.nested.url).toBe('https://www.zhihu.com/api/v4/test?[REDACTED]')
    expect(sanitized.nested.description).toContain('truncated')
    expect(sanitized.self).toBe('[Circular]')
    expect(JSON.stringify(sanitized)).not.toContain('secret-cookie')
    expect(JSON.stringify(sanitized)).not.toContain('secret-token')
  })

  it('serializes Error and non-Error failures without throwing', () => {
    const error = Object.assign(new Error('request failed'), { code: 'E_TEST' })
    expect(serializeLogError(error)).toMatchObject({
      name: 'Error',
      message: 'request failed',
      code: 'E_TEST',
    })
    expect(serializeLogError({ reason: 'failed' })).toMatchObject({
      name: 'NonError',
    })
    expect(serializeLogError({ cookieContent: 'plain-secret', responseBody: { text: 'private' } }).message).not.toContain(
      'plain-secret',
    )
  })
})
