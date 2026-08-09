import { describe, expect, it } from 'vitest'
import {
  parseDbRecordExportPayload,
  parseDbRecordListPayload,
  parseOpenLocalPathPayload,
} from '../../src/shared/ipc/payload'
import { AppErrorCode } from '../../src/shared/error/application_error'

describe('IPC payload validation', () => {
  it('accepts the zero-based first database page', () => {
    expect(parseDbRecordListPayload({ type: 'answer', pageNo: 0, pageSize: 20 })).toEqual({
      type: 'answer',
      pageNo: 0,
      pageSize: 20,
      parentId: undefined,
    })
  })

  it.each([
    null,
    { type: 'answer', pageNo: -1, pageSize: 20 },
    { type: 'answer', pageNo: 0.5, pageSize: 20 },
    { type: 'answer', pageNo: 0, pageSize: 0 },
    { type: 'answer', pageNo: 0, pageSize: 1001 },
  ])('rejects an invalid database page payload %#', (payload) => {
    expect(() => parseDbRecordListPayload(payload)).toThrowError(
      expect.objectContaining({ code: AppErrorCode.LOG_PAYLOAD_INVALID }),
    )
  })

  it('validates export and local-path payloads', () => {
    expect(parseDbRecordExportPayload({ type: 'article', parentId: 'author-1' })).toEqual({
      type: 'article',
      parentId: 'author-1',
    })
    expect(parseOpenLocalPathPayload({ targetPath: 'D:\\output\\book.epub' })).toBe(
      'D:\\output\\book.epub',
    )
    expect(() => parseOpenLocalPathPayload({ targetPath: '' })).toThrowError(
      expect.objectContaining({ code: AppErrorCode.LOG_PAYLOAD_INVALID }),
    )
  })
})
