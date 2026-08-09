import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateFixtureEnvelope } from '../helpers/fixture'

const { validateFixture } = require('../../scripts/tests/runtime.cjs') as {
  validateFixture: (value: unknown, source: Record<string, unknown>) => boolean
}

const fixtureRoot = path.resolve(__dirname, '../../fixtures/zhihu')

describe('fixture 契约', () => {
  it('校验全部内置错误和采集 fixture 及其校验和', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'sources.json'), 'utf8')) as {
      sources: Array<Record<string, unknown> & { name: string }>
    }
    const sourceMap = new Map(manifest.sources.map((source) => [source.name, source]))
    const directoryList = ['errors', 'online'].filter((directoryName) =>
      fs.existsSync(path.join(fixtureRoot, directoryName)),
    )
    let fixtureCount = 0
    for (const directoryName of directoryList) {
      const directoryPath = path.join(fixtureRoot, directoryName)
      const fileList = fs.readdirSync(directoryPath).filter((fileName) => fileName.endsWith('.json'))
      fixtureCount += fileList.length
      for (const fileName of fileList) {
        const value = JSON.parse(fs.readFileSync(path.join(directoryPath, fileName), 'utf8'))
        expect(() => validateFixtureEnvelope(value)).not.toThrow()
        if (directoryName === 'online') {
          const source = sourceMap.get(path.basename(fileName, '.json'))
          expect(source, `missing manifest source for ${fileName}`).toBeDefined()
          expect(validateFixture(value, source as Record<string, unknown>), fileName).toBe(true)
        }
        const serialized = JSON.stringify(value)
        expect(serialized).not.toMatch(/d_c0=|authorization["':]|set-cookie|x-zse/i)
      }
    }
    expect(fixtureCount).toBeGreaterThanOrEqual(3)
  })

  it('使用唯一的知乎 HTTPS 来源，并将可选的 404 收藏夹保留为离线测试', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'sources.json'), 'utf8')) as {
      schemaVersion: number
      sources: Array<{ name: string; url: string; online: boolean; pageOffsets?: number[] }>
    }
    expect(manifest.schemaVersion).toBe(1)
    expect(new Set(manifest.sources.map((item) => item.name)).size).toBe(manifest.sources.length)
    for (const source of manifest.sources) {
      const sourceUrl = new URL(source.url)
      expect(sourceUrl.protocol).toBe('https:')
      expect(sourceUrl.hostname === 'www.zhihu.com' || sourceUrl.hostname === 'zhuanlan.zhihu.com').toBe(true)
      expect(source.pageOffsets?.every((offset) => Number.isInteger(offset) && offset >= 0) ?? true).toBe(true)
    }
    expect(manifest.sources.find((item) => item.name === 'collection-empty-or-not-found')?.online).toBe(false)
  })
})
