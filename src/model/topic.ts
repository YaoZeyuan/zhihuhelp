import Base from '~/src/model/base'
import * as TypeTopic from '~/src/type/zhihu/topic'
import * as TypeAnswer from '~/src/type/zhihu/answer'

class Topic extends Base {
  static TABLE_NAME = `Topic`
  static TABLE_COLUMN = [`topic_id`, `raw_json`]

  static TOPIC_ANSWER_TABLE_NAME = `Topic_Answer`
  static TOPIC_ANSWER_TABLE_COLUMN = [`topic_id`, `answer_id`]

  /**
   * 从数据库中获取话题信息
   * @param topicId
   */
  static async asyncGetTopicInfo(topicId: string): Promise<TypeTopic.Info> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where('topic_id', '=', topicId)
      .catch(() => {
        return []
      })
    let topicInfoJson = recordList?.[0]?.raw_json
    let topicInfo
    try {
      topicInfo = JSON.parse(topicInfoJson)
    } catch {
      topicInfo = {}
    }
    return topicInfo
  }

  /**
   * 从数据库中获取话题内的答案id列表
   * @param topicId
   */
  static async asyncGetAnswerIdList(topicId: string): Promise<string[]> {
    let recordList = await this.db
      .select(this.TOPIC_ANSWER_TABLE_COLUMN)
      .from(this.TOPIC_ANSWER_TABLE_NAME)
      .where('topic_id', '=', topicId)
      .catch(() => {
        return []
      })
    let answerIdList: string[] = []
    for (let record of recordList) {
      answerIdList.push(record.answer_id)
    }

    return answerIdList
  }

  /**
   * 存储话题信息数据
   * @param topicRecord
   */
  static async asyncReplaceTopicInfo(topicRecord: TypeTopic.Info): Promise<void> {
    let topicId = topicRecord.id
    let raw_json = JSON.stringify(topicRecord)
    await this.replaceInto({
      topic_id: topicId,
      raw_json,
    })
    return
  }

  /**
   * 存储话题答案数据
   * @param columnRecord
   */
  static async asyncReplaceTopicAnswer(topicId: string, answerRecord: TypeAnswer.Record): Promise<void> {
    let answerId = answerRecord.id
    await this.replaceInto(
      {
        topic_id: topicId,
        answer_id: answerId,
      },
      this.TOPIC_ANSWER_TABLE_NAME,
    )
    return
  }

  /**
   * 获取所有topic数量
   * @returns 
   */
  static async asyncGetTopicCount(): Promise<number> {
    let count = await this.db
      .countDistinct("topic_id as count")
      .from(this.TABLE_NAME)
      .catch(() => {
        return []
      }) as { "count": number }[]

    return count?.[0]?.count ?? 0
  }
}

export default Topic
