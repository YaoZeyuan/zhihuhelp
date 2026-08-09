import { describe, expect, it } from 'vitest'
import { ApplicationError } from '../../src/shared/error/application_error'
import { assertIpcResponseSucceeded } from '../../src/shared/ipc/result'

describe('IPC response result contract', () => {
  it('turns a resolved business failure into a rejected IPC operation', () => {
    expect(() => assertIpcResponseSucceeded({
      status: 'failure',
      message: 'JSON schema 不匹配，无法导入。',
    }, 'import-db-record-json')).toThrowError(ApplicationError)
  })

  it.each(['success', 'partial_success', 'canceled'])('keeps %s as a resolved response', (status) => {
    const response = { status }
    expect(assertIpcResponseSucceeded(response, 'example')).toBe(response)
  })
})
