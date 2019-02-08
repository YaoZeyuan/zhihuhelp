import _ from 'lodash'
import Base from '~/src/api/base'
import ActivityRecord from '~/src/type/model/activity'

class Activity extends Base {
  /**
   * 获取用户活动列表 
   * https://www.zhihu.com/api/v4/members/404-Page-Not-found/activities?limit=10&after_id=1547034952&desktop=True
   * @param url_token
   * @param afterTimeAt 从X时间后
   * @param limit
   * @param sortBy
   */
  static async asyncGetAutherActivityList(url_token: string, afterTimeAt: number = 0, limit: number = 20): Promise<Array<ActivityRecord>> {
    const baseUrl = `https://www.zhihu.com/api/v4/members/${url_token}/activities`
    const config = {
      after_id: afterTimeAt,
      limit: limit,
      desktop: 'True',
    }
    const record = await Base.http.get(baseUrl, {
      params: config
    })
    const activityList = _.get(record, ['data'], [])
    return activityList
  }
}
export default Activity
