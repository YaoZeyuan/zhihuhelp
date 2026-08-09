import Base from '~/src/model/base.js'
import type * as TypeAnswer from '~/src/type/zhihu/answer.js'
import lodash from 'lodash'
import { normalizeAuthorAliases, normalizeAuthorIdentifier } from '~/src/domain/author/identity.js'

class Answer extends Base {
  static TABLE_NAME = `Answer`
  static TABLE_COLUMN = [`answer_id`, `question_id`, `author_url_token`, `author_id`, `raw_json`]

  /**
   * 从数据库中获取指定内答案
   * @param answerId
   */
  static async asyncGetAnswer(answerId: string): Promise<TypeAnswer.Record> {
    let recordList = await this.db.select(this.TABLE_COLUMN).from(this.TABLE_NAME).where('answer_id', '=', answerId)
    let answerRecord = recordList[0]
    if (answerRecord === undefined) {
      return {} as TypeAnswer.Record
    }
    return this.parseEntityRawJson<TypeAnswer.Record>(answerRecord.raw_json, answerId)
  }

  /**
   * 从数据库中获取指定内答案列表
   * @param answerIdList
   */
  static async asyncGetAnswerList(answerIdList: string[]): Promise<TypeAnswer.Record[]> {
    let sql = this.db.select(this.TABLE_COLUMN).from(this.TABLE_NAME).whereIn('answer_id', answerIdList).toString()
    // sql中的变量太多(>999), 会导致sqlite3中的select查询无法执行, 因此这里改为使用raw直接执行sql语句
    let recordList = await this.rawClient.raw(sql, [])
    let answerRecordList = []
    for (let record of recordList) {
      let answerRecord = this.parseEntityRawJson<TypeAnswer.Record>(record?.raw_json, record?.answer_id ?? 'unknown')
      if (lodash.isEmpty(answerRecord) === false) {
        answerRecordList.push(answerRecord)
      }
    }

    return answerRecordList
  }

  /**
   * 根据问题idList从数据库中获取指定内答案列表
   * @param questionIdList
   */
  static async asyncGetAnswerListByQuestionIdList(questionIdList: string[]): Promise<TypeAnswer.Record[]> {
    let sql = this.db.select(this.TABLE_COLUMN).from(this.TABLE_NAME).whereIn('question_id', questionIdList).toString()
    // sql中的变量太多(>999), 会导致sqlite3中的select查询无法执行, 因此这里改为使用raw直接执行sql语句
    let recordList = await this.rawClient.raw(sql, [])
    let answerRecordList = []
    for (let record of recordList) {
      let answerRecord = this.parseEntityRawJson<TypeAnswer.Record>(record?.raw_json, record?.answer_id ?? 'unknown')
      if (lodash.isEmpty(answerRecord) === false) {
        answerRecordList.push(answerRecord)
      }
    }

    return answerRecordList
  }

  /**
   * 根据作者urlToken从数据库中获取指定内答案列表
   * @param authorUrlToken
   */
  static async asyncGetAnswerListByAuthorUrlToken(authorUrlToken: string): Promise<TypeAnswer.Record[]> {
    return this.asyncGetAnswerListByAuthorIdentity(authorUrlToken, [authorUrlToken])
  }

  /**
   * Query author relations by stable id first while retaining token-only legacy rows.
   */
  static async asyncGetAnswerListByAuthorIdentity(
    authorId: string,
    aliases: string[] = [],
  ): Promise<TypeAnswer.Record[]> {
    const normalizedAuthorId = normalizeAuthorIdentifier(authorId)
    const normalizedAliases = normalizeAuthorAliases([normalizedAuthorId, ...aliases])
    if (normalizedAuthorId === '' && normalizedAliases.length === 0) {
      return []
    }

    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where((builder) => {
        if (normalizedAuthorId !== '') {
          builder.where('author_id', '=', normalizedAuthorId)
        }
        if (normalizedAliases.length > 0) {
          const method = normalizedAuthorId === '' ? 'whereIn' : 'orWhereIn'
          builder[method]('author_url_token', normalizedAliases)
        }
      })
    let answerRecordList = []
    for (let record of recordList) {
      let answerRecord = this.parseEntityRawJson<TypeAnswer.Record>(record?.raw_json, record?.answer_id ?? 'unknown')
      if (lodash.isEmpty(answerRecord) === false) {
        answerRecordList.push(answerRecord)
      }
    }

    return answerRecordList
  }

  /**
   * 存储问题答案数据
   * @param columnRecord
   */
  static async asyncReplaceAnswer(answerRecord: TypeAnswer.Record): Promise<void> {
    let raw_json = JSON.stringify(answerRecord)
    let answerId = answerRecord.id
    let questionId = answerRecord.question.id
    let authorUrlToken = answerRecord.author.url_token
    let authorId = answerRecord.author.id
    await this.replaceInto(
      {
        question_id: questionId,
        answer_id: answerId,
        author_id: authorId,
        author_url_token: authorUrlToken,
        raw_json,
      },
      this.TABLE_NAME,
    )
    return
  }

  /**
   * 获取所有answer数量
   * @returns
   */
  static async asyncGetAnswerCount(): Promise<number> {
    let count = (await this.db.countDistinct('answer_id as count').from(this.TABLE_NAME)) as { count: number }[]

    return count?.[0]?.count ?? 0
  }

  /**
   * 获取所有question数量
   * @returns
   */
  static async asyncGetQuestionCount(): Promise<number> {
    let count = (await this.db.countDistinct('question_id as count').from(this.TABLE_NAME)) as { count: number }[]

    return count?.[0]?.count ?? 0
  }
}

export default Answer
