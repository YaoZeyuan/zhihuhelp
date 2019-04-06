import Base from '~/src/command/fetch/base'
import AnswerApi from '~/src/api/answer'
import MTotalAnswer from '~/src/model/total_answer'
import CommonUtil from '~/src/library/util/common'
import _ from 'lodash'

class FetchAnswer extends Base {
  static get signature() {
    return `
        Fetch:Answer

        {id:[必传]答案id}
        `
  }

  static get description() {
    return '抓取单个知乎回答'
  }

  async execute(args: any, options: any): Promise<any> {
    const { id: answerId } = args
    await CommonUtil.asyncAppendPromiseWithDebounce(this.fetchAnswer(answerId, 1, 1))
    await CommonUtil.asyncAppendPromiseWithDebounce(new Promise(() => {}), true)
    this.log(`回答${answerId}抓取完毕`)
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

export default FetchAnswer
