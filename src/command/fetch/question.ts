import Base from '~/src/command/fetch/base'
import QuestionApi from '~/src/api/question'
import AnswerApi from '~/src/api/answer'
import MAnswer from '~/src/model/answer'
import MQuestion from '~/src/model/question'
import MTotalAnswer from '~/src/model/total_answer'
import CommonUtil from '~/src/library/util/common'
import _ from 'lodash'

class FetchQuestion extends Base {
  static get signature() {
    return `
        Fetch:Question

        {id:[必传]问题id}
        `
  }

  static get description() {
    return '抓取知乎问题'
  }

  async execute(args: any, options: any): Promise<any> {
    const { id: questionId } = args
    this.log(`开始抓取问题${questionId}下的数据`)
    this.log(`获取问题信息`)
    const questionInfo = await QuestionApi.asyncGetQuestionInfo(questionId)
    await MQuestion.asyncReplaceQuestionInfo(questionInfo)
    this.log(`用户信息获取完毕`)
    const title = questionInfo.title
    const answerCount = questionInfo.answer_count
    this.log(`问题${title}(${questionId})下共有${answerCount}个回答`)
    this.log(`开始抓取回答列表`)
    let answerIndex = 0
    for (let offset = 0; offset < answerCount; offset = offset + this.max) {
      let answerList = await QuestionApi.asyncGetAnswerList(questionId, offset, this.max)
      for (let answer of answerList) {
        answerIndex = answerIndex + 1
        await MQuestion.asyncReplaceQuestionAnswer(questionId, answer)
        let answerId = `${answer.id}`
        await CommonUtil.asyncAppendPromiseWithDebounce(this.fetchAnswer(answerId, answerIndex, answerCount))
      }
    }
    await CommonUtil.asyncAppendPromiseWithDebounce(new Promise(() => {}), true)
    this.log(`全部回答抓取完毕`)
  }

  async fetchAnswer(answerId: string, index: number, totalAnswer: number) {
    let answer = await AnswerApi.asyncGetAnswer(answerId)
    let questionId: string = _.get(answer, ['question', 'id'], '')
    if (_.isEmpty(questionId)) {
      this.log(`回答${answerId}中没有问题数据, 自动跳过`)
    }
    await MTotalAnswer.asyncReplaceAnswer(questionId, answer)
    this.log(`第${index}/${totalAnswer}个回答获取完毕`)
    return
  }
}

export default FetchQuestion
