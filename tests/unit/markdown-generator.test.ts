import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  MarkdownGenerator,
  PANDOC_MARKDOWN_OPTIONS,
  prepareHtmlForMarkdown,
  type MarkdownConverter,
} from '../../src/application/workflow/generate/library/markdown/index.js'

const temporaryPaths: string[] = []

async function createTemporaryDirectory(): Promise<string> {
  const temporaryPath = await fs.mkdtemp(path.join(os.tmpdir(), 'zhihuhelp-markdown-'))
  temporaryPaths.push(temporaryPath)
  return temporaryPath
}

afterEach(async () => {
  await Promise.all(temporaryPaths.splice(0).map((temporaryPath) => (
    fs.rm(temporaryPath, { recursive: true, force: true })
  )))
})

describe('MarkdownGenerator', () => {
  it('runs the real default TypeScript Worker without falling back', async () => {
    const outputRootPath = await createTemporaryDirectory()
    const generator = new MarkdownGenerator()

    try {
      const result = await generator.generate({
        outputRootPath,
        bookBasename: 'real-worker-book',
        imageQuality: 'hd',
        sources: [{
          relativeHtmlPath: 'html/index.html',
          html: '<h1>真实 Worker 转换</h1><p>正文</p>',
        }],
      })

      expect(result).toMatchObject({ fileCount: 1, fallbackCount: 0, details: [] })
      await expect(fs.readFile(
        path.join(result.outputPath, 'html', 'index.md'),
        'utf8',
      )).resolves.toContain('# 真实 Worker 转换')
    } finally {
      await generator.dispose()
    }
  }, 120_000)

  it('converts Chinese rich HTML and mirrors every multi-file and single-file page', async () => {
    const outputRootPath = await createTemporaryDirectory()
    const directPandocConverter: MarkdownConverter = {
      async convert(html, options = PANDOC_MARKDOWN_OPTIONS) {
        const { convert } = await import('pandoc-wasm')
        const result = await convert({ ...options }, html, {})
        return { markdown: result.stdout, warnings: result.warnings }
      },
    }
    const generator = new MarkdownGenerator(directPandocConverter)

    const result = await generator.generate({
      outputRootPath,
      bookBasename: '中文测试书',
      imageQuality: 'hd',
      imageSourceMap: new Map([['../image/local.jpg', 'https://pic.example.com/original.jpg']]),
      sources: [
        {
          relativeHtmlPath: 'html/index.html',
          html: `<!doctype html><html><head>
            <style>.hidden { display: none }</style>
            <link rel="stylesheet" href="../css/main.css">
            <script>window.shouldNotRun = true</script>
            </head><body>
            <aside class="single-page-toc">不应进入 Markdown 的目录</aside>
            <h1 style="color:red">中文标题</h1>
            <ul><li>列表项目</li></ul>
            <table><thead><tr><th>列</th></tr></thead><tbody><tr><td>值</td></tr></tbody></table>
            <pre><code class="language-js">const answer = 42</code></pre>
            <img alt="远程图" src="../image/local.jpg">
            <a href="./chapter.html#第二节">下一章</a>
            </body></html>`,
        },
        {
          relativeHtmlPath: 'html/chapter.html',
          html: '<h2>第二章</h2><p>正文</p>',
        },
        {
          relativeHtmlPath: '单文件版/中文测试书.html',
          html: '<aside class="single-page-toc"><details>目录</details></aside><main><h1>全集</h1></main>',
        },
      ],
    })

    expect(result).toMatchObject({ fileCount: 3, fallbackCount: 0 })
    expect(result.files.map((file) => file.relativeMarkdownPath).sort()).toEqual([
      'html/chapter.md',
      'html/index.md',
      '单文件版/中文测试书.md',
    ])

    const indexMarkdown = await fs.readFile(path.join(result.outputPath, 'html', 'index.md'), 'utf8')
    const singleMarkdown = await fs.readFile(
      path.join(result.outputPath, '单文件版', '中文测试书.md'),
      'utf8',
    )
    expect(indexMarkdown).toContain('# 中文标题')
    expect(indexMarkdown).toMatch(/-\s+列表项目/)
    expect(indexMarkdown).toMatch(/\|\s*列\s*\|/)
    expect(indexMarkdown).toContain('const answer = 42')
    expect(indexMarkdown).toContain('https://pic.example.com/original.jpg')
    expect(indexMarkdown).toContain('./chapter.md#第二节')
    expect(indexMarkdown).not.toContain('window.shouldNotRun')
    expect(indexMarkdown).not.toContain('main.css')
    expect(indexMarkdown).not.toContain('不应进入 Markdown 的目录')
    expect(singleMarkdown).toContain('# 全集')
    expect(singleMarkdown).not.toContain('目录')
  }, 120_000)

  it('removes every image in no-image mode and restores mapped remote URLs otherwise', () => {
    const html = '<p><img alt="示例" src="../image/a.jpg"><img src=https://already.example/b.png></p>'
    expect(prepareHtmlForMarkdown(html, 'none')).not.toMatch(/<img\b/i)
    expect(prepareHtmlForMarkdown(html, 'raw', {
      '../image/a.jpg': 'https://pic.example.com/a.jpg',
    })).toContain('src="https://pic.example.com/a.jpg"')
    expect(prepareHtmlForMarkdown(html, 'raw')).toContain('https://already.example/b.png')
  })

  it('uses the failure suffix, reports fallback details, and rewrites links after all outcomes are known', async () => {
    const outputRootPath = await createTemporaryDirectory()
    const converter: MarkdownConverter = {
      async convert(html, options) {
        expect(options).toEqual(PANDOC_MARKDOWN_OPTIONS)
        if (html.includes('data-conversion-failure')) {
          throw new Error('fixture conversion failed')
        }
        return {
          markdown: '[损坏章节](./broken.html#anchor)',
          warnings: ['fixture warning'],
        }
      },
    }
    const generator = new MarkdownGenerator(converter)

    const result = await generator.generate({
      outputRootPath,
      bookBasename: 'fallback-book',
      imageQuality: 'none',
      sources: [
        {
          relativeHtmlPath: 'html/index.html',
          html: '<a href="./broken.html">损坏章节</a>',
        },
        {
          relativeHtmlPath: 'html/broken.html',
          html: '<article data-conversion-failure><a href="./index.html">返回目录</a><img src="x.jpg"></article>',
        },
      ],
    })

    expect(result).toMatchObject({ fileCount: 2, fallbackCount: 1 })
    expect(result.details).toEqual([
      expect.objectContaining({
        sourceRelativeHtmlPath: 'html/broken.html',
        relativeMarkdownPath: 'html/broken.pandoc-failed.md',
        errorMessage: 'fixture conversion failed',
      }),
    ])
    const indexMarkdown = await fs.readFile(path.join(result.outputPath, 'html', 'index.md'), 'utf8')
    const fallbackMarkdown = await fs.readFile(
      path.join(result.outputPath, 'html', 'broken.pandoc-failed.md'),
      'utf8',
    )
    expect(indexMarkdown).toContain('./broken.pandoc-failed.md#anchor')
    expect(fallbackMarkdown).toContain('href="./index.md"')
    expect(fallbackMarkdown).not.toMatch(/<img\b/i)
  })

  it('throws a real filesystem write error instead of reporting a fallback success', async () => {
    const temporaryDirectory = await createTemporaryDirectory()
    const outputRootPath = path.join(temporaryDirectory, 'not-a-directory')
    await fs.writeFile(outputRootPath, 'blocking file', 'utf8')
    const generator = new MarkdownGenerator({
      async convert() {
        return { markdown: '# converted', warnings: [] }
      },
    })

    await expect(generator.generate({
      outputRootPath,
      bookBasename: 'book',
      imageQuality: 'hd',
      sources: [{ relativeHtmlPath: 'html/index.html', html: '<h1>book</h1>' }],
    })).rejects.toThrow()
  })

  it('removes stale Markdown only from the current book after conversion finishes', async () => {
    const outputRootPath = await createTemporaryDirectory()
    const currentBookPath = path.join(outputRootPath, 'current-book')
    const otherBookFile = path.join(outputRootPath, 'other-book', 'html', 'keep.md')
    await fs.mkdir(path.join(currentBookPath, 'html'), { recursive: true })
    await fs.mkdir(path.dirname(otherBookFile), { recursive: true })
    await fs.writeFile(path.join(currentBookPath, 'html', 'stale.md'), 'stale', 'utf8')
    await fs.writeFile(otherBookFile, 'keep', 'utf8')
    const generator = new MarkdownGenerator({
      async convert() {
        return { markdown: '# fresh', warnings: [] }
      },
    })

    await generator.generate({
      outputRootPath,
      bookBasename: 'current-book',
      imageQuality: 'hd',
      sources: [{ relativeHtmlPath: 'html/fresh.html', html: '<h1>fresh</h1>' }],
    })

    await expect(fs.stat(path.join(currentBookPath, 'html', 'stale.md'))).rejects.toThrow()
    await expect(fs.readFile(path.join(currentBookPath, 'html', 'fresh.md'), 'utf8')).resolves.toBe('# fresh')
    await expect(fs.readFile(otherBookFile, 'utf8')).resolves.toBe('keep')
  })

  it('writes a clean cache mirror before replacing stale final output', async () => {
    const temporaryDirectory = await createTemporaryDirectory()
    const cacheRootPath = path.join(temporaryDirectory, 'cache')
    const outputRootPath = path.join(temporaryDirectory, 'output')
    const cacheBookPath = path.join(cacheRootPath, 'current-book')
    const outputBookPath = path.join(outputRootPath, 'current-book')
    const oldFinalFile = path.join(outputBookPath, 'html', 'old.md')
    const otherBookFile = path.join(outputRootPath, 'other-book', 'html', 'keep.md')
    await fs.mkdir(path.dirname(path.join(cacheBookPath, 'html', 'cache-stale.md')), { recursive: true })
    await fs.mkdir(path.dirname(oldFinalFile), { recursive: true })
    await fs.mkdir(path.dirname(otherBookFile), { recursive: true })
    await fs.writeFile(path.join(cacheBookPath, 'html', 'cache-stale.md'), 'cache stale', 'utf8')
    await fs.writeFile(oldFinalFile, 'old final', 'utf8')
    await fs.writeFile(otherBookFile, 'keep', 'utf8')
    let sawOldFinalDuringConversion = false
    const generator = new MarkdownGenerator({
      async convert() {
        sawOldFinalDuringConversion = await fs.readFile(oldFinalFile, 'utf8') === 'old final'
        return { markdown: '# fresh cache', warnings: [] }
      },
    })

    const result = await generator.generate({
      cacheRootPath,
      outputRootPath,
      bookBasename: 'current-book',
      imageQuality: 'hd',
      sources: [{ relativeHtmlPath: 'html/fresh.html', html: '<h1>fresh</h1>' }],
    })

    expect(sawOldFinalDuringConversion).toBe(true)
    expect(result.outputPath).toBe(outputBookPath)
    expect(result.files[0].outputPath).toBe(path.join(outputBookPath, 'html', 'fresh.md'))
    await expect(fs.readFile(path.join(cacheBookPath, 'html', 'fresh.md'), 'utf8')).resolves.toBe('# fresh cache')
    await expect(fs.readFile(path.join(outputBookPath, 'html', 'fresh.md'), 'utf8')).resolves.toBe('# fresh cache')
    await expect(fs.stat(path.join(cacheBookPath, 'html', 'cache-stale.md'))).rejects.toThrow()
    await expect(fs.stat(oldFinalFile)).rejects.toThrow()
    await expect(fs.readFile(otherBookFile, 'utf8')).resolves.toBe('keep')
  })

  it('rejects unsafe source paths and output collisions before conversion', async () => {
    const outputRootPath = await createTemporaryDirectory()
    let conversionCount = 0
    const generator = new MarkdownGenerator({
      async convert() {
        conversionCount += 1
        return { markdown: '', warnings: [] }
      },
    })

    await expect(generator.generate({
      outputRootPath,
      bookBasename: 'book',
      imageQuality: 'hd',
      sources: [{ relativeHtmlPath: '../secret.html', html: '' }],
    })).rejects.toThrow(/Unsafe relative HTML path/)
    await expect(generator.generate({
      outputRootPath,
      bookBasename: 'book',
      imageQuality: 'hd',
      sources: [
        { relativeHtmlPath: 'html/a:b.html', html: '' },
        { relativeHtmlPath: 'html/a?b.html', html: '' },
      ],
    })).rejects.toThrow(/output path collision/)
    expect(conversionCount).toBe(0)
  })

  it('rejects a fallback filename that collides with another converted output', async () => {
    const outputRootPath = await createTemporaryDirectory()
    const generator = new MarkdownGenerator({
      async convert(html) {
        if (html === 'fail') {
          throw new Error('expected failure')
        }
        return { markdown: html, warnings: [] }
      },
    })

    await expect(generator.generate({
      outputRootPath,
      bookBasename: 'book',
      imageQuality: 'hd',
      sources: [
        { relativeHtmlPath: 'html/a.html', html: 'fail' },
        { relativeHtmlPath: 'html/a.pandoc-failed.html', html: 'success' },
      ],
    })).rejects.toThrow(/collision after fallback/)
  })
})
