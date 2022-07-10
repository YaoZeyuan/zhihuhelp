import Base from '~/src/command/generate/base'
import * as Types from './resource/type/index'
import * as Consts from './resource/const/index'
import * as Const_TaskConfig from '~/src/constant/task_config'
import TypeTaskConfig from '~/src/type/task_config'
import TypeAnswer from '~/src/type/zhihu/answer'
import * as TypePin from '~/src/type/zhihu/pin'
import TypeArticle from '~/src/type/zhihu/article'
import PathConfig from '~/src/config/path'
import MAuthor from '~/src/model/author'
import MAuthorAskQuestion from '~/src/model/author_ask_question'
import MActivity from '~/src/model/activity'
import MAnswer from '~/src/model/answer'
import MArticle from '~/src/model/article'
import MTopic from '~/src/model/topic'
import MCollection from '~/src/model/collection'
import MColumn from '~/src/model/column'
import MPin from '~/src/model/pin'
import lodash from 'lodash'
import json5 from 'json5'

import AnswerView from '~/src/public/template/react/answer'
import PinView from '~/src/public/template/react/pin'
import ArticleView from '~/src/public/template/react/article'
import BaseView from '~/src/public/template/react/base'
import fs from 'fs'
import path from 'path'
import CommonUtil from '~/src/library/util/common'
import * as Date_Format from '~/src/constant/date_format'
import moment from 'moment'

type EpubResourcePackage = {
  questionList: TypeAnswer.Record[][]
  articleList: TypeArticle.Record[]
  pinList: TypePin.Record[]
}

class GenerateCustomer extends Base {
  public static commandName = 'Generate:Customer'
  public static description = `输出自定义电子书`

