import Base from '~/src/model/base.js'
import type * as TypeAuthor from '~/src/type/zhihu/author.js'
import {
  createResolvedAuthorIdentity,
  normalizeAuthorIdentifier,
  type ResolvedAuthorIdentity,
} from '~/src/domain/author/identity.js'

type AuthorRow = {
  id: unknown
  url_token: unknown
  raw_json: unknown
}

class Author extends Base {
  static TABLE_NAME = `Author`
  static TABLE_COLUMN = [`id`, `url_token`, `raw_json`]

  /**
   * 从数据库中获取用户信息
   * @param urlToken
   */
  static async asyncGetAuthor(identifier: string): Promise<TypeAuthor.Record> {
    const identity = await this.asyncResolveIdentity(identifier)
    if (identity === undefined) {
      return {} as TypeAuthor.Record
    }
    return identity.author
  }

  /**
   * Resolve either the stable Author.id or the current Author.url_token.
   * Stable ids deliberately win if an identifier happens to match both columns.
   */
  static async asyncResolveIdentity(identifier: string): Promise<ResolvedAuthorIdentity | undefined> {
    const requestedIdentifier = normalizeAuthorIdentifier(identifier)
    if (requestedIdentifier === '') {
      return undefined
    }

    let recordList = (await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where('id', '=', requestedIdentifier)
      .limit(1)) as AuthorRow[]

    if (recordList.length === 0) {
      recordList = (await this.db
        .select(this.TABLE_COLUMN)
        .from(this.TABLE_NAME)
        .where('url_token', '=', requestedIdentifier)
        .limit(1)) as AuthorRow[]
    }

    const persistedAuthor = recordList[0]
    if (persistedAuthor === undefined) {
      return undefined
    }

    const author = this.parseEntityRawJson<TypeAuthor.Record>(
      persistedAuthor.raw_json,
      normalizeAuthorIdentifier(persistedAuthor.id) || requestedIdentifier,
    )
    return createResolvedAuthorIdentity(author, requestedIdentifier, persistedAuthor)
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
    let count = (await this.db.countDistinct('url_token as count').from(this.TABLE_NAME)) as { count: number }[]

    return count?.[0]?.count ?? 0
  }
}

export default Author
