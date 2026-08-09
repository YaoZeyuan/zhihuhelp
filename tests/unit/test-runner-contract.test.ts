import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

type TestSource = {
  name: string
  sourceType: string
  online: boolean
  id?: string
  url?: string
  optional?: boolean
  pageOffsets?: number[]
}

const require = createRequire(import.meta.url)
const {
  TestResultStatus,
  checksum,
  selectSourcesForMode,
  summarizePageItem,
  validateEntitySourceResult,
  validateFixture,
  validatePaginatedSourceResult,
  validateRunSummary,
} = require('../../scripts/tests/runtime.cjs') as {
  TestResultStatus: { SUCCESS: string; EXPECTED_FAILURE: string }
  checksum: (data: unknown) => string
  selectSourcesForMode: (manifest: unknown, mode: 'online' | 'fixtures') => TestSource[]
  summarizePageItem: (item: unknown) => Record<string, unknown>
  validateEntitySourceResult: (source: TestSource, entity: unknown) => true
  validateFixture: (fixture: unknown, source?: TestSource) => boolean
  validatePaginatedSourceResult: (source: TestSource, pages: unknown) => true
  validateRunSummary: (summary: unknown, expectedSources: TestSource[], mode: 'online' | 'fixtures') => true
}

const manifest = {
  sources: [
    { name: 'answer-primary', sourceType: 'answer', online: true },
    { name: 'answer-secondary', sourceType: 'answer', online: true },
    { name: 'author-primary', sourceType: 'author', online: true },
    { name: 'author-abnormal', sourceType: 'author', online: true },
    { name: 'offline-error', sourceType: 'answer', online: false },
  ],
}

describe('CommonJS runner 的 ESM 加载契约', () => {
  const electronRunnerSource = readFileSync(
    new URL('../../scripts/tests/electron-online-runner.cjs', import.meta.url),
    'utf8',
  )
  const screenshotRunnerSource = readFileSync(
    new URL('../../scripts/docs/prepare-output-screenshot.cjs', import.meta.url),
    'utf8',
  )

  it('通过文件 URL 和原生动态 import 加载 ESM dist 模块', () => {
    for (const source of [electronRunnerSource, screenshotRunnerSource]) {
      expect(source).toContain("require('node:url')")
      expect(source).toContain('pathToFileURL(')
      expect(source).toContain('return import(moduleUrl)')
    }

    expect(electronRunnerSource).not.toContain("require(path.join(rootPath, 'dist'")
    expect(screenshotRunnerSource).not.toContain("require('../../dist")
  })

  it('保持 Electron runner 为 CommonJS 并指向 CommonJS 沙箱 preload', () => {
    expect(electronRunnerSource).toContain("require('electron')")
    expect(electronRunnerSource).toContain("'preload.cjs'")
    expect(electronRunnerSource).toContain('async function initializeRuntimeContract()')
    expect(electronRunnerSource).toContain('async function loadApi(sourceType)')
  })
})

describe('Electron 测试 runner 结果契约', () => {
  it('在线模式每种类型选择一个正常源，fixture 刷新时选择全部启用源', () => {
    expect(selectSourcesForMode(manifest, 'online').map((source) => source.name)).toEqual([
      'answer-primary',
      'author-primary',
    ])
    expect(selectSourcesForMode(manifest, 'fixtures').map((source) => source.name)).toEqual([
      'answer-primary',
      'answer-secondary',
      'author-primary',
      'author-abnormal',
    ])
  })

  it('在线模式不允许可选源挤占同类型必需源', () => {
    const selectionManifest = {
      sources: [
        { name: 'answer-optional', sourceType: 'answer', online: true, optional: true },
        { name: 'answer-required', sourceType: 'answer', online: true },
      ],
    }

    expect(selectSourcesForMode(selectionManifest, 'online').map((source) => source.name)).toEqual(['answer-required'])
  })

  it('要求完整且唯一的源摘要，并要求正常源成功', () => {
    const expectedSources = selectSourcesForMode(manifest, 'online')
    const completeSummary = expectedSources.map((source) => ({
      name: source.name,
      status: TestResultStatus.SUCCESS,
      durationMs: 1,
    }))

    expect(validateRunSummary(completeSummary, expectedSources, 'online')).toBe(true)
    expect(() => validateRunSummary(completeSummary.slice(0, 1), expectedSources, 'online')).toThrow(/source mismatch/)
    expect(() => validateRunSummary([completeSummary[0], completeSummary[0]], expectedSources, 'online')).toThrow(
      /source mismatch/,
    )
    expect(() =>
      validateRunSummary(
        completeSummary.map((item, index) =>
          index === 0 ? { ...item, status: TestResultStatus.EXPECTED_FAILURE } : item,
        ),
        expectedSources,
        'online',
      ),
    ).toThrow(/invalid status/)
  })

  it('允许明确异常的 fixture 源记录预期失败', () => {
    const expectedSources = selectSourcesForMode(manifest, 'fixtures')
    const summary = expectedSources.map((source) => ({
      name: source.name,
      status: source.name.includes('abnormal') ? TestResultStatus.EXPECTED_FAILURE : TestResultStatus.SUCCESS,
      durationMs: 0,
    }))

    expect(validateRunSummary(summary, expectedSources, 'fixtures')).toBe(true)
  })

  it('允许明确可选的源报告预期失败', () => {
    const optionalSource = {
      name: 'collection-optional',
      sourceType: 'collection',
      online: true,
      optional: true,
    }

    expect(
      validateRunSummary(
        [
          {
            name: optionalSource.name,
            status: TestResultStatus.EXPECTED_FAILURE,
            durationMs: 0,
          },
        ],
        [optionalSource],
        'online',
      ),
    ).toBe(true)
  })
})

