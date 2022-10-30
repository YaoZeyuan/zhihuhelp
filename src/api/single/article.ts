import Base from '~/src/api/single/base'
import TypeArticle from '~/src/type/zhihu/article'

class Article extends Base {
  /**
   * 获取单篇文章详情
   * @param articleId
   */
  static async asyncGetArticle(articleId: number): Promise<TypeArticle.Record> {
    const baseUrl = `https://www.zhihu.com/api/v4/articles/${articleId}`
    const config = {}
    const record = await Base.http.get(baseUrl, {
      params: config,
    })
    const articleRecord = record
    return articleRecord
  }
}
export default Article
