import Base from '~/src/model/base.js'
import type * as TypeAuthor from '~/src/type/zhihu/author.js'
import { normalizeAuthorAliases, normalizeAuthorIdentifier } from '~/src/domain/author/identity.js'

class AuthorAskQuestion extends Base {
  static TABLE_NAME = `Author_Ask_Question`
  static TABLE_COLUMN = [`question_id`, `author_url_token`, `author_id`, `raw_json`]

  /**
   * 从数据库中获取用户提问的问题id列表
   * @param urlToken
   */
  static async asyncGetAuthorAskQuestionIdList(urlToken: string): Promise<string[]> {
    return this.asyncGetAuthorAskQuestionIdListByAuthorIdentity(urlToken, [urlToken])
  }

  /**
   * Query author-question relations by stable id and compatible token aliases.
   */
  static async asyncGetAuthorAskQuestionIdListByAuthorIdentity(
    authorId: string,
    aliases: string[] = [],
  ): Promise<string[]> {
    const normalizedAuthorId = normalizeAuthorIdentifier(authorId)
    const normalizedAliases = normalizeAuthorAliases([normalizedAuthorId, ...aliases])
    if (normalizedAuthorId === '' && normalizedAliases.length === 0) {
      return []
    }

    let recordList = await this.db
      .select(`question_id`)
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

    let questionIdList = []
    for (let record of recordList) {
      let questionId: string = record?.question_id ?? ''
      if (questionId === '') {
        continue
      }
      questionIdList.push(questionId)
    }
    return questionIdList
  }

  /**
   * 存储用户提问记录
   * @param authorQuestionRecord
   */
  static async asyncReplaceAuthorQuestion(
    author_url_token: string,
    author_id: string,
    authorQuestionRecord: TypeAuthor.Question,
  ): Promise<void> {
    let question_id = authorQuestionRecord.id
    let raw_json = JSON.stringify(authorQuestionRecord)
    await this.replaceInto({
      question_id,
      author_url_token,
      author_id,
      raw_json,
    })
    return
  }
}

export default AuthorAskQuestion
