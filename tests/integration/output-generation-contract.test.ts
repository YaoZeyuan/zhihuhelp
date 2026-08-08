import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EpubGenerator from '../../src/application/workflow/generate/library/epub_generator'
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

  it('writes the EPUB mimetype as the first uncompressed ZIP entry', async () => {
    const generator = new EpubGenerator({ bookname: 'EPUB contract', imageQuilty: 'none' })
    generator.generateSinglePageHtml({ html: '<html><body>EPUB</body></html>' })

    await generator.asyncGenerateEpub(['epub'])

    const archive = fs.readFileSync(generator.epubOutputPathUri)
    expect(archive.readUInt32LE(0)).toBe(0x04034b50)
    expect(archive.readUInt16LE(8)).toBe(0)
    const nameLength = archive.readUInt16LE(26)
    expect(archive.subarray(30, 30 + nameLength).toString('utf8')).toBe('mimetype')
    const dataLength = archive.readUInt32LE(22)
    expect(archive.subarray(30 + nameLength, 30 + nameLength + dataLength).toString('utf8')).toBe(
      'application/epub+zip',
    )
  })
})
