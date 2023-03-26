import Base from '~/src/model/base'
import TypeArticle from '~/src/type/zhihu/article'
import lodash from 'lodash'

class Article extends Base {
  static TABLE_NAME = `Article`
  static TABLE_COLUMN = [`article_id`, `author_url_token`, `author_id`, `column_id`, `raw_json`]

  /**
   * 从数据库中获取文章详情
   * @param articleId
   */
  static async asyncGetArticle(articleId: string): Promise<TypeArticle.Record> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where('article_id', '=', articleId)
      .catch(() => {
        return []
      })
    let articleJson = recordList?.[0]?.raw_json
    let article
    try {
      article = JSON.parse(articleJson)
    } catch {
      article = {}
    }
    return article
  }

  /**
   * 从数据库中根据专栏id获取文章列表
   * @param columnId
   */
  static async asyncGetArticleListByAuthorUrlToken(authorUrlToken: string): Promise<TypeArticle.Record[]> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where('author_url_token', '=', authorUrlToken)
      .catch(() => {
        return []
      })

    let articleRecordList = []
    for (let record of recordList) {
      let articleRecordJson = record?.raw_json
      let articleRecord
      try {
        articleRecord = JSON.parse(articleRecordJson)
      } catch {
        articleRecord = {}
      }
      if (lodash.isEmpty(articleRecord) === false) {
        articleRecordList.push(articleRecord)
      }
    }
    return articleRecordList
  }

  /**
   * 从数据库中根据专栏id获取文章列表
   * @param columnId
   */
  static async asyncGetArticleListByColumnId(columnId: string): Promise<TypeArticle.Record[]> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where('column_id', '=', columnId)
      .catch(() => {
        return []
      })

    let articleRecordList = []
    for (let record of recordList) {
      let articleRecordJson = record?.raw_json
      let articleRecord
      try {
        articleRecord = JSON.parse(articleRecordJson)
      } catch {
        articleRecord = {}
      }
      if (lodash.isEmpty(articleRecord) === false) {
        articleRecordList.push(articleRecord)
      }
    }
    return articleRecordList
  }

  /**
   * 从数据库中获取文章列表
   * @param articleIdList
   */
  static async asyncGetArticleList(articleIdList: string[]): Promise<TypeArticle.Record[]> {
    let sql = this.db.select(this.TABLE_COLUMN).from(this.TABLE_NAME).whereIn('article_id', articleIdList).toString()
    // sql中的变量太多(>999), 会导致sqlite3中的select查询无法执行, 因此这里改为使用raw直接执行sql语句
    let recordList = await this.rawClient.raw(sql, []).catch(() => {
      return []
    })

    let articleRecordList = []
    for (let record of recordList) {
      let articleRecordJson = record?.raw_json
      let articleRecord
      try {
        articleRecord = JSON.parse(articleRecordJson)
      } catch {
        articleRecord = {}
      }
      if (lodash.isEmpty(articleRecord) === false) {
        articleRecordList.push(articleRecord)
      }
    }
    return articleRecordList
  }

  /**
   * 存储文章
   * @param articleRecord
   */
  static async asyncReplaceArticle(articleRecord: TypeArticle.Record): Promise<void> {
    let id = articleRecord.id
    // 文章可能不隶属于任何专栏, 也就可能没有column.id
    let columnId = articleRecord?.column?.id ?? 'ColumnNotExists'
    let authorUrlToken = articleRecord?.author?.url_token ?? 'AuthorNotExists'
    let authorId = articleRecord?.author?.id ?? 'AuthorIdNotExists'
    let raw_json = JSON.stringify(articleRecord)
    await this.replaceInto({
      article_id: id,
      author_id: authorId,
      author_url_token: authorUrlToken,
      column_id: columnId,
      raw_json,
    })
    return
  }

  /**
   * 获取所有question数量
   * @returns 
   */
  static async asyncGetArticleCount(): Promise<number> {
    let count = await this.db
      .countDistinct("article_id as count")
      .from(this.TABLE_NAME)
      .catch(() => {
        return []
      }) as { "count": number }[]

    return count?.[0]?.count ?? 0
  }
}

export default Article
