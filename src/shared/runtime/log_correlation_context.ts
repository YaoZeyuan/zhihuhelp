import { AsyncLocalStorage } from 'node:async_hooks'

export type LogCorrelationContext = {
  traceId?: string
  runId?: string
  jobId?: string
}

const logCorrelationStorage = new AsyncLocalStorage<LogCorrelationContext>()

export function getLogCorrelationContext(): LogCorrelationContext {
  return logCorrelationStorage.getStore() ?? {}
}

export function runWithLogCorrelation<T>(
  context: LogCorrelationContext,
  handler: () => T,
): T {
  const current = getLogCorrelationContext()
  const next: LogCorrelationContext = {
    traceId: context.traceId ?? current.traceId,
    runId: context.runId ?? current.runId,
    jobId: context.jobId ?? current.jobId,
  }
  return logCorrelationStorage.run(next, handler)
}
