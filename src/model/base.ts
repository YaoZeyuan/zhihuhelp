import Knex from '~/src/library/knex'
import { AppErrorCode, ApplicationError } from '~/src/shared/error/application_error'

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
   * Parse an entity snapshot read from SQLite.
   *
   * A missing row is handled by each caller before invoking this method. Once
   * a row exists, however, raw_json must contain a JSON object; otherwise the
   * persisted data is corrupt and generation must fail with a useful
   * diagnostic instead of silently treating the entity as absent.
   */
  static parseEntityRawJson<T>(
    rawJson: unknown,
    entityId: string | number,
    tableName = this.TABLE_NAME,
  ): T {
    const message = `Invalid raw_json in table "${tableName}" for entity "${String(entityId)}"`
    if (typeof rawJson !== 'string') {
      throw new ApplicationError(
        AppErrorCode.PERSIST_DATA_INVALID,
        message,
        new TypeError('raw_json must be a string'),
      )
    }

    try {
      const parsed = JSON.parse(rawJson)
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new TypeError('raw_json must contain a JSON object')
      }
      return parsed as T
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new ApplicationError(AppErrorCode.PERSIST_DATA_INVALID, message, error)
    }
  }

  static resolveEntityId(record: Record<string, unknown>): string {
    const candidateList = [
      this.PRIMARY_KEY,
      'answer_id',
      'article_id',
      'pin_id',
      'collection_id',
      'column_id',
      'topic_id',
      'record_id',
      'id',
      'url_token',
    ].filter(Boolean)
    for (const candidate of candidateList) {
      const value = record[candidate]
      if (value !== undefined && value !== null && value !== '') {
        return String(value)
      }
    }
    return 'unknown'
  }

  static assertValidRawJsonRows(recordList: Record<string, unknown>[], tableName = this.TABLE_NAME): void {
    for (const record of recordList) {
      if (Object.prototype.hasOwnProperty.call(record, 'raw_json')) {
        this.parseEntityRawJson(record.raw_json, this.resolveEntityId(record), tableName)
      }
    }
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
    this.assertValidRawJsonRows(recordList)
    return recordList
  }
}

export default Base
