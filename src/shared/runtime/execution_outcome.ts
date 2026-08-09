import { LogStatus, SerializedError } from '~/src/shared/logging/log_contract.js'
import { AppErrorCode } from '~/src/shared/error/application_error.js'

export type ExecutionFailure = {
  entityType?: string
  entityId?: string
  taskType?: string
  error: SerializedError
}

export type ExecutionOutcome = {
  status: typeof LogStatus.SUCCESS | typeof LogStatus.PARTIAL_SUCCESS
  successCount: number
  failureCount: number
  failures: ExecutionFailure[]
}

export function createSuccessOutcome(successCount = 0): ExecutionOutcome {
  return {
    status: LogStatus.SUCCESS,
    successCount,
    failureCount: 0,
    failures: [],
  }
}

export function createPartialOutcome(successCount: number, failures: ExecutionFailure[]): ExecutionOutcome {
  return {
    status: LogStatus.PARTIAL_SUCCESS,
    successCount,
    failureCount: failures.length,
    failures,
  }
}

export function isExecutionOutcome(value: unknown): value is ExecutionOutcome {
  if (value === null || typeof value !== 'object') {
    return false
  }
  const record = value as Partial<ExecutionOutcome>
  return (
    (record.status === LogStatus.SUCCESS || record.status === LogStatus.PARTIAL_SUCCESS) &&
    typeof record.successCount === 'number' &&
    typeof record.failureCount === 'number' &&
    Array.isArray(record.failures)
  )
}

export function mergeExecutionOutcomes(outcomeList: ExecutionOutcome[]): ExecutionOutcome {
  const successCount = outcomeList.reduce((total, outcome) => total + outcome.successCount, 0)
  const failures = outcomeList.flatMap((outcome) => outcome.failures)
  return failures.length > 0 ? createPartialOutcome(successCount, failures) : createSuccessOutcome(successCount)
}

const RECOVERABLE_ENTITY_ERROR_CODE_SET = new Set<string>([
  AppErrorCode.ENTITY_RESPONSE_EMPTY,
  AppErrorCode.ENTITY_NOT_FOUND,
  AppErrorCode.ENTITY_DELETED,
])

export function isRecoverableExecutionFailure(failure: ExecutionFailure): boolean {
  return typeof failure.error.code === 'string' && RECOVERABLE_ENTITY_ERROR_CODE_SET.has(failure.error.code)
}

export function hasFatalExecutionFailure(failures: ExecutionFailure[]): boolean {
  return failures.some((failure) => isRecoverableExecutionFailure(failure) === false)
}