  async execute(): Promise<any> {
    this.log(`从${PathConfig.configUri}中读取配置文件`)
    let fetchConfigJSON = fs.readFileSync(PathConfig.configUri).toString()
    this.log('content =>', fetchConfigJSON)
    let customerTaskConfig: TypeTaskConfig.Type_Task_Config = json5.parse(fetchConfigJSON)

    let generateConfig = customerTaskConfig.generateConfig
    let fetchTaskList = customerTaskConfig.fetchTaskList

    // 生成类型
    let generateType = generateConfig.generateType
    let bookname = generateConfig.bookTitle
    let comment = generateConfig.comment
    let imageQuilty = generateConfig.imageQuilty
    let maxQuestionOrArticleInBook = generateConfig.maxQuestionOrArticleInBook
    let orderByList = generateConfig.orderByList

    // 根据生成类型, 制定最终结果数据集

    // 最终电子书数据列表
    let epubRecordList: Types.Type_Ebook_Column_Item[] = []
    switch (generateType) {
      case Const_TaskConfig.Const_Generate_Type_独立输出电子书:
        break
      case Const_TaskConfig.Const_Generate_Type_合并输出电子书_内容打乱重排:
        break
      case Const_TaskConfig.Const_Generate_Type_合并输出电子书_按任务拆分章节:
        break
    }

    // 生成最终结果集

    // 按配置拆分电子书

    // 针对每一个结果, 生成epub

    // 处理html
    // 下载图片
    // 输出内容

    // 全部完成后打开文件夹

    this.log(`开始输出自定义电子书, 共有${fetchTaskList.length}个任务`)
    // 将任务中的数据按照问题/文章/想法进行汇总
    let answerList: TypeAnswer.Record[] = []
    let questionList: TypeAnswer.Record[][] = []
    let articleList: TypeArticle.Record[] = []
    let pinList: TypePin.Record[] = []

    this.log(`将任务中的数据按照问题/文章/想法进行汇总`)
    let taskIndex = 0
    for (let taskConfig of fetchTaskList) {
      taskIndex = taskIndex + 1
      this.log(
        `处理第${taskIndex}/${fetchTaskList.length}个任务, 任务类型:${taskConfig.type}, 任务备注:${taskConfig.comment}`,
      )
      let taskType = taskConfig.type
      let targetId = `${taskConfig.id}`
    }
    // 将回答按照问题合并在一起
    let uniqQuestionMap: {
      [questionId: string]: {
        [answerId: string]: TypeAnswer.Record
      }
    } = {}
    for (let answer of answerList) {
      if (uniqQuestionMap[answer.question.id]) {
        uniqQuestionMap[answer.question.id][answer.id] = answer
      } else {
        uniqQuestionMap[answer.question.id] = {
          [answer.id]: answer,
        }
      }
    }

    for (let questionId of Object.keys(uniqQuestionMap)) {
      let answerMap = uniqQuestionMap[questionId]
      let answerList = []
      for (let answerId of Object.keys(answerMap)) {
        let answer = answerMap[answerId]
        answerList.push(answer)
      }
      questionList.push(answerList)
    }

    this.log(`所有数据获取完毕, 最终结果为=>`)
    this.log(`问题 => ${questionList.length}个`)
    this.log(`文章 => ${articleList.length}篇`)
    this.log(`想法 => ${pinList.length}条`)
    this.log(`按配置排序`)
    // 需要倒过来排, 这样排出来的结果才和预期一致
    let reverseOrderByList = lodash.cloneDeep(orderByList)
    reverseOrderByList.reverse()
    for (let orderByConfig of reverseOrderByList) {
      // 需要额外对questionList中的answerList进行排序
      let bufQuestionList = []
      switch (orderByConfig.orderBy) {
        case 'voteUpCount':
          for (let answerList of questionList) {
            answerList.sort((item1, item2) => {
              if (orderByConfig.order === 'asc') {
                return item1.voteup_count - item2.voteup_count
              } else {
                return item2.voteup_count - item1.voteup_count
              }
            })
            bufQuestionList.push(answerList)
          }
          questionList = bufQuestionList

          questionList.sort((item1, item2) => {
            let item1VoteUpCount = 0
            let item2VoteUpCount = 0
            for (let answerInItem1 of item1) {
              item1VoteUpCount += answerInItem1.voteup_count
            }
            for (let answerInItem2 of item2) {
              item2VoteUpCount += answerInItem2.voteup_count
            }
            if (orderByConfig.order === 'asc') {
              return item1VoteUpCount - item2VoteUpCount
            } else {
              return item2VoteUpCount - item1VoteUpCount
            }
          })
          articleList.sort((item1, item2) => {
            let item1VoteUpCount = item1.voteup_count
            let item2VoteUpCount = item2.voteup_count
            if (orderByConfig.order === 'asc') {
              return item1VoteUpCount - item2VoteUpCount
            } else {
              return item2VoteUpCount - item1VoteUpCount
            }
          })
          pinList.sort((item1, item2) => {
            let item1VoteUpCount = item1.like_count
            let item2VoteUpCount = item2.like_count
            if (orderByConfig.order === 'asc') {
              return item1VoteUpCount - item2VoteUpCount
            } else {
              return item2VoteUpCount - item1VoteUpCount
            }
          })
          break
        case 'commentCount':
          for (let answerList of questionList) {
            answerList.sort((item1, item2) => {
              if (orderByConfig.order === 'asc') {
                return item1.comment_count - item2.comment_count
              } else {
                return item2.comment_count - item1.comment_count
              }
            })
            bufQuestionList.push(answerList)
          }
          questionList = bufQuestionList

          questionList.sort((item1, item2) => {
            let item1CommentCount = 0
            let item2CommentCount = 0
            for (let answerInItem1 of item1) {
              item1CommentCount += answerInItem1.comment_count
            }
            for (let answerInItem2 of item2) {
              item2CommentCount += answerInItem2.comment_count
            }
            if (orderByConfig.order === 'asc') {
              return item1CommentCount - item2CommentCount
            } else {
              return item2CommentCount - item1CommentCount
            }
          })
          articleList.sort((item1, item2) => {
            let item1CommentCount = item1.comment_count
            let item2CommentCount = item2.comment_count
            if (orderByConfig.order === 'asc') {
              return item1CommentCount - item2CommentCount
            } else {
              return item2CommentCount - item1CommentCount
            }
          })
          pinList.sort((item1, item2) => {
            let item1CommentCount = item1.comment_count
            let item2CommentCount = item2.comment_count
            if (orderByConfig.order === 'asc') {
              return item1CommentCount - item2CommentCount
            } else {
              return item2CommentCount - item1CommentCount
            }
          })
          break
        case 'createAt':
          for (let answerList of questionList) {
            answerList.sort((item1, item2) => {
              if (orderByConfig.order === 'asc') {
                return item1.created_time - item2.created_time
              } else {
                return item2.created_time - item1.created_time
              }
            })
            bufQuestionList.push(answerList)
          }
          questionList = bufQuestionList

          questionList.sort((item1, item2) => {
            let item1MinCreateAt = 99999999999999999999999
            let item1MaxCreateAt = 0
            let item2MinCreateAt = 99999999999999999999999
            let item2MaxCreateAt = 0
            for (let answerInItem1 of item1) {
              if (answerInItem1.created_time > item1MaxCreateAt) {
                item1MaxCreateAt = answerInItem1.created_time
              }
              if (answerInItem1.created_time < item1MinCreateAt) {
                item1MinCreateAt = answerInItem1.created_time
              }
            }
            for (let answerInItem2 of item2) {
              if (answerInItem2.created_time > item2MaxCreateAt) {
                item2MaxCreateAt = answerInItem2.created_time
              }
              if (answerInItem2.created_time < item2MinCreateAt) {
                item2MinCreateAt = answerInItem2.created_time
              }
            }
            if (orderByConfig.order === 'asc') {
              return item1MinCreateAt - item2MinCreateAt
            } else {
              return item1MaxCreateAt - item2MaxCreateAt
            }
          })
          articleList.sort((item1, item2) => {
            if (orderByConfig.order === 'asc') {
              return item1.created - item2.created
            } else {
              return item2.created - item1.created
            }
          })
          pinList.sort((item1, item2) => {
            if (orderByConfig.order === 'asc') {
              return item1.created - item2.created
            } else {
              return item2.created - item1.created
            }
          })
          break
        case 'updateAt':
          for (let answerList of questionList) {
            answerList.sort((item1, item2) => {
              if (orderByConfig.order === 'asc') {
                return item1.updated_time - item2.updated_time
              } else {
                return item2.updated_time - item1.updated_time
              }
            })
            bufQuestionList.push(answerList)
          }
          questionList = bufQuestionList

          questionList.sort((item1, item2) => {
            let item1MinUpdateAt = 99999999999999999999999
            let item1MaxUpdateAt = 0
            let item2MinUpdateAt = 99999999999999999999999
            let item2MaxUpdateAt = 0
            for (let answerInItem1 of item1) {
              if (answerInItem1.updated_time > item1MaxUpdateAt) {
                item1MaxUpdateAt = answerInItem1.updated_time
              }
              if (answerInItem1.updated_time < item1MinUpdateAt) {
                item1MinUpdateAt = answerInItem1.updated_time
              }
            }
            for (let answerInItem2 of item2) {
              if (answerInItem2.updated_time > item2MaxUpdateAt) {
                item2MaxUpdateAt = answerInItem2.updated_time
              }
              if (answerInItem2.updated_time < item2MinUpdateAt) {
                item2MinUpdateAt = answerInItem2.updated_time
              }
            }
            if (orderByConfig.order === 'asc') {
              return item1MinUpdateAt - item2MinUpdateAt
            } else {
              return item1MaxUpdateAt - item2MaxUpdateAt
            }
          })
          articleList.sort((item1, item2) => {
            if (orderByConfig.order === 'asc') {
              return item1.updated - item2.updated
            } else {
              return item2.updated - item1.updated
            }
          })
          pinList.sort((item1, item2) => {
            if (orderByConfig.order === 'asc') {
              return item1.updated - item2.updated
            } else {
              return item2.updated - item1.updated
            }
          })
          break
      }
    }

    // 按最大允许值切分列表
    let epubResourceList: EpubResourcePackage[] = []
    let fileCounter = 0

    let splitQuestionList: TypeAnswer.Record[][] = []
    let splitArticleList: TypeArticle.Record[] = []
    let splitPinList: TypePin.Record[] = []

    for (let answerList of questionList) {
      splitQuestionList.push(answerList)
      fileCounter++
      if (fileCounter >= maxQuestionOrArticleInBook) {
        epubResourceList.push({
          questionList: splitQuestionList,
          articleList: splitArticleList,
          pinList: splitPinList,
        })
        splitQuestionList = []
        splitArticleList = []
        splitPinList = []
        fileCounter = 0
      }
    }

    for (let article of articleList) {
      splitArticleList.push(article)
      fileCounter++
      if (fileCounter >= maxQuestionOrArticleInBook) {
        epubResourceList.push({
          questionList: splitQuestionList,
          articleList: splitArticleList,
          pinList: splitPinList,
        })
        splitQuestionList = []
        splitArticleList = []
        splitPinList = []
        fileCounter = 0
      }
    }

    for (let pin of pinList) {
      splitPinList.push(pin)
      fileCounter++
      if (fileCounter >= maxQuestionOrArticleInBook) {
        epubResourceList.push({
          questionList: splitQuestionList,
          articleList: splitArticleList,
          pinList: splitPinList,
        })
        splitQuestionList = []
        splitArticleList = []
        splitPinList = []
        fileCounter = 0
      }
    }
    // 将剩余未被收集的资源, 一起打成一个包
    if (splitQuestionList.length || splitArticleList.length || splitPinList.length) {
      epubResourceList.push({
        questionList: splitQuestionList,
        articleList: splitArticleList,
        pinList: splitPinList,
      })
    }

    let bookCounter = 0
    for (let resourcePackage of epubResourceList) {
      bookCounter++
      let booktitle = ''
      if (epubResourceList.length <= 1) {
        booktitle = bookname
      } else {
        booktitle = `${bookname}-第${bookCounter}卷`
      }
      this.log(`输出电子书:${booktitle}`)
      await this.generateEpub(booktitle, imageQuilty, resourcePackage)
      this.log(`电子书:${booktitle}输出完毕`)
    }
  }

