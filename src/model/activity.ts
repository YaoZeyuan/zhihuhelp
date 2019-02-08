import Base from '~/src/model/base'
import ActivityRecord from '~/src/type/model/activity'
import _ from 'lodash'
import moment from 'moment'
import DATE_FORMAT from '~/src/constant/date_format'


class Activity extends Base {
  static readonly ZHIHU_ACTIVITY_START_AT = moment('2011-01-25 00:00:00', DATE_FORMAT.DISPLAY_BY_SECOND).unix() // 知乎活动开始时间
  static readonly ZHIHU_ACTIVITY_END_AT = moment().unix() // 知乎活动结束时间


  static readonly VERB_MEMBER_FOLLOW_COLUMN = 'MEMBER_FOLLOW_COLUMN'
  static readonly VERB_ANSWER_VOTE_UP = 'ANSWER_VOTE_UP'
  static readonly VERB_QUESTION_FOLLOW = 'MEMBER_QUESTION_FOLLOW'


  static TABLE_NAME = `Activity`
  static TABLE_COLUMN = [
    `id`,
    `url_token`,
    `verb`,
    `raw_json`
  ]


  /**
   * 从数据库中获取指定用户指定类别的行为列表
   * @param id
   */
  static async asyncGetActivityList(urlToken: string, startAt: number, endAt: number, verbList = [Activity.VERB_ANSWER_VOTE_UP]): Promise<Array<ActivityRecord>> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where('id', '>=', startAt)
      .where('id', '<=', endAt)
      .where('url_token', '=', urlToken)
      .whereIn('verb', verbList)
      .catch(() => { return [] })

    let activityRecordList = []
    for (let record of recordList) {
      let activityRecordJson = _.get(record, ['raw_json'], '{}')
      let activityRecord
      try {
        activityRecord = JSON.parse(activityRecordJson)
      } catch {
        activityRecord = {}
      }
      if (_.isEmpty(activityRecord) === false) {
        activityRecordList.push(activityRecord)
      }
    }
    return activityRecordList
  }

  /**
   * 存储用户行为
   * @param activityRecord
   */
  static async asyncReplaceArticle(activityRecord: ActivityRecord): Promise<void> {
    let id = activityRecord.id
    let verb = activityRecord.verb
    let urlToken = activityRecord.actor.url_token
    let raw_json = JSON.stringify(activityRecord)
    await this.replaceInto({
      id,
      verb,
      url_token: urlToken,
      raw_json
    })
    return
  }
}

export default Activity
