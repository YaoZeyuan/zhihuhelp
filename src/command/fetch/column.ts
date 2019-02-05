import Base from "~/src/command/fetch/base";
import ColumnApi from "~/src/api/column";
import ArticleApi from "~/src/api/article";
import MColumn from "~/src/model/column";
import MAtricle from "~/src/model/atricle";

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
            let articleExpertList = await ColumnApi.asyncGetAtricleExcerptList(columnId, offset, this.max)
            for (let articleExpert of articleExpertList) {
                await MColumn.asyncReplaceColumnAtricleExcerpt(columnId, articleExpert)
            }
            this.log(`第${offset}~${offset + this.max}篇文章概要抓取完毕`)
        }
        let articleExpertList = await MColumn.asyncGetArticleExcerptList(columnId)
        this.log(`开始抓取文章详情`)
        let index = 0
        for (let articleExpert of articleExpertList) {
            index++
            this.log(`开始抓取第${index}/${articleExpertList.length}篇文章`)
            let articleId = articleExpert.id
            columnId
            let articleRecord = await ArticleApi.asyncGetArticle(articleId)
            await MAtricle.asyncReplaceArticle(articleRecord)
        }
        this.log(`全部文章抓取完毕`)
    }

}

export default FetchAuthor;