  /**
   * 根据生成配置, 生成电子书资源包
   * @param generateConfig
   */
  async asyncGetColumnPackage(
    fetchTaskList: TypeTaskConfig.Type_Task_Config['fetchTaskList'],
    generateConfig: TypeTaskConfig.Type_Task_Config['generateConfig'],
  ) {
    // 生成类型
    let generateType = generateConfig.generateType
    let bookname = generateConfig.bookTitle
    let comment = generateConfig.comment
    let imageQuilty = generateConfig.imageQuilty
    let maxQuestionOrArticleInBook = generateConfig.maxQuestionOrArticleInBook
    let orderByList = generateConfig.orderByList

    // 根据生成类型, 制定最终结果数据集

    // 最终电子书数据列表
    let unitPackageList: Types.Type_Unit_Item[] = []
    for (let fetchTask of fetchTaskList) {
      let unitPackage = await this.asyncGetUintPackageByFetchTask(fetchTask)
      if (unitPackage === undefined) {
        // 未查找到元素则直接跳过
        continue
      }
      unitPackageList.push(unitPackage)
    }
    // 得到单元列表
    // 按照设置进行分卷
    let epubRecordList: Types.Type_Ebook_Column_Item[] = []
    switch (generateType) {
      case Const_TaskConfig.Const_Generate_Type_独立输出电子书:
        {
          // 用于搜集所有混合类型的记录
          let mixUnitPackage: Types.Type_Unit_Item_混合类型 = {
            type: Const_TaskConfig.Const_Task_Type_混合类型,
            pageList: [],
          }
          for (let unitPackage of unitPackageList) {
            if (unitPackage.type === Const_TaskConfig.Const_Task_Type_混合类型) {
              // 所有混合类型合并为一本电子书
              mixUnitPackage.pageList = [...mixUnitPackage.pageList, ...unitPackage.pageList]
              continue
            } else {
              // 每个单元输出为一本电子书
              let subEpubRecordList = this.autoSplitUnitPackage({
                unitItemList: [unitPackage],
                booktitle: this.generateColumnTitle(unitPackage),
                generateConfig,
              })
              epubRecordList = [...epubRecordList, ...subEpubRecordList]
            }
          }
          // 如果有合并单元, 也输出为一本电子书
          if (mixUnitPackage.pageList.length > 0) {
            let subEpubRecordList = this.autoSplitUnitPackage({
              unitItemList: [mixUnitPackage],
              booktitle: this.generateColumnTitle(mixUnitPackage),
              generateConfig,
            })
            epubRecordList = [...epubRecordList, ...subEpubRecordList]
          }
        }
        break
      case Const_TaskConfig.Const_Generate_Type_合并输出电子书_内容打乱重排:
        {
          // 将所有数据混合起来
          let mixUnitPackage: Types.Type_Unit_Item_混合类型 = {
            type: Const_TaskConfig.Const_Task_Type_混合类型,
            pageList: [],
          }
          for (let unitPackage of unitPackageList) {
            mixUnitPackage.pageList = [...mixUnitPackage.pageList, ...unitPackage.pageList]
            let subEpubRecordList = this.autoSplitUnitPackage({
              unitItemList: [mixUnitPackage],
              booktitle: bookname,
              generateConfig,
            })
            epubRecordList = [...epubRecordList, ...subEpubRecordList]
          }
        }
        break
      case Const_TaskConfig.Const_Generate_Type_合并输出电子书_按任务拆分章节:
        {
          let processUnitList: Types.Type_Unit_Item[] = []
          // 用于搜集所有混合类型的记录
          let mixUnitPackage: Types.Type_Unit_Item_混合类型 = {
            type: Const_TaskConfig.Const_Task_Type_混合类型,
            pageList: [],
          }
          for (let unitPackage of unitPackageList) {
            if (unitPackage.type === Const_TaskConfig.Const_Task_Type_混合类型) {
              // 所有混合类型合并为一本电子书
              mixUnitPackage.pageList = [...mixUnitPackage.pageList, ...unitPackage.pageList]
              continue
            } else {
              processUnitList.push(unitPackage)
            }
          }

          // 所有单元合并输出为一本电子书
          processUnitList.push(mixUnitPackage)
          let subEpubRecordList = this.autoSplitUnitPackage({
            unitItemList: processUnitList,
            booktitle: bookname,
            generateConfig,
          })
          epubRecordList = [...epubRecordList, ...subEpubRecordList]
        }
        break
    }
  }

