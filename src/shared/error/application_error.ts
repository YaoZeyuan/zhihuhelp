export const AppErrorCode = {
  REQUEST_FAILED: 'REQUEST_FAILED',
  IMAGE_DOWNLOAD_FAILED: 'IMAGE_DOWNLOAD_FAILED',
  AUTH_COOKIE_INVALID: 'AUTH_COOKIE_INVALID',
  SIGNATURE_FAILED: 'SIGNATURE_FAILED',
  TASK_TIMEOUT: 'TASK_TIMEOUT',
  BATCH_FAILED: 'BATCH_FAILED',
  ENTITY_RESPONSE_EMPTY: 'ENTITY_RESPONSE_EMPTY',
  PAGINATION_RESPONSE_INVALID: 'PAGINATION_RESPONSE_INVALID',
  ENTITY_NOT_FOUND: 'ENTITY_NOT_FOUND',
  ENTITY_DELETED: 'ENTITY_DELETED',
  VERSION_CHECK_FAILED: 'VERSION_CHECK_FAILED',
  PERSIST_DATA_INVALID: 'PERSIST_DATA_INVALID',
  LOG_PAYLOAD_INVALID: 'LOG_PAYLOAD_INVALID',
} as const

export type AppErrorCodeValue = (typeof AppErrorCode)[keyof typeof AppErrorCode]

export class ApplicationError extends Error {
  readonly code: AppErrorCodeValue
  readonly cause?: unknown

  constructor(code: AppErrorCodeValue, message: string, cause?: unknown) {
    super(message)
    this.name = 'ApplicationError'
    this.code = code
    this.cause = cause
  }
}
