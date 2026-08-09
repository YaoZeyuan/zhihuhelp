import Base from '~/src/api/single/base.js'
import type * as TypeActivity from '~/src/type/zhihu/activity.js'
import dayjs from 'dayjs'
import { assertZhihuPaginatedData } from '~/src/shared/error/zhihu_response_validation.js'
import { AppErrorCode, ApplicationError } from '~/src/shared/error/application_error.js'

function assertBooleanPagingIsEnd(payload: unknown): boolean {
  const paging = payload !== null && typeof payload === 'object' && Array.isArray(payload) === false
    ? (payload as Record<string, unknown>).paging
    : undefined
  const isEnd = paging !== null && typeof paging === 'object' && Array.isArray(paging) === false
    ? (paging as Record<string, unknown>).is_end
    : undefined

  if (typeof isEnd !== 'boolean') {
    throw new ApplicationError(
      AppErrorCode.PAGINATION_RESPONSE_INVALID,
      'author.activities pagination response is missing a boolean paging.is_end',
    )
  }

  return isEnd
}

class Activity extends Base {
  /**
   * 获取用户活动列表
   * https://www.zhihu.com/api/v4/members/404-Page-Not-found/activities?limit=10&after_id=1547034952&desktop=True
   * @param url_token
   * @param afterTimeAt 从X时间后
   * @param limit
   * @param sortBy
   */
  static async asyncGetAutherActivityList(
    url_token: string,
    afterTimeAt: number = 0,
    limit: number = 20,
  ): Promise<TypeActivity.Record[]> {
    const baseUrl = `https://www.zhihu.com/api/v4/members/${url_token}/activities`
    const config = {
      after_id: afterTimeAt,
      limit: limit,
      desktop: 'True',
    }
    const record = await Base.http.get(baseUrl, {
      params: config,
    })
    const activityList = assertZhihuPaginatedData<TypeActivity.Record>(record, 'author.activities')
    assertBooleanPagingIsEnd(record)
    return activityList
  }

  /**
   * 检查指定时间后是否还有用户活跃记录
   * @param url_token
   * @param afterTimeAt 从X时间后
   */
  static async asyncCheckHasAutherActivityAfterAt(url_token: string, afterTimeAt: number = 0): Promise<boolean> {
    const baseUrl = `https://www.zhihu.com/api/v4/members/${url_token}/activities`
    const config = {
      after_id: afterTimeAt,
      limit: 10,
      desktop: 'True',
    }
    const record = await Base.http.get(baseUrl, {
      params: config,
    })
    assertZhihuPaginatedData<TypeActivity.Record>(record, 'author.activities')
    return assertBooleanPagingIsEnd(record) === false
  }

  /**
   * 获取用户最近一次活跃时间
   * @param url_token
   */
  static async asyncGetAutherLastActivityAt(url_token: string): Promise<number> {
    const baseUrl = `https://www.zhihu.com/api/v4/members/${url_token}/activities`
    let now = dayjs().unix()
    const config = {
      after_id: now,
      limit: 10,
      desktop: 'True',
    }
    const record = await Base.http.get(baseUrl, {
      params: config,
    })
    const activityList = assertZhihuPaginatedData<TypeActivity.Record>(record, 'author.activities')
    assertBooleanPagingIsEnd(record)
    let lastActivityMsAt = activityList[0]?.id ?? 0
    let lastActivityAt = lastActivityMsAt / 1000 // 取到的id是毫秒值, 因此需要除以1000
    if (lastActivityAt <= 0) {
      return 0
    }
    return lastActivityAt
  }
}
export default Activity