  /**
   * 根据任务类型, 返回单元包
   * @param taskConfig
   */
  async asyncGetUintPackageByFetchTask(
    taskConfig: TypeTaskConfig.Type_Fetch_Task_Config_Item,
  ): Promise<Types.Type_Unit_Item | undefined> {
    let unitPackage: Types.Type_Unit_Item
    let targetId = taskConfig.id
    switch (taskConfig.type) {
      case Const_TaskConfig.Const_Task_Type_用户提问过的所有问题:
      case Const_TaskConfig.Const_Task_Type_用户的所有回答:
      case Const_TaskConfig.Const_Task_Type_销号用户的所有回答:
      case Const_TaskConfig.Const_Task_Type_用户发布的所有想法:
      case Const_TaskConfig.Const_Task_Type_用户发布的所有文章:
      case Const_TaskConfig.Const_Task_Type_用户赞同过的所有文章:
      case Const_TaskConfig.Const_Task_Type_用户赞同过的所有回答:
      case Const_TaskConfig.Const_Task_Type_用户关注过的所有问题: {
        // 提取公共代码
        this.log(`获取用户${targetId}信息`)
        let authorInfo = await MAuthor.asyncGetAuthor(targetId)
        if (lodash.isEmpty(authorInfo)) {
          this.log(`用户${targetId}信息获取失败, 自动跳过`)
          return
        }
        let userName = `${authorInfo.name}(${targetId})`
        let pageList: Types.Type_Page_Item[] = []
        // 根据任务类别, 收集具体数据
        switch (taskConfig.type) {
          case Const_TaskConfig.Const_Task_Type_用户提问过的所有问题:
            {
              this.log(`获取用户${userName}所有提问过的问题`)
              let questionIdList = await MAuthorAskQuestion.asyncGetAuthorAskQuestionIdList(targetId)
              this.log(`用户${userName}所有提问过的问题id列表获取完毕`)
              this.log(`开始获取用户${userName}所有提问过的问题下的回答列表`)
              for (let questionId of questionIdList) {
                let answerListInAuthorAskQuestion = await MAnswer.asyncGetAnswerListByQuestionIdList([questionId])
                // 问题下没有回答, 则略过问题展示(这样可以将回答相关数据源都收拢到 Answer 表中, 不需要来回更新数据)
                if (answerListInAuthorAskQuestion.length === 0) {
                  this.log(`问题${questionId}下没有回答, 自动跳过`)
                  continue
                }
                let questionInfo = answerListInAuthorAskQuestion[0]?.question
                let page: Types.Type_Page_Question_Item = {
                  baseInfo: questionInfo,
                  recordList: answerListInAuthorAskQuestion,
                  type: Consts.Const_Type_Question,
                  first_action_at: 0,
                  last_action_at: 0,
                }
                pageList.push(page)
              }
              this.log(`用户${targetId}所有提问过的问题下的回答列表获取完毕`)
            }
            break
          case Const_TaskConfig.Const_Task_Type_用户的所有回答:
          case Const_TaskConfig.Const_Task_Type_销号用户的所有回答:
            {
              this.log(`获取用户${userName}所有回答过的答案`)
              let answerListInAuthorHasAnswer = await MAnswer.asyncGetAnswerListByAuthorUrlToken(targetId)
              for (let item of answerListInAuthorHasAnswer) {
                let page: Types.Type_Page_Question_Item = {
                  baseInfo: item.question,
                  recordList: [item],
                  type: Consts.Const_Type_Question,
                  first_action_at: 0,
                  last_action_at: 0,
                }
                pageList.push(page)
              }
            }
            break
          case Const_TaskConfig.Const_Task_Type_用户发布的所有想法:
            {
              this.log(`获取用户${userName}所有发表过的想法`)
              let pinListByAuthorPost = await MPin.asyncGetPinListByAuthorUrlToken(targetId)
              for (let item of pinListByAuthorPost) {
                let page: Types.Type_Page_Pin_Item = {
                  recordList: [item],
                  type: Consts.Const_Type_Pin,
                  first_action_at: 0,
                  last_action_at: 0,
                }
                pageList.push(page)
              }
            }
            break
          case Const_TaskConfig.Const_Task_Type_用户发布的所有文章:
            {
              this.log(`获取用户${userName}发表过的所有文章`)
              let articleListByAuthor = await MArticle.asyncGetArticleListByAuthorUrlToken(targetId)
              for (let item of articleListByAuthor) {
                let page: Types.Type_Page_Article_Item = {
                  recordList: [item],
                  type: Consts.Const_Type_Article,
                  first_action_at: 0,
                  last_action_at: 0,
                }
                pageList.push(page)
              }
            }
            break
          case Const_TaskConfig.Const_Task_Type_用户赞同过的所有文章:
            {
              this.log(`获取用户${userName}赞同过的所有文章id`)
              let articleIdListInAuthorAgreeArticle = await MActivity.asyncGetAllActivityTargetIdList(
                targetId,
                MActivity.VERB_MEMBER_VOTEUP_ARTICLE,
              )
              this.log(`用户${userName}赞同过的所有文章id获取完毕`)
              this.log(`获取用户${userName}赞同过的所有文章`)
              let articleListInAuthorAgreeArticle = await MArticle.asyncGetArticleList(
                articleIdListInAuthorAgreeArticle,
              )
              for (let item of articleListInAuthorAgreeArticle) {
                let page: Types.Type_Page_Article_Item = {
                  recordList: [item],
                  type: Consts.Const_Type_Article,
                  first_action_at: 0,
                  last_action_at: 0,
                }
                pageList.push(page)
              }
            }
            break
          case Const_TaskConfig.Const_Task_Type_用户赞同过的所有回答:
            {
              this.log(`获取用户${userName}赞同过的所有回答id`)
              let answerIdListInAuthorAgreeAnswer = await MActivity.asyncGetAllActivityTargetIdList(
                targetId,
                MActivity.VERB_ANSWER_VOTE_UP,
              )
              this.log(`用户${userName}赞同过的所有回答id获取完毕`)
              this.log(`获取用户${userName}赞同过的所有回答`)
              let answerListInAuthorAgreeAnswer = await MAnswer.asyncGetAnswerList(answerIdListInAuthorAgreeAnswer)
              for (let item of answerListInAuthorAgreeAnswer) {
                let page: Types.Type_Page_Question_Item = {
                  recordList: [item],
                  baseInfo: item.question,
                  type: Consts.Const_Type_Question,
                  first_action_at: 0,
                  last_action_at: 0,
                }
                pageList.push(page)
              }
            }
            break
          case Const_TaskConfig.Const_Task_Type_用户关注过的所有问题:
            {
              this.log(`获取用户${userName}关注过的所有问题id`)
              let questionIdListInAuthorWatchQuestion = await MActivity.asyncGetAllActivityTargetIdList(
                targetId,
                MActivity.VERB_QUESTION_FOLLOW,
              )
              this.log(`用户${userName}关注过的所有问题id获取完毕`)
              this.log(`开始获取用户${userName}关注过的所有问题下的回答列表`)
              for (let questionId of questionIdListInAuthorWatchQuestion) {
                let answerListInAuthorAskQuestion = await MAnswer.asyncGetAnswerListByQuestionIdList([questionId])
                // 问题下没有回答, 则略过问题展示(这样可以将回答相关数据源都收拢到 Answer 表中, 不需要来回更新数据)
                if (answerListInAuthorAskQuestion.length === 0) {
                  this.log(`问题${questionId}下没有回答, 自动跳过`)
                  continue
                }
                let questionInfo = answerListInAuthorAskQuestion[0]?.question
                let page: Types.Type_Page_Question_Item = {
                  baseInfo: questionInfo,
                  recordList: answerListInAuthorAskQuestion,
                  type: Consts.Const_Type_Question,
                  first_action_at: 0,
                  last_action_at: 0,
                }
                pageList.push(page)
              }
            }
            break
        }
        this.log(`用户${userName}数据获取完毕`)
        // 填充单元对象
        unitPackage = {
          info: authorInfo,
          type: taskConfig.type,
          pageList: pageList,
        }
        return unitPackage
      }
      case Const_TaskConfig.Const_Task_Type_话题: {
        this.log(`获取话题${targetId}信息`)
        let topicInfo = await MTopic.asyncGetTopicInfo(targetId)
        if (lodash.isEmpty(topicInfo)) {
          this.log(`话题${targetId}信息获取失败, 自动跳过`)
          return
        }
        let topicName = `${topicInfo.name}(${targetId})`
        this.log(`获取话题${topicName}下所有精华回答id`)
        let answerIdListInTopic = await MTopic.asyncGetAnswerIdList(targetId)
        this.log(`话题${topicName}下精华回答id列表获取完毕`)
        this.log(`获取话题${topicName}下精华回答列表`)
        let pageList: Types.Type_Page_Item[] = []
        for (let answerId of answerIdListInTopic) {
          let answerRecord = await MAnswer.asyncGetAnswer(answerId)
          if (lodash.isEmpty(answerRecord)) {
            continue
          }
          let page: Types.Type_Page_Question_Item = {
            baseInfo: answerRecord.question,
            recordList: [answerRecord],
            type: Consts.Const_Type_Question,
            first_action_at: 0,
            last_action_at: 0,
          }
          pageList.push(page)
        }
        // 填充单元对象
        unitPackage = {
          info: topicInfo,
          type: taskConfig.type,
          pageList: pageList,
        }
        this.log(`话题${topicName}下精华回答列表获取完毕`)
        return unitPackage
      }
      case Const_TaskConfig.Const_Task_Type_收藏夹: {
        this.log(`获取收藏夹${targetId}信息`)
        let columnInfo = await MCollection.asyncGetCollectionInfo(targetId)
        if (lodash.isEmpty(columnInfo)) {
          this.log(`收藏夹${targetId}信息获取失败, 自动跳过`)
          return
        }
        let columnName = `${columnInfo.title}(${targetId})`
        this.log(`获取收藏夹${columnName}下所有收藏`)
        let recordList = await MCollection.asyncGetCollectionRecordList(targetId)
        let pageList: Types.Type_Page_Item[] = []
        // 如果收藏夹中有重复元素, 则合并之
        let questionPageMap: Map<TypeAnswer.Question['id'], Types.Type_Page_Question_Item> = new Map()
        // @todo 这里可以考虑对收藏元素进行排序
        for (let record of recordList) {
          switch (record.record_type) {
            case MCollection.Const_Record_Type_回答:
              {
                let answer = await MAnswer.asyncGetAnswer(record.record_id)
                if (lodash.isEmpty(answer)) {
                  continue
                }
                // 先不考虑合并问题
                let page: Types.Type_Page_Question_Item = {
                  baseInfo: answer.question,
                  recordList: [answer],
                  type: Consts.Const_Type_Question,
                  first_action_at: record.record_at,
                  last_action_at: record.record_at,
                }
                if (questionPageMap.has(answer.question.id) === false) {
                  // 将page元素保留在map列表中, 方便合并收藏夹中的元素
                  questionPageMap.set(answer.question.id, page)
                  pageList.push(page)
                } else {
                  // 之前已经有过page元素, 则不需要新建元素, 直接复用即可
                  page = questionPageMap.get(answer.question.id) as Types.Type_Page_Question_Item
                  page.recordList.push(answer)
                  page.first_action_at = Math.min(page.first_action_at, record.record_at)
                  page.last_action_at = Math.max(page.last_action_at, record.record_at)
                }
              }
              break
            case MCollection.Const_Record_Type_想法:
              {
                let pin = await MPin.asyncGetPin(record.record_id)
                if (lodash.isEmpty(pin)) {
                  continue
                }
                let page: Types.Type_Page_Pin_Item = {
                  recordList: [pin],
                  type: Consts.Const_Type_Pin,
                  first_action_at: record.record_at,
                  last_action_at: record.record_at,
                }
                pageList.push(page)
              }
              break
            case MCollection.Const_Record_Type_文章:
              {
                let article = await MArticle.asyncGetArticle(record.record_id)
                if (lodash.isEmpty(article)) {
                  continue
                }
                let page: Types.Type_Page_Article_Item = {
                  recordList: [article],
                  type: Consts.Const_Type_Article,
                  first_action_at: record.record_at,
                  last_action_at: record.record_at,
                }
                pageList.push(page)
              }
              break
            default:
              continue
          }
        }
        // 填充单元对象
        unitPackage = {
          info: columnInfo,
          type: taskConfig.type,
          pageList: pageList,
        }
        this.log(`收藏夹${columnName}下收藏元素列表获取完毕`)
        return unitPackage
      }
      case Const_TaskConfig.Const_Task_Type_专栏: {
        this.log(`获取专栏${targetId}信息`)
        let columnInfo = await MColumn.asyncGetColumnInfo(targetId)
        if (lodash.isEmpty(columnInfo)) {
          this.log(`专栏${targetId}信息获取失败, 自动跳过`)
          return
        }
        let columnName = `${columnInfo.title}(${targetId})`
        this.log(`获取专栏${columnName}下所有文章`)
        let articleListInColumn = await MArticle.asyncGetArticleListByColumnId(targetId)
        let pageList: Types.Type_Page_Item[] = []
        for (let item of articleListInColumn) {
          if (lodash.isEmpty(item)) {
            continue
          }
          let page: Types.Type_Page_Article_Item = {
            recordList: [item],
            type: Consts.Const_Type_Article,
            first_action_at: 0,
            last_action_at: 0,
          }
          pageList.push(page)
        }
        // 填充单元对象
        unitPackage = {
          info: columnInfo,
          type: taskConfig.type,
          pageList: pageList,
        }
        this.log(`专栏${columnName}下文章获取完毕`)
        return unitPackage
      }
      case Const_TaskConfig.Const_Task_Type_文章: {
        this.log(`获取文章${targetId}`)
        let singleArticle = await MArticle.asyncGetArticle(targetId)
        if (lodash.isEmpty(singleArticle)) {
          this.log(`文章${targetId}获取失败, 自动跳过`)
          return
        }
        let pageList: Types.Type_Page_Item[] = []

        let page: Types.Type_Page_Article_Item = {
          recordList: [singleArticle],
          type: Consts.Const_Type_Article,
          first_action_at: 0,
          last_action_at: 0,
        }
        pageList.push(page)
        // 填充单元对象
        unitPackage = {
          type: Const_TaskConfig.Const_Task_Type_混合类型,
          pageList: pageList,
        }
        this.log(`文章${targetId}获取完毕`)
        return unitPackage
      }
      case Const_TaskConfig.Const_Task_Type_问题: {
        this.log(`获取问题${targetId}下的回答列表`)
        let answerListInQuestion = await MAnswer.asyncGetAnswerListByQuestionIdList([targetId])
        if (lodash.isEmpty(answerListInQuestion)) {
          this.log(`问题${targetId}获取失败, 自动跳过`)
          return
        }
        let pageList: Types.Type_Page_Item[] = []
        let questionInfo = answerListInQuestion[0]?.question
        let page: Types.Type_Page_Question_Item = {
          baseInfo: questionInfo,
          recordList: answerListInQuestion,
          type: Consts.Const_Type_Question,
          first_action_at: 0,
          last_action_at: 0,
        }
        pageList.push(page)
        // 填充单元对象
        unitPackage = {
          type: Const_TaskConfig.Const_Task_Type_混合类型,
          pageList: pageList,
        }
        this.log(`问题${targetId}下的回答列表获取完毕`)
        return unitPackage
      }
      case Const_TaskConfig.Const_Task_Type_回答: {
        this.log(`获取回答${targetId}`)
        let singleAnswer = await MAnswer.asyncGetAnswer(targetId)
        if (lodash.isEmpty(singleAnswer)) {
          this.log(`回答${targetId}获取失败, 自动跳过`)
          return
        }
        let pageList: Types.Type_Page_Item[] = []
        let questionInfo = singleAnswer?.question
        let page: Types.Type_Page_Question_Item = {
          baseInfo: questionInfo,
          recordList: [singleAnswer],
          type: Consts.Const_Type_Question,
          first_action_at: 0,
          last_action_at: 0,
        }
        pageList.push(page)
        // 填充单元对象
        unitPackage = {
          type: Const_TaskConfig.Const_Task_Type_混合类型,
          pageList: pageList,
        }
        this.log(`回答${targetId}获取完毕`)
        return unitPackage
      }
      case Const_TaskConfig.Const_Task_Type_想法: {
        this.log(`获取想法${targetId}`)
        let singlePin = await MPin.asyncGetPin(targetId)
        if (lodash.isEmpty(singlePin)) {
          this.log(`想法${targetId}获取失败, 自动跳过`)
          return
        }
        let pageList: Types.Type_Page_Item[] = []
        let page: Types.Type_Page_Pin_Item = {
          recordList: [singlePin],
          type: Consts.Const_Type_Pin,
          first_action_at: 0,
          last_action_at: 0,
        }
        pageList.push(page)
        // 填充单元对象
        unitPackage = {
          type: Const_TaskConfig.Const_Task_Type_混合类型,
          pageList: pageList,
        }
        this.log(`想法${targetId}获取完毕`)
        return unitPackage
      }
      default:
        this.log(`不支持的任务类型:${taskConfig.type}, 自动跳过`)
    }
  }

