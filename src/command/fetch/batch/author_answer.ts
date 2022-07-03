import AuthorApi from '~/src/api/author'
import MAuthor from '~/src/model/author'
import MTotalAnswer from '~/src/model/total_answer'
import Base from '~/src/command/fetch/batch/base'
import BatchFetchAnswer from '~/src/command/fetch/batch/answer'
import CommonUtil from '~/src/library/util/common'
import CommonConfig from '~/src/config/common'

class BatchFetchAuthorAnswer extends Base {
  async fetch(urlToken: string) {
    this.log(`开始抓取用户${urlToken}的数据`)
    this.log(`获取用户信息`)
    const authorInfo = await AuthorApi.asyncGetAutherInfo(urlToken)
    await MAuthor.asyncReplaceAuthor(authorInfo)
    this.log(`用户信息获取完毕`)
    const name = authorInfo.name
    const answerCount = authorInfo.answer_count
    this.log(`用户${name}(${urlToken})共有${answerCount}个回答`)
    this.log(`开始抓取回答列表`)
    this.log(`开始抓取用户${name}(${urlToken})的所有回答记录,共${answerCount}条`)
    let answetIdList = []
    let batchFetchAnswer = new BatchFetchAnswer()
    let loopCounter = 0
    for (let offset = 0; offset < answerCount; offset = offset + this.max) {
      let answerList = await AuthorApi.asyncGetAutherAnswerList(urlToken, offset, this.max)
      for (let answer of answerList) {
        await MTotalAnswer.asyncReplaceAnswer(answer)
      }
      this.log(`第${offset}~${offset + this.max}条回答记录抓取完毕`)
      loopCounter = loopCounter + 1
      if (loopCounter % CommonConfig.protect_Loop_Count === 0) {
        this.log(`第${loopCounter}次抓取, 休眠${CommonConfig.protect_To_Wait_ms / 1000}s, 保护知乎服务器`)
        await CommonUtil.asyncSleep(CommonConfig.protect_To_Wait_ms )
      }
    }
    // this.log(`开始抓取用户${name}(${urlToken})的所有回答记录,共${answetIdList.length}条`)
    // await batchFetchAnswer.fetchListAndSaveToDb(answetIdList)
    this.log(`用户${name}(${urlToken})的回答记录抓取完毕`)
  }
}

export default BatchFetchAuthorAnswer
