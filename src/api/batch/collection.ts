import CollectionApi from '~/src/api/single/collection'
import MCollection from '~/src/model/collection'
import Base from '~/src/api/batch/base'
import CommonUtil from '~/src/library/util/common'
import BatchFetchAnswer from '~/src/api/batch/answer'
import BatchFetchPin from '~/src/api/batch/pin'
import BatchFetchArticle from '~/src/api/batch/article'
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
    let pinIdList: string[] = []
    let articleIdList: string[] = []
    let batchFetchAnswer = new BatchFetchAnswer()
    let batchFetchPin = new BatchFetchPin()
    let batchFetchArticle = new BatchFetchArticle()
    this.log(`开始抓取收藏列表`)
    for (let offset = 0; offset < answerCount; offset = offset + this.fetchLimit) {
      let asyncTaskFunc = async () => {
        // 先拿到AnswerExcerpt, 然后再去获取回答详情
        let itemList = await CollectionApi.asyncGetItemList(id, offset, this.fetchLimit)
        for (let item of itemList) {
          await MCollection.asyncReplaceCollectionRecord(id, item)
          switch (item.content.type) {
            case "answer":
              answerIdList.push(item.content.id)
              break;
            case "pin":
              pinIdList.push(item.content.id)
              break;
            case "article":
              articleIdList.push(item.content.id)
              break;
          }
        }
        this.log(`收藏列表中第${offset}~${offset + itemList.length}条记录抓取完毕`)
      }
      CommonUtil.addAsyncTaskFunc({
        asyncTaskFunc,
        needProtect: true,
      })
    }
    await CommonUtil.asyncWaitAllTaskComplete({
      needTTL: true
    })
    this.log(`全部收藏摘要列表抓取完毕`)
    // 然后需要抓取涉及的回答/想法/文章

    this.log(`开始抓取收藏夹${collectionInfo.title}(${collectionInfo.id})的下所有回答详情,共${answerIdList.length}条`)
    await batchFetchAnswer.fetchListAndSaveToDb(answerIdList)
    this.log(`开始抓取收藏夹${collectionInfo.title}(${collectionInfo.id})的下所有想法详情,共${pinIdList.length}条`)
    await batchFetchPin.fetchListAndSaveToDb(pinIdList)
    this.log(`开始抓取收藏夹${collectionInfo.title}(${collectionInfo.id})的下所有文章详情,共${articleIdList.length}条`)
    await batchFetchArticle.fetchListAndSaveToDb(articleIdList)
    this.log(`收藏夹${collectionInfo.title}(${collectionInfo.id})下所有详情抓取完毕`)
  }
}

export default BatchFetchCollection
