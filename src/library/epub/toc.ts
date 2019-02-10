class TOC {
    index = 0 // 生成id

    title = ""
    creator = ''
    author = ''
    identifier = 'helloworld'
    language = 'zh-cn'

    publisher = 'zhihuhelp'

    navMapList: Array<string> = []

    get content() {
        return `
        <?xml version="1.0"?>
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
        <head>
            <title>${this.title}</title>
        </head>
        <body>
          <nav id="toc" epub:type="toc">
            <h1>Table of Contents</h1>
            ${this.navOlString}
          </nav>
        </body></html>
`

    }

    get navOlString() {
        return this.navMapList.join('')
    }

    addHtml(title: string, filename: string) {
        this.index = this.index + 1
        this.navMapList.push(`
            <li id="nav_index_${this.index}">
                <a href="./html/${filename}">${title}</a>
            </li>
        `)
    }
}


export default TOC