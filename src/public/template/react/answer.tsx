import TypeAnswer from '~/src/type/zhihu/answer'
import Base from '~/src/public/template/react/base'

class Answer extends Base {
  /**
   * 生成单个问题对应的react元素
   * @param answerRecordList
   */
  private static generateSingleItemElement(answerRecordList: TypeAnswer.Record[]) {
    let baseAnswerRecord: TypeAnswer.Record = answerRecordList?.[0]
    let answerElementList = []
    for (let answerRecord of answerRecordList) {
      let answerElement = this.generateSingleAnswerElement(answerRecord)
      answerElementList.push(answerElement)
    }
    let questionElement = this.generateQuestionElement(baseAnswerRecord.question, answerElementList)
    return questionElement
  }

  static render(answerInSameQuestionRecordList: TypeAnswer.Record[]) {
    // 都是同一个
    let baseAnswerRecord: TypeAnswer.Record = answerInSameQuestionRecordList?.[0]
    let title = baseAnswerRecord.question.title
    let questionElement = this.generateSingleItemElement(answerInSameQuestionRecordList)
    let pageElement = this.generatePageElement(title, [questionElement])
    return this.renderToString(pageElement)
  }

  /**
   * 将按问题分组的answer记录渲染到同一个html中
   *
   * @param title 最后生成html的标题
   * @param answerRecordList 按相同问题对答案进行分组
   */
  static renderInSinglePage(title: string, answerRecordList: TypeAnswer.Record[][]) {
    let questionElementList = []
    for (let answerInSameQuestionRecordList of answerRecordList) {
      let questionElement = this.generateSingleItemElement(answerInSameQuestionRecordList)
      questionElementList.push(questionElement)
    }
    let pageElement = this.generatePageElement(title, questionElementList)
    return this.renderToString(pageElement)
  }
}

export default Answer
