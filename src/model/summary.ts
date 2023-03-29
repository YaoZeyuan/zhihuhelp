import Base from '~/src/model/base'

import * as Consts from "~/src/constant/task_config"
import MAuthor from '~/src/model/author'
import MAuthorAskQuestion from '~/src/model/author_ask_question'
import MActivity from '~/src/model/activity'
import MAnswer from '~/src/model/answer'
import MArticle from '~/src/model/article'
import MTopic from '~/src/model/topic'
import MCollection from '~/src/model/collection'
import MColumn from '~/src/model/column'
import MPin from '~/src/model/pin'

export type DataType = {
    key: string;
    name: string;
}

export type FetchListRes = {
    recordList: DataType[],
    total: number,
    pageNo: number,
    pageSize: number,
}

export type Select_Type = typeof Consts.Const_Task_Type_专栏
    | typeof Consts.Const_Task_Type_收藏夹
    | typeof Consts.Const_Task_Type_用户的所有回答
    | typeof Consts.Const_Task_Type_话题
    | typeof Consts.Const_Task_Type_问题

/**
 * 获取数据库中的汇总信息
 */

export default class Summary extends Base {
    /**
     * 获取数据库汇总信息
     */
    static async asyncGetSummaryInfo() {
        const answer = await MAnswer.asyncGetAnswerCount()
        const question = await MAnswer.asyncGetQuestionCount()
        const pin = await MPin.asyncGetPinCount()
        const article = await MArticle.asyncGetArticleCount()
        const author = await MAuthor.asyncGetAuthorCount()
        const topic = await MTopic.asyncGetTopicCount()
        const collection = await MCollection.asyncGetCollectionCount()
        const column = await MColumn.asyncGetColumnCount()

        return {
            answer,
            question,
            pin,
            article,
            author,
            topic,
            collection,
            column,
        }

    }

    /**
     * 获取列表信息-实现成本较高, 需要对每个模块单独编写获取列表接口, 暂不实现
     * @param param0 
     * @returns 
     */
    static async asyncGetTabList({
        type,
        pageNo,
        pageSize
    }: {
        type: Select_Type,
        pageNo: number,
        pageSize: number,
    }) {
        let recordList: DataType[] = []
        let total = 0
        switch (type) {
            case Consts.Const_Task_Type_专栏:
                recordList = await MColumn.asyncGetList({
                    pageNo,
                    pageSize,
                })
                total = await MColumn.asyncGetColumnCount()
                break;
            case Consts.Const_Task_Type_收藏夹:
                recordList = await MCollection.asyncGetList({
                    pageNo,
                    pageSize,
                })
                total = await MCollection.asyncGetCollectionCount()
                break;
            case Consts.Const_Task_Type_用户的所有回答:
                recordList = await MAuthor.asyncGetList({
                    pageNo,
                    pageSize,
                })
                total = await MAuthor.asyncGetAuthorCount()
                break;
            case Consts.Const_Task_Type_话题:
                recordList = await MTopic.asyncGetList({
                    pageNo,
                    pageSize,
                })
                total = await MTopic.asyncGetTopicCount()
                break;
            default:
                break;
        }
        return {
            recordList,
            total,
            pageNo,
            pageSize,
        }

    }
}