  /**
   * 根据任务类型, 生成默认电子书名
   * @param unitItem
   * @returns
   */
  generateColumnTitle(unitItem: Types.Type_Unit_Item) {
    let bookTitle = ''
    switch (unitItem.type) {
      case Const_TaskConfig.Const_Task_Type_混合类型:
        bookTitle = `混合类型_${moment().format(Date_Format.Const_Display_By_Second)}`
        break
      case Const_TaskConfig.Const_Task_Type_收藏夹:
        bookTitle = `收藏夹_${unitItem.info['title']}(${unitItem.info['id']})`
        break
      case Const_TaskConfig.Const_Task_Type_专栏:
        bookTitle = `专栏_${unitItem.info['title']}(${unitItem.info['id']})`
        break
      case Const_TaskConfig.Const_Task_Type_话题:
        bookTitle = `话题_${unitItem.info['name']}(${unitItem.info['id']})`
        break
      case Const_TaskConfig.Const_Task_Type_用户提问过的所有问题:
      case Const_TaskConfig.Const_Task_Type_用户的所有回答:
      case Const_TaskConfig.Const_Task_Type_用户发布的所有文章:
      case Const_TaskConfig.Const_Task_Type_销号用户的所有回答:
      case Const_TaskConfig.Const_Task_Type_用户发布的所有想法:
      case Const_TaskConfig.Const_Task_Type_用户赞同过的所有回答:
      case Const_TaskConfig.Const_Task_Type_用户赞同过的所有文章:
      case Const_TaskConfig.Const_Task_Type_用户关注过的所有问题:
        {
          let userName = `用户_${unitItem.info['name']}(${unitItem.info['id']})`
          switch (unitItem.type) {
            case Const_TaskConfig.Const_Task_Type_用户提问过的所有问题:
              bookTitle = `${userName}_提问过的所有问题`
              break
            case Const_TaskConfig.Const_Task_Type_用户的所有回答:
            case Const_TaskConfig.Const_Task_Type_销号用户的所有回答:
              bookTitle = `${userName}_的所有回答`
              break
            case Const_TaskConfig.Const_Task_Type_用户发布的所有文章:
              bookTitle = `${userName}_发布的所有文章`
              break
            case Const_TaskConfig.Const_Task_Type_用户发布的所有想法:
              bookTitle = `${userName}_发布的所有想法`
              break
            case Const_TaskConfig.Const_Task_Type_用户赞同过的所有回答:
              bookTitle = `${userName}_赞同过的所有回答`
              break
            case Const_TaskConfig.Const_Task_Type_用户赞同过的所有文章:
              bookTitle = `${userName}_赞同过的所有文章`
              break
            case Const_TaskConfig.Const_Task_Type_用户关注过的所有问题:
              bookTitle = `${userName}_关注过的所有问题`
              break
            default:
              bookTitle = `${userName}`
          }
        }
        break
      default:
        bookTitle = `未识别任务_${moment().format(Date_Format.Const_Display_By_Second)}`
    }
    return bookTitle
  }

