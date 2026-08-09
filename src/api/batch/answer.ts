import AnswerApi from '~/src/api/single/answer.js'
import MAnswer from '~/src/model/answer.js'
import Base from '~/src/api/batch/base.js'

class BatchFetchAnswer extends Base {
  /**
   * 获取单个回答,并存入数据库中
   * @param answerId
   */
  async fetch(answerId: string) {
    this.log(`准备抓取回答${answerId}`)
    let answer = await AnswerApi.asyncGetAnswer(answerId)
    this.assertEntityRecord(answer, 'answer', answerId)
    let questionId = `${answer.question.id}`
    this.log(`问题${questionId}下的回答${answerId}抓取成功, 存入数据库`)
    await this.persist('answer', answerId, () => MAnswer.asyncReplaceAnswer(answer))
    this.log(`问题${questionId}下的回答${answerId}成功存入数据库`)
  }
}

export default BatchFetchAnswer
