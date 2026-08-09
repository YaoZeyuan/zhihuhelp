import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'
import logger from '~/src/library/logger.js'
import AdmZip from 'adm-zip'
import OPF from './opf.js'
import TOC from './toc.js'

const ZIP_METHOD_STORED = 0
const REQUIRED_EPUB_ENTRIES = [
  'META-INF/container.xml',
  'OEBPS/content.opf',
  'OEBPS/toc.xhtml',
] as const
const moduleDirectory = path.dirname(fileURLToPath(import.meta.url))

class Epub {
  opf = new OPF()
  toc = new TOC()

  basePath = path.resolve('.') // 基础路径
  bookname = '' // 书名

  bookIdentifier = 'helloworld' // id, 直接写死
  creator = 'zhihuhelp' // 创建者, 直接写死

  get currentPath() {
    return path.resolve(moduleDirectory)
  }
  get resourcePath() {
    return path.resolve(this.currentPath, 'resource')
  }

  get epubCachePath() {
    return path.resolve(this.basePath)
  }
  get epubContentCachePath() {
    return path.resolve(this.epubCachePath, 'OEBPS')
  }
  get epubCacheHtmlPath() {
    return path.resolve(this.epubContentCachePath, 'html')
  }
  get epubCacheCssPath() {
    return path.resolve(this.epubContentCachePath, 'css')
  }
  get epubCacheImagePath() {
    return path.resolve(this.epubContentCachePath, 'image')
  }

  constructor(bookname: string, basePath: string, outputBasename = bookname) {
    this.basePath = basePath
    this.bookname = outputBasename

    this.opf.creator = this.creator
    this.toc.creator = this.creator

    this.opf.title = bookname
    this.toc.title = bookname

    this.initPath()
  }

  initPath() {
    fs.mkdirSync(this.epubCachePath, { recursive: true })
    fs.mkdirSync(this.epubContentCachePath, { recursive: true })
    fs.mkdirSync(this.epubCacheCssPath, { recursive: true })
    fs.mkdirSync(this.epubCacheHtmlPath, { recursive: true })
    fs.mkdirSync(this.epubCacheImagePath, { recursive: true })

    fs.mkdirSync(path.resolve(this.epubCachePath, 'META-INF'), { recursive: true })

    // 静态资源
    fs.copyFileSync(
      path.resolve(this.resourcePath, 'META-INF', 'container.xml'),
      path.resolve(this.epubCachePath, 'META-INF', 'container.xml'),
    )
    fs.copyFileSync(
      path.resolve(this.resourcePath, 'META-INF', 'duokan-extension.xml'),
      path.resolve(this.epubCachePath, 'META-INF', 'duokan-extension.xml'),
    )
    fs.copyFileSync(path.resolve(this.resourcePath, 'mimetype'), path.resolve(this.epubCachePath, 'mimetype'))
  }

  parseFilename(uri: string) {
    let uriSplitList = uri.split(path.sep)
    let filename = uriSplitList?.[uriSplitList.length - 1] ?? ''
    return filename
  }

  addIndexHtml(title: string, uri: string) {
    let filename = this.parseFilename(uri)
    this.CopyFileSyncSafe(uri, path.resolve(this.epubCacheHtmlPath, filename))
    this.opf.addIndexHtml(filename)
    this.toc.addIndexHtml(title, filename)
  }

  addHtml(title: string, uri: string) {
    let filename = this.parseFilename(uri)
    this.CopyFileSyncSafe(uri, path.resolve(this.epubCacheHtmlPath, filename))
    this.opf.addHtml(filename)
    this.toc.addHtml(title, filename)
  }

  addCss(uri: string) {
    let filename = this.parseFilename(uri)
    this.CopyFileSyncSafe(uri, path.resolve(this.epubCacheCssPath, filename))
    this.opf.addCss(filename)
  }

  addImage(uri: string) {
    let filename = this.parseFilename(uri)
    this.CopyFileSyncSafe(uri, path.resolve(this.epubCacheImagePath, filename))
    this.opf.addImage(filename)
  }

  addCoverImage(uri: string) {
    let filename = this.parseFilename(uri)
    this.CopyFileSyncSafe(uri, path.resolve(this.epubCacheImagePath, filename))
    this.opf.addCoverImage(filename)
  }

  /**
   * 生成epub
   */
  async asyncGenerate() {
    let tocContent = this.toc.content
    fs.writeFileSync(path.resolve(this.epubContentCachePath, 'toc.xhtml'), tocContent)
    let opfContent = this.opf.content
    fs.writeFileSync(path.resolve(this.epubContentCachePath, 'content.opf'), opfContent)

    let zip = new AdmZip({ noSort: true })
    let epubUri = path.resolve(this.epubCachePath, this.bookname + '.epub')
    logger.log('开始制作epub, 压缩为zip需要一定时间, 请等待')

    const mimetypeEntry = zip.addFile(
      'mimetype',
      fs.readFileSync(path.resolve(this.epubCachePath, 'mimetype'))
    )
    // EPUB requires the first entry to be the uncompressed `mimetype` file.
    mimetypeEntry.header.method = ZIP_METHOD_STORED
    this.addDirectoryToZip(zip, path.resolve(this.epubCachePath, 'META-INF'), 'META-INF')
    this.addDirectoryToZip(zip, path.resolve(this.epubCachePath, 'OEBPS'), 'OEBPS')
    this.validateArchiveEntries(zip)
    mimetypeEntry.header.method = ZIP_METHOD_STORED

    await zip.writeZipPromise(epubUri)
    logger.log('epub制作完成')
  }

  private addDirectoryToZip(zip: AdmZip, directoryPath: string, zipDirectory: string) {
    const entries = fs.readdirSync(directoryPath, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name))
    for (const entry of entries) {
      const sourcePath = path.resolve(directoryPath, entry.name)
      const zipPath = path.posix.join(zipDirectory, entry.name)
      if (entry.isDirectory()) {
        this.addDirectoryToZip(zip, sourcePath, zipPath)
      } else if (entry.isFile()) {
        zip.addFile(zipPath, fs.readFileSync(sourcePath), '', fs.statSync(sourcePath))
      }
    }
  }

  private validateArchiveEntries(zip: AdmZip) {
    const entryNames = new Set(zip.getEntries().map((entry) => entry.entryName.replace(/\\/g, '/')))
    const missingEntries = REQUIRED_EPUB_ENTRIES.filter((entryName) => entryNames.has(entryName) === false)
    const htmlEntryCount = [...entryNames].filter((entryName) => /^OEBPS\/html\/.+\.html$/i.test(entryName)).length
    if (missingEntries.length > 0 || htmlEntryCount === 0) {
      throw new Error(
        `EPUB 结构不完整：缺少 ${missingEntries.join(', ') || '正文 HTML'}，正文页面数 ${htmlEntryCount}。`,
      )
    }
  }

  private CopyFileSyncSafe(fromUri: string, toUri: string) {
    fs.copyFileSync(fromUri, toUri)
  }
}

export default Epub