  /**
   * 自动将单元列表拆分后返回epub卷列表
   */
  autoSplitUnitPackage({
    unitItemList,
    booktitle,
    generateConfig,
  }: {
    unitItemList: Types.Type_Unit_Item[]
    /**
     * 基础标题名
     */
    booktitle: string
    generateConfig: TypeTaskConfig.Type_Task_Config['generateConfig']
  }): Types.Type_Ebook_Column_Item[] {
    let totalPageCount = 0
    for (let unitItem of unitItemList) {
      totalPageCount = totalPageCount + unitItem.pageList.length
    }

    let totalColumnCount = Math.ceil(totalPageCount / generateConfig.maxQuestionOrArticleInBook)
    if (totalColumnCount <= 1) {
      // 不需要分卷
      return [
        {
          bookname: booktitle,
          unitList: [...unitItemList],
        },
      ]
    }

    // 解除引用
    let processUnitList = [...unitItemList]
    let epubItemList: Types.Type_Ebook_Column_Item[] = []
    for (let currentBookColumnIndex = 1; processUnitList.length > 0; currentBookColumnIndex++) {
      // 总卷数确定, 从前往后加即可
      let bookname = `${booktitle}_${currentBookColumnIndex}/${totalColumnCount}卷`

      let currentUnitList: Types.Type_Unit_Item[] = []
      let currentPageCount = 0
      // 取出第一个unit
      let nextUnit = processUnitList.shift() as Types.Type_Unit_Item
      if (nextUnit === undefined) {
        continue
      }

      while (currentPageCount + nextUnit.pageList.length < generateConfig.maxQuestionOrArticleInBook) {
        currentUnitList.push(nextUnit)
        nextUnit = processUnitList.shift() as Types.Type_Unit_Item
        if (nextUnit === undefined) {
          break
        }
      }
      // 判断nextUnit的情况
      // 若nextUnit为undefined, 说明所有数据均已取出, 可以正常构建epub代码
      // 若不为undefined, 说明currentPageCount + nextUnit的值超过了阈值, 需要对nextUnit进行拆分
      if (nextUnit === undefined) {
        let epubItem: Types.Type_Ebook_Column_Item = {
          bookname: bookname,
          unitList: currentUnitList,
        }
        epubItemList.push(epubItem)
      } else {
        // 对unit进行拆分

        let legalUnit: Types.Type_Unit_Item = {
          ...nextUnit,
          pageList: [...nextUnit.pageList.slice(0, generateConfig.maxQuestionOrArticleInBook - currentPageCount)],
        }
        currentUnitList.push(legalUnit)
        let epubItem: Types.Type_Ebook_Column_Item = {
          bookname: bookname,
          unitList: currentUnitList,
        }
        epubItemList.push(epubItem)

        // 溢出部分重新放回待处理列表
        nextUnit.pageList = [...nextUnit.pageList.slice(generateConfig.maxQuestionOrArticleInBook - currentPageCount)]
        processUnitList.unshift(nextUnit)
      }
    }

    return epubItemList
  }

