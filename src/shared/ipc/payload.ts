import { AppErrorCode, ApplicationError } from '~/src/shared/error/application_error'

export type DbRecordListRequest = {
  type: string
  pageNo: number
  pageSize: number
  parentId?: string
}

export type DbRecordExportRequest = {
  type: string
  parentId?: string
}

function requireRecord(payload: unknown, label: string): Record<string, unknown> {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ApplicationError(AppErrorCode.LOG_PAYLOAD_INVALID, `${label}必须是对象`)
  }
  return payload as Record<string, unknown>
}

export function parseDbRecordListPayload(payload: unknown): DbRecordListRequest {
  const { type, pageNo, pageSize, parentId } = requireRecord(payload, '数据库列表请求参数')
  if (
    typeof type !== 'string'
    || type.trim() === ''
    || Number.isInteger(pageNo) === false
    || Number(pageNo) < 0
    || Number.isInteger(pageSize) === false
    || Number(pageSize) < 1
    || Number(pageSize) > 1000
    || (parentId !== undefined && typeof parentId !== 'string')
  ) {
    throw new ApplicationError(AppErrorCode.LOG_PAYLOAD_INVALID, '数据库列表分页参数无效')
  }
  return {
    type,
    pageNo: pageNo as number,
    pageSize: pageSize as number,
    parentId: parentId as string | undefined,
  }
}

export function parseDbRecordExportPayload(payload: unknown): DbRecordExportRequest {
  const { type, parentId } = requireRecord(payload, '数据库导出参数')
  if (
    typeof type !== 'string'
    || type.trim() === ''
    || (parentId !== undefined && typeof parentId !== 'string')
  ) {
    throw new ApplicationError(AppErrorCode.LOG_PAYLOAD_INVALID, '数据库导出参数无效')
  }
  return {
    type,
    parentId: parentId as string | undefined,
  }
}

export function parseOpenLocalPathPayload(payload: unknown): string {
  const targetPath = requireRecord(payload, '打开路径参数').targetPath
  if (typeof targetPath !== 'string' || targetPath.trim() === '') {
    throw new ApplicationError(AppErrorCode.LOG_PAYLOAD_INVALID, '打开路径参数无效')
  }
  return targetPath
}
