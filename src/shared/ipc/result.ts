import { AppErrorCode, ApplicationError } from '~/src/shared/error/application_error'
import { LogStatus } from '~/src/shared/logging/log_contract'

type IpcResultRecord = {
  status?: unknown
  message?: unknown
}

/**
 * IPC handlers must reject business failures so both Electron and renderer
 * logging observe the same terminal state. User cancellations remain normal
 * resolved results.
 */
export function assertIpcResponseSucceeded<T>(response: T, channel: string): T {
  if (response === null || typeof response !== 'object') {
    return response
  }
  const result = response as IpcResultRecord
  if (result.status !== LogStatus.FAILURE) {
    return response
  }
  const message = typeof result.message === 'string' && result.message.trim() !== ''
    ? result.message
    : `IPC 请求返回失败：${channel}`
  throw new ApplicationError(AppErrorCode.REQUEST_FAILED, message)
}
