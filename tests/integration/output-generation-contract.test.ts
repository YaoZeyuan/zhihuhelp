import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EpubGenerator from '../../src/application/workflow/generate/library/epub_generator'
import HtmlRender from '../../src/application/workflow/generate/library/html_render'
import React from 'react'
import AdmZip from 'adm-zip'
import PathConfig from '../../src/config/path'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

describe('output generation contract', () => {
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

  it('honors html-only output and keeps unsafe title characters inside the sandbox', async () => {
    const generator = new EpubGenerator({
      bookname: '../A&B/:*? 测试书',
      imageQuilty: 'none',
    })
    generator.generateSinglePageHtml({ html: '<html><body>A &amp; B</body></html>' })

    const result = await generator.asyncGenerateEpub(['html'])

    expect(result.missingImageCount).toBe(0)
    expect(fs.existsSync(generator.htmlOutputPathUri)).toBe(true)
    expect(fs.existsSync(generator.epubOutputPathUri)).toBe(false)
    expect(generator.htmlOutputPathUri.startsWith(path.resolve(sandbox.outputPath))).toBe(true)
    expect(path.basename(generator.htmlOutputPathUri)).not.toMatch(/[<>:"/\\|?*]/)
  })

  it('does not add a missing downloaded image to the EPUB manifest', () => {
    const generator = new EpubGenerator({ bookname: 'missing-image', imageQuilty: 'hd' })
    const missingPath = path.join(sandbox.cachePath, 'does-not-exist.png')
    ;(generator.imgUriPool as Map<string, any>).set('fixture://missing.png', {
      realFilename: 'does-not-exist.png',
      fileCacheUri: missingPath,
    })

    expect(generator.copyImgToCache(generator.htmlCacheImgPath)).toEqual(['does-not-exist.png'])
    expect(generator.epub.opf.content).not.toContain('does-not-exist.png')
  })

  it('writes a complete EPUB with the mimetype as the first uncompressed ZIP entry', async () => {
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
    expect(entryNames).toEqual(expect.arrayContaining([
      'META-INF/container.xml',
      'OEBPS/content.opf',
      'OEBPS/toc.xhtml',
      'OEBPS/html/chapter-1.html',
    ]))
    expect(zip.readAsText('OEBPS/html/chapter-1.html')).toContain('EPUB body marker')
    const opf = zip.readAsText('OEBPS/content.opf')
    expect(opf).toContain('href="html/chapter-1.html"')
    expect(opf).toMatch(/<itemref idref="index_\d+"/)
  })

  it('refuses to publish an EPUB without a body chapter', async () => {
    const generator = new EpubGenerator({ bookname: 'empty EPUB', imageQuilty: 'none' })
    generator.generateSinglePageHtml({ html: '<html><body>HTML only</body></html>' })

    await expect(generator.asyncGenerateEpub(['epub'])).rejects.toThrow('EPUB 结构不完整')
    expect(fs.existsSync(generator.epubOutputPathUri)).toBe(false)
  })

  it('renders a responsive single-file table of contents with page anchors', () => {
    const index = HtmlRender.renderIndex({ title: '目录', recordList: [{ title: '用户', uri: '#author-1', pageList: [{ title: '回答', uri: '#answer-1' }] }] }).singleEle
    const html = HtmlRender.generateSinglePageWithIndex({
      title: 'fixture', index,
      eleList: [React.createElement('section', { id: 'author-1', key: 'author-1' }, HtmlRender.renderInfoPage({ title: '用户', desc: '签名' }).singleEle)],
    })
    expect(html).toContain('single-page-toc')
    expect(html).toContain('href="#answer-1"')
    expect(html).toContain('id="author-1"')
    expect(html).toContain('签名')
  })

  it('does not render an empty information body', () => {
    const html = HtmlRender.renderToString(HtmlRender.renderInfoPage({ title: '信息页' }).htmlEle)
    expect(html).not.toContain('panel-body')
  })
})
