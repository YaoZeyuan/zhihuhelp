import AuthorApi from '~/src/api/single/author'
import MAuthorAskQuestion from '~/src/model/author_ask_question'
import MAuthor from '~/src/model/author'
import Base from '~/src/api/batch/base'
import BatchFetchQuestion from '~/src/api/batch/question'
import { assertZhihuNonNegativeIntegerCount } from '~/src/shared/error/zhihu_response_validation'

class BatchFetchAuthorQuestion extends Base {
  async fetch(urlToken: string) {
    this.log(`开始抓取用户${urlToken}的数据`)
    this.log(`获取用户信息`)
    const authorInfo = await AuthorApi.asyncGetAutherInfo(urlToken)
    this.assertEntityRecord(authorInfo, 'author', urlToken, ['id', 'url_token'])
    await this.persist('author', urlToken, () => MAuthor.asyncReplaceAuthor(authorInfo))
    this.log(`用户信息获取完毕`)
    const name = authorInfo.name
    const authorId = authorInfo.id
    const questionCount = assertZhihuNonNegativeIntegerCount(authorInfo.question_count, `author ${urlToken}.question_count`)
    this.log(`用户${name}(${urlToken})共提了${questionCount}个问题`)
    this.log(`开始抓取提问列表`)
    let batchFetchQuestion = new BatchFetchQuestion()
    for (let offset = 0; offset < questionCount; offset = offset + this.fetchLimit) {
      let authorQuestionList = await AuthorApi.asyncGetAutherQuestionList(urlToken, offset, this.fetchLimit)
      for (let authorQuestion of authorQuestionList) {
        await this.persist('author_question', `${urlToken}:${authorQuestion.id}`, () =>
          MAuthorAskQuestion.asyncReplaceAuthorQuestion(urlToken, authorId, authorQuestion),
        )
      }
      this.log(`第${offset}~${offset + this.fetchLimit}条用户提问记录获取完毕`)
    }
    let questionIdList = await MAuthorAskQuestion.asyncGetAuthorAskQuestionIdList(urlToken)
    this.log(`开始抓取用户${name}(${urlToken})的所有提问下的回答记录,共${questionIdList.length}条`)
    const outcome = await batchFetchQuestion.fetchListAndSaveToDb(questionIdList)
    this.log(`用户${name}(${urlToken})的提问记录抓取完毕`)
    return outcome
  }
}

export default BatchFetchAuthorQuestion
