import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

type TitleViolation = {
  file: string
  line: number
  title: string
  reason: string
}

type TitleVerificationResult = {
  fileCount: number
  titleCount: number
  violations: TitleViolation[]
}

type VerifyTestTitles = (options: { testRoot: string }) => TitleVerificationResult

const require = createRequire(import.meta.url)
const { verifyTestTitles } = require('../../scripts/tests/verify-test-titles.cjs') as {
  verifyTestTitles: VerifyTestTitles
}

describe('测试标题中文检查器', () => {
  let testRoot: string

  beforeEach(() => {
    testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zhihuhelp-test-titles-'))
  })

  afterEach(() => {
    fs.rmSync(testRoot, { recursive: true, force: true })
  })

  function writeTestFile(fileName: string, content: string): void {
    fs.writeFileSync(path.join(testRoot, fileName), content, 'utf8')
  }

  it('接受包含必要技术名词和参数占位符的中文标题', () => {
    writeTestFile(
      'valid.test.ts',
      [
        "describe('MarkdownGenerator 生成流程', () => {",
        "  it.each([1, 2])('保留参数值 %s', () => {})",
        '  test(`IPC 请求 ${value} 失败时返回中文诊断`, () => {})',
        '})',
      ].join('\n'),
    )

    const result = verifyTestTitles({ testRoot })

    expect(result).toMatchObject({ fileCount: 1, titleCount: 3, violations: [] })
  })

  it('识别条件构造器、扩展构造器、for 参数化调用和多行模板标题', () => {
    writeTestFile(
      'builders.test.ts',
      [
        "describe.skipIf(true)('条件套件仍使用中文标题', () => {})",
        "test.runIf(false)('条件测试仍使用中文标题', () => {})",
        'const extendedTest = test.extend({ value: 1 })',
        'extendedTest(`扩展测试使用中文标题`, () => {})',
        'test.for([1])(`多行模板',
        '标题保留参数 $0`, () => {})',
      ].join('\n'),
    )

    const result = verifyTestTitles({ testRoot })

    expect(result).toMatchObject({ fileCount: 1, titleCount: 3, violations: [] })
  })

  it('拒绝直接调用和参数化调用中的纯英文标题并报告位置', () => {
    writeTestFile(
      'invalid.test.tsx',
      `
        describe('english suite', () => {
          it.each([{ label: 'case' }])('$label stays English', () => {})
        })
      `,
    )

    const result = verifyTestTitles({ testRoot })

    expect(result.violations).toEqual([
      expect.objectContaining({ file: 'invalid.test.tsx', line: 2, title: 'english suite' }),
      expect.objectContaining({ file: 'invalid.test.tsx', line: 3, title: '$label stays English' }),
    ])
  })

  it('拒绝无法静态检查的动态标题', () => {
    writeTestFile(
      'dynamic.test.ts',
      ["const title = 'english title'", 'test(title, () => {})', "test.each([1])('参数化场景 %s', () => {})"].join(
        '\n',
      ),
    )

    const result = verifyTestTitles({ testRoot })

    expect(result).toMatchObject({ fileCount: 1, titleCount: 2 })
    expect(result.violations).toEqual([
      expect.objectContaining({
        file: 'dynamic.test.ts',
        line: 2,
        title: 'title',
        reason: '测试标题必须使用可静态检查的字符串或模板字符串',
      }),
    ])
  })
})
