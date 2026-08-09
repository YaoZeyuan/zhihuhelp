import Base from '~/src/model/base.js'
import type * as TypeAuthor from '~/src/type/zhihu/author.js'

class Author extends Base {
  static TABLE_NAME = `Author`
  static TABLE_COLUMN = [`id`, `url_token`, `raw_json`]

  /**
   * 从数据库中获取用户信息
   * @param urlToken
   */
  static async asyncGetAuthor(urlToken: string): Promise<TypeAuthor.Record> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where('url_token', '=', urlToken)
    let authorRecord = recordList?.[0]
    if (authorRecord === undefined) {
      return {} as TypeAuthor.Record
    }
    return this.parseEntityRawJson<TypeAuthor.Record>(authorRecord.raw_json, urlToken)
  }

  /**
   * 存储用户数据
   * @param authorRecord
   */
  static async asyncReplaceAuthor(authorRecord: TypeAuthor.Record): Promise<void> {
    let id = authorRecord.id
    let url_token = authorRecord.url_token
    let raw_json = JSON.stringify(authorRecord)
    await this.replaceInto({
      id,
      url_token,
      raw_json,
    })
    return
  }

  /**
   * 获取所有author数量
   * @returns 
   */
  static async asyncGetAuthorCount(): Promise<number> {
    let count = (await this.db
      .countDistinct("url_token as count")
      .from(this.TABLE_NAME)) as { "count": number }[]

    return count?.[0]?.count ?? 0
  }
}

export default Author
