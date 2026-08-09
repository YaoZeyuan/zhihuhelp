import {
  LOG_SCHEMA_VERSION,
  LogLevel,
  LogSource,
  LogStatus,
  type StructuredLogRecord,
} from '~/src/shared/logging/log_contract.js'
import { parseJsonlRecords } from '~/src/shared/logging/output_history.js'

function isStructuredBackendRecord(record: Record<string, unknown>): record is StructuredLogRecord {
  return (
    record.schemaVersion === LOG_SCHEMA_VERSION &&
    record.source === LogSource.BACKEND &&
    typeof record.triggerAt === 'string' &&
    typeof record.eventCode === 'string' &&
    typeof record.level === 'string' &&
    typeof record.message === 'string'
  )
}

export function buildRuntimeSessionErrorList(
  eventList: Record<string, unknown>[],
  sessionStartedAt: number,
): StructuredLogRecord[] {
  if (Number.isFinite(sessionStartedAt) === false || sessionStartedAt < 0) {
    return []
  }

  return eventList
    .map((event, index) => ({
      event,
      index,
      triggerAt: typeof event.triggerAt === 'string' ? Date.parse(event.triggerAt) : Number.NaN,
    }))
    .filter(({ event, triggerAt }) => {
      if (
        isStructuredBackendRecord(event) === false ||
        Number.isFinite(triggerAt) === false ||
        triggerAt < sessionStartedAt ||
        event.status === LogStatus.PARTIAL_SUCCESS
      ) {
        return false
      }
      return event.level === LogLevel.ERROR || event.status === LogStatus.FAILURE
    })
    .sort((left, right) => right.triggerAt - left.triggerAt || right.index - left.index)
    .map(({ event }) => event as StructuredLogRecord)
}

export function parseRuntimeSessionErrorList(content: string, sessionStartedAt: number): StructuredLogRecord[] {
  return buildRuntimeSessionErrorList(parseJsonlRecords(content), sessionStartedAt)
}
