import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveStaticApiPath } from '../../scripts/docs/static-api-plugin'

describe('文档开发 API 映射', () => {
  const apiRoot = path.resolve('api')

  it('映射版本端点并忽略其缓存失效查询参数', () => {
    expect(resolveStaticApiPath(apiRoot, '/api/zhihuhelp/version?now=2026-08-09')).toBe(
      path.resolve(apiRoot, 'zhihuhelp', 'version'),
    )
  })

  it.each(['/guide/', '/api/', '/api/../package.json', '/api/%2e%2e/package.json', '/api/%E0%A4%A'])('拒绝无关或不安全路径：%s', (url) => {
    expect(resolveStaticApiPath(apiRoot, url)).toBeUndefined()
  })
})
