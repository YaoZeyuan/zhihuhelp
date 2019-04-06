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
      include:
        'data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,collapsed_by,suggest_edit,comment_count,can_comment,content,voteup_count,reshipment_settings,comment_permission,mark_infos,created_time,updated_time,review_info,question,excerpt,is_labeled,label_info,relationship.is_authorized,voting,is_author,is_thanked,is_nothelp;data[*].author.badge[?(type=best_answerer)].topics',
      offset: offset,
      limit: limit,
      sort_by: sortBy,
    }
    const record = await Base.http.get(baseUrl, {
      params: config,
    })
    const answerList = _.get(record, ['data'], [])
    return answerList
  }

  /**
   * 获取单个回答
   * @param id
   */
  static async asyncGetAnswer(id: number | string): Promise<TypeAnswer.Record> {
    const baseUrl = `https://api.zhihu.com/answers/${id}`
    const config = {
      include: `data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,is_sticky,collapsed_by,suggest_edit,comment_count,can_comment,content,editable_content,voteup_count,reshipment_settings,comment_permission,mark_infos,created_time,updated_time,review_info,question.detail,answer_count,follower_count,excerpt,detail,question_type,title,id,created,updated_time,relevant_info,excerpt,label_info,relationship.is_authorized,is_author,voting,is_thanked,is_nothelp,is_labeled,is_recognized`,
      // @todo(yaozeyuan) 周末把API集中替换过来
      // 更好的参数(可以获得问题详情) =>  'data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,is_sticky,collapsed_by,suggest_edit,comment_count,can_comment,content,editable_content,voteup_count,reshipment_settings,comment_permission,mark_infos,created_time,updated_time,review_info,question.detail,answer_count,follower_count,excerpt,detail,question_type,title,id,created,updated_time,relevant_info,excerpt,label_info,relationship.is_authorized,is_author,voting,is_thanked,is_nothelp,is_labeled,is_recognized',
    }
    const answerRecord: TypeAnswer.Record = await Base.http.get(baseUrl, {
      params: config,
    })
    return answerRecord
  }
}
export default Answer