describe('Electron 在线分页证据', () => {
  it('优先使用稳定 id 汇总直接或包装的列表记录，之后才回退到仅有 type', () => {
    expect(summarizePageItem({ id: 'answer-1', type: 'answer', content: '<p>body</p>' })).toEqual({
      id: 'answer-1',
      type: 'answer',
    })
    expect(summarizePageItem({ content: { id: 'pin-1', type: 'pin' } })).toEqual({
      id: 'pin-1',
      type: 'pin',
    })
    expect(summarizePageItem({ target: { type: 'answer' } })).toEqual({ type: 'answer' })
    expect(() => summarizePageItem({ content: '<p>body</p>' })).toThrow(/stable id or type/)
  })

  it('必需源要求第一页非空，但尊重 optional 标记', () => {
    const requiredSource = {
      name: 'author-required',
      sourceType: 'author',
      id: 'author-1',
      online: true,
      pageOffsets: [0],
    }
    const emptyPage = {
      sourceName: requiredSource.name,
      sourceType: requiredSource.sourceType,
      sourceId: requiredSource.id,
      offset: 0,
      limit: 1,
      itemCount: 0,
      items: [],
    }

    expect(() => validatePaginatedSourceResult(requiredSource, [emptyPage])).toThrow(/empty first page/)
    expect(validatePaginatedSourceResult({ ...requiredSource, optional: true }, [emptyPage])).toBe(true)
  })

  it('拒绝缺少稳定证据的页面摘要和页面来源不匹配', () => {
    const source = {
      name: 'question-required',
      sourceType: 'question',
      id: 'question-1',
      online: true,
      pageOffsets: [0],
    }
    const page = {
      sourceName: source.name,
      sourceType: source.sourceType,
      sourceId: source.id,
      offset: 0,
      limit: 1,
      itemCount: 1,
      items: [{}],
    }

    expect(() => validatePaginatedSourceResult(source, [page])).toThrow(/no stable id or type/)
    expect(() =>
      validatePaginatedSourceResult(source, [
        { ...page, sourceName: 'another-source', items: [{ id: 'answer-1', type: 'answer' }] },
      ]),
    ).toThrow(/source mismatch/)
  })

  it('校验收藏夹多页来源，并拒绝重复项或仅有 type 的项目', () => {
    const source = {
      name: 'collection-required',
      sourceType: 'collection',
      id: 'collection-1',
      online: true,
      pageOffsets: [0, 1],
    }
    const createPage = (offset: number, item: Record<string, unknown>) => ({
      sourceName: source.name,
      sourceType: source.sourceType,
      sourceId: source.id,
      offset,
      limit: 1,
      itemCount: 1,
      items: [item],
    })
    const firstPage = createPage(0, { id: 'article-1', type: 'article' })
    const secondPage = createPage(1, { id: 'pin-1', type: 'pin' })

    expect(validatePaginatedSourceResult(source, [firstPage, secondPage])).toBe(true)
    expect(() =>
      validatePaginatedSourceResult(source, [firstPage, createPage(1, { id: 'article-1', type: 'article' })]),
    ).toThrow(/duplicate item id/)
    expect(() => validatePaginatedSourceResult(source, [firstPage, createPage(1, { type: 'pin' })])).toThrow(
      /needs an id/,
    )
  })
})

describe('Electron 在线实体与 fixture 证据', () => {
  const authorSource = {
    name: 'author-jin-xu-liang',
    sourceType: 'author',
    id: 'jin-xu-liang',
    url: 'https://www.zhihu.com/people/jin-xu-liang',
    online: true,
    pageOffsets: [0],
  }

  it('清理前匹配原始用户 url_token', () => {
    expect(
      validateEntitySourceResult(authorSource, {
        id: 'author-hash',
        url_token: authorSource.id,
        type: 'people',
      }),
    ).toBe(true)
    expect(() =>
      validateEntitySourceResult(authorSource, {
        id: 'author-hash',
        url_token: 'another-author',
        type: 'people',
      }),
    ).toThrow(/does not match manifest source id/)
  })

  it('拒绝页面包含空摘要但 checksum 有效的在线 fixture', () => {
    const createPage = (items: Array<Record<string, unknown>>) => ({
      sourceName: authorSource.name,
      sourceType: authorSource.sourceType,
      sourceId: authorSource.id,
      offset: 0,
      limit: 1,
      itemCount: items.length,
      items,
    })
    const createFixture = (pages: unknown[]) => {
      const data = {
        entity: {
          id: 'author-hash',
          url_token: '[REDACTED]',
          type: 'people',
        },
        pages,
      }
      return {
        schemaVersion: 1,
        sourceType: authorSource.sourceType,
        sourceUrl: authorSource.url,
        capturedAt: '2026-08-08T00:00:00.000Z',
        checksum: checksum(data),
        data,
      }
    }

    expect(validateFixture(createFixture([createPage([{ id: 'answer-1', type: 'answer' }])]), authorSource)).toBe(true)
    expect(validateFixture(createFixture([createPage([{}])]), authorSource)).toBe(false)
  })
})
