import _ from 'lodash'
import Base from '~/src/api/base'
import TypeQuestion from '~/src/type/namespace/question'
import TypeAnswer from '~/src/type/namespace/answer'

class Question extends Base {
  /**
   * 获取问题详情
   * demo => https://www.zhihu.com/api/v4/questions/32314049/answers?include=data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,is_sticky,collapsed_by,suggest_edit,comment_count,can_comment,content,editable_content,voteup_count,reshipment_settings,comment_permission,mark_infos,created_time,updated_time,review_info,question.detail,answer_count,follower_count,excerpt,detail,question_type,title,id,created,updated_time,relevant_info,excerpt,label_info,relationship.is_authorized,is_author,voting,is_thanked,is_nothelp,is_labeled,is_recognized&offset=&limit=3&sort_by=default&platform=desktop
   * @param url_token
   * @param offset
   * @param limit
   */
  static async asyncGetAnswerList(questionId: number, offset: number = 0, limit: number = 20): Promise<Array<TypeAnswer.Record>> {
    const baseUrl = `https://www.zhihu.com/api/v4/questions/${questionId}/answers`
    const config = {
      include:
        'data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,is_sticky,collapsed_by,suggest_edit,comment_count,can_comment,content,editable_content,voteup_count,reshipment_settings,comment_permission,mark_infos,created_time,updated_time,review_info,question.detail,answer_count,follower_count,excerpt,detail,question_type,title,id,created,updated_time,relevant_info,excerpt,label_info,relationship.is_authorized,is_author,voting,is_thanked,is_nothelp,is_labeled,is_recognized',
      offset: offset,
      limit: limit,
    }
    const record = await Base.http.get(baseUrl, {
      params: config,
    })
    const answerList = _.get(record, ['data'], [])
    return answerList
  }
}
export default Question
