import CollectionApi from '~/src/api/single/collection'
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
    await MCollection.asyncReplaceCollectionInfo(collectionInfo)
    let answerCount = collectionInfo.answer_count
    this.log(`话题${collectionInfo.title}(${collectionInfo.id})信息获取完毕, 共有回答${answerCount}个`)

    let answerIdList: string[] = []
    let batchFetchAnswer = new BatchFetchAnswer()
    this.log(`开始抓取收藏列表`)
    for (let offset = 0; offset < answerCount; offset = offset + this.fetchLimit) {
      let asyncTaskFunc = async () => {
        // 先拿到AnswerExcerpt, 然后再去获取回答详情
        let itemList = await CollectionApi.asyncGetItemList(id, offset, this.fetchLimit)
        for (let item of itemList) {
          await MCollection.asyncReplaceCollectionRecord(id, item)
        }
        this.log(`收藏列表中第${offset}~${offset + itemList.length}条记录抓取完毕`)
      }
      CommonUtil.addAsyncTaskFunc({
        asyncTaskFunc,
        needProtect: true,
      })
    }
    await CommonUtil.asyncWaitAllTaskComplete()
    this.log(`全部收藏摘要列表抓取完毕`)
    // 然后需要抓取涉及的回答/想法/文章

    this.log(`开始抓取收藏夹${collectionInfo.title}(${collectionInfo.id})的下所有回答详情,共${answerIdList.length}条`)
    await batchFetchAnswer.fetchListAndSaveToDb(answerIdList)
    this.log(`收藏夹${collectionInfo.title}(${collectionInfo.id})下所有回答详情抓取完毕`)
  }
}

export default BatchFetchCollection
