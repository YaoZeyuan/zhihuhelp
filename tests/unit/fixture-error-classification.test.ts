import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { AppErrorCode } from '../../src/shared/error/application_error'
import {
  classifyZhihuResponse,
  ZhihuResponseKind,
} from '../../src/shared/error/zhihu_response_classification'

type ErrorFixture = {
  data: {
    status?: number
    items?: unknown[]
    kind?: string
  }
}

function readFixture(name: string): ErrorFixture {
  const fixturePath = path.resolve(process.cwd(), 'fixtures', 'zhihu', 'errors', `${name}.json`)
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as ErrorFixture
}

describe('知乎错误 fixture 分类', () => {
  it('区分正常空列表、404 与已删除实体', () => {
    const emptyList = readFixture('empty-list')
    const notFound = readFixture('not-found')
    const deleted = readFixture('deleted')

    expect(classifyZhihuResponse({ payload: emptyList.data })).toEqual({
      kind: ZhihuResponseKind.EMPTY_LIST,
      recoverable: true,
    })
    expect(classifyZhihuResponse({ status: notFound.data.status })).toEqual({
      kind: ZhihuResponseKind.NOT_FOUND,
      errorCode: AppErrorCode.ENTITY_NOT_FOUND,
      recoverable: true,
    })
    expect(classifyZhihuResponse({ status: deleted.data.status })).toEqual({
      kind: ZhihuResponseKind.DELETED,
      errorCode: AppErrorCode.ENTITY_DELETED,
      recoverable: true,
    })
  })

  it('认证失败与其它 HTTP 错误不能被当作可恢复实体错误', () => {
    expect(classifyZhihuResponse({ status: 401 })).toMatchObject({
      kind: ZhihuResponseKind.AUTH_INVALID,
      errorCode: AppErrorCode.AUTH_COOKIE_INVALID,
      recoverable: false,
    })
    expect(classifyZhihuResponse({ status: 500 })).toMatchObject({
      kind: ZhihuResponseKind.REQUEST_FAILED,
      errorCode: AppErrorCode.REQUEST_FAILED,
      recoverable: false,
    })
  })
})
