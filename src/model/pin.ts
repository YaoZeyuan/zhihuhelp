import Base from '~/src/model/base'
import * as TypePin from '~/src/type/zhihu/pin'
import lodash from 'lodash'

class Pin extends Base {
  static TABLE_NAME = `Pin`
  static TABLE_COLUMN = [`pin_id`, `author_url_token`, `author_id`, `raw_json`]

  /**
   * 从数据库中获取用户的想法列表
   * @param questionId
   */
  static async asyncGetPinListByAuthorUrlToken(authorUrlToken: string): Promise<TypePin.Record[]> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where('author_url_token', authorUrlToken)
      .catch(() => {
        return []
      })
    let pinRecordList = []
    for (let record of recordList) {
      let pinRecordJson = record?.raw_json
      let pinRecord
      try {
        pinRecord = JSON.parse(pinRecordJson)
      } catch {
        pinRecord = {}
      }
      if (lodash.isEmpty(pinRecord) === false) {
        pinRecordList.push(pinRecord)
      }
    }

    return pinRecordList
  }
  /**
   * 根据pinId从数据库中获取用户的想法
   * @param pinId
   */
  static async asyncGetPin(pinId: string): Promise<TypePin.Record> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where('pin_id', '=', pinId)
      .catch(() => {
        return []
      })
    let pinRecordJson = recordList?.[0]?.raw_json
    let pinRecord: TypePin.Record
    try {
      pinRecord = JSON.parse(pinRecordJson)
    } catch {
      pinRecord = {} as any
    }

    return pinRecord
  }

  /**
   * 根据pinId从数据库中获取用户的想法列表
   * @param pinIdList
   */
  static async asyncGetPinList(pinIdList: string[]): Promise<TypePin.Record[]> {
    let sql = this.db.select(this.TABLE_COLUMN).from(this.TABLE_NAME).whereIn('pin_id', pinIdList).toString()
    // sql中的变量太多(>999), 会导致sqlite3中的select查询无法执行, 因此这里改为使用raw直接执行sql语句
    let recordList = await this.rawClient.raw(sql, []).catch(() => {
      return []
    })
    let pinRecordList = []
    for (let record of recordList) {
      let pinRecordJson = record?.raw_json
      let pinRecord
      try {
        pinRecord = JSON.parse(pinRecordJson)
      } catch {
        pinRecord = {}
      }
      if (lodash.isEmpty(pinRecord) === false) {
        pinRecordList.push(pinRecord)
      }
    }

    return pinRecordList
  }

  /**
   * 存储想法数据
   * @param pinRecord
   */
  static async asyncReplacePin(pinRecord: TypePin.Record): Promise<void> {
    let raw_json = JSON.stringify(pinRecord)
    let pin_id = pinRecord.id
    let author_url_token = pinRecord.author.url_token
    let author_id = pinRecord.author.id
    await this.replaceInto(
      {
        pin_id,
        author_id,
        author_url_token,
        raw_json,
      },
      this.TABLE_NAME,
    )
    return
  }

  /**
   * 获取所有pin数量
   * @returns 
   */
  static async asyncGetPinCount(): Promise<number> {
    let count = await this.db
      .countDistinct("pin_id as count")
      .from(this.TABLE_NAME)
      .catch(() => {
        return []
      }) as { "count": number }[]

    return count?.[0]?.count ?? 0
  }
}

export default Pin
