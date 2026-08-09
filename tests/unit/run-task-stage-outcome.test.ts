import { afterEach, describe, expect, it, vi } from 'vitest'
import RunTaskWorkflow from '../../src/application/workflow/run_task/run_task_workflow'
import Logger from '../../src/library/logger'
import { LogStatus } from '../../src/shared/logging/log_contract'

describe('RunTaskWorkflow 阶段局部结果', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    [LogStatus.PARTIAL_SUCCESS, LogStatus.PARTIAL_SUCCESS],
    [LogStatus.SUCCESS, LogStatus.SUCCESS],
  ] as const)(
    '上游上下文已为 partial_success 时仍独立记录 generate=%s',
    async (stageResult, expectedTerminal) => {
      const workflow = new RunTaskWorkflow()
      const eventSpy = vi.spyOn(Logger, 'event').mockImplementation(() => undefined as never)
      const context = {
        traceId: 'trace-stage-outcome',
        runId: 'run-stage-outcome',
        trigger: 'cli',
        outcomeStatus: LogStatus.PARTIAL_SUCCESS,
      } as any

      await (workflow as any).runStage(
        context,
        'generate',
        '生成电子书',
        async () => stageResult,
        {},
        'stage-generate-run',
      )

      const terminal = eventSpy.mock.calls
        .map(([entry]) => entry)
        .find((entry) => entry.jobId === 'stage-generate-run' && entry.status !== LogStatus.START)
      expect(terminal?.status).toBe(expectedTerminal)
      expect(context.outcomeStatus).toBe(LogStatus.PARTIAL_SUCCESS)
    },
  )
})
