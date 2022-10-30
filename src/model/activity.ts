import Base from '~/src/model/base'
import * as TypeActivity from '~/src/type/zhihu/activity'
import lodash from 'lodash'
import moment from 'moment'
import * as DATE_FORMAT from '~/src/constant/date_format'

class Activity extends Base {
  static readonly ZHIHU_ACTIVITY_START_MONTH_AT = moment('2011-01-25 00:00:00', DATE_FORMAT.Const_Display_By_Second)
    .startOf(DATE_FORMAT.Const_Unit_Month)
    .unix() // 知乎活动开始时间
  static readonly ZHIHU_ACTIVITY_END_MONTH_AT = moment().endOf(DATE_FORMAT.Const_Unit_Month).unix() // 知乎活动结束时间

  static readonly VERB_ANSWER_VOTE_UP = 'ANSWER_VOTE_UP' // 点赞
  static readonly VERB_MEMBER_FOLLOW_COLLECTION = 'MEMBER_FOLLOW_COLLECTION' // 关注收藏夹
  static readonly VERB_QUESTION_FOLLOW = 'QUESTION_FOLLOW' // 关注问题
  static readonly VERB_ANSWER_CREATE = 'ANSWER_CREATE' // 创建回答
  static readonly VERB_TOPIC_FOLLOW = 'TOPIC_FOLLOW' // 关注话题
  static readonly VERB_MEMBER_VOTEUP_ARTICLE = 'MEMBER_VOTEUP_ARTICLE' // 点赞文章
  static readonly VERB_MEMBER_FOLLOW_COLUMN = 'MEMBER_FOLLOW_COLUMN' // 关注专栏
  static readonly VERB_MEMBER_FOLLOW_ROUNDTABLE = 'MEMBER_FOLLOW_ROUNDTABLE' // 关注圆桌
  static readonly VERB_MEMBER_CREATE_ARTICLE = 'MEMBER_CREATE_ARTICLE' // 发表文章

  // 将行为记录转为文字
  static readonly DISPLAT_VERB = {
    [Activity.VERB_ANSWER_VOTE_UP]: '赞同回答',
    [Activity.VERB_MEMBER_FOLLOW_COLLECTION]: '关注收藏夹',
    [Activity.VERB_QUESTION_FOLLOW]: '关注问题',
    [Activity.VERB_ANSWER_CREATE]: '创建回答',
    [Activity.VERB_TOPIC_FOLLOW]: '关注话题',
    [Activity.VERB_MEMBER_VOTEUP_ARTICLE]: '赞同文章',
    [Activity.VERB_MEMBER_FOLLOW_COLUMN]: '关注专栏',
    [Activity.VERB_MEMBER_FOLLOW_ROUNDTABLE]: '关注圆桌',
    [Activity.VERB_MEMBER_CREATE_ARTICLE]: '发表文章',
  }

  static TABLE_NAME = `Activity`
  static TABLE_COLUMN = [`id`, `url_token`, `verb`, `raw_json`]

  /**
   * 从数据库中获取指定用户指定类别的目标id列表
   * @param id
   */
  static async asyncGetAllActivityTargetIdList(
    urlToken: string,
    verbType = Activity.VERB_ANSWER_VOTE_UP,
  ): Promise<string[]> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where('url_token', '=', urlToken)
      .where('verb', '=', verbType)
      .catch(() => {
        return []
      })

    let activityTargetIdList = []
    for (let record of recordList) {
      let activityRecordJson = record?.raw_json
      let activityRecord: TypeActivity.Record
      try {
        activityRecord = JSON.parse(activityRecordJson)
      } catch {
        activityRecord = {} as any
      }
      if (lodash.isEmpty(activityRecord) === false) {
        activityTargetIdList.push(`${activityRecord.target.id}`)
      }
    }
    return activityTargetIdList
  }

  /**
   * 从数据库中获取指定用户指定类别的目标id => 触发时间映射表
   * @param id
   */
  static async asyncGetAllActionRecordMap(
    urlToken: string,
    verbType = Activity.VERB_ANSWER_VOTE_UP,
  ): Promise<{
    [targetId: string]: number
  }> {
    let recordList = await this.db
      .select(this.TABLE_COLUMN)
      .from(this.TABLE_NAME)
      .where('url_token', '=', urlToken)
      .where('verb', '=', verbType)
      .catch(() => {
        return []
      })

    let actionRecord: {
      [targetId: string]: number
    } = {}
    for (let record of recordList) {
      let activityRecordJson = record?.raw_json
      let activityRecord: TypeActivity.Record
      try {
        activityRecord = JSON.parse(activityRecordJson)
      } catch {
        continue
      }
      let targetId = `${activityRecord.target.id}`
      let actionAt = activityRecord?.created_time ?? 0
      actionRecord[targetId] = actionAt
    }
    return actionRecord
  }

  /**
   * 存储用户行为
   * @param activityRecord
   */
  static async asyncReplaceActivity(activityRecord: TypeActivity.Record): Promise<void> {
    let id = activityRecord.id
    let verb = activityRecord.verb
    let urlToken = activityRecord.actor.url_token
    let raw_json = JSON.stringify(activityRecord)
    await this.replaceInto({
      id,
      verb,
      url_token: urlToken,
      raw_json,
    })
    return
  }
}

export default Activity
