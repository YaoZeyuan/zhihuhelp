import Base from '~/src/command/fetch/base'
import ColumnApi from '~/src/api/column'
import ArticleApi from '~/src/api/article'
import MColumn from '~/src/model/column'
import MArticle from '~/src/model/article'
import CommonUtil from '~/src/library/util/common'
import TypeArticleExcerpt from '~/src/type/namespace/article_excerpt'
import TypeTaskConfig from '~/src/type/namespace/task_config'

class FetchAuthor extends Base {
  static get signature() {
    return `
        Fetch:Customer
        {fetchConfigJSON:[必填]json形式的抓取配置}
    `
  }

  static get description() {
    return '自定义抓取任务'
  }

  async execute(args: any, options: any): Promise<any> {
    let { fetchConfigJSON } = args
    let customerTaskConfig: TypeTaskConfig.Customer = JSON.parse(fetchConfigJSON)
    this.log(`开始进行自定义抓取, 共有${customerTaskConfig.config_list.length}个任务`)
    for (let taskConfig of customerTaskConfig.config_list) {
      switch (taskConfig.type) {
        case 'author-ask-question':
          break
        case 'author-answer':
          break
        case 'author-pin':
          break
        case 'topic':
          break
        case 'collection':
          break
        case 'column':
          break
        case 'article':
          break
        case 'question':
          break
        case 'answer':
          break
        case 'pin':
          break
        case 'author-agree':
        case 'author-agree-article':
        case 'author-agree-answer':
        case 'author-watch-question':
        case 'author-activity':
          break
        default:
          this.log(`不支持的任务类型:${taskConfig.type}, 自动跳过`)
      }
    }
  }
}

export default FetchAuthor
