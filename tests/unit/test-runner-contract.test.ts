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

describe('CommonJS runner ESM loading contract', () => {
  const electronRunnerSource = readFileSync(
    new URL('../../scripts/tests/electron-online-runner.cjs', import.meta.url),
    'utf8',
  )
  const screenshotRunnerSource = readFileSync(
    new URL('../../scripts/docs/prepare-output-screenshot.cjs', import.meta.url),
    'utf8',
  )

  it('loads ESM dist modules through file URLs and native dynamic import', () => {
    for (const source of [electronRunnerSource, screenshotRunnerSource]) {
      expect(source).toContain("require('node:url')")
      expect(source).toContain('pathToFileURL(')
      expect(source).toContain('return import(moduleUrl)')
    }

    expect(electronRunnerSource).not.toContain("require(path.join(rootPath, 'dist'")
    expect(screenshotRunnerSource).not.toContain("require('../../dist")
  })

  it('keeps the Electron runner in CommonJS and targets the CommonJS sandboxed preload', () => {
    expect(electronRunnerSource).toContain("require('electron')")
    expect(electronRunnerSource).toContain("'preload.cjs'")
    expect(electronRunnerSource).toContain('async function initializeRuntimeContract()')
    expect(electronRunnerSource).toContain('async function loadApi(sourceType)')
  })
})

describe('Electron test runner result contract', () => {
  it('selects one normal source per type online and all enabled sources during fixture refresh', () => {
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

  it('does not let an optional source displace a required source of the same type online', () => {
    const selectionManifest = {
      sources: [
        { name: 'answer-optional', sourceType: 'answer', online: true, optional: true },
        { name: 'answer-required', sourceType: 'answer', online: true },
      ],
    }

    expect(selectSourcesForMode(selectionManifest, 'online').map((source) => source.name)).toEqual(['answer-required'])
  })

  it('requires a complete unique source summary and successful normal sources', () => {
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

  it('allows an explicitly abnormal fixture source to record an expected failure', () => {
    const expectedSources = selectSourcesForMode(manifest, 'fixtures')
    const summary = expectedSources.map((source) => ({
      name: source.name,
      status: source.name.includes('abnormal') ? TestResultStatus.EXPECTED_FAILURE : TestResultStatus.SUCCESS,
      durationMs: 0,
    }))

    expect(validateRunSummary(summary, expectedSources, 'fixtures')).toBe(true)
  })

  it('allows an explicitly optional source to report an expected failure', () => {
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

describe('Electron online pagination evidence', () => {
  it('summarizes direct and wrapped list records with a stable id before type-only fallback', () => {
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

  it('requires a non-empty first page for required sources but honors the optional marker', () => {
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

  it('rejects page summaries without stable evidence and page provenance mismatches', () => {
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

  it('validates collection multi-page provenance and rejects duplicate or type-only items', () => {
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

describe('Electron online entity and fixture evidence', () => {
  const authorSource = {
    name: 'author-jin-xu-liang',
    sourceType: 'author',
    id: 'jin-xu-liang',
    url: 'https://www.zhihu.com/people/jin-xu-liang',
    online: true,
    pageOffsets: [0],
  }

  it('matches the raw author url_token before sanitization', () => {
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

  it('rejects a checksum-valid online fixture whose page contains an empty summary', () => {
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
