import Base from '~/src/model/base'
import TypeAuthor from '~/src/type/zhihu/author'

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
      .catch(() => {
        return []
      })
    let authorInfoJson = recordList?.[0]?.raw_json
    let authorInfo
    try {
      authorInfo = JSON.parse(authorInfoJson)
    } catch {
      authorInfo = {}
    }
    return authorInfo
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
    let count = await this.db
      .countDistinct("url_token as count")
      .from(this.TABLE_NAME)
      .catch(() => {
        return []
      }) as { "count": number }[]

    return count?.[0]?.count ?? 0
  }
}

export default Author
