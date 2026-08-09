import AuthorApi from '~/src/api/single/author.js'
import MAuthorAskQuestion from '~/src/model/author_ask_question.js'
import MAuthor from '~/src/model/author.js'
import BatchFetchPin from '~/src/api/batch/pin.js'
import Base from '~/src/api/batch/base.js'
import CommonUtil from '~/src/library/util/common.js'
import CommonConfig from '~/src/config/common.js'
import { assertZhihuNonNegativeIntegerCount } from '~/src/shared/error/zhihu_response_validation.js'

class BatchFetchAuthorPin extends Base {
  async fetch(urlToken: string) {
    this.log(`开始抓取用户${urlToken}的数据`)
    this.log(`获取用户信息`)
    const authorInfo = await AuthorApi.asyncGetAutherInfo(urlToken)
    this.assertEntityRecord(authorInfo, 'author', urlToken, ['id', 'url_token'])
    await this.persist('author', urlToken, () => MAuthor.asyncReplaceAuthor(authorInfo))
    this.log(`用户信息获取完毕`)
    const name = authorInfo.name
    const authorId = authorInfo.id
    const pinCount = assertZhihuNonNegativeIntegerCount(authorInfo.pins_count, `author ${urlToken}.pins_count`)
    this.log(`用户${name}(${urlToken})共发布了${pinCount}个想法`)
    this.log(`开始抓取想法列表`)
    let batchFetchPin = new BatchFetchPin()
    let pinIdList: string[] = []
    for (let offset = 0; offset < pinCount; offset = offset + this.fetchLimit) {
      let asyncTaskFunc = async () => {
        let authorPinsList = await AuthorApi.asyncGetAutherPinList(urlToken, offset, this.fetchLimit)
        for (let authorPin of authorPinsList) {
          let pinId = `${authorPin.id}`
          pinIdList.push(pinId)
        }
        this.log(`第${offset}~${offset + this.fetchLimit}条用户想法记录获取完毕`)
      }

      CommonUtil.addAsyncTaskFunc({
        asyncTaskFunc,
        needProtect: true,
      })
    }
    await CommonUtil.asyncWaitAllTaskComplete({
      needTTL: true
    })
    this.log(`开始抓取用户${name}(${urlToken})的所有想法详情记录,共${pinIdList.length}条`)
    const outcome = await batchFetchPin.fetchListAndSaveToDb(pinIdList)
    this.log(`用户${name}(${urlToken})的想法列表抓取完毕`)
    return outcome
  }
}

export default BatchFetchAuthorPin
