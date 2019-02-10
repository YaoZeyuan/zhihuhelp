import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'

class Epub {
    basePath = path.resolve('.')
    bookname = ''
    get currentPath() { return path.resolve(__dirname) }
    get resourcePath() { return path.resolve(this.currentPath, 'resource') }


    get epubCachePath() { return path.resolve(this.basePath, this.bookname) }
    get epubContentCachePath() { return path.resolve(this.epubCachePath, 'OEBPS') }
    get epubCacheHtmlPath() { return path.resolve(this.epubContentCachePath, 'html') }
    get epubCacheCssPath() { return path.resolve(this.epubContentCachePath, 'css') }
    get epubCacheImagePath() { return path.resolve(this.epubContentCachePath, 'image') }

    constructor(basePath: string, bookname: string) {
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

    addHtml() {

    }

    addCss() {

    }

    addImage() {

    }
}

export default Epub