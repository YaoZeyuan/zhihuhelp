import { describe, expect, it } from 'vitest'
import { ApplicationError } from '../../src/shared/error/application_error'
import { assertIpcResponseSucceeded } from '../../src/shared/ipc/result'

describe('IPC 响应结果契约', () => {
  it('将已返回的业务失败转换为被拒绝的 IPC 操作', () => {
    expect(() => assertIpcResponseSucceeded({
      status: 'failure',
      message: 'JSON schema 不匹配，无法导入。',
    }, 'import-db-record-json')).toThrowError(ApplicationError)
  })

  it.each(['success', 'partial_success', 'canceled'])('保持 %s 为正常返回的响应', (status) => {
    const response = { status }
    expect(assertIpcResponseSucceeded(response, 'example')).toBe(response)
  })
})
