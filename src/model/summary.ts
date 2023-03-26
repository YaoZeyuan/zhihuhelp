import Base from '~/src/model/base'

import MAuthor from '~/src/model/author'
import MAuthorAskQuestion from '~/src/model/author_ask_question'
import MActivity from '~/src/model/activity'
import MAnswer from '~/src/model/answer'
import MArticle from '~/src/model/article'
import MTopic from '~/src/model/topic'
import MCollection from '~/src/model/collection'
import MColumn from '~/src/model/column'
import MPin from '~/src/model/pin'

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
}