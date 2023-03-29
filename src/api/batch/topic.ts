import TopicApi from '~/src/api/single/topic'
import MTopic from '~/src/model/topic'
import Base from '~/src/api/batch/base'
import CommonUtil from '~/src/library/util/common'
import BatchFetchAnswer from '~/src/api/batch/answer'

class BatchFetchTopic extends Base {
  async fetch(id: string) {
    this.log(`开始抓取话题${id}的精华回答`)
    this.log(`获取话题信息`)
    const topicInfo = await TopicApi.asyncGetTopicInfo(id)
    await MTopic.asyncReplaceTopicInfo(topicInfo)
    let baseAnswer = topicInfo.best_answers_count
    this.log(`话题${topicInfo.name}(${topicInfo.id})信息获取完毕, 共有精华回答${baseAnswer}个`)

    let answerIdList: string[] = []
    let batchFetchAnswer = new BatchFetchAnswer()
    this.log(`开始抓取话题精华回答列表`)
    for (let offset = 0; offset < baseAnswer; offset = offset + this.fetchLimit) {
      let asyncTaskFunc = async () => {
        let answerList = await TopicApi.asyncGetAnswerList(id, offset, this.fetchLimit)
        for (let answer of answerList) {
          // 传递给外部
          answerIdList.push(`${answer.id}`)
          await MTopic.asyncReplaceTopicAnswer(id, answer).catch((e) => {
            console.log('catch error')
            console.log(e)
          })
        }
        this.log(`列表中第${offset}~${offset + answerList.length}条精华回答摘要抓取完毕`)
      }
      CommonUtil.addAsyncTaskFunc({
        asyncTaskFunc,
        needProtect: true
      })
    }
    await CommonUtil.asyncWaitAllTaskComplete({
      needTTL: true
    })
    this.log(`全部话题精华回答列表抓取完毕`)

    this.log(`开始抓取话题${topicInfo.name}(${topicInfo.id})的下所有精华回答,共${answerIdList.length}条`)
    await batchFetchAnswer.fetchListAndSaveToDb(answerIdList)
    this.log(`话题${topicInfo.name}(${topicInfo.id})下所有精华回答抓取完毕`)
  }
}

export default BatchFetchTopic
