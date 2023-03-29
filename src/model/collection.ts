import Base from '~/src/model/base'
import * as TypeCollection from '~/src/type/zhihu/collection'
import moment from 'moment'

type Type_Record = {
  record_type:
  | typeof Collection.Const_Record_Type_回答
  | typeof Collection.Const_Record_Type_想法
  | typeof Collection.Const_Record_Type_文章
  record_id: string
  record_at: number
}

class Collection extends Base {
  static TABLE_NAME = `Collection`
  static TABLE_COLUMN = [`collection_id`, `raw_json`]

  static COLLECTION_RECORD_TABLE_NAME = `Collection_Record`
  static COLLECTION_RECORD_TABLE_COLUMN = [
    `collection_id`,
    // 记录类型: answer/pin/article
    `record_type`,
    `record_id`,
    // 添加到收藏夹的时间戳
    `record_at`,
    `raw_json`,
  ]

  static readonly Const_Record_Type_回答 = 'answer' as const
  static readonly Const_Record_Type_想法 = 'pin' as const
  static readonly Const_Record_Type_文章 = 'article' as const

  /**
   * 从数据库中获取收藏夹信息
   * @param collectionId
   */
  static async asyncGetCollectionInfo(collectionId: string): Promise<TypeCollection.Info> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where('collection_id', '=', collectionId)
      .catch(() => {
        return []
      })
    let collectionInfoJson = recordList?.[0]?.['raw_json']
    let collectionInfo
    try {
      collectionInfo = JSON.parse(collectionInfoJson)
    } catch {
      collectionInfo = {}
    }
    return collectionInfo
  }

  /**
   * 从数据库中获取收藏夹内的记录id列表
   * @param collectionId
   */
  static async asyncGetCollectionRecordList(collectionId: string): Promise<Type_Record[]> {
    let recordList = await this.db
      .select(this.COLLECTION_RECORD_TABLE_COLUMN)
      .from(this.COLLECTION_RECORD_TABLE_NAME)
      .where('collection_id', '=', collectionId)
      .catch(() => {
        return []
      })

    return recordList
  }

  /**
   * 存储收藏夹数据
   * @param collectionRecord
   */
  static async asyncReplaceCollectionInfo(collectionRecord: TypeCollection.Info): Promise<void> {
    let collectionId = collectionRecord.id
    let raw_json = JSON.stringify(collectionRecord)
    await this.replaceInto({
      collection_id: collectionId,
      raw_json,
    })
    return
  }

  /**
   * 存储收藏夹元素概览数据
   * @param columnRecord
   */
  static async asyncReplaceCollectionRecord(
    collectionId: number | string,
    rawCollectionRecord: TypeCollection.Type_Collection_Item,
  ): Promise<void> {
    let collectionRecord = rawCollectionRecord.content
    let collectionRecordAtStr = rawCollectionRecord.created
    // '2022-01-13T00:08:14+08:00'
    let record_at = moment(collectionRecordAtStr, 'YYYY-MM-DDTHH:mm:ssZZ').clone().unix()
    let record_type = collectionRecord.type
    let record_id = collectionRecord.id

    // 有没有记录, 都需要使用新json数据
    let raw_json = JSON.stringify(collectionRecord)
    await this.replaceInto(
      {
        collection_id: collectionId,
        record_id,
        record_at,
        record_type,
        raw_json,
      },
      this.COLLECTION_RECORD_TABLE_NAME,
    )
    return
  }

  /**
   * 获取所有collection数量
   * @returns 
   */
  static async asyncGetCollectionCount(): Promise<number> {
    let count = await this.db
      .countDistinct("collection_id as count")
      .from(this.TABLE_NAME)
      .catch(() => {
        return []
      }) as { "count": number }[]

    return count?.[0]?.count ?? 0
  }
}

export default Collection
