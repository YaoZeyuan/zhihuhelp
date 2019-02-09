import Base from "~/src/command/fetch/base";
import ColumnApi from "~/src/api/column";
import ArticleApi from "~/src/api/article";
import MColumn from "~/src/model/column";
import MArticle from "~/src/model/article";
import CommonUtil from "~/src/library/util/common";
import ArticleExcerptRecord from "~/src/type/namespace/article_excerpt";

class FetchAuthor extends Base {
    max = 20

    static get signature() {
        return `
        Fetch:Column

        {columnId:[必填]专栏id}
        `;
    }

    static get description() {
        return "抓取专栏文章列表";
    }

    async execute(args: any, options: any): Promise<any> {
        const { columnId } = args;
        this.log(`开始抓取专栏${columnId}的数据`);
        this.log(`获取专栏信息`);
        const columnInfo = await ColumnApi.asyncGetColumnInfo(columnId);
        await MColumn.asyncReplaceColumnInfo(columnInfo)
        this.log(`专栏信息获取完毕`);
        const title = columnInfo.title
        const articleCount = columnInfo.articles_count
        this.log(`专栏${title}(${columnId})下共有${articleCount}篇文章`)
        this.log(`开始抓取文章概要列表`)
        for (let offset = 0; offset < articleCount; offset = offset + this.max) {
            await CommonUtil.appendPromiseWithDebounce((async function (columnId, offset, that) {
                let articleExpertList = await ColumnApi.asyncGetArticleExcerptList(columnId, offset, that.max)
                for (let articleExpert of articleExpertList) {
                    await MColumn.asyncReplaceColumnArticleExcerpt(columnId, articleExpert).catch(e => {
                        console.log('catch error')
                        console.log(e)
                    })
                }
                that.log(`第${offset}~${offset + that.max}篇文章概要抓取完毕`)
            })(columnId, offset, this))
            this.log(`将第${offset}~${offset + this.max}文章添加到任务队列中`)
        }
        await CommonUtil.appendPromiseWithDebounce(this.emptyPromiseFunction(), true)
        this.log(`全部文章概要抓取完毕`)

        let articleExpertList = await MColumn.asyncGetArticleExcerptList(columnId)
        this.log(`开始抓取文章详情`)
        let index = 0
        for (let articleExpert of articleExpertList) {
            index++
            await CommonUtil.appendPromiseWithDebounce(this.downloadArticle(index, articleExpert))
            this.log(`将第${index}篇文章添加到任务队列中`)
        }
        this.log(`抓取最后一篇文章`)
        await CommonUtil.appendPromiseWithDebounce(this.emptyPromiseFunction(), true)
        this.log(`全部文章抓取完毕`)
    }

    async downloadArticle(index: number, articleExpert: ArticleExcerptRecord) {
        this.log(`抓取第${index}篇文章`)
        let articleId = articleExpert.id
        let articleRecord = await ArticleApi.asyncGetArticle(articleId)
        await MArticle.asyncReplaceArticle(articleRecord)
        this.log(`第${index}篇文章抓取完毕`)
    }
}

export default FetchAuthor;
