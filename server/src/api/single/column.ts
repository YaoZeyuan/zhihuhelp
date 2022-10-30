import Base from '~/src/api/single/base'
import TypeColumn from '~/src/type/zhihu/column'
import TypeArticleExcerpt from '~/src/type/zhihu/article_excerpt'

class Column extends Base {
  /**
   * 获取专栏信息
   * @param columnId
   */
  static async asyncGetColumnInfo(columnId: string): Promise<TypeColumn.Record> {
    const baseUrl = `https://zhuanlan.zhihu.com/api/columns/${columnId}`
    const config = {}
    const record = await Base.http.get(baseUrl, {
      params: config,
    })
    const columnInfo = record
    return columnInfo
  }

  /**
   * 获取专栏信息
   * @param columnId
   */
  static async asyncGetArticleExcerptList(
    columnId: string,
    offset = 0,
    limit = 10,
  ): Promise<TypeArticleExcerpt.Record[]> {
    const baseUrl = `https://www.zhihu.com/api/v4/columns/${columnId}/articles`
    const config = {
      offset,
      limit,
    }
    const record = await Base.http.get(baseUrl, {
      params: config,
    })
    const articleExcerptList = record?.data ?? []
    return articleExcerptList
  }
}
export default Column
