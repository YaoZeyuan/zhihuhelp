import AuthorApi from '~/src/api/single/author.js'
import MAuthor from '~/src/model/author.js'
import BatchFetchArticle from '~/src/api/batch/article.js'
import Base from '~/src/api/batch/base.js'
import CommonUtil from '~/src/library/util/common.js'
import CommonConfig from '~/src/config/common.js'
import { assertZhihuNonNegativeIntegerCount } from '~/src/shared/error/zhihu_response_validation.js'
import { getCanonicalAuthorUrlToken } from '~/src/domain/author/identity.js'

class BatchFetchAuthorArticle extends Base {
  async fetch(urlToken: string) {
    this.log(`开始抓取用户${urlToken}的数据`)
    this.log(`获取用户信息`)
    const authorInfo = await AuthorApi.asyncGetAutherInfo(urlToken)
    this.assertEntityRecord(authorInfo, 'author', urlToken, ['id'])
    const canonicalUrlToken = getCanonicalAuthorUrlToken(authorInfo)
    await this.persist('author', canonicalUrlToken, () => MAuthor.asyncReplaceAuthor(authorInfo))
    this.log(`用户信息获取完毕`)
    const name = authorInfo.name
    const articleCount = assertZhihuNonNegativeIntegerCount(
      authorInfo.articles_count,
      `author ${canonicalUrlToken}.articles_count`,
    )
    this.log(`用户${name}(${canonicalUrlToken})共发布了${articleCount}篇文章`)
    this.log(`开始抓取文章列表`)
    let batchFetchArticle = new BatchFetchArticle()
    let articleIdList: string[] = []
    for (let offset = 0; offset < articleCount; offset = offset + this.fetchLimit) {
      let asyncTaskFunc = async () => {
        let authorArticlesList = await AuthorApi.asyncGetAutherArticleList(canonicalUrlToken, offset, this.fetchLimit)
        for (let authorArticle of authorArticlesList) {
          let articleId = `${authorArticle.id}`
          articleIdList.push(articleId)
        }
        this.log(`用户发表的第${offset}~${offset + this.fetchLimit}篇文章简介获取完毕`)
      }
      CommonUtil.addAsyncTaskFunc({
        asyncTaskFunc,
        needProtect: true,
      })
    }
    await CommonUtil.asyncWaitAllTaskComplete({
      needTTL: true,
    })
    this.log(`开始抓取用户${name}(${canonicalUrlToken})的所有文章详情,共${articleIdList.length}篇`)
    const outcome = await batchFetchArticle.fetchListAndSaveToDb(articleIdList)
    this.log(`用户${name}(${canonicalUrlToken})的文章列表抓取完毕`)
    return outcome
  }
}

export default BatchFetchAuthorArticle
