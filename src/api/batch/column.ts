import ColumnApi from '~/src/api/single/column'
import MColumn from '~/src/model/column'
import Base from '~/src/api/batch/base'
import CommonUtil from '~/src/library/util/common'
import BatchFetchArticle from '~/src/api/batch/article'
import Logger from '~/src/library/logger'

class BatchFetchColumn extends Base {
  async fetch(id: string) {
    this.log(`开始抓取专栏${id}的数据`)
    this.log(`获取专栏信息`)
    const columnInfo = await ColumnApi.asyncGetColumnInfo(id)
    await MColumn.asyncReplaceColumnInfo(columnInfo)
    this.log(`专栏信息获取完毕`)
    const title = columnInfo.title
    const articleCount = columnInfo.articles_count
    let columnTitle = `${title}(${columnInfo.id})`
    this.log(`专栏${columnTitle}下共有${articleCount}篇文章`)
    this.log(`开始抓取文章概要列表`)
    let articleIdList: string[] = []
    let batchFetchArticle = new BatchFetchArticle()
    for (let offset = 0; offset < articleCount; offset = offset + this.fetchLimit) {
      let asyncTaskFunc = async () => {
        let articleExcerptList = await ColumnApi.asyncGetArticleExcerptList(id, offset, this.fetchLimit)
        for (let articleExcerpt of articleExcerptList) {
          articleIdList.push(`${articleExcerpt.id}`)
        }
        this.log(`专栏${columnTitle}下中第${offset}~${offset + articleExcerptList.length}篇文章id抓取完毕`)
      }

      CommonUtil.addAsyncTaskFunc({
        asyncTaskFunc,
        needProtect: true
      })
    }
    await CommonUtil.asyncWaitAllTaskComplete({
      needTTL: true
    })
    this.log(`专栏${columnTitle}下全部文章id抓取完毕`)

    this.log(`开始抓取专栏${columnTitle}下所有文章,共${articleIdList.length}条`)
    await batchFetchArticle.fetchListAndSaveToDb(articleIdList)
    this.log(`专栏${columnTitle}下所有文章抓取完毕`)
  }
}

export default BatchFetchColumn
