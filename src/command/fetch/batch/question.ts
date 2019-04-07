import TypeAnswer from '~/src/type/namespace/answer'
import TypeQuestion from '~/src/type/namespace/question'
import QuestionApi from '~/src/api/question'
import AnswerApi from '~/src/api/answer'
import CommonUtil from '~/src/library/util/common'
import MTotalAnswer from '~/src/model/total_answer'
import MQuestion from '~/src/model/question'
import Logger from '~/src/library/logger'
import _ from 'lodash'
import BatchFetchAnswer from '~/src/command/fetch/batch/answer'
import Base from '~/src/command/fetch/batch/base'

class BatchFetchQuestion extends Base {
  /**
   * 获取单个问题,并存入数据库中
   * @param questionId
   */
  async fetchAndSaveToDb(questionId: string) {
    Logger.log(`准备抓取问题${questionId}`)
    let question = await QuestionApi.asyncGetQuestionInfo(questionId)
    if (_.isEmpty(question)) {
      Logger.log(`问题${questionId}抓取失败`)
      return
    }
    let title = question.title
    let answerCount = question.answer_count
    Logger.log(`问题:${title}(${questionId})信息抓取成功, 存入数据库`)
    await MQuestion.asyncReplaceQuestionInfo(question)
    Logger.log(`问题:${title}(${questionId})信息成功存入数据库`)
    Logger.log(`问题${title}(${questionId})下共有${answerCount}个回答`)
    Logger.log(`开始抓取问题${title}(${questionId})下的回答列表`)
    let answerIndex = 0
    let answerIdList = []
    let batchFetchAnswer = new BatchFetchAnswer()
    for (let offset = 0; offset < answerCount; offset = offset + this.max) {
      let answerList = await QuestionApi.asyncGetAnswerList(questionId, offset, this.max)
      for (let answer of answerList) {
        answerIndex = answerIndex + 1
        await MQuestion.asyncReplaceQuestionAnswer(questionId, answer)
        let answerId = `${answer.id}`
        answerIdList.push(answerId)
      }
    }
    await batchFetchAnswer.fetchListAndSaveToDb(answerIdList)
    Logger.log(`问题${title}(${questionId})下全部回答抓取完毕`)
  }
}

export default BatchFetchQuestion
