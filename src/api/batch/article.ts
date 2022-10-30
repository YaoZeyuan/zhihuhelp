import ArticleApi from '~/src/api/single/article'
import MArticle from '~/src/model/article'
import lodash from 'lodash'
import Base from '~/src/api/batch/base'

class BatchFetchArticle extends Base {
  /**
   * 获取单个回答,并存入数据库中
   * @param id
   */
  async fetch(id: string) {
    this.log(`准备抓取文章${id}`)
    let article = await ArticleApi.asyncGetArticle(id as unknown as number)
    if (lodash.isEmpty(article)) {
      this.log(`文章${id}抓取失败`)
      return
    }
    this.log(`文章${id}抓取成功, 存入数据库`)
    await MArticle.asyncReplaceArticle(article)
    this.log(`文章${id}成功存入数据库`)
  }
}

export default BatchFetchArticle
