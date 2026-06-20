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
    id: string;
    name: string;
    type: string;
    description: string;
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
    | typeof Consts.Const_Task_Type_回答
    | typeof Consts.Const_Task_Type_文章
    | typeof Consts.Const_Task_Type_想法

/**
 * 获取数据库中的汇总信息
 */

export default class Summary extends Base {
    private static parseRawJson(rawJson: unknown): any {
        if (typeof rawJson !== 'string') {
            return rawJson ?? {}
        }
        try {
            return JSON.parse(rawJson)
        } catch {
            return {}
        }
    }

    private static stripHtml(content: unknown): string {
        if (typeof content !== 'string') {
            return ''
        }
        return content
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 120)
    }

    private static formatRecord({
        id,
        name,
        type,
        description = '',
    }: {
        id: string | number,
        name: unknown,
        type: string,
        description?: unknown,
    }): DataType {
        const displayId = String(id ?? '')
        const displayName = typeof name === 'string' && name.trim() !== '' ? name.trim() : displayId
        const displayDescription = typeof description === 'string' ? description.trim() : ''
        return {
            key: `${type}-${displayId}`,
            id: displayId,
            name: displayName,
            type,
            description: displayDescription,
        }
    }

    private static async asyncGetQuestionList({
        pageNo,
        pageSize,
    }: {
        pageNo: number,
        pageSize: number,
    }): Promise<DataType[]> {
        const recordList = await MAnswer.db
            .select(['question_id', 'raw_json'])
            .from(MAnswer.TABLE_NAME)
            .groupBy('question_id')
            .orderBy('question_id', 'desc')
            .limit(pageSize)
            .offset(pageNo * pageSize)
            .catch(() => {
                return []
            })
        return recordList.map((record: any) => {
            const raw = Summary.parseRawJson(record.raw_json)
            return Summary.formatRecord({
                id: record.question_id,
                name: raw?.question?.title,
                type: '问题',
                description: raw?.question?.excerpt ?? raw?.question?.type ?? '',
            })
        })
    }

    private static formatAnswerRecordList(recordList: any[]): DataType[] {
        return recordList.map((record) => {
            const raw = Summary.parseRawJson(record.raw_json)
            return Summary.formatRecord({
                id: record.answer_id,
                name: raw?.question?.title ?? `回答 ${record.answer_id}`,
                type: '回答',
                description: Summary.stripHtml(raw?.excerpt ?? raw?.content) || `作者: ${record.author_url_token}`,
            })
        })
    }

    private static formatArticleRecordList(recordList: any[]): DataType[] {
        return recordList.map((record) => {
            const raw = Summary.parseRawJson(record.raw_json)
            return Summary.formatRecord({
                id: record.article_id,
                name: raw?.title,
                type: '文章',
                description: raw?.author?.name ? `作者: ${raw.author.name}` : `专栏: ${record.column_id}`,
            })
        })
    }

    private static formatPinRecordList(recordList: any[]): DataType[] {
        return recordList.map((record) => {
            const raw = Summary.parseRawJson(record.raw_json)
            return Summary.formatRecord({
                id: record.pin_id,
                name: Summary.stripHtml(raw?.excerpt_title ?? raw?.content?.[0]?.text ?? raw?.content) || `想法 ${record.pin_id}`,
                type: '想法',
                description: raw?.author?.name ? `作者: ${raw.author.name}` : `作者: ${record.author_url_token}`,
            })
        })
    }

    private static formatAuthorRecordList(recordList: any[]): DataType[] {
        return recordList.map((record) => {
            const raw = Summary.parseRawJson(record.raw_json)
            return Summary.formatRecord({
                id: record.url_token,
                name: raw?.name,
                type: '用户',
                description: raw?.headline ?? record.id,
            })
        })
    }

    private static formatColumnRecordList(recordList: any[]): DataType[] {
        return recordList.map((record) => {
            const raw = Summary.parseRawJson(record.raw_json)
            return Summary.formatRecord({
                id: record.column_id,
                name: raw?.title ?? raw?.name,
                type: '专栏',
                description: raw?.description ?? '',
            })
        })
    }

    private static formatCollectionRecordList(recordList: any[]): DataType[] {
        return recordList.map((record) => {
            const raw = Summary.parseRawJson(record.raw_json)
            return Summary.formatRecord({
                id: record.collection_id,
                name: raw?.title,
                type: '收藏夹',
                description: raw?.description ?? '',
            })
        })
    }

    private static formatTopicRecordList(recordList: any[]): DataType[] {
        return recordList.map((record) => {
            const raw = Summary.parseRawJson(record.raw_json)
            return Summary.formatRecord({
                id: record.topic_id,
                name: raw?.name,
                type: '话题',
                description: raw?.excerpt ?? raw?.introduction ?? '',
            })
        })
    }

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
            case Consts.Const_Task_Type_回答:
                recordList = Summary.formatAnswerRecordList(await MAnswer.asyncGetList({
                    pageNo,
                    pageSize,
                }))
                total = await MAnswer.asyncGetAnswerCount()
                break;
            case Consts.Const_Task_Type_文章:
                recordList = Summary.formatArticleRecordList(await MArticle.asyncGetList({
                    pageNo,
                    pageSize,
                }))
                total = await MArticle.asyncGetArticleCount()
                break;
            case Consts.Const_Task_Type_想法:
                recordList = Summary.formatPinRecordList(await MPin.asyncGetList({
                    pageNo,
                    pageSize,
                }))
                total = await MPin.asyncGetPinCount()
                break;
            case Consts.Const_Task_Type_问题:
                recordList = await Summary.asyncGetQuestionList({
                    pageNo,
                    pageSize,
                })
                total = await MAnswer.asyncGetQuestionCount()
                break;
            case Consts.Const_Task_Type_专栏:
                recordList = Summary.formatColumnRecordList(await MColumn.asyncGetList({
                    pageNo,
                    pageSize,
                }))
                total = await MColumn.asyncGetColumnCount()
                break;
            case Consts.Const_Task_Type_收藏夹:
                recordList = Summary.formatCollectionRecordList(await MCollection.asyncGetList({
                    pageNo,
                    pageSize,
                }))
                total = await MCollection.asyncGetCollectionCount()
                break;
            case Consts.Const_Task_Type_用户的所有回答:
                recordList = Summary.formatAuthorRecordList(await MAuthor.asyncGetList({
                    pageNo,
                    pageSize,
                }))
                total = await MAuthor.asyncGetAuthorCount()
                break;
            case Consts.Const_Task_Type_话题:
                recordList = Summary.formatTopicRecordList(await MTopic.asyncGetList({
                    pageNo,
                    pageSize,
                }))
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
