import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'
import logger from '~/src/library/logger.js'
import AdmZip from 'adm-zip'
import OPF from './opf.js'
import TOC from './toc.js'

const ZIP_METHOD_STORED = 0
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

    let zip = new AdmZip()
    let epubUri = path.resolve(this.epubCachePath, this.bookname + '.epub')
    logger.log('开始制作epub, 压缩为zip需要一定时间, 请等待')

    const mimetypeEntry = zip.addFile(
      'mimetype',
      fs.readFileSync(path.resolve(this.epubCachePath, 'mimetype'))
    )
    // EPUB requires the first entry to be the uncompressed `mimetype` file.
    mimetypeEntry.header.method = ZIP_METHOD_STORED
    await zip.addLocalFolderPromise(path.resolve(this.epubCachePath, 'META-INF'), {
      "zipPath": 'META-INF'
    })
    await zip.addLocalFolderPromise(path.resolve(this.epubCachePath, 'OEBPS'), {
      "zipPath": 'OEBPS'
    })

    await zip.writeZipPromise(epubUri)
    logger.log('epub制作完成')
  }

  private CopyFileSyncSafe(fromUri: string, toUri: string) {
    fs.copyFileSync(fromUri, toUri)
  }
}

export default Epub
