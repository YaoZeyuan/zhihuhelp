import Knex from '~/src/library/knex'

class Base {
  static TABLE_NAME = ``
  static TABLE_COLUMN: string[]
  static PRIMARY_KEY = ``

  /**
   * 获取sqlite客户端
   */
  static get db() {
    return Knex.queryBuilder()
  }

  /**
   * 获取sqlite客户端
   */
  static get rawClient() {
    return Knex
  }

  /**
   * 手工拼接replaceInto语句
   * @param{object} data
   */
  static replaceInto(data: object, tableName = this.TABLE_NAME) {
    let columnList = []
    let markList = []
    let valueList = []
    for (let key of Object.keys(data)) {
      columnList.push(`\`${key}\``)
      markList.push(`?`)
      valueList.push((data as any)?.[key] ?? '')
    }
    let rawSql = `
        REPLACE INTO ${tableName} (${columnList.join(',')}) VALUES (${markList.join(',')})
        `
    return Knex.raw(rawSql, valueList)
  }

  /**
   * 获取记录列表
   * @param param0 
   * @returns 
   */
  static async asyncGetList({ pageNo, pageSize }: {
    pageNo: number,
    pageSize: number,
  }) {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .limit(pageSize)
      .offset(pageNo * pageSize)
      .catch(() => {
        return []
      })
    return recordList
  }
}

export default Base
