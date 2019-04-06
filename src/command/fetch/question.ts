import Base from '~/src/command/fetch/base'
import QuestionApi from '~/src/api/question'
import AnswerApi from '~/src/api/answer'
import MAnswer from '~/src/model/answer'
import MQuestion from '~/src/model/question'

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
    for (let offset = 0; offset < answerCount; offset = offset + this.max) {
      let answerList = await QuestionApi.asyncGetAnswerList(questionId, offset, this.max)
      for (let answer of answerList) {
        await MQuestion.asyncReplaceQuestionAnswer(questionId, answer)
      }
      this.log(`第${offset}~${offset + this.max}条回答抓取完毕`)
    }
    this.log(`全部回答抓取完毕`)
  }
}

export default FetchQuestion
