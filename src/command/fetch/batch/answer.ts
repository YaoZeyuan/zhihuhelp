import TypeAnswer from '~/src/type/namespace/answer'
import AnswerApi from '~/src/api/answer'
import CommonUtil from '~/src/library/util/common'
import MTotalAnswer from '~/src/model/total_answer'
import Logger from '~/src/library/logger'
import _ from 'lodash'

class BatchFetchAnswer {
  /**
   * 获取单个回答,并存入数据库中
   * @param answerId
   */
  async fetchAndSaveToDb(answerId: string) {
    Logger.log(`准备抓取回答${answerId}`)
    let answer = await AnswerApi.asyncGetAnswer(answerId)
    if (_.isEmpty(answer)) {
      Logger.log(`回答${answerId}抓取失败`)
      return
    }
    let questionId = `${answer.question.id}`
    Logger.log(`回答${answerId}抓取成功, 存入数据库`)
    await MTotalAnswer.asyncReplaceAnswer(questionId, answer)
    Logger.log(`回答${answerId}成功存入数据库`)
  }

  /**
   * 获取回答列表,并存入数据库中
   * @param answerIdList
   */
  async fetchAnswerListAndSaveToDb(answerIdList: Array<string>) {
    let index = 0
    for (let answerId of answerIdList) {
      index = index + 1
      Logger.log(`将第${index}/${answerIdList.length}个回答(${answerId})置入待抓取队列中`)
      await CommonUtil.asyncAppendPromiseWithDebounce(this.fetchAndSaveToDb(answerId))
    }
    Logger.log(`派发所有待抓取回答任务`)
    await CommonUtil.asyncDispatchAllPromiseInQueen()
    Logger.log(`所有抓取回答任务执行完毕`)
  }
}

export default BatchFetchAnswer
