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
        const authorInfo = await AuthorApi.asyncGetAutherInfo(columnId);
        await MAuthor.asyncReplaceAuthor(authorInfo)
        this.log(`用户信息获取完毕`);
        const name = authorInfo.name
        const answerCount = authorInfo.answer_count
        this.log(`用户${name}(${columnId})共有${answerCount}个回答`)
        this.log(`开始抓取回答列表`)
        for (let offset = 0; offset < answerCount; offset = offset + this.max) {
            let answerList = await AnswerApi.asyncGetAutherAnswerList(columnId, offset, this.max)
            for (let answer of answerList) {
                await MAnswer.asyncReplaceAnswer(answer)
            }
            this.log(`第${offset}~${offset + this.max}条回答抓取完毕`)
        }
        this.log(`全部回答抓取完毕`)
    }

}

export default FetchAuthor;
