import AuthorApi from '~/src/api/single/author.js'
import MAuthor from '~/src/model/author.js'
import Base from '~/src/api/batch/base.js'
import ActivityApi from '~/src/api/single/activity.js'
import MActivity from '~/src/model/activity.js'
import moment from 'moment'
import * as DATE_FORMAT from '~/src/constant/date_format.js'
import CommonUtil from '~/src/library/util/common.js'
import BatchFetchAnswer from '~/src/api/batch/answer.js'
import BatchFetchQuestion from '~/src/api/batch/question.js'
import BatchFetchArticle from './article.js'
import CommonConfig from '~/src/config/common.js'
import { createSuccessOutcome, mergeExecutionOutcomes } from '~/src/shared/runtime/execution_outcome.js'
import { createResolvedAuthorIdentity } from '~/src/domain/author/identity.js'

class BatchFetchAuthorActivity extends Base {
  async fetch(urlToken: string) {
    this.log(`开始抓取用户${urlToken}的历史活动`)
    this.log(`获取用户信息`)
    const authorInfo = await AuthorApi.asyncGetAutherInfo(urlToken)
    this.assertEntityRecord(authorInfo, 'author', urlToken, ['id'])
    const { aliases: authorAliases, urlToken: canonicalUrlToken } = createResolvedAuthorIdentity(authorInfo, urlToken)
    await this.persist('author', canonicalUrlToken, () => MAuthor.asyncReplaceAuthor(authorInfo))
    this.log(`用户信息获取完毕`)
    const name = authorInfo.name
    this.log(`开始抓取用户行为列表`)
    let startAt = MActivity.ZHIHU_ACTIVITY_START_MONTH_AT
    this.log(`检查用户${name}(${canonicalUrlToken})最后一次活跃时间`)
    let endAt = await ActivityApi.asyncGetAutherLastActivityAt(canonicalUrlToken)
    if (endAt === 0) {
      this.log(`用户${name}(${canonicalUrlToken})没有活动记录`)
      return createSuccessOutcome(0)
    }
    this.log(
      `用户${name}(${canonicalUrlToken})最后一次活跃于${moment.unix(endAt).format(DATE_FORMAT.Const_Display_By_Second)}`,
    )

    this.log(`检查用户${name}(${canonicalUrlToken})首次活跃时间`)
    let loopCounter = 0
    let hasActivityInSupportedRange = false
    for (let checkAt = startAt; checkAt <= endAt;) {
      let hasActivityAfterAt = await ActivityApi.asyncCheckHasAutherActivityAfterAt(canonicalUrlToken, checkAt)
      if (hasActivityAfterAt) {
        hasActivityInSupportedRange = true
        this.log(
          `经检查, 用户${name}(${canonicalUrlToken})在${moment
            .unix(checkAt)
            .format(DATE_FORMAT.Const_Display_By_Second)}前有活动记录`,
        )
        this.log(`检查完毕`)
        startAt = moment.unix(checkAt).startOf(DATE_FORMAT.Const_Unit_Month).unix()
        break
      } else {
        this.log(
          `经检查, 用户${name}(${canonicalUrlToken})在${moment
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
    if (hasActivityInSupportedRange === false) {
      this.log(`用户${name}(${canonicalUrlToken})在支持的时间范围内没有活动记录`)
      return createSuccessOutcome(0)
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
          await this.fetchActivityInRange(canonicalUrlToken, fetchStartAt, fetchEndAt)
        },
        needProtect: true,
      })
    }
    await CommonUtil.asyncWaitAllTaskComplete({
      needTTL: false,
    })
    this.log(`用户${name}(${canonicalUrlToken})活动记录抓取完毕`)

    this.log(`抓取用户${name}(${canonicalUrlToken})赞同过的所有回答`)
    let allAgreeAnswerIdList = await MActivity.asyncGetAllActivityTargetIdListByAuthorAliases(
      authorAliases,
      MActivity.VERB_ANSWER_VOTE_UP,
    )
    let batchFetchAnswer = new BatchFetchAnswer()
    const answerOutcome = await this.collectNestedBatchOutcome(() =>
      batchFetchAnswer.fetchListAndSaveToDb(allAgreeAnswerIdList),
    )
    this.log(`用户${name}(${canonicalUrlToken})赞同过的所有回答抓取完毕`)
    this.log(`抓取用户${name}(${canonicalUrlToken})赞同过的所有文章`)
    let allAgreeArticleIdList = await MActivity.asyncGetAllActivityTargetIdListByAuthorAliases(
      authorAliases,
      MActivity.VERB_MEMBER_VOTEUP_ARTICLE,
    )
    let batchFetchArticle = new BatchFetchArticle()
    const articleOutcome = await this.collectNestedBatchOutcome(() =>
      batchFetchArticle.fetchListAndSaveToDb(allAgreeArticleIdList),
    )
    this.log(`用户${name}(${canonicalUrlToken})赞同过的所有文章抓取完毕`)
    this.log(`抓取用户${name}(${canonicalUrlToken})关注过的所有问题`)
    let allFollowQustionIdList = await MActivity.asyncGetAllActivityTargetIdListByAuthorAliases(
      authorAliases,
      MActivity.VERB_QUESTION_FOLLOW,
    )
    let batchFetchQuestion = new BatchFetchQuestion()
    const questionOutcome = await this.collectNestedBatchOutcome(() =>
      batchFetchQuestion.fetchListAndSaveToDb(allFollowQustionIdList),
    )
    this.log(`用户${name}(${canonicalUrlToken})关注过的所有问题抓取完毕`)
    return mergeExecutionOutcomes([answerOutcome, articleOutcome, questionOutcome])
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
    let loopCounter = 0
    for (let fetchAt = endAt; startAt <= fetchAt && fetchAt <= endAt;) {
      const currentFetchAt = fetchAt
      this.log(`[${rangeString}]抓取${moment.unix(fetchAt).format(DATE_FORMAT.Const_Display_By_Second)}的记录`)
      const activityList = await ActivityApi.asyncGetAutherActivityList(urlToken, fetchAt)
      if (activityList.length === 0) {
        // 空窗口向前移动一天；请求失败会由 HTTP 层直接抛出。
        fetchAt = currentFetchAt - 86400
      } else {
        let oldestActivityAt = currentFetchAt
        for (const activityRecord of activityList) {
          const activityAt = Number(activityRecord.id) / 1000
          if (Number.isFinite(activityAt)) {
            oldestActivityAt = Math.min(oldestActivityAt, Math.floor(activityAt))
          }
          await this.persist('activity', `${activityRecord.id}`, () => MActivity.asyncReplaceActivity(activityRecord))
        }
        // API 游标是包含式的，至少回退一秒以避免重复页导致死循环。
        fetchAt = oldestActivityAt < currentFetchAt ? oldestActivityAt - 1 : currentFetchAt - 86400
      }
      loopCounter++
      if (loopCounter % CommonConfig.protect_Loop_Count === 0) {
        await CommonUtil.asyncSleep(CommonConfig.protect_To_Wait_ms)
      }
    }
    this.log(`[${rangeString}]${rangeString}期间的记录抓取完毕`)
  }
}

export default BatchFetchAuthorActivity
