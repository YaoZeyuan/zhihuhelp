import _ from 'lodash'
import Base from '~/src/api/base'
import TypeAnswer from '~/src/type/namespace/answer'

class Answer extends Base {
  /**
   * 获取用户回答列表
   * @param url_token
   * @param offset
   * @param limit
   * @param sortBy
   */
  static async asyncGetAutherAnswerList(url_token: string, offset: number = 0, limit: number = 20, sortBy: string = Base.CONST_SORT_BY_CREATED): Promise<Array<TypeAnswer.Record>> {
    const baseUrl = `https://www.zhihu.com/api/v4/members/${url_token}/answers`
    const config = {
      include: 'data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,collapsed_by,suggest_edit,comment_count,can_comment,content,voteup_count,reshipment_settings,comment_permission,mark_infos,created_time,updated_time,review_info,question,excerpt,is_labeled,label_info,relationship.is_authorized,voting,is_author,is_thanked,is_nothelp;data[*].author.badge[?(type=best_answerer)].topics',
      offset: offset,
      limit: limit,
      sort_by: sortBy
    }
    const record = await Base.http.get(baseUrl, {
      params: config
    })
    const answerList = _.get(record, ['data'], [])
    return answerList
  }
}
export default Answer
