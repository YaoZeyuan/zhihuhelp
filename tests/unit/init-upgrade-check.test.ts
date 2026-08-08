import { afterEach, describe, expect, it, vi } from 'vitest'
import semver from 'semver'
import InitWorkflow from '../../src/application/workflow/init/init_workflow'
import http from '../../src/library/http'
import Logger from '../../src/library/logger'
import { AppErrorCode } from '../../src/shared/error/application_error'
import { LogEventCode, LogStatus } from '../../src/shared/logging/log_contract'
import { RunContext } from '../../src/shared/runtime/run_context'

function createContext(): RunContext {
  return {
    runId: 'init-upgrade-run',
    traceId: 'init-upgrade-trace',
    configPath: 'unused-config.json',
    databasePath: 'unused.sqlite',
    outputPath: 'unused-output',
    cachePath: 'unused-cache',
    logPath: 'unused-log',
    skipUpgradeCheck: false,
    trigger: 'cli',
    outcomeStatus: LogStatus.SUCCESS,
  }
}

async function runUpgradeCheck(context: RunContext): Promise<void> {
  const workflow = new InitWorkflow() as unknown as {
    checkUpgrade(runContext: RunContext): Promise<void>
  }
  await workflow.checkUpgrade(context)
}

describe('InitWorkflow upgrade response validation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    ['a response without version', {}],
    ['an invalid semver version', { version: 'latest' }],
  ])('continues initialization with partial_success for %s', async (_label, payload) => {
    vi.spyOn(http.rawInstance, 'get').mockResolvedValue({ data: payload } as never)
    const eventSpy = vi.spyOn(Logger, 'event').mockReturnValue({} as never)
    const context = createContext()

    await expect(runUpgradeCheck(context)).resolves.toBeUndefined()

    expect(context.outcomeStatus).toBe(LogStatus.PARTIAL_SUCCESS)
    expect(eventSpy).toHaveBeenLastCalledWith(expect.objectContaining({
      eventCode: LogEventCode.INIT_PARTIAL_SUCCESS,
      status: LogStatus.PARTIAL_SUCCESS,
      errorCode: AppErrorCode.VERSION_CHECK_FAILED,
      error: expect.objectContaining({ code: AppErrorCode.VERSION_CHECK_FAILED }),
    }))
  })

  it('also recovers when semver comparison itself throws', async () => {
    vi.spyOn(http.rawInstance, 'get').mockResolvedValue({ data: { version: '99.0.0' } } as never)
    vi.spyOn(semver, 'gt').mockImplementation(() => {
      throw new Error('semver comparison failed')
    })
    const eventSpy = vi.spyOn(Logger, 'event').mockReturnValue({} as never)
    const context = createContext()

    await expect(runUpgradeCheck(context)).resolves.toBeUndefined()

    expect(context.outcomeStatus).toBe(LogStatus.PARTIAL_SUCCESS)
    expect(eventSpy).toHaveBeenLastCalledWith(expect.objectContaining({
      errorCode: AppErrorCode.VERSION_CHECK_FAILED,
      status: LogStatus.PARTIAL_SUCCESS,
    }))
  })
})
