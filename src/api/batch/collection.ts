import CollectionApi from '~/src/api/collection'
import MCollection from '~/src/model/collection'
import Base from '~/src/api/batch/base'
import CommonUtil from '~/src/library/util/common'
import BatchFetchAnswer from '~/src/api/batch/answer'
import Logger from '~/src/library/logger'

class BatchFetchCollection extends Base {
  async fetch(id: string) {
    this.log(`开始抓取收藏夹${id}内的回答`)
    this.log(`获取收藏夹信息`)
    const collectionInfo = await CollectionApi.asyncGetCollectionInfo(id)
    await MCollection.asyncReplaceColumnInfo(collectionInfo)
    let answerCount = collectionInfo.answer_count
    this.log(`话题${collectionInfo.title}(${collectionInfo.id})信息获取完毕, 共有回答${answerCount}个`)

    let answerIdList: string[] = []
    let batchFetchAnswer = new BatchFetchAnswer()
    // @todo 收藏夹目前支持收藏文章和想法, 需要根据收藏类型进行分类处理. 数据库表结构也需要改一下
    this.log(`开始抓取回答列表`)
    for (let offset = 0; offset < answerCount; offset = offset + this.fetchLimit) {
      let asyncTaskFunc = async () => {
        // 先拿到AnswerExcerpt, 然后再去获取回答详情
        let answerList = await CollectionApi.asyncGetAnswerExcerptList(id, offset, this.fetchLimit)
        for (let answer of answerList) {
          answerIdList.push(`${answer.id}`)
          await MCollection.asyncReplaceColumnAnswerExcerpt(id, answer).catch((e) => {
            Logger.log('catch error')
            Logger.log(e)
          })
        }
        this.log(`列表中第${offset}~${offset + answerList.length}条回答摘要抓取完毕`)
      }
      CommonUtil.addAsyncTaskFunc({
        asyncTaskFunc,
        needProtect: true,
        label: this,
      })
    }
    await CommonUtil.asyncWaitAllTaskCompleteByLabel(this)
    this.log(`全部回答摘要列表抓取完毕`)

    this.log(`开始抓取收藏夹${collectionInfo.title}(${collectionInfo.id})的下所有回答详情,共${answerIdList.length}条`)
    await batchFetchAnswer.fetchListAndSaveToDb(answerIdList)
    this.log(`收藏夹${collectionInfo.title}(${collectionInfo.id})下所有回答详情抓取完毕`)
  }
}

export default BatchFetchCollection
