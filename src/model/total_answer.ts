import Base from '~/src/model/base'
import TypeAnswer from '~/src/type/namespace/answer'
import _ from 'lodash'

class TotalAnswer extends Base {
  static TABLE_NAME = `V2_Total_Answer`
  static TABLE_COLUMN = [`answer_id`, `question_id`, `author_url_token`, `author_id`, `raw_json`]

  /**
   * 从数据库中获取话题内的答案列表
   * @param questionId
   */
  static async asyncGetAnswerList(answerIdList: Array<string>): Promise<Array<TypeAnswer.Record>> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .whereIn('answer_id', answerIdList)
      .catch(() => {
        return []
      })
    let answerRecordList = []
    for (let record of recordList) {
      let answerRecordJson = _.get(record, ['raw_json'], '{}')
      let answerRecord
      try {
        answerRecord = JSON.parse(answerRecordJson)
      } catch {
        answerRecord = {}
      }
      if (_.isEmpty(answerRecord) === false) {
        answerRecordList.push(answerRecord)
      }
    }

    return answerRecordList
  }

  /**
   * 存储问题答案数据
   * @param columnRecord
   */
  static async asyncReplaceAnswer(answerRecord: TypeAnswer.Record): Promise<void> {
    let raw_json = JSON.stringify(answerRecord)
    let answerId = answerRecord.id
    let questionId = answerRecord.question.id
    let authorUrlToken = answerRecord.author.url_token
    let authorId = answerRecord.author.id
    await this.replaceInto(
      {
        question_id: questionId,
        answer_id: answerId,
        author_id: authorId,
        author_url_token: authorUrlToken,
        raw_json,
      },
      this.TABLE_NAME,
    )
    return
  }
}

export default TotalAnswer
