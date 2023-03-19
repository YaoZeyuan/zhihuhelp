import QuestionApi from '~/src/api/single/question'
import lodash from 'lodash'
import BatchFetchAnswer from '~/src/api/batch/answer'
import Base from '~/src/api/batch/base'
import CommonUtil from '~/src/library/util/common'

class BatchFetchQuestion extends Base {
  /**
   * 获取单个问题,并存入数据库中
   * @param questionId
   */
  async fetch(questionId: string) {
    this.log(`准备抓取问题${questionId}`)
    let question = await QuestionApi.asyncGetQuestionInfo(questionId)
    if (lodash.isEmpty(question)) {
      this.log(`问题${questionId}抓取失败`)
      return
    }
    let title = question.title
    let answerCount = question.answer_count
    this.log(`问题:${title}(${questionId})信息抓取成功`)
    // question的信息不需要存入数据库, 直接使用answer进行保存即可
    // this.log(`问题:${title}(${questionId})信息成功存入数据库`)
    this.log(`问题${title}(${questionId})下共有${answerCount}个回答`)
    this.log(`开始抓取问题${title}(${questionId})下的回答列表`)
    // 首先先获取所有answerId
    let answerIdList: string[] = []
    for (let offset = 0; offset < answerCount; offset = offset + this.fetchLimit) {
      let asyncTaskFunc = async () => {
        let answerList = await QuestionApi.asyncGetAnswerList(questionId, offset, this.fetchLimit)
        for (let answer of answerList) {
          let answerId = `${answer.id}`
          answerIdList.push(answerId)
        }
      }
      CommonUtil.addAsyncTaskFunc({
        asyncTaskFunc,
        needProtect: true
      })
    }
    await CommonUtil.asyncWaitAllTaskComplete({
      needTTL: true
    })
    // 然后集中获取相关回答内容
    let batchFetchAnswer = new BatchFetchAnswer()
    await batchFetchAnswer.fetchListAndSaveToDb(answerIdList)
    this.log(`问题${title}(${questionId})下全部回答抓取完毕`)
  }
}

export default BatchFetchQuestion
