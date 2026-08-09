import { describe, expect, it } from 'vitest'
import {
  parseDbRecordExportPayload,
  parseDbRecordListPayload,
  parseOpenLocalPathPayload,
  parseRuntimeSessionErrorsPayload,
} from '../../src/shared/ipc/payload'
import { AppErrorCode } from '../../src/shared/error/application_error'

describe('IPC 载荷校验', () => {
  it('接受从零开始的数据库第一页', () => {
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
  ])('拒绝无效的数据库分页载荷 %#', (payload) => {
    expect(() => parseDbRecordListPayload(payload)).toThrowError(
      expect.objectContaining({ code: AppErrorCode.LOG_PAYLOAD_INVALID }),
    )
  })

  it('校验导出和本地路径载荷', () => {
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

  it('只接受有效的本会话错误查询起点', () => {
    expect(parseRuntimeSessionErrorsPayload({ since: 1_786_118_400_000 })).toEqual({
      since: 1_786_118_400_000,
    })
    for (const payload of [null, {}, { since: -1 }, { since: Number.NaN }, { since: 'now' }]) {
      expect(() => parseRuntimeSessionErrorsPayload(payload)).toThrowError(
        expect.objectContaining({ code: AppErrorCode.LOG_PAYLOAD_INVALID }),
      )
    }
  })
})
