import Base from '~/src/model/base'
import TypeColumn from '~/src/type/zhihu/column'

class Column extends Base {
  static TABLE_NAME = `Column`
  static TABLE_COLUMN = [`column_id`, `raw_json`]

  /**
   * 从数据库中获取专栏信息
   * @param columnId
   */
  static async asyncGetColumnInfo(columnId: string): Promise<TypeColumn.Record> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where('column_id', '=', columnId)
      .catch(() => {
        return []
      })
    let columnInfoJson = recordList?.[0]?.raw_json
    let columnInfo
    try {
      columnInfo = JSON.parse(columnInfoJson)
    } catch {
      columnInfo = {}
    }
    return columnInfo
  }

  /**
   * 存储专栏数据
   * @param columnRecord
   */
  static async asyncReplaceColumnInfo(columnRecord: TypeColumn.Record): Promise<void> {
    let columnId = columnRecord.id
    let raw_json = JSON.stringify(columnRecord)
    await this.replaceInto({
      column_id: columnId,
      raw_json,
    })
    return
  }

  /**
   * 获取所有collumn数量
   * @returns 
   */
  static async asyncGetColumnCount(): Promise<number> {
    let count = await this.db
      .countDistinct("column_id as count")
      .from(this.TABLE_NAME)
      .catch(() => {
        return []
      }) as { "count": number }[]

    return count?.[0]?.count ?? 0
  }
}

export default Column