  async generateEpub(
    bookname: string,
    imageQuilty: TypeTaskConfig.imageQuilty,
    epubResourcePackage: EpubResourcePackage,
  ) {
    // 初始化资源, 重置所有静态类变量
    this.bookname = CommonUtil.encodeFilename(`${bookname}`)
    this.imageQuilty = imageQuilty
    let { questionList, articleList, pinList } = epubResourcePackage
    this.imgUriPool = new Map()

    // 初始化文件夹
    this.initStaticRecource()

    // 单独记录生成的元素, 以便输出成单页
    let totalElementListToGenerateSinglePage = []
    this.log(`生成问题html列表`)
    for (let answerRecordList of questionList) {
      let title = answerRecordList[0].question.id
      let content = AnswerView.render(answerRecordList)
      content = this.processContent(content)
      fs.writeFileSync(path.resolve(this.htmlCacheHtmlPath, `${title}.html`), content)
      this.epub.addHtml(answerRecordList[0].question.title, path.resolve(this.htmlCacheHtmlPath, `${title}.html`))

      // 单独记录生成的元素, 以便输出成单页文件
      let contentElementList = []
      for (let answerRecord of answerRecordList) {
        let contentElement = BaseView.generateSingleAnswerElement(answerRecord)
        contentElementList.push(contentElement)
      }
      let elememt = BaseView.generateQuestionElement(answerRecordList[0].question, contentElementList)
      totalElementListToGenerateSinglePage.push(elememt)
    }

    this.log(`生成文章列表`)
    for (let articleRecord of articleList) {
      let title = articleRecord.id
      let content = ArticleView.render(articleRecord)
      content = this.processContent(content)
      fs.writeFileSync(path.resolve(this.htmlCacheHtmlPath, `${title}.html`), content)
      this.epub.addHtml(articleRecord.title, path.resolve(this.htmlCacheHtmlPath, `${title}.html`))

      // 单独记录生成的元素, 以便输出成单页文件
      let elememt = BaseView.generateSingleArticleElement(articleRecord)
      totalElementListToGenerateSinglePage.push(elememt)
    }

    this.log(`生成想法列表`)
    for (let pinRecord of pinList) {
      let title = pinRecord.id
      let content = PinView.render(pinRecord)
      content = this.processContent(content)
      fs.writeFileSync(path.resolve(this.htmlCacheHtmlPath, `${title}.html`), content)
      this.epub.addHtml(pinRecord.excerpt_title, path.resolve(this.htmlCacheHtmlPath, `${title}.html`))

      // 单独记录生成的元素, 以便输出成单页文件
      let elememt = BaseView.generateSinglePinElement(pinRecord)
      totalElementListToGenerateSinglePage.push(elememt)
    }

    this.log(`生成单一html文件`)
    // 生成全部文件
    let pageElement = BaseView.generatePageElement(this.bookname, totalElementListToGenerateSinglePage)
    let content = BaseView.renderToString(pageElement)
    this.log(`内容渲染完毕, 开始对内容进行输出前预处理`)
    content = this.processContent(content)
    fs.writeFileSync(path.resolve(this.htmlCacheSingleHtmlPath, `${this.bookname}.html`), content)

    //  生成目录
    this.log(`生成目录`)
    let firstAnswerInQuestionToRenderIndexList = []
    for (let answerRecordList of questionList) {
      // 只取回答列表中的第一个元素, 以便生成目录
      firstAnswerInQuestionToRenderIndexList.push(answerRecordList[0])
    }
    let indexContent = BaseView.renderIndex(this.bookname, [
      ...firstAnswerInQuestionToRenderIndexList,
      ...articleList,
      ...pinList,
    ])
    fs.writeFileSync(path.resolve(this.htmlCacheHtmlPath, `index.html`), indexContent)
    this.epub.addIndexHtml('目录', path.resolve(this.htmlCacheHtmlPath, `index.html`))

    // 处理静态资源
    await this.asyncProcessStaticResource()

    this.log(`自定义电子书${this.bookname}生成完毕`)
  }
}

export default GenerateCustomer
