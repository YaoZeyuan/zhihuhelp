import { AppErrorCode, ApplicationError } from '~/src/shared/error/application_error'

/**
 * Parse a Zhihu paginated response without conflating a malformed payload with
 * a legitimate empty page. Only an explicit array in `data` is accepted.
 */
export function assertZhihuPaginatedData<T>(payload: unknown, source: string): T[] {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createInvalidPaginationResponseError(source)
  }

  const data = (payload as Record<string, unknown>).data
  if (Array.isArray(data) === false) {
    throw createInvalidPaginationResponseError(source)
  }

  return data as T[]
}

/**
 * Validate a count used to schedule paginated requests.
 *
 * A missing or malformed count must not be treated as zero: doing so would
 * silently turn an invalid entity response into a successful empty fetch.
 */
export function assertZhihuNonNegativeIntegerCount(value: unknown, source: string): number {
  if (typeof value !== 'number' || Number.isFinite(value) === false || Number.isInteger(value) === false || value < 0) {
    throw new ApplicationError(
      AppErrorCode.PAGINATION_RESPONSE_INVALID,
      `${source} is missing a valid non-negative integer count`,
    )
  }

  return value
}

function createInvalidPaginationResponseError(source: string): ApplicationError {
  return new ApplicationError(
    AppErrorCode.PAGINATION_RESPONSE_INVALID,
    `${source} 分页响应缺少有效的 data 数组`,
  )
}
