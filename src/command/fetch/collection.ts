import Base from "~/src/command/fetch/base";
import CollectionApi from "~/src/api/collection";
import AnswerApi from "~/src/api/answer";
import MCollection from "~/src/model/collection";
import moment from "moment"
import DATE_FORMAT from "~/src/constant/date_format";
import CommonUtil from "~/src/library/util/common";


class FetchCollection extends Base {
    static get signature() {
        return `
        Fetch:Collection

        {collectionId:[必传]收藏夹id}
        `;
    }

    static get description() {
        return "抓取知乎收藏夹内的回答, 由于接口未返回收藏的文章数据, 因此不能抓取收藏的文章";
    }

    async execute(args: any, options: any): Promise<any> {
        const { collectionId } = args;
        this.log(`开始抓取收藏夹${collectionId}内的回答`);
        this.log(`获取收藏夹信息`);
        const collectionInfo = await CollectionApi.asyncGetCollectionInfo(collectionId);
        await MCollection.asyncReplaceColumnInfo(collectionInfo)

        this.log(`收藏夹${collectionInfo.title}(${collectionInfo.id})信息获取完毕, 共有${collectionInfo.answer_count}个回答`);

        this.log(`开始抓取收藏夹回答列表`)
        for (let offset = 0; offset < collectionInfo.answer_count; offset = offset + this.max) {
            await CommonUtil.asyncAppendPromiseWithDebounce(this.asyncGetAnswerList(collectionId, offset))
            this.log(`将抓取第${offset}~${offset + this.max}回答任务添加到任务队列中`)
        }
        await CommonUtil.asyncAppendPromiseWithDebounce(this.emptyPromiseFunction(), true)
        this.log(`全部收藏夹回答抓取完毕`)
    }

    async asyncGetAnswerList(collectionId: number, offset: number) {
        let answerExcerptList = await CollectionApi.asyncGetAnswerExcerptList(collectionId, offset, this.max)
        for (let answerExcerpt of answerExcerptList) {
            await MCollection.asyncReplaceColumnAnswerExcerpt(collectionId, answerExcerpt).catch(e => {
                console.log('catch error')
                console.log(e)
            })
            let answerId = answerExcerpt.id
            let answerRecord = await AnswerApi.asyncGetAnswer(answerId)
            await MCollection.asyncReplaceColumnAnswer(collectionId, answerRecord)
        }
        this.log(`第${offset}~${offset + answerExcerptList.length}条回答抓取完毕`)
    }
}

export default FetchCollection;
