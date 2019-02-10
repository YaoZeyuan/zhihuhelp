import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'
import _ from 'lodash'
import OPF from './opf'
import TOC from './toc'

class Epub {
    opf = new OPF()
    toc = new TOC()

    basePath = path.resolve('.') // 基础路径
    bookname = '' // 书名

    bookIdentifier = 'helloworld' // id, 直接写死

    get currentPath() { return path.resolve(__dirname) }
    get resourcePath() { return path.resolve(this.currentPath, 'resource') }

    get epubCachePath() { return path.resolve(this.basePath) }
    get epubContentCachePath() { return path.resolve(this.epubCachePath, 'OEBPS') }
    get epubCacheHtmlPath() { return path.resolve(this.epubContentCachePath, 'html') }
    get epubCacheCssPath() { return path.resolve(this.epubContentCachePath, 'css') }
    get epubCacheImagePath() { return path.resolve(this.epubContentCachePath, 'image') }

    constructor(bookname: string, basePath: string) {
        this.basePath = basePath
        this.bookname = bookname
        this.initPath()
    }

    initPath() {
        shelljs.mkdir('-p', this.epubCachePath)
        shelljs.mkdir('-p', this.epubContentCachePath)
        shelljs.mkdir('-p', this.epubCacheCssPath)
        shelljs.mkdir('-p', this.epubCacheHtmlPath)
        shelljs.mkdir('-p', this.epubCacheImagePath)

        shelljs.mkdir('-p', path.resolve(this.epubCachePath, 'META-INF'))

        // 静态资源
        fs.copyFileSync(
            path.resolve(this.resourcePath, 'META-INF', 'container.xml'),
            path.resolve(this.epubCachePath, 'META-INF', 'container.xml')
        )
        fs.copyFileSync(
            path.resolve(this.resourcePath, 'META-INF', 'duokan-extension.xml'),
            path.resolve(this.epubCachePath, 'META-INF', 'duokan-extension.xml')
        )
        fs.copyFileSync(
            path.resolve(this.resourcePath, 'mimetype'),
            path.resolve(this.epubCachePath, 'mimetype')
        )
    }

    parseFilename(uri: string) {
        let uriSplitList = uri.split(path.sep)
        let filename = _.get(uriSplitList, uriSplitList.length - 1, '')
        return filename
    }

    addHtml(title: string, uri: string) {
        let filename = this.parseFilename(uri)
        fs.copyFileSync(uri, path.resolve(this.epubCacheHtmlPath, filename))
        this.opf.addHtml(filename)
        this.toc.addHtml(title, filename)
    }

    addCss(uri: string) {
        let filename = this.parseFilename(uri)
        fs.copyFileSync(uri, path.resolve(this.epubCacheCssPath, filename))
        this.opf.addCss(filename)
    }

    addImage(uri: string) {
        let filename = this.parseFilename(uri)
        fs.copyFileSync(uri, path.resolve(this.epubCacheImagePath, filename))
        this.opf.addImage(filename)
    }

    /**
     * 生成epub
     */
    generate() {
        let tocContent = this.toc.content
        fs.writeFileSync(path.resolve(this.epubContentCachePath, 'toc.xhtml'), tocContent)
        let opfContent = this.opf.content
        fs.writeFileSync(path.resolve(this.epubContentCachePath, 'content.opf'), opfContent)
    }
}

export default Epub