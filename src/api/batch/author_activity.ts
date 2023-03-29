import AuthorApi from '~/src/api/single/author'
import MAuthor from '~/src/model/author'
import Base from '~/src/api/batch/base'
import ActivityApi from '~/src/api/single/activity'
import MActivity from '~/src/model/activity'
import moment from 'moment'
import * as DATE_FORMAT from '~/src/constant/date_format'
import CommonUtil from '~/src/library/util/common'
import BatchFetchAnswer from '~/src/api/batch/answer'
import BatchFetchQuestion from '~/src/api/batch/question'
import BatchFetchColumn from '~/src/api/batch/column'
import BatchFetchArticle from './article'
import CommonConfig from '~/src/config/common'
import lodash from 'lodash'

class BatchFetchAuthorActivity extends Base {
  async fetch(urlToken: string) {
    this.log(`开始抓取用户${urlToken}的历史活动`)
    this.log(`获取用户信息`)
    const authorInfo = await AuthorApi.asyncGetAutherInfo(urlToken)
    await MAuthor.asyncReplaceAuthor(authorInfo)
    this.log(`用户信息获取完毕`)
    const name = authorInfo.name
    this.log(`开始抓取用户行为列表`)
    let startAt = MActivity.ZHIHU_ACTIVITY_START_MONTH_AT
    this.log(`检查用户${name}(${urlToken})最后一次活跃时间`)
    let endAt = await ActivityApi.asyncGetAutherLastActivityAt(urlToken)
    this.log(`用户${name}(${urlToken})最后一次活跃于${moment.unix(endAt).format(DATE_FORMAT.Const_Display_By_Second)}`)

    this.log(`检查用户${name}(${urlToken})首次活跃时间`)
    let loopCounter = 0
    for (let checkAt = startAt; checkAt <= endAt;) {
      let hasActivityAfterAt = await ActivityApi.asyncCheckHasAutherActivityAfterAt(urlToken, checkAt)
      if (hasActivityAfterAt) {
        this.log(
          `经检查, 用户${name}(${urlToken})在${moment
            .unix(checkAt)
            .format(DATE_FORMAT.Const_Display_By_Second)}前有活动记录`,
        )
        this.log(`检查完毕`)
        startAt = moment.unix(checkAt).startOf(DATE_FORMAT.Const_Unit_Month).unix()
        break
      } else {
        this.log(
          `经检查, 用户${name}(${urlToken})在${moment
            .unix(checkAt)
            .format(DATE_FORMAT.Const_Display_By_Second)}前没有活动记录`,
        )
        this.log(`向后推一个月, 继续检查`)
        let newCheckAt = moment.unix(checkAt).add(1, DATE_FORMAT.Const_Unit_Month).unix()
        checkAt = newCheckAt
      }
      loopCounter = loopCounter + 1
      if (loopCounter % CommonConfig.protect_Loop_Count === 0) {
        this.log(`第${loopCounter}次抓取, 休眠${CommonConfig.protect_To_Wait_ms / 1000}s, 保护知乎服务器`)
        await CommonUtil.asyncSleep(CommonConfig.protect_To_Wait_ms)
      }
    }
    this.log(
      `用户活动时间范围为${moment.unix(startAt).format(DATE_FORMAT.Const_Display_By_Second)} ~ ${moment
        .unix(endAt)
        .format(DATE_FORMAT.Const_Display_By_Second)}, 按照该范围按月抓取`,
    )
    for (let fetchAt = startAt; startAt <= fetchAt && fetchAt <= endAt;) {
      let fetchStartAt = fetchAt
      let fetchEndAt = moment.unix(fetchAt).endOf(DATE_FORMAT.Const_Unit_Month).unix()
      fetchAt = fetchEndAt + 1
      CommonUtil.addAsyncTaskFunc({
        asyncTaskFunc: async () => {
          await this.fetchActivityInRange(urlToken, fetchStartAt, fetchEndAt)
        },
        needProtect: true,
      })
    }
    await CommonUtil.asyncWaitAllTaskComplete({
      needTTL: false
    })
    this.log(`用户${name}(${urlToken})活动记录抓取完毕`)

    this.log(`抓取用户${name}(${urlToken})赞同过的所有回答`)
    let allAgreeAnswerIdList = await MActivity.asyncGetAllActivityTargetIdList(urlToken, MActivity.VERB_ANSWER_VOTE_UP)
    let batchFetchAnswer = new BatchFetchAnswer()
    await batchFetchAnswer.fetchListAndSaveToDb(allAgreeAnswerIdList)
    this.log(`用户${name}(${urlToken})赞同过的所有回答抓取完毕`)
    this.log(`抓取用户${name}(${urlToken})赞同过的所有文章`)
    let allAgreeArticleIdList = await MActivity.asyncGetAllActivityTargetIdList(
      urlToken,
      MActivity.VERB_MEMBER_VOTEUP_ARTICLE,
    )
    let batchFetchArticle = new BatchFetchArticle()
    await batchFetchArticle.fetchListAndSaveToDb(allAgreeArticleIdList)
    this.log(`用户${name}(${urlToken})赞同过的所有文章抓取完毕`)
    this.log(`抓取用户${name}(${urlToken})关注过的所有问题`)
    let allFollowQustionIdList = await MActivity.asyncGetAllActivityTargetIdList(
      urlToken,
      MActivity.VERB_QUESTION_FOLLOW,
    )
    let batchFetchQuestion = new BatchFetchQuestion()
    await batchFetchQuestion.fetchListAndSaveToDb(allFollowQustionIdList)
    this.log(`用户${name}(${urlToken})关注过的所有问题抓取完毕`)
  }

  /**
   * 抓取指定时间范围内的用户活动记录
   * @param urlToken
   * @param startAt
   * @param endAt
   */
  private async fetchActivityInRange(urlToken: string, startAt: number, endAt: number) {
    let rangeString = `${moment.unix(startAt).format(DATE_FORMAT.Const_Display_By_Day)} ~ ${moment
      .unix(endAt)
      .format(DATE_FORMAT.Const_Display_By_Day)}`
    this.log(`抓取时间范围为:${rangeString}内的记录`)
    for (let fetchAt = endAt; startAt <= fetchAt && fetchAt <= endAt;) {
      let asyncTaskFunc = async () => {
        this.log(`[${rangeString}]抓取${moment.unix(fetchAt).format(DATE_FORMAT.Const_Display_By_Second)}的记录`)
        let activityList = await ActivityApi.asyncGetAutherActivityList(urlToken, fetchAt)
        if (activityList.length === 0) {
          // 没有这段时间的记录或者接口调用失败, 自动往前挪一天
          fetchAt = fetchAt - 86400
          return
        }
        for (let activityRecord of activityList) {
          // 更新时间(id是毫秒值)
          fetchAt = Number.parseInt(`${activityRecord.id / 1000}`)
          if (lodash.isNumber(fetchAt) === false) {
            fetchAt = 0
          }
          await MActivity.asyncReplaceActivity(activityRecord)
        }
      }
      // 通过统一的任务中心执行
      CommonUtil.addAsyncTaskFunc({
        asyncTaskFunc,
        needProtect: true,
      })
    }
    await CommonUtil.asyncWaitAllTaskComplete({
      needTTL: true
    })
    this.log(`[${rangeString}]${rangeString}期间的记录抓取完毕`)
  }
}

export default BatchFetchAuthorActivity
