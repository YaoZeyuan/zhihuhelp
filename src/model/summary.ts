import Base from '~/src/model/base.js'

import * as Consts from "~/src/constant/task_config.js"
import MAuthor from '~/src/model/author.js'
import MAnswer from '~/src/model/answer.js'
import MArticle from '~/src/model/article.js'
import MTopic from '~/src/model/topic.js'
import MCollection from '~/src/model/collection.js'
import MColumn from '~/src/model/column.js'
import MPin from '~/src/model/pin.js'

export type DataRecordKind = 'answer' | 'article' | 'pin' | 'meta'

export type DataType = {
    key: string;
    id: string;
    name: string;
    type: string;
    description: string;
    recordKind: DataRecordKind;
    title?: string;
    subtitle?: string;
    contentHtml?: string;
    originContentHtml?: string;
    sourceUrl?: string;
    coverUrl?: string;
    author?: {
        id: string;
        name: string;
        headline: string;
        avatarUrl: string;
        url: string;
    };
    voteupCount?: number;
    commentCount?: number;
    createdAt?: number;
    updatedAt?: number;
}

export type FetchListRes = {
    recordList: DataType[],
    total: number,
    pageNo: number,
    pageSize: number,
    parentId?: string,
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
    private static parseRawJson(
        rawJson: unknown,
        entityId: string | number = 'unknown',
        tableName = 'summary',
    ): any {
        return this.parseEntityRawJson(rawJson, entityId, tableName)
    }

    private static stripHtml(content: unknown): string {
        if (typeof content !== 'string') {
            return ''
        }
        return content
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
    }

    private static limitText(content: unknown, maxLength = 280): string {
        const text = Summary.stripHtml(content)
        if (text.length <= maxLength) {
            return text
        }
        return `${text.slice(0, maxLength)}...`
    }

    private static normalizeZhihuUrl(url: unknown, fallback = ''): string {
        if (typeof url !== 'string' || url.trim() === '') {
            return fallback
        }
        const trimmedUrl = url.trim()
        if (/^https?:\/\//.test(trimmedUrl)) {
            return trimmedUrl
        }
        if (trimmedUrl.startsWith('/')) {
            return `https://www.zhihu.com${trimmedUrl}`
        }
        return fallback
    }

    private static getAuthorInfo(author: any) {
        const id = String(author?.id ?? '')
        const urlToken = String(author?.url_token ?? '')
        const authorUrl = Summary.normalizeZhihuUrl(
            author?.url,
            urlToken ? `https://www.zhihu.com/people/${urlToken}` : id ? `https://www.zhihu.com/people/${id}` : '',
        )
        return {
            id,
            name: String(author?.name ?? '匿名用户'),
            headline: String(author?.headline ?? ''),
            avatarUrl: String(author?.avatar_url ?? ''),
            url: authorUrl,
        }
    }

    private static buildPinContentHtml(raw: any): string {
        if (typeof raw?.content_html === 'string' && raw.content_html.trim() !== '') {
            return raw.content_html
        }
        if (Array.isArray(raw?.content) === false) {
            return ''
        }
        return raw.content.map((item: any) => {
            if (item?.type === 'image' && typeof item?.url === 'string') {
                return `<img src="${item.url}" />`
            }
            const text = item?.content ?? item?.own_text ?? ''
            if (typeof text === 'string' && text.trim() !== '') {
                return `<div>${text}</div>`
            }
            return ''
        }).join('')
    }

    private static formatRecord({
        id,
        name,
        type,
        description = '',
        recordKind = 'meta',
        ...extra
    }: {
        id: string | number,
        name: unknown,
        type: string,
        description?: unknown,
        recordKind?: DataRecordKind,
        title?: string,
        subtitle?: string,
        contentHtml?: string,
        originContentHtml?: string,
        sourceUrl?: string,
        coverUrl?: string,
        author?: DataType['author'],
        voteupCount?: number,
        commentCount?: number,
        createdAt?: number,
        updatedAt?: number,
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
            recordKind,
            ...extra,
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
        return recordList.map((record: any) => {
            const raw = Summary.parseRawJson(record.raw_json, record.question_id, MAnswer.TABLE_NAME)
            return Summary.formatRecord({
                id: record.question_id,
                name: raw?.question?.title,
                type: '问题',
                description: raw?.question?.detail ?? raw?.question?.excerpt ?? raw?.question?.type ?? '',
            })
        })
    }

    private static formatAnswerRecordList(recordList: any[]): DataType[] {
        return recordList.map((record) => {
            const raw = Summary.parseRawJson(record.raw_json, record.answer_id, MAnswer.TABLE_NAME)
            const title = String(raw?.question?.title ?? `回答 ${record.answer_id}`)
            const contentHtml = typeof raw?.content === 'string' ? raw.content : ''
            return Summary.formatRecord({
                id: record.answer_id,
                name: title,
                type: '回答',
                description: Summary.limitText(raw?.excerpt ?? contentHtml) || `作者: ${record.author_url_token}`,
                recordKind: 'answer',
                title,
                subtitle: raw?.question?.detail ?? raw?.question?.excerpt ?? '',
                contentHtml,
                sourceUrl: `https://www.zhihu.com/question/${raw?.question?.id ?? record.question_id}/answer/${record.answer_id}`,
                author: Summary.getAuthorInfo(raw?.author),
                voteupCount: Number(raw?.voteup_count ?? 0),
                commentCount: Number(raw?.comment_count ?? 0),
                createdAt: Number(raw?.created_time ?? 0),
                updatedAt: Number(raw?.updated_time ?? 0),
            })
        })
    }

    private static formatArticleRecordList(recordList: any[]): DataType[] {
        return recordList.map((record) => {
            const raw = Summary.parseRawJson(record.raw_json, record.article_id, MArticle.TABLE_NAME)
            const title = String(raw?.title ?? `文章 ${record.article_id}`)
            const contentHtml = typeof raw?.content === 'string' ? raw.content : ''
            return Summary.formatRecord({
                id: record.article_id,
                name: title,
                type: '文章',
                description: Summary.limitText(raw?.excerpt ?? contentHtml) || (raw?.author?.name ? `作者: ${raw.author.name}` : `专栏: ${record.column_id}`),
                recordKind: 'article',
                title,
                subtitle: raw?.column?.title ? `专栏: ${raw.column.title}` : '',
                contentHtml,
                sourceUrl: Summary.normalizeZhihuUrl(raw?.url, `https://zhuanlan.zhihu.com/p/${record.article_id}`),
                coverUrl: typeof raw?.title_image === 'string' ? raw.title_image : '',
                author: Summary.getAuthorInfo(raw?.author),
                voteupCount: Number(raw?.voteup_count ?? 0),
                commentCount: Number(raw?.comment_count ?? 0),
                createdAt: Number(raw?.created ?? 0),
                updatedAt: Number(raw?.updated ?? 0),
            })
        })
    }

    private static formatPinRecordList(recordList: any[]): DataType[] {
        return recordList.map((record) => {
            const raw = Summary.parseRawJson(record.raw_json, record.pin_id, MPin.TABLE_NAME)
            const contentHtml = Summary.buildPinContentHtml(raw)
            const originContentHtml = Summary.buildPinContentHtml(raw?.repin)
            const title = Summary.limitText(raw?.excerpt_title, 80) || `想法 ${record.pin_id}`
            return Summary.formatRecord({
                id: record.pin_id,
                name: title,
                type: '想法',
                description: Summary.limitText(`${contentHtml} ${originContentHtml}`) || (raw?.author?.name ? `作者: ${raw.author.name}` : `作者: ${record.author_url_token}`),
                recordKind: 'pin',
                title,
                contentHtml,
                originContentHtml,
                sourceUrl: Summary.normalizeZhihuUrl(raw?.url, `https://www.zhihu.com/pin/${record.pin_id}`),
                author: Summary.getAuthorInfo(raw?.author),
                voteupCount: Number(raw?.like_count ?? raw?.reaction_count ?? 0),
                commentCount: Number(raw?.comment_count ?? 0),
                createdAt: Number(raw?.created ?? 0),
                updatedAt: Number(raw?.updated ?? 0),
            })
        })
    }

    private static formatAuthorRecordList(recordList: any[]): DataType[] {
        return recordList.map((record) => {
            const raw = Summary.parseRawJson(record.raw_json, record.url_token, MAuthor.TABLE_NAME)
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
            const raw = Summary.parseRawJson(record.raw_json, record.column_id, MColumn.TABLE_NAME)
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
            const raw = Summary.parseRawJson(record.raw_json, record.collection_id, MCollection.TABLE_NAME)
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
            const raw = Summary.parseRawJson(record.raw_json, record.topic_id, MTopic.TABLE_NAME)
            return Summary.formatRecord({
                id: record.topic_id,
                name: raw?.name,
                type: '话题',
                description: raw?.excerpt ?? raw?.introduction ?? '',
            })
        })
    }

    private static async asyncCountWhere({
        tableName,
        countColumn,
        whereColumn,
        whereValue,
    }: {
        tableName: string,
        countColumn: string,
        whereColumn: string,
        whereValue: string,
    }) {
        const count = await Base.db
            .countDistinct(`${countColumn} as count`)
            .from(tableName)
            .where(whereColumn, '=', whereValue) as { count: number }[]
        return count?.[0]?.count ?? 0
    }

    private static async asyncGetAnswerContentByQuestion({
        questionId,
        pageNo,
        pageSize,
    }: {
        questionId: string,
        pageNo: number,
        pageSize: number,
    }): Promise<FetchListRes> {
        const recordList = await MAnswer.db
            .select(MAnswer.TABLE_COLUMN)
            .from(MAnswer.TABLE_NAME)
            .where('question_id', '=', questionId)
            .orderBy('answer_id', 'desc')
            .limit(pageSize)
            .offset(pageNo * pageSize)
        const total = await Summary.asyncCountWhere({
            tableName: MAnswer.TABLE_NAME,
            countColumn: 'answer_id',
            whereColumn: 'question_id',
            whereValue: questionId,
        })
        return {
            recordList: Summary.formatAnswerRecordList(recordList),
            total,
            pageNo,
            pageSize,
            parentId: questionId,
        }
    }

    private static async asyncGetAuthorContent({
        authorUrlToken,
        pageNo,
        pageSize,
    }: {
        authorUrlToken: string,
        pageNo: number,
        pageSize: number,
    }): Promise<FetchListRes> {
        const answerRecordList = await MAnswer.db
            .select(MAnswer.TABLE_COLUMN)
            .from(MAnswer.TABLE_NAME)
            .where('author_url_token', '=', authorUrlToken)
        const articleRecordList = await MArticle.db
            .select(MArticle.TABLE_COLUMN)
            .from(MArticle.TABLE_NAME)
            .where('author_url_token', '=', authorUrlToken)
        const pinRecordList = await MPin.db
            .select(MPin.TABLE_COLUMN)
            .from(MPin.TABLE_NAME)
            .where('author_url_token', '=', authorUrlToken)
        const mixedRecordList = [
            ...Summary.formatAnswerRecordList(answerRecordList),
            ...Summary.formatArticleRecordList(articleRecordList),
            ...Summary.formatPinRecordList(pinRecordList),
        ].sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0))
        return {
            recordList: mixedRecordList.slice(pageNo * pageSize, (pageNo + 1) * pageSize),
            total: mixedRecordList.length,
            pageNo,
            pageSize,
            parentId: authorUrlToken,
        }
    }

    private static async asyncGetColumnContent({
        columnId,
        pageNo,
        pageSize,
    }: {
        columnId: string,
        pageNo: number,
        pageSize: number,
    }): Promise<FetchListRes> {
        const recordList = await MArticle.db
            .select(MArticle.TABLE_COLUMN)
            .from(MArticle.TABLE_NAME)
            .where('column_id', '=', columnId)
            .orderBy('article_id', 'desc')
            .limit(pageSize)
            .offset(pageNo * pageSize)
        const total = await Summary.asyncCountWhere({
            tableName: MArticle.TABLE_NAME,
            countColumn: 'article_id',
            whereColumn: 'column_id',
            whereValue: columnId,
        })
        return {
            recordList: Summary.formatArticleRecordList(recordList),
            total,
            pageNo,
            pageSize,
            parentId: columnId,
        }
    }

    private static async asyncGetTopicContent({
        topicId,
        pageNo,
        pageSize,
    }: {
        topicId: string,
        pageNo: number,
        pageSize: number,
    }): Promise<FetchListRes> {
        const answerIdList = await MTopic.asyncGetAnswerIdList(topicId)
        const pageAnswerIdList = answerIdList.slice(pageNo * pageSize, (pageNo + 1) * pageSize)
        const recordList = pageAnswerIdList.length === 0 ? [] : await MAnswer.db
            .select(MAnswer.TABLE_COLUMN)
            .from(MAnswer.TABLE_NAME)
            .whereIn('answer_id', pageAnswerIdList)
        return {
            recordList: Summary.formatAnswerRecordList(recordList),
            total: answerIdList.length,
            pageNo,
            pageSize,
            parentId: topicId,
        }
    }

    private static async asyncGetCollectionContent({
        collectionId,
        pageNo,
        pageSize,
    }: {
        collectionId: string,
        pageNo: number,
        pageSize: number,
    }): Promise<FetchListRes> {
        const collectionRecordList = await MCollection.db
            .select(MCollection.COLLECTION_RECORD_TABLE_COLUMN)
            .from(MCollection.COLLECTION_RECORD_TABLE_NAME)
            .where('collection_id', '=', collectionId)
            .orderBy('record_at', 'desc')
            .limit(pageSize)
            .offset(pageNo * pageSize)
        const total = await Summary.asyncCountWhere({
            tableName: MCollection.COLLECTION_RECORD_TABLE_NAME,
            countColumn: 'record_id',
            whereColumn: 'collection_id',
            whereValue: collectionId,
        })
        const recordList: DataType[] = []
        for (const collectionRecord of collectionRecordList) {
            if (collectionRecord.record_type === MCollection.Const_Record_Type_回答) {
                const dbRecordList = await MAnswer.db
                    .select(MAnswer.TABLE_COLUMN)
                    .from(MAnswer.TABLE_NAME)
                    .where('answer_id', '=', collectionRecord.record_id)
                recordList.push(...Summary.formatAnswerRecordList(dbRecordList.length > 0 ? dbRecordList : [{
                    answer_id: collectionRecord.record_id,
                    question_id: Summary.parseRawJson(collectionRecord.raw_json, collectionRecord.record_id, MCollection.COLLECTION_RECORD_TABLE_NAME)?.question?.id ?? '',
                    author_url_token: Summary.parseRawJson(collectionRecord.raw_json, collectionRecord.record_id, MCollection.COLLECTION_RECORD_TABLE_NAME)?.author?.url_token ?? '',
                    raw_json: collectionRecord.raw_json,
                }]))
            }
            if (collectionRecord.record_type === MCollection.Const_Record_Type_文章) {
                const dbRecordList = await MArticle.db
                    .select(MArticle.TABLE_COLUMN)
                    .from(MArticle.TABLE_NAME)
                    .where('article_id', '=', collectionRecord.record_id)
                recordList.push(...Summary.formatArticleRecordList(dbRecordList.length > 0 ? dbRecordList : [{
                    article_id: collectionRecord.record_id,
                    column_id: Summary.parseRawJson(collectionRecord.raw_json, collectionRecord.record_id, MCollection.COLLECTION_RECORD_TABLE_NAME)?.column?.id ?? '',
                    raw_json: collectionRecord.raw_json,
                }]))
            }
            if (collectionRecord.record_type === MCollection.Const_Record_Type_想法) {
                const dbRecordList = await MPin.db
                    .select(MPin.TABLE_COLUMN)
                    .from(MPin.TABLE_NAME)
                    .where('pin_id', '=', collectionRecord.record_id)
                recordList.push(...Summary.formatPinRecordList(dbRecordList.length > 0 ? dbRecordList : [{
                    pin_id: collectionRecord.record_id,
                    author_url_token: Summary.parseRawJson(collectionRecord.raw_json, collectionRecord.record_id, MCollection.COLLECTION_RECORD_TABLE_NAME)?.author?.url_token ?? '',
                    raw_json: collectionRecord.raw_json,
                }]))
            }
        }
        return {
            recordList,
            total,
            pageNo,
            pageSize,
            parentId: collectionId,
        }
    }

    private static async asyncGetRelatedContentList({
        type,
        parentId,
        pageNo,
        pageSize,
    }: {
        type: Select_Type,
        parentId: string,
        pageNo: number,
        pageSize: number,
    }): Promise<FetchListRes> {
        switch (type) {
            case Consts.Const_Task_Type_问题:
                return Summary.asyncGetAnswerContentByQuestion({ questionId: parentId, pageNo, pageSize })
            case Consts.Const_Task_Type_用户的所有回答:
                return Summary.asyncGetAuthorContent({ authorUrlToken: parentId, pageNo, pageSize })
            case Consts.Const_Task_Type_专栏:
                return Summary.asyncGetColumnContent({ columnId: parentId, pageNo, pageSize })
            case Consts.Const_Task_Type_收藏夹:
                return Summary.asyncGetCollectionContent({ collectionId: parentId, pageNo, pageSize })
            case Consts.Const_Task_Type_话题:
                return Summary.asyncGetTopicContent({ topicId: parentId, pageNo, pageSize })
            default:
                return {
                    recordList: [],
                    total: 0,
                    pageNo,
                    pageSize,
                    parentId,
                }
        }
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
        pageSize,
        parentId,
    }: {
        type: Select_Type,
            pageNo: number,
            pageSize: number,
            parentId?: string,
        }) {
        if (typeof parentId === 'string' && parentId.trim() !== '') {
            return Summary.asyncGetRelatedContentList({
                type,
                parentId,
                pageNo,
                pageSize,
            })
        }
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
