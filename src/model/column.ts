import Base from '~/src/model/base'
import ColumnRecord from '~/src/type/model/column'
import ArticleExcerptRecord from '~/src/type/model/article_excerpt'
import _ from 'lodash'

class Column extends Base {
    static TABLE_NAME = `Column`
    static TABLE_COLUMN = [
        `column_id`,
        `raw_json`,
    ]

    static COLUMN_ARTICLE_EXCERPT_TABLE_NAME = `ColumnArticleExcerpt`
    static COLUMN_ARTICLE_EXCERPT_TABLE_COLUMN = [
        `column_id`,
        `article_id`,
        `raw_json`,
    ]

    /**
     * 从数据库中获取专栏信息
     * @param columnId 
     */
    static async asyncGetColumnInfo(columnId: string): Promise<ColumnRecord> {
        let recordList = await this.db
            .select(this.TABLE_COLUMN)
            .from(this.TABLE_NAME)
            .where('column_id', '=', columnId)
            .catch(() => { return [] })
        let columnInfoJson = _.get(recordList, [0, 'raw_json'], '{}')
        let columnInfo
        try {
            columnInfo = JSON.parse(columnInfoJson)
        } catch{
            columnInfo = {}
        }
        return columnInfo
    }


    /**
     * 从数据库中获取专栏文章列表
     * @param columnId 
     */
    static async asyncGetArticleExcerptList(columnId: string): Promise<Array<ArticleExcerptRecord>> {
        let recordList = await this.db
            .select(this.COLUMN_ARTICLE_EXCERPT_TABLE_COLUMN)
            .from(this.COLUMN_ARTICLE_EXCERPT_TABLE_NAME)
            .where('column_id', '=', columnId)
            .catch(() => { return [] })
        let articleExcerptRecordList = []
        for (let record of recordList) {
            let articleExcerptRecordJson = _.get(record, ['raw_json'], '{}')
            let articleExcerptRecord
            try {
                articleExcerptRecord = JSON.parse(articleExcerptRecordJson)
            } catch{
                articleExcerptRecord = {}
            }
            if (_.isEmpty(articleExcerptRecord) === false) {
                articleExcerptRecordList.push(articleExcerptRecord)
            }
        }

        return articleExcerptRecordList
    }

    /**
     * 存储专栏数据
     * @param columnRecord 
     */
    static async asyncReplaceColumnInfo(columnRecord: ColumnRecord): Promise<void> {
        let columnId = columnRecord.id
        let raw_json = JSON.stringify(columnRecord)
        await this.replaceInto({
            column_id: columnId,
            raw_json
        })
        return
    }

    /**
     * 存储专栏文章列表数据
     * @param columnRecord 
     */
    static async asyncReplaceColumnAtricleExcerpt(columnId: string, articleExcerptRecord: ArticleExcerptRecord): Promise<void> {
        let raw_json = JSON.stringify(articleExcerptRecord)
        let articleId = articleExcerptRecord.id
        await this.replaceInto({
            column_id: columnId,
            article_id: articleId,
            raw_json
        }, this.COLUMN_ARTICLE_EXCERPT_TABLE_NAME)
        return
    }
}

export default Column