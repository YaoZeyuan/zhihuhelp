import Base from '~/src/model/base'
import TypeArticle from '~/src/type/namespace/article'
import _ from 'lodash'

class Article extends Base {
  static TABLE_NAME = `Article`
  static TABLE_COLUMN = [`article_id`, `column_id`, `raw_json`]

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
    let articleJson = _.get(recordList, [0, 'raw_json'], '{}')
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
  static async asyncGetArticleListByColumnId(columnId: string): Promise<Array<TypeArticle.Record>> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where('column_id', '=', columnId)
      .catch(() => {
        return []
      })

    let articleRecordList = []
    for (let record of recordList) {
      let articleRecordJson = _.get(record, ['raw_json'], '{}')
      let articleRecord
      try {
        articleRecord = JSON.parse(articleRecordJson)
      } catch {
        articleRecord = {}
      }
      if (_.isEmpty(articleRecord) === false) {
        articleRecordList.push(articleRecord)
      }
    }
    return articleRecordList
  }

  /**
   * 从数据库中获取文章列表
   * @param articleIdList
   */
  static async asyncGetArticleList(articleIdList: Array<string>): Promise<Array<TypeArticle.Record>> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .whereIn('article_id', articleIdList)
      .catch(() => {
        return []
      })

    let articleRecordList = []
    for (let record of recordList) {
      let articleRecordJson = _.get(record, ['raw_json'], '{}')
      let articleRecord
      try {
        articleRecord = JSON.parse(articleRecordJson)
      } catch {
        articleRecord = {}
      }
      if (_.isEmpty(articleRecord) === false) {
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
    let columnId = articleRecord.column.id
    let raw_json = JSON.stringify(articleRecord)
    await this.replaceInto({
      article_id: id,
      column_id: columnId,
      raw_json,
    })
    return
  }
}

export default Article
