import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EpubGenerator from '../../src/application/workflow/generate/library/epub_generator'
import HtmlRender from '../../src/application/workflow/generate/library/html_render'
import React from 'react'
import AdmZip from 'adm-zip'
import PathConfig from '../../src/config/path'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

describe('输出生成契约', () => {
  let sandbox: TestSandbox
  let originalCachePath: string
  let originalOutputPath: string
  let originalLogPath: string

  beforeEach(() => {
    sandbox = createTestSandbox('output-contract')
    originalCachePath = PathConfig.cachePath
    originalOutputPath = PathConfig.outputPath
    originalLogPath = PathConfig.logPath
    PathConfig.setCachePath(sandbox.cachePath)
    PathConfig.setOutputPath(sandbox.outputPath)
    PathConfig.setLogPath(sandbox.logPath)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    PathConfig.setCachePath(originalCachePath)
    PathConfig.setOutputPath(originalOutputPath)
    PathConfig.setLogPath(originalLogPath)
    vi.restoreAllMocks()
    sandbox.cleanup()
  })

  it('遵循仅 HTML 输出并将标题中的不安全字符限制在沙箱内', async () => {
    const generator = new EpubGenerator({
      bookname: '../A&B/:*? 测试书',
      imageQuilty: 'none',
    })
    generator.generateSinglePageHtml({ html: '<html><body>A &amp; B</body></html>' })

    const result = await generator.asyncGenerateEpub(['html'])

    expect(result.missingImageCount).toBe(0)
    expect(fs.existsSync(generator.htmlOutputPathUri)).toBe(true)
    expect(fs.existsSync(generator.epubOutputPathUri)).toBe(false)
    expect(generator.bookOutputPath).toBe(path.join(sandbox.outputPath, generator.outputBasename))
    expect(generator.htmlOutputPathUri).toBe(path.join(generator.bookOutputPath, 'html'))
    expect(generator.markdownOutputPathUri).toBe(path.join(generator.bookOutputPath, 'markdown'))
    expect(generator.epubOutputPathUri).toBe(
      path.join(generator.bookOutputPath, 'epub', `${generator.outputBasename}.epub`),
    )
    expect(path.basename(generator.epubOutputPathUri, '.epub')).toBe(
      path.basename(generator.bookOutputPath),
    )
    expect(path.basename(generator.bookOutputPath)).not.toMatch(/[<>:"/\\|?*]/)
    expect(generator.htmlCachePath).toBe(path.join(sandbox.cachePath, 'html', generator.outputBasename))
  })

  it('不将下载失败的图片加入 EPUB manifest', () => {
    const generator = new EpubGenerator({ bookname: 'missing-image', imageQuilty: 'hd' })
    const missingPath = path.join(sandbox.cachePath, 'does-not-exist.png')
    ;(generator.imgUriPool as Map<string, any>).set('fixture://missing.png', {
      realFilename: 'does-not-exist.png',
      fileCacheUri: missingPath,
    })

    expect(generator.copyImgToCache(generator.htmlCacheImgPath)).toEqual(['does-not-exist.png'])
    expect(generator.epub.opf.content).not.toContain('does-not-exist.png')
  })

  it('写出完整 EPUB 且将 mimetype 作为 ZIP 中首个未压缩条目', async () => {
    const generator = new EpubGenerator({ bookname: 'EPUB contract', imageQuilty: 'none' })
    generator.addHtml({ filename: 'chapter-1', title: 'Chapter 1', html: '<html><body>EPUB body marker</body></html>' })

    await generator.asyncGenerateEpub(['epub'])

    const archive = fs.readFileSync(generator.epubOutputPathUri)
    expect(archive.length).toBeGreaterThan(1024)
    expect(archive.readUInt32LE(0)).toBe(0x04034b50)
    expect(archive.readUInt16LE(8)).toBe(0)
    const nameLength = archive.readUInt16LE(26)
    expect(archive.subarray(30, 30 + nameLength).toString('utf8')).toBe('mimetype')
    const dataLength = archive.readUInt32LE(22)
    expect(archive.subarray(30 + nameLength, 30 + nameLength + dataLength).toString('utf8')).toBe(
      'application/epub+zip',
    )

    const zip = new AdmZip(archive)
    const entryNames = zip.getEntries().map((entry) => entry.entryName.replace(/\\/g, '/'))
    expect(entryNames).toEqual(
      expect.arrayContaining([
        'META-INF/container.xml',
        'OEBPS/content.opf',
        'OEBPS/toc.xhtml',
        'OEBPS/html/chapter-1.html',
      ]),
    )
    expect(zip.readAsText('OEBPS/html/chapter-1.html')).toContain('EPUB body marker')
    const opf = zip.readAsText('OEBPS/content.opf')
    expect(opf).toContain('href="html/chapter-1.html"')
    expect(opf).toMatch(/<itemref idref="index_\d+"/)
  })

  it('拒绝发布没有正文章节的 EPUB', async () => {
    const generator = new EpubGenerator({ bookname: 'empty EPUB', imageQuilty: 'none' })
    generator.generateSinglePageHtml({ html: '<html><body>HTML only</body></html>' })

    await expect(generator.asyncGenerateEpub(['epub'])).rejects.toThrow('EPUB 结构不完整')
    expect(fs.existsSync(generator.epubOutputPathUri)).toBe(false)
  })

  it('渲染带页内锚点的响应式单文件目录', () => {
    const index = HtmlRender.renderIndex({
      title: '目录',
      recordList: [{ title: '用户', uri: '#author-1', pageList: [{ title: '回答', uri: '#answer-1' }] }],
    }).singleEle
    const html = HtmlRender.generateSinglePageWithIndex({
      title: 'fixture',
      index,
      eleList: [
        React.createElement(
          'section',
          { id: 'author-1', key: 'author-1' },
          HtmlRender.renderInfoPage({ title: '用户', desc: '签名' }).singleEle,
        ),
      ],
    })
    expect(html).toContain('single-page-toc')
    expect(html).toContain('href="#answer-1"')
    expect(html).toContain('id="author-1"')
    expect(html).toContain('签名')
  })

  it('不渲染空的信息正文', () => {
    const html = HtmlRender.renderToString(HtmlRender.renderInfoPage({ title: '信息页' }).htmlEle)
    expect(html).not.toContain('panel-body')
  })

  it('同名重跑仅清理当前书籍目录并保留其他书籍和公共输出', () => {
    const firstGenerator = new EpubGenerator({ bookname: 'same-book', imageQuilty: 'none' })
    const staleFile = path.join(firstGenerator.bookOutputPath, 'markdown', 'stale.md')
    const otherBookFile = path.join(sandbox.outputPath, 'other-book', 'html', 'keep.html')
    const jsonFile = path.join(sandbox.outputPath, 'json', 'keep.json')
    const diagnosticFile = path.join(sandbox.outputPath, 'diagnostics', 'keep.json')
    for (const filePath of [staleFile, otherBookFile, jsonFile, diagnosticFile]) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, 'keep')
    }

    const secondGenerator = new EpubGenerator({ bookname: 'same-book', imageQuilty: 'none' })

    expect(secondGenerator.bookOutputPath).toBe(firstGenerator.bookOutputPath)
    expect(fs.existsSync(staleFile)).toBe(false)
    expect(fs.readFileSync(otherBookFile, 'utf8')).toBe('keep')
    expect(fs.readFileSync(jsonFile, 'utf8')).toBe('keep')
    expect(fs.readFileSync(diagnosticFile, 'utf8')).toBe('keep')
  })

  it.each(['html', 'markdown', 'epub', 'json', 'diagnostics'])(
    '保留名称 %s 不会占用或清理输出根公共目录',
    (bookname) => {
      const publicFile = path.join(sandbox.outputPath, bookname, 'keep.txt')
      fs.mkdirSync(path.dirname(publicFile), { recursive: true })
      fs.writeFileSync(publicFile, 'keep')

      const generator = new EpubGenerator({ bookname, imageQuilty: 'none' })

      expect(generator.bookOutputPath).not.toBe(path.join(sandbox.outputPath, bookname))
      expect(fs.readFileSync(publicFile, 'utf8')).toBe('keep')
      expect(path.basename(generator.bookOutputPath).length).toBeLessThanOrEqual(120)
    },
  )
})
