import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveStaticApiPath } from '../../scripts/docs/static-api-plugin'

describe('documentation development API mapping', () => {
  const apiRoot = path.resolve('api')

  it('maps the version endpoint and ignores its cache-busting query', () => {
    expect(resolveStaticApiPath(apiRoot, '/api/zhihuhelp/version?now=2026-08-09')).toBe(
      path.resolve(apiRoot, 'zhihuhelp', 'version'),
    )
  })

  it.each(['/guide/', '/api/', '/api/../package.json', '/api/%2e%2e/package.json', '/api/%E0%A4%A'])('rejects unrelated or unsafe paths: %s', (url) => {
    expect(resolveStaticApiPath(apiRoot, url)).toBeUndefined()
  })
})
