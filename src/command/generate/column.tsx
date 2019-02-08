import Base from "~/src/command/generate/base";
import MArticle from "~/src/model/article";
import MColumn from "~/src/model/column";
import renderArticle from "~/src/view/article"
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'
import PathConfig from '~/src/config/path'
import StringUtil from '~/src/library/util/string'

class GenerateColumn extends Base {
    max = 20

    static get signature() {
        return `
        Generate:Column

        {columnId:[必填]专栏id}
        `;
    }

    static get description() {
        return "生成知乎专栏的电子书";
    }

    async execute(args: any, options: any): Promise<any> {
        const { columnId } = args;
        this.log(`开始抓取专栏${columnId}的信息`);
        this.log(`获取专栏信息`);
        const columnInfo = await MColumn.asyncGetColumnInfo(columnId);
        this.log(`专栏信息获取完毕`);
        const title = columnInfo.title
        const articleCount = columnInfo.articles_count


        this.log(`专栏${title}(${columnId})共有${articleCount}篇文章`)
        const bookname = StringUtil.encodeFilename(`专栏${title}(${columnId})的知乎文章集锦`)
        // 初始化文件夹
        this.log(`创建电子书:${bookname}对应文件夹`)
        let htmlCachePath = path.resolve(PathConfig.htmlCachePath, bookname)
        let htmlCacheHtmlPath = path.resolve(htmlCachePath, '') // 单文件就没必要放在html文件夹内了, 直接放最外层即可
        let htmlCacheCssPath = path.resolve(htmlCachePath, 'css')
        let htmlCacheImgPath = path.resolve(htmlCachePath, 'image')
        shelljs.mkdir('-p', htmlCachePath)
        shelljs.mkdir('-p', htmlCacheHtmlPath)
        shelljs.mkdir('-p', htmlCacheCssPath)
        shelljs.mkdir('-p', htmlCacheImgPath)
        this.log(`电子书:${bookname}对应文件夹创建完毕`)

        this.log(`获取文章列表`)
        let articleRecordList = await MArticle.asyncGetArticleList(columnId)
        this.log(`文章列表获取完毕, 共${articleRecordList.length}条答案`)
        // 直接渲染为单个文件
        let content = renderArticle(bookname, columnInfo, articleRecordList)
        this.log(`专栏文章渲染完毕, 开始对内容进行输出前预处理`)
        content = this.processContent(content)
        fs.writeFileSync(path.resolve(htmlCacheHtmlPath, `${bookname}.html`), content)
        this.log(`文章列表处理完毕, 准备下载图片`)
        // 下载图片
        await this.downloadImg()
        this.log(`图片下载完毕`)
        this.copyImgToCache(htmlCacheImgPath)

        this.log(`复制静态资源`)
        // css
        for (let filename of ['bootstrap.css', 'customer.css', 'markdown.css', 'normalize.css',]) {
            let copyFromUri = path.resolve(PathConfig.resourcePath, 'css', filename)
            let copyToUri = path.resolve(htmlCacheCssPath, filename)
            fs.copyFileSync(copyFromUri, copyToUri)
        }
        // 图片资源
        for (let filename of ['cover.jpg', 'kanshan.png']) {
            let copyFromUri = path.resolve(PathConfig.resourcePath, 'image', filename)
            let copyToUri = path.resolve(htmlCacheImgPath, filename)
            fs.copyFileSync(copyFromUri, copyToUri)
        }

        this.log(`专栏${title}(${columnId})生成完毕`)
    }

}

export default GenerateColumn;
