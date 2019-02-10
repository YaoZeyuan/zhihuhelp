import Base from "~/src/command/generate/base";
import MArticle from "~/src/model/article";
import MColumn from "~/src/model/column";
import ArticleView from "~/src/view/article"
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
        this.bookname = StringUtil.encodeFilename(`专栏${title}(${columnId})的知乎文章集锦`)
        // 初始化文件夹
        this.initPath()

        this.log(`获取文章列表`)
        let articleRecordList = await MArticle.asyncGetArticleList(columnId)
        this.log(`文章列表获取完毕, 共${articleRecordList.length}条答案`)
        // 生成单个文件
        for (let articleRecord of articleRecordList) {
            let title = articleRecord.id
            let content = ArticleView.render(articleRecord)
            content = this.processContent(content)
            fs.writeFileSync(path.resolve(this.htmlCacheHtmlPath, `${title}.html`), content)
        }
        //  生成全部文件
        let content = ArticleView.renderInSinglePage(this.bookname, articleRecordList)
        this.log(`内容渲染完毕, 开始对内容进行输出前预处理`)
        content = this.processContent(content)
        fs.writeFileSync(path.resolve(this.htmlCacheSingleHtmlPath, `${this.bookname}.html`), content)

        // 处理静态资源
        await this.asyncProcessStaticResource()

        this.log(`专栏${title}(${columnId})生成完毕`)
    }

}

export default GenerateColumn;
