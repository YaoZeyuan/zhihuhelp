import Base from '~/src/model/base.js'
import * as TypePin from '~/src/type/zhihu/pin.js'
import lodash from 'lodash'
import { normalizeAuthorAliases, normalizeAuthorIdentifier } from '~/src/domain/author/identity.js'

class Pin extends Base {
  static TABLE_NAME = `Pin`
  static TABLE_COLUMN = [`pin_id`, `author_url_token`, `author_id`, `raw_json`]

  /**
   * 从数据库中获取用户的想法列表
   * @param questionId
   */
  static async asyncGetPinListByAuthorUrlToken(authorUrlToken: string): Promise<TypePin.Record[]> {
    return this.asyncGetPinListByAuthorIdentity(authorUrlToken, [authorUrlToken])
  }

  /**
   * Query author relations by stable id first while retaining token-only legacy rows.
   */
  static async asyncGetPinListByAuthorIdentity(authorId: string, aliases: string[] = []): Promise<TypePin.Record[]> {
    const normalizedAuthorId = normalizeAuthorIdentifier(authorId)
    const normalizedAliases = normalizeAuthorAliases([normalizedAuthorId, ...aliases])
    if (normalizedAuthorId === '' && normalizedAliases.length === 0) {
      return []
    }

    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where((builder) => {
        if (normalizedAuthorId !== '') {
          builder.where('author_id', '=', normalizedAuthorId)
        }
        if (normalizedAliases.length > 0) {
          const method = normalizedAuthorId === '' ? 'whereIn' : 'orWhereIn'
          builder[method]('author_url_token', normalizedAliases)
        }
      })
    let pinRecordList = []
    for (let record of recordList) {
      let pinRecord = this.parseEntityRawJson<TypePin.Record>(record?.raw_json, record?.pin_id ?? 'unknown')
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
    let recordList = await this.db.select(this.TABLE_COLUMN).from(this.TABLE_NAME).where('pin_id', '=', pinId)
    let pinRecord = recordList?.[0]
    if (pinRecord === undefined) {
      return {} as TypePin.Record
    }
    return this.parseEntityRawJson<TypePin.Record>(pinRecord.raw_json, pinId)
  }

  /**
   * 根据pinId从数据库中获取用户的想法列表
   * @param pinIdList
   */
  static async asyncGetPinList(pinIdList: string[]): Promise<TypePin.Record[]> {
    let sql = this.db.select(this.TABLE_COLUMN).from(this.TABLE_NAME).whereIn('pin_id', pinIdList).toString()
    // sql中的变量太多(>999), 会导致sqlite3中的select查询无法执行, 因此这里改为使用raw直接执行sql语句
    let recordList = await this.rawClient.raw(sql, [])
    let pinRecordList = []
    for (let record of recordList) {
      let pinRecord = this.parseEntityRawJson<TypePin.Record>(record?.raw_json, record?.pin_id ?? 'unknown')
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
    let count = (await this.db.countDistinct('pin_id as count').from(this.TABLE_NAME)) as { count: number }[]

    return count?.[0]?.count ?? 0
  }
}

export default Pin
