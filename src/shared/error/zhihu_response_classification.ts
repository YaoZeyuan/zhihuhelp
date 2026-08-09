import { AppErrorCode, AppErrorCodeValue } from '~/src/shared/error/application_error.js'

export const ZhihuResponseKind = {
  OK: 'ok',
  EMPTY_LIST: 'empty_list',
  NOT_FOUND: 'not_found',
  DELETED: 'deleted',
  AUTH_INVALID: 'auth_invalid',
  REQUEST_FAILED: 'request_failed',
} as const

export type ZhihuResponseClassification = {
  kind: (typeof ZhihuResponseKind)[keyof typeof ZhihuResponseKind]
  errorCode?: AppErrorCodeValue
  recoverable: boolean
}

/**
 * 将 HTTP 状态和最小响应语义统一映射为稳定的业务分类。
 * 在线 runner、离线 fixture 与生产请求共用这套规则，避免“未抛错即成功”。
 */
export function classifyZhihuResponse(input: {
  status?: unknown
  payload?: unknown
}): ZhihuResponseClassification {
  if (input.status === 404) {
    return {
      kind: ZhihuResponseKind.NOT_FOUND,
      errorCode: AppErrorCode.ENTITY_NOT_FOUND,
      recoverable: true,
    }
  }
  if (input.status === 410) {
    return {
      kind: ZhihuResponseKind.DELETED,
      errorCode: AppErrorCode.ENTITY_DELETED,
      recoverable: true,
    }
  }
  if (input.status === 401 || input.status === 403) {
    return {
      kind: ZhihuResponseKind.AUTH_INVALID,
      errorCode: AppErrorCode.AUTH_COOKIE_INVALID,
      recoverable: false,
    }
  }
  if (isExplicitEmptyList(input.payload)) {
    return {
      kind: ZhihuResponseKind.EMPTY_LIST,
      recoverable: true,
    }
  }
  if (typeof input.status === 'number' && input.status >= 400) {
    return {
      kind: ZhihuResponseKind.REQUEST_FAILED,
      errorCode: AppErrorCode.REQUEST_FAILED,
      recoverable: false,
    }
  }
  return {
    kind: ZhihuResponseKind.OK,
    recoverable: true,
  }
}

function isExplicitEmptyList(payload: unknown): boolean {
  if (Array.isArray(payload)) {
    return payload.length === 0
  }
  if (payload === null || typeof payload !== 'object') {
    return false
  }
  const record = payload as Record<string, unknown>
  if (record.kind === ZhihuResponseKind.EMPTY_LIST && Array.isArray(record.items)) {
    return record.items.length === 0
  }
  return Array.isArray(record.data) && record.data.length === 0
}
