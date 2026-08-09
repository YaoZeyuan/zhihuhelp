import Base from '~/src/api/single/base.js'
import * as TypeCollection from '~/src/type/zhihu/collection.js'
import { assertZhihuPaginatedData } from '~/src/shared/error/zhihu_response_validation.js'

class Collection extends Base {
  /**
   * 获取收藏夹内回答摘要列表
   * @param offset
   * @param limit
   */
  static async asyncGetAnswerExcerptList(
    colectionId: number | string,
    offset: number = 0,
    limit: number = 20,
  ): Promise<TypeCollection.AnswerExcerpt[]> {
    const baseUrl = `https://www.zhihu.com/api/v4/collections/${colectionId}/items`
    const config = {
      offset: offset,
      limit: limit,
    }
    const record = await Base.http.get(baseUrl, {
      params: config,
    })
    const answerList = assertZhihuPaginatedData<TypeCollection.AnswerExcerpt>(record, 'collection.items')
    return answerList
  }

  /**
   * 获取收藏夹内内容列表
   * @param offset
   * @param limit
   */
  static async asyncGetItemList(
    colectionId: number | string,
    offset: number = 0,
    limit: number = 20,
  ): Promise<TypeCollection.Type_Collection_Item[]> {
    const baseUrl = `https://www.zhihu.com/api/v4/collections/${colectionId}/items`
    const config = {
      offset: offset,
      limit: limit,
    }
    const record = await Base.http.get(baseUrl, {
      params: config,
    })
    const recordList = assertZhihuPaginatedData<TypeCollection.Type_Collection_Item>(record, 'collection.items')
    return recordList
  }

  /**
   * 获取收藏夹信息
   * @param collectionId
   */
  static async asyncGetCollectionInfo(collectionId: number | string): Promise<TypeCollection.Info> {
    const baseUrl = `https://www.zhihu.com/api/v4/collections/${collectionId}`
    const config = {}
    const rawCollectionInfoRecord: any = await Base.http.get(baseUrl, {
      params: config,
    })
    const collectionInfoRecord = rawCollectionInfoRecord?.collection ?? {}
    return collectionInfoRecord
  }
}
export default Collection
