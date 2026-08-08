import * as Consts from '~/src/application/workflow/generate/resource/const/index'
import * as Const_TaskConfig from '~/src/constant/task_config'
import TypeTaskConfig from '~/src/type/task_config'
import TypeAnswer from '~/src/type/zhihu/answer'
import * as TypePin from '~/src/type/zhihu/pin'
import TypeArticle from '~/src/type/zhihu/article'
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
import CommonUtil from "~/src/library/util/common"
import Logger from '~/src/library/logger'

import HtmlRender from '~/src/application/workflow/generate/library/html_render'
import * as Date_Format from '~/src/constant/date_format'

import * as Package from '~/src/application/workflow/generate/resource/library/package'

import EpubGenerator from '~/src/application/workflow/generate/library/epub_generator'
import moment from 'moment'
import { ReactElement } from 'react'
import { RunContext } from '~/src/shared/runtime/run_context'
import { LogEventCode, LogLevel, LogStage, LogStatus, StructuredLogEntry } from '~/src/shared/logging/log_contract'
import { AppErrorCode, ApplicationError } from '~/src/shared/error/application_error'

/**
 * 生成html
 */
type Type_Generate_Html = {
  // 文件名
  filename: string
  // 页面标题
  title: string
  // 正常html
  html: string
  // 用于渲染单页的html
  ele4SinglePage: ReactElement
}

/**
 * 生成目录
 */
export type Type_Index_Record = {
  title: string
  uri: string
  pageList: {
    title: string
    uri: string
  }[]
}

type EpubResourcePackage = {
  questionList: TypeAnswer.Record[][]
  articleList: TypeArticle.Record[]
  pinList: TypePin.Record[]
}

class GenerateWorkflow {
  private context?: RunContext
  private missingGenerateTaskList: { taskType: string; entityId: string }[] = []
  private hasPartialGenerateOutcome = false

  /**
   * 根据已解析的任务配置从 SQLite 读取内容并输出 HTML/EPUB。
   *
   * 该 workflow 只编排生成流程；配置文件读取和 CLI 参数解析由 interface 层完成。
   */
  async execute(
    customerTaskConfig: TypeTaskConfig.Type_Task_Config,
    context?: RunContext,
  ): Promise<typeof LogStatus.SUCCESS | typeof LogStatus.PARTIAL_SUCCESS> {
    this.context = context
    this.missingGenerateTaskList = []
    this.hasPartialGenerateOutcome = false
    const startedAt = Date.now()
    const executeJobId = 'generate-execute'
    let generateConfig = customerTaskConfig.generateConfig
    let fetchTaskList = customerTaskConfig.fetchTaskList
    this.event({
      jobId: executeJobId,
      status: LogStatus.START,
      level: LogLevel.INFO,
      message: '加载生成配置',
      details: {
        fetchTaskCount: fetchTaskList.length,
        generateConfig: this.summarizeGenerateConfig(generateConfig),
      },
    })

    // 生成类型
    let imageQuilty = generateConfig.imageQuilty
    const outputFormats = generateConfig.outputFormats ?? ['html', 'epub']

    // 根据生成类型, 制定最终结果数据集

    // 最终电子书数据列表

    // 生成最终结果集

    // 按配置拆分电子书

    try {
      let epubColumnList = await this.asyncGetColumnPackage({ fetchTaskList, generateConfig })

      if (
        fetchTaskList.length > 0
        && this.missingGenerateTaskList.length >= fetchTaskList.length
      ) {
        throw new ApplicationError(
          AppErrorCode.BATCH_FAILED,
          `没有可生成的数据，${this.missingGenerateTaskList.length} 个任务未在数据库中找到实体`,
        )
      }
      if (this.missingGenerateTaskList.length > 0 && this.context) {
        this.hasPartialGenerateOutcome = true
        this.context.outcomeStatus = LogStatus.PARTIAL_SUCCESS
      } else if (this.missingGenerateTaskList.length > 0) {
        this.hasPartialGenerateOutcome = true
      }

      this.event({
        jobId: executeJobId,
        status: LogStatus.PROGRESS,
        level: LogLevel.INFO,
        message: '电子书分卷准备完成',
        details: {
          bookCount: epubColumnList.length,
          books: epubColumnList.map((epubColumn) => this.summarizeEpubColumn(epubColumn)),
          missingTaskCount: this.missingGenerateTaskList.length,
          missingTasks: this.missingGenerateTaskList,
        },
      })

      // 针对每一个结果, 生成epub

      // 处理html
      // 下载图片
      // 输出内容

      for (let epubColumn of epubColumnList) {
        let bookname = epubColumn.bookname
        this.log(`输出电子书:${bookname}`)
        await this.generateEpub({
          epubColumn,
          imageQuilty,
          outputFormats,
        })
        this.log(`电子书:${bookname}输出完毕`)
      }
      const executeStatus = this.hasPartialGenerateOutcome
        ? LogStatus.PARTIAL_SUCCESS
        : LogStatus.SUCCESS
      this.event({
        jobId: executeJobId,
        status: executeStatus,
        level: executeStatus === LogStatus.PARTIAL_SUCCESS ? LogLevel.WARN : LogLevel.INFO,
        message: executeStatus === LogStatus.PARTIAL_SUCCESS ? '所有电子书已输出，部分资源缺失' : '所有电子书输出完成',
        durationMs: Date.now() - startedAt,
        details: {
          bookCount: epubColumnList.length,
          books: epubColumnList.map((epubColumn) => this.summarizeEpubColumn(epubColumn)),
        },
      })
      this.log(`所有电子书输出完毕`)
      return executeStatus
      // 全部完成后打开文件夹
    } catch (error) {
      this.event({
        jobId: executeJobId,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
        message: '生成 workflow 执行失败',
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        details: {
          fetchTaskCount: fetchTaskList.length,
          generateConfig: this.summarizeGenerateConfig(generateConfig),
        },
      })
      throw error
    }
  }

  private event(entry: Omit<StructuredLogEntry, 'runId' | 'traceId'>): void {
    const { stage = LogStage.GENERATE, ...event } = entry
    Logger.event({
      traceId: this.context?.traceId,
      runId: this.context?.runId,
      stage,
      ...event,
    })
  }

  private summarizeGenerateConfig(
    generateConfig: TypeTaskConfig.Type_Task_Config['generateConfig'],
  ): { [key: string]: unknown } {
    return {
      bookTitle: generateConfig.bookTitle,
      generateType: generateConfig.generateType,
      imageQuilty: generateConfig.imageQuilty,
      maxItemInBook: generateConfig.maxItemInBook,
      orderByList: generateConfig.orderByList,
      comment: generateConfig.comment,
    }
  }

  private summarizeFetchTask(
    fetchTask: TypeTaskConfig.Type_Fetch_Task_Config_Item,
    index?: number,
  ): { [key: string]: unknown } {
    return {
      index,
      type: fetchTask.type,
      id: `${fetchTask.id}`,
      rawInputText: fetchTask.rawInputText,
      comment: fetchTask.comment,
      skipFetch: fetchTask.skipFetch,
    }
  }

  private summarizeUnitPackage(unitPackage: Package.Type_Unit_Item): { [key: string]: unknown } {
    return {
      type: unitPackage.type,
      pageCount: unitPackage.pageList.length,
      itemCount: unitPackage.getItemCount(),
      info: this.summarizeUnitInfo(unitPackage),
    }
  }

  private summarizeUnitInfo(unitPackage: Package.Type_Unit_Item): { [key: string]: unknown } | undefined {
    if (unitPackage.info === undefined) {
      return undefined
    }
    const rawInfo = unitPackage.info as {
      id?: string | number
      name?: string
      title?: string
      url_token?: string
    }
    return {
      id: rawInfo.id,
      name: rawInfo.name,
      title: rawInfo.title,
      urlToken: rawInfo.url_token,
    }
  }

  private summarizeEpubColumn(epubColumn: Package.Ebook_Column): { [key: string]: unknown } {
    return {
      bookname: epubColumn.bookname,
      unitCount: epubColumn.unitList.length,
      pageCount: epubColumn.unitList.reduce((sum, unit) => sum + unit.pageList.length, 0),
      itemCount: epubColumn.unitList.reduce((sum, unit) => sum + unit.getItemCount(), 0),
      units: epubColumn.unitList.map((unit) => this.summarizeUnitPackage(unit)),
    }
  }

  private log(...argumentList: unknown[]): void {
    let message = ''
    for (const rawMessage of argumentList) {
      if (lodash.isString(rawMessage) === false) {
        message = message + JSON.stringify(rawMessage)
      } else {
        message = message + rawMessage
      }
    }
    Logger.log(`[GenerateWorkflow] ` + message)
  }

  /**
   * 根据生成配置, 生成电子书资源包
   * @param generateConfig
   */
  async asyncGetColumnPackage({
    fetchTaskList,
    generateConfig,
  }: {
    fetchTaskList: TypeTaskConfig.Type_Task_Config['fetchTaskList']
    generateConfig: TypeTaskConfig.Type_Task_Config['generateConfig']
  }) {
    const startedAt = Date.now()
    this.event({
      status: LogStatus.PROGRESS,
      level: LogLevel.INFO,
      message: '开始整理生成数据包',
      details: {
        fetchTaskCount: fetchTaskList.length,
        generateConfig: this.summarizeGenerateConfig(generateConfig),
      },
    })
    // 生成类型
    let generateType = generateConfig.generateType
    let bookname = generateConfig.bookTitle

    // 需要逆序后, 排序出来才是实际要求的结果
    let reversedOrderByList = [...generateConfig.orderByList].reverse()

    // 根据生成类型, 制定最终结果数据集

    // 最终电子书数据列表
    let unitPackageList: Package.Type_Unit_Item[] = []
    let mixUnitPackage = new Package.Unit_混合类型({
      pageList: [],
    })
    for (const [index, fetchTask] of fetchTaskList.entries()) {
      let unitPackage = await this.asyncGetUintPackageByFetchTaskWithLog(fetchTask, index)
      if (unitPackage === undefined) {
        // 未查找到元素则直接跳过
        continue
      }

      // 混合类型需要单独处理
      if (unitPackage.type === Const_TaskConfig.Const_Task_Type_混合类型) {
        // 所有混合类型合并为一本电子书
        for (let page of unitPackage.pageList) {
          mixUnitPackage.add(page)
        }
      } else {
        unitPackageList.push(unitPackage)
      }
    }
    // 如果有混合类型任务, 合并后作为最后一项加在最后
    if (mixUnitPackage.pageList.length > 0) {
      unitPackageList.push(mixUnitPackage)
    }

    // 对数据进行排序
    // 首先对数据进行预处理
    switch (generateType) {
      case Const_TaskConfig.Const_Generate_Type_独立输出电子书:
        // 单独输出不需要额外处理
        break
      case Const_TaskConfig.Const_Generate_Type_合并输出电子书_按任务拆分章节:
        //按任务合并章节不需要额外处理
        break
      case Const_TaskConfig.Const_Generate_Type_合并输出电子书_内容打乱重排:
        {
          // 打乱重排的话需要先将数据进行合并

          // 先将所有数据混合起来
          let mixUnitPackage = new Package.Unit_混合类型({
            pageList: [],
          })
          for (let unitPackage of unitPackageList) {
            for (let page of unitPackage.pageList) {
              mixUnitPackage.add(page)
            }
          }
          unitPackageList = [mixUnitPackage]
        }
        break
    }
    // 然后排序
    for (let unitPackage of unitPackageList) {
      for (let orderConfig of reversedOrderByList) {
        // 直接调用每个单元中的sort方法即可
        unitPackage.sortPageList({
          orderBy: orderConfig.orderBy,
          orderWith: orderConfig.orderWith,
        })
      }
    }

    // 对数据进行分卷
    let epubRecordList: Package.Ebook_Column[] = []
    switch (generateType) {
      case Const_TaskConfig.Const_Generate_Type_独立输出电子书:
        for (let unitPackage of unitPackageList) {
          // 每个单元输出为一本电子书
          let subEpubRecordList = this.autoSplitUnitPackage({
            unitItemList: [unitPackage],
            booktitle: this.generateColumnTitle(unitPackage),
            generateConfig,
          })
          for (let item of subEpubRecordList) {
            epubRecordList.push(item)
          }
        }
        break
      case Const_TaskConfig.Const_Generate_Type_合并输出电子书_内容打乱重排:
      case Const_TaskConfig.Const_Generate_Type_合并输出电子书_按任务拆分章节:
        {
          // 所有单元合并输出为一本电子书
          let subEpubRecordList = this.autoSplitUnitPackage({
            unitItemList: unitPackageList,
            booktitle: bookname,
            generateConfig,
          })
          epubRecordList = [...epubRecordList, ...subEpubRecordList]
        }
        break
    }
    this.event({
      status: LogStatus.PROGRESS,
      level: LogLevel.INFO,
      message: '生成数据包整理完成',
      durationMs: Date.now() - startedAt,
      details: {
        generateType,
        sourceUnitCount: unitPackageList.length,
        sourceUnits: unitPackageList.map((unitPackage) => this.summarizeUnitPackage(unitPackage)),
        bookCount: epubRecordList.length,
        books: epubRecordList.map((epubRecord) => this.summarizeEpubColumn(epubRecord)),
      },
    })
    return epubRecordList
  }

  private async asyncGetUintPackageByFetchTaskWithLog(
    taskConfig: TypeTaskConfig.Type_Fetch_Task_Config_Item,
    index: number,
  ): Promise<Package.Type_Unit_Item | undefined> {
    const startedAt = Date.now()
    const jobId = `generate-unit-${index}-${taskConfig.type}-${taskConfig.id}`
    this.event({
      jobId,
      status: LogStatus.START,
      level: LogLevel.INFO,
      message: '开始从数据库组装生成单元',
      taskType: taskConfig.type,
      entityId: `${taskConfig.id}`,
      details: this.summarizeFetchTask(taskConfig, index),
    })
    try {
      const unitPackage = await this.asyncGetUintPackageByFetchTask(taskConfig)
      if (unitPackage === undefined) {
        this.missingGenerateTaskList.push({
          taskType: taskConfig.type,
          entityId: `${taskConfig.id}`,
        })
        this.event({
          jobId,
          status: LogStatus.PARTIAL_SUCCESS,
          level: LogLevel.WARN,
          message: '数据库中未找到可生成的数据，已跳过该任务',
          taskType: taskConfig.type,
          entityId: `${taskConfig.id}`,
          durationMs: Date.now() - startedAt,
          details: this.summarizeFetchTask(taskConfig, index),
        })
        return undefined
      }
      this.event({
        jobId,
        status: LogStatus.SUCCESS,
        level: LogLevel.INFO,
        message: '生成单元组装完成',
        taskType: taskConfig.type,
        entityId: `${taskConfig.id}`,
        durationMs: Date.now() - startedAt,
        details: {
          task: this.summarizeFetchTask(taskConfig, index),
          unitPackage: this.summarizeUnitPackage(unitPackage),
        },
      })
      return unitPackage
    } catch (error) {
      this.event({
        jobId,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
        message: '生成单元组装失败',
        taskType: taskConfig.type,
        entityId: `${taskConfig.id}`,
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        details: this.summarizeFetchTask(taskConfig, index),
      })
      throw error
    }
  }

  /**
   * 根据任务类型, 返回单元包
   * @param taskConfig
   */
  async asyncGetUintPackageByFetchTask(
    taskConfig: TypeTaskConfig.Type_Fetch_Task_Config_Item,
  ): Promise<Package.Type_Unit_Item | undefined> {
    let unitPackage: Package.Type_Unit_Item
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
        let pageList: Package.Type_Page_Item[] = []
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
                let page = new Package.Page_Question({
                  baseInfo: questionInfo,
                })
                for (let record of answerListInAuthorAskQuestion) {
                  page.add({
                    actionAt: 0,
                    record,
                  })
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
                let page = new Package.Page_Question({
                  baseInfo: item.question,
                })
                page.add({
                  actionAt: 0,
                  record: item,
                })
                pageList.push(page)
              }
            }
            break
          case Const_TaskConfig.Const_Task_Type_用户发布的所有想法:
            {
              this.log(`获取用户${userName}所有发表过的想法`)
              let pinListByAuthorPost = await MPin.asyncGetPinListByAuthorUrlToken(targetId)
              for (let item of pinListByAuthorPost) {
                let page = new Package.Page_Pin()
                page.add({
                  actionAt: 0,
                  record: item,
                })
                pageList.push(page)
              }
            }
            break
          case Const_TaskConfig.Const_Task_Type_用户发布的所有文章:
            {
              this.log(`获取用户${userName}发表过的所有文章`)
              let articleListByAuthor = await MArticle.asyncGetArticleListByAuthorUrlToken(targetId)
              for (let item of articleListByAuthor) {
                let page = new Package.Page_Article()
                page.add({
                  actionAt: 0,
                  record: item,
                })
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
                let page = new Package.Page_Article()
                page.add({
                  actionAt: 0,
                  record: item,
                })
                pageList.push(page)
              }
            }
            break
          case Const_TaskConfig.Const_Task_Type_用户赞同过的所有回答:
            {
              this.log(`获取用户${userName}赞同过的所有回答id`)
              let actionRecordMap = await MActivity.asyncGetAllActionRecordMap(targetId, MActivity.VERB_ANSWER_VOTE_UP)
              this.log(`用户${userName}赞同过的所有回答id获取完毕`)
              this.log(`获取用户${userName}赞同过的所有回答`)
              let answerListInAuthorAgreeAnswer = await MAnswer.asyncGetAnswerList(Object.keys(actionRecordMap))
              for (let item of answerListInAuthorAgreeAnswer) {
                let page = new Package.Page_Question({
                  baseInfo: item.question,
                })
                let actionAt = actionRecordMap?.[item.id] ?? 0
                page.add({
                  actionAt: actionAt,
                  record: item,
                })
                pageList.push(page)
              }
            }
            break
          case Const_TaskConfig.Const_Task_Type_用户关注过的所有问题:
            {
              this.log(`获取用户${userName}关注过的所有问题id`)
              let actionRecordMap = await MActivity.asyncGetAllActionRecordMap(targetId, MActivity.VERB_QUESTION_FOLLOW)
              this.log(`用户${userName}关注过的所有问题id获取完毕`)
              this.log(`开始获取用户${userName}关注过的所有问题下的回答列表`)
              let questionIdListInAuthorWatchQuestion = Object.keys(actionRecordMap)
              for (let questionId of questionIdListInAuthorWatchQuestion) {
                let answerListInAuthorAskQuestion = await MAnswer.asyncGetAnswerListByQuestionIdList([questionId])
                // 问题下没有回答, 则略过问题展示(这样可以将回答相关数据源都收拢到 Answer 表中, 不需要来回更新数据)
                if (answerListInAuthorAskQuestion.length === 0) {
                  this.log(`问题${questionId}下没有回答, 自动跳过`)
                  continue
                }
                let questionInfo = answerListInAuthorAskQuestion[0]?.question

                let page = new Package.Page_Question({
                  baseInfo: questionInfo,
                })
                let actionAt = actionRecordMap?.[questionId] ?? 0
                for (let answer of answerListInAuthorAskQuestion) {
                  page.add({
                    actionAt: actionAt,
                    record: answer,
                  })
                }
                pageList.push(page)
              }
            }
            break
        }
        this.log(`用户${userName}数据获取完毕`)
        // 填充单元对象
        unitPackage = new Package.Unit_用户({
          info: authorInfo,
          type: taskConfig.type,
          pageList: pageList,
        })
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
        let pageList: Package.Type_Page_Item[] = []
        for (let answerId of answerIdListInTopic) {
          let answerRecord = await MAnswer.asyncGetAnswer(answerId)
          if (lodash.isEmpty(answerRecord)) {
            continue
          }
          let page = new Package.Page_Question({
            baseInfo: answerRecord.question,
          })
          page.add({
            actionAt: 0,
            record: answerRecord,
          })
          pageList.push(page)
        }
        // 填充单元对象
        unitPackage = new Package.Unit_话题({
          info: topicInfo,
          pageList: pageList,
        })
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
        let pageList: Package.Type_Page_Item[] = []
        // 如果收藏夹中有重复元素, 则合并之
        let questionPageMap: Map<TypeAnswer.Question['id'], Package.Page_Question> = new Map()
        for (let record of recordList) {
          switch (record.record_type) {
            case MCollection.Const_Record_Type_回答:
              {
                let answer = await MAnswer.asyncGetAnswer(record.record_id)
                if (lodash.isEmpty(answer)) {
                  continue
                }
                let page = new Package.Page_Question({
                  baseInfo: answer.question,
                })
                page.add({
                  actionAt: record.record_at,
                  record: answer,
                })
                if (questionPageMap.has(answer.question.id) === false) {
                  // 将page元素保留在map列表中, 方便合并收藏夹中的元素
                  questionPageMap.set(answer.question.id, page)
                  pageList.push(page)
                } else {
                  // 之前已经有过page元素, 则不需要新建元素, 直接复用即可
                  page = questionPageMap.get(answer.question.id) as Package.Page_Question
                  page.add({
                    actionAt: record.record_at,
                    record: answer,
                  })
                }
              }
              break
            case MCollection.Const_Record_Type_想法:
              {
                let pin = await MPin.asyncGetPin(record.record_id)
                if (lodash.isEmpty(pin)) {
                  continue
                }
                let page = new Package.Page_Pin()
                page.add({
                  actionAt: record.record_at,
                  record: pin,
                })
                pageList.push(page)
              }
              break
            case MCollection.Const_Record_Type_文章:
              {
                let article = await MArticle.asyncGetArticle(record.record_id)
                if (lodash.isEmpty(article)) {
                  continue
                }
                let page = new Package.Page_Article()
                page.add({
                  actionAt: record.record_at,
                  record: article,
                })
                pageList.push(page)
              }
              break
            default:
              continue
          }
        }
        // 填充单元对象
        unitPackage = new Package.Unit_收藏夹({
          info: columnInfo,
          pageList: pageList,
        })
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
        let pageList: Package.Type_Page_Item[] = []
        for (let item of articleListInColumn) {
          if (lodash.isEmpty(item)) {
            continue
          }
          let page = new Package.Page_Article()
          page.add({
            record: item,
            actionAt: 0,
          })
          pageList.push(page)
        }
        // 填充单元对象
        unitPackage = new Package.Unit_专栏({
          info: columnInfo,
          pageList: pageList,
        })
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
        let pageList: Package.Type_Page_Item[] = []
        let page = new Package.Page_Article()
        page.add({
          record: singleArticle,
          actionAt: 0,
        })
        pageList.push(page)

        // 填充单元对象
        unitPackage = new Package.Unit_混合类型({
          pageList,
        })
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
        let pageList: Package.Type_Page_Item[] = []
        let questionInfo = answerListInQuestion[0]?.question
        let page = new Package.Page_Question({
          baseInfo: questionInfo,
        })
        for (let answer of answerListInQuestion) {
          page.add({
            record: answer,
            actionAt: 0,
          })
        }
        pageList.push(page)
        // 填充单元对象
        unitPackage = new Package.Unit_混合类型({
          pageList,
        })
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
        let pageList: Package.Type_Page_Item[] = []
        let questionInfo = singleAnswer?.question
        let page = new Package.Page_Question({
          baseInfo: questionInfo,
        })
        page.add({
          record: singleAnswer,
          actionAt: 0,
        })
        pageList.push(page)
        // 填充单元对象
        unitPackage = new Package.Unit_混合类型({
          pageList,
        })
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
        let pageList: Package.Type_Page_Item[] = []

        let page = new Package.Page_Pin()
        page.add({
          record: singlePin,
          actionAt: 0,
        })
        pageList.push(page)
        // 填充单元对象
        unitPackage = new Package.Unit_混合类型({
          pageList,
        })
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
  generateColumnTitle(unitItem: Package.Type_Unit_Item) {
    let bookTitle = ''
    switch (unitItem.type) {
      case Const_TaskConfig.Const_Task_Type_混合类型:
        bookTitle = `问答混排_${moment().format(Date_Format.Const_Display_By_Second)}`
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
    return CommonUtil.encodeFilename(bookTitle)
  }

  /**
   * 自动将单元列表拆分后返回epub卷列表
   */
  autoSplitUnitPackage({
    unitItemList,
    booktitle,
    generateConfig,
  }: {
    unitItemList: Package.Type_Unit_Item[]
    /**
     * 基础标题名
     */
    booktitle: string
    generateConfig: TypeTaskConfig.Type_Task_Config['generateConfig']
  }): Package.Ebook_Column[] {
    if (generateConfig.maxItemInBook <= 0) {
      throw new Error(`maxItemInBook 必须大于 0`)
    }
    let totalItemCount = 0
    for (let unitItem of unitItemList) {
      totalItemCount = totalItemCount + unitItem.getItemCount()
    }

    let totalColumnCount = Math.ceil(totalItemCount / generateConfig.maxItemInBook)
    if (totalColumnCount <= 1) {
      // 不需要分卷
      return [
        new Package.Ebook_Column({
          bookname: booktitle,
          unitList: [...unitItemList],
        }),
      ]
    }

    // 解除引用
    let processUnitList = [...unitItemList]
    let epubItemList: Package.Ebook_Column[] = []
    for (let currentBookColumnIndex = 1; processUnitList.length > 0; currentBookColumnIndex++) {
      // 总卷数确定, 从前往后加即可
      let bookname = `${booktitle}_${currentBookColumnIndex}-of-${totalColumnCount}卷`

      let currentUnitList: Package.Type_Unit_Item[] = []
      let currentItemCount = 0
      // 取出第一个unit
      let nextUnit = processUnitList.shift()
      if (nextUnit === undefined) {
        continue
      }

      while (nextUnit !== undefined && currentItemCount + nextUnit.getItemCount() <= generateConfig.maxItemInBook) {
        currentUnitList.push(nextUnit)
        currentItemCount = currentItemCount + nextUnit.getItemCount()
        nextUnit = processUnitList.shift()
      }
      // 判断nextUnit的情况
      // 若nextUnit为undefined, 说明所有数据均已取出, 可以正常构建epub代码
      // 若不为undefined, 说明currentPageCount + nextUnit的值超过了阈值, 需要对nextUnit进行拆分
      if (nextUnit === undefined || currentItemCount >= generateConfig.maxItemInBook) {
        let epubItem = new Package.Ebook_Column({
          bookname: bookname,
          unitList: currentUnitList,
        })
        epubItemList.push(epubItem)
        if (nextUnit !== undefined) {
          processUnitList.unshift(nextUnit)
        }
      } else {
        // 对unit进行拆分
        let legalUnit: Package.Type_Unit_Item
        let remainUnit: Package.Type_Unit_Item

        switch (nextUnit.type) {
          case Const_TaskConfig.Const_Task_Type_专栏:
            legalUnit = new Package.Unit_专栏({
              info: nextUnit.info,
              pageList: [],
            })
            remainUnit = new Package.Unit_专栏({
              info: nextUnit.info,
              pageList: [],
            })
            break
          case Const_TaskConfig.Const_Task_Type_收藏夹:
            legalUnit = new Package.Unit_收藏夹({
              info: nextUnit.info,
              pageList: [],
            })
            remainUnit = new Package.Unit_收藏夹({
              info: nextUnit.info,
              pageList: [],
            })
            break
          case Const_TaskConfig.Const_Task_Type_话题:
            legalUnit = new Package.Unit_话题({
              info: nextUnit.info,
              pageList: [],
            })
            remainUnit = new Package.Unit_话题({
              info: nextUnit.info,
              pageList: [],
            })
            break
          case Const_TaskConfig.Const_Task_Type_混合类型:
            legalUnit = new Package.Unit_混合类型({
              pageList: [],
            })
            remainUnit = new Package.Unit_混合类型({
              pageList: [],
            })
            break
          default: {
            legalUnit = new Package.Unit_用户({
              info: nextUnit.info,
              pageList: [],
              type: nextUnit.type,
            })
            remainUnit = new Package.Unit_用户({
              info: nextUnit.info,
              pageList: [],
              type: nextUnit.type,
            })
          }
        }

        // 生成当前单元和剩余单元对应的页码
        let legalItemCount = generateConfig.maxItemInBook - currentItemCount
        let legalPageList: typeof nextUnit.pageList = []
        let remainPageList: typeof nextUnit.pageList = []
        for (let page of nextUnit.pageList) {
          if (legalItemCount >= page.getItemCount()) {
            legalPageList.push(page)
            legalItemCount = legalItemCount - page.getItemCount()
            continue
          }
          if (legalItemCount < page.getItemCount()) {
            if (legalItemCount > 0) {
              // 从page中取出还可以被放置的部分
              let legalPage = page.slice(0, legalItemCount)
              legalPageList.push(legalPage)
              let remainPage = page.slice(legalItemCount)
              remainPageList.push(remainPage)
              // 剩余元素数一定为0
              legalItemCount = 0
            } else {
              remainPageList.push(page)
            }
            continue
          }
        }

        for (let page of legalPageList) {
          legalUnit.add(page)
        }
        currentUnitList.push(legalUnit)
        let epubItem = new Package.Ebook_Column({
          bookname: bookname,
          unitList: currentUnitList,
        })
        epubItemList.push(epubItem)

        // 溢出部分重新放回待处理列表
        for (let page of remainPageList) {
          remainUnit.add(page)
        }
        processUnitList.unshift(remainUnit)
      }
    }

    return epubItemList
  }

  /**
   * 将unit转换成信息页
   * @param unit
   */
  generateUnitInfoHtml(unit: Package.Type_Unit_Item): Type_Generate_Html {
    let pageTitle = this.generateColumnTitle(unit)
    let filename = ""
    // 渲染结果
    let renderResult
    switch (unit.type) {
      case Const_TaskConfig.Const_Task_Type_混合类型:
        renderResult = HtmlRender.renderInfoPage({
          title: `混合类型_${moment().format(Date_Format.Const_Display_By_Second)}`,
        })
        filename = `mix_type_${moment().format(Date_Format.Const_Display_By_Second)}`
        break
      case Const_TaskConfig.Const_Task_Type_收藏夹:
        renderResult = HtmlRender.renderInfoPage({
          title: `收藏夹_${unit.info['title']}(${unit.info['id']})`,
        })
        filename = `collection_type_${unit.info['id']}`
        break
      case Const_TaskConfig.Const_Task_Type_专栏:
        renderResult = HtmlRender.renderInfoPage({
          title: `专栏_${unit.info['title']}(${unit.info['id']})`,
        })
        filename = `column_type_${unit.info['id']}`
        break
      case Const_TaskConfig.Const_Task_Type_话题:
        renderResult = HtmlRender.renderInfoPage({
          title: `话题_${unit.info['name']}(${unit.info['id']})`,
        })
        filename = `topic_type_${unit.info['id']}`
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
          let userName = `用户_${unit.info['name']}(${unit.info['id']})`
          switch (unit.type) {
            case Const_TaskConfig.Const_Task_Type_用户提问过的所有问题:
              renderResult = HtmlRender.renderInfoPage({
                title: `${userName}_提问过的所有问题`,
              })
              filename = `author_type_${unit.info['id']}_ask_all_question`
              break
            case Const_TaskConfig.Const_Task_Type_用户的所有回答:
            case Const_TaskConfig.Const_Task_Type_销号用户的所有回答:
              renderResult = HtmlRender.renderInfoPage({
                title: `${userName}_的所有回答`,
              })
              filename = `author_type_${unit.info['id']}_all_answer`
              break
            case Const_TaskConfig.Const_Task_Type_用户发布的所有文章:
              renderResult = HtmlRender.renderInfoPage({
                title: `${userName}_发布的所有文章`,
              })
              filename = `author_type_${unit.info['id']}_all_article`
              break
            case Const_TaskConfig.Const_Task_Type_用户发布的所有想法:
              renderResult = HtmlRender.renderInfoPage({
                title: `${userName}_发布的所有想法`,
              })
              filename = `author_type_${unit.info['id']}_all_pin`
              break
            case Const_TaskConfig.Const_Task_Type_用户赞同过的所有回答:
              renderResult = HtmlRender.renderInfoPage({
                title: `${userName}_赞同过的所有回答`,
              })
              filename = `author_type_${unit.info['id']}_all_argee_answer`
              break
            case Const_TaskConfig.Const_Task_Type_用户赞同过的所有文章:
              renderResult = HtmlRender.renderInfoPage({
                title: `${userName}_赞同过的所有文章`,
              })
              filename = `author_type_${unit.info['id']}_all_argee_article`
              break
            case Const_TaskConfig.Const_Task_Type_用户关注过的所有问题:
              renderResult = HtmlRender.renderInfoPage({
                title: `${userName}_关注过的所有问题`,
              })
              filename = `author_type_${unit.info['id']}_all_follow_question`
              break
            default:
              renderResult = HtmlRender.renderInfoPage({
                title: `${userName}`,
              })
              filename = `author_type_default_${moment().format(Date_Format.Const_Display_By_Second)}`
          }
        }
        break
      default:
        renderResult = HtmlRender.renderInfoPage({
          title: `未识别任务_${moment().format(Date_Format.Const_Display_By_Second)}`,
        })
        filename = `unknown_type_${moment().format(Date_Format.Const_Display_By_Second)}`
    }
    return {
      filename: filename,
      title: pageTitle,
      html: HtmlRender.renderToString(renderResult.htmlEle),
      ele4SinglePage: renderResult.singleEle,
    }
  }

  generatePageHtml(page: Package.Type_Page_Item): Type_Generate_Html {
    let pageTitle = ''
    let filename = ""
    let renderResult
    switch (page.type) {
      case Consts.Const_Type_Article:
        filename = (page as Package.Page_Article).recordList[0].record.id + ""
        pageTitle = (page as Package.Page_Article).recordList[0].record.title
        renderResult = HtmlRender.renderArticle({
          title: pageTitle,
          recordList: page.recordList.map((item) => item.record),
        })
        break
      case Consts.Const_Type_Pin:
        filename = (page as Package.Page_Pin).recordList[0].record.id
        pageTitle = (page as Package.Page_Pin).recordList[0].record.excerpt_title
        renderResult = HtmlRender.renderPin({
          title: pageTitle,
          recordList: page.recordList.map((item) => item.record),
        })
        break
      case Consts.Const_Type_Question:
        filename = (page as Package.Page_Question).recordList[0].record.question.id + ""
        pageTitle = (page as Package.Page_Question).recordList[0].record.question.title
        renderResult = HtmlRender.renderQuestion({
          title: pageTitle,
          recordList: page.recordList.map((item) => item.record),
        })
        break
    }

    return {
      filename: CommonUtil.encodeFilename(filename),
      title: pageTitle,
      html: HtmlRender.renderToString(renderResult.htmlEle),
      ele4SinglePage: renderResult.singleEle,
    }
  }

  generateIndexHtml(recordList: Type_Index_Record[]): Type_Generate_Html {
    let renderResult = HtmlRender.renderIndex({
      title: '目录',
      recordList: recordList,
    })

    return {
      filename: "index",
      title: '目录',
      html: HtmlRender.renderToString(renderResult.htmlEle),
      ele4SinglePage: renderResult.singleEle,
    }
  }

  generateSinglePageHtml(eleList: Type_Generate_Html['ele4SinglePage'][]): string {
    let htmlResult = HtmlRender.generateSinglePageHtml({
      title: '',
      eleList,
    })

    return htmlResult
  }

  async generateEpub({
    imageQuilty,
    epubColumn,
    outputFormats,
  }: {
    imageQuilty: TypeTaskConfig.Type_Image_Quilty
    epubColumn: Package.Ebook_Column
    outputFormats: ('html' | 'epub')[]
  }) {
    const startedAt = Date.now()
    const jobId = `generate-book-${++this.generateJobCounter}`
    this.event({
      jobId,
      eventCode: LogEventCode.OUTPUT_START,
      stage: LogStage.OUTPUT,
      status: LogStatus.START,
      level: LogLevel.INFO,
      message: '开始生成单本电子书',
      details: {
        imageQuilty,
        outputFormats,
        book: this.summarizeEpubColumn(epubColumn),
      },
    })

    let epubGenerator: EpubGenerator | undefined
    try {
      // 初始化资源, 重置所有静态类变量
      epubGenerator = new EpubGenerator({ bookname: epubColumn.bookname, imageQuilty })

      // 单独记录生成的元素, 以便输出成单页
      let ele4SinglePageList: ReactElement[] = []
      this.log(`生成问题html列表`)
      let indexRecordList: Type_Index_Record[] = []
      let htmlPageCount = 0
      for (let unit of epubColumn.unitList) {
        // 生成信息页
        let { filename, title, html, ele4SinglePage: unitEle4SinglePage } = this.generateUnitInfoHtml(unit)
        ele4SinglePageList.push(unitEle4SinglePage)
        let uri = epubGenerator.addHtml({
          filename,
          title,
          html,
        })
        htmlPageCount++
        let unitRecord: Type_Index_Record = {
          title: title,
          uri: uri,
          pageList: [],
        }
        // 生成内容页
        for (let page of unit.pageList) {
          let { filename, title, html, ele4SinglePage: pageEle4SinglePage } = this.generatePageHtml(page)
          ele4SinglePageList.push(pageEle4SinglePage)
          let uri = epubGenerator.addHtml({
            filename,
            title,
            html,
          })
          htmlPageCount++
          let pageRecord: Type_Index_Record['pageList'][number] = {
            title: title,
            uri: uri,
          }
          unitRecord.pageList.push(pageRecord)
        }
        indexRecordList.push(unitRecord)
      }
      let indexPage = this.generateIndexHtml(indexRecordList)
      epubGenerator.addIndexHtml({
        filename: indexPage.filename,
        title: indexPage.title,
        html: indexPage.html,
      })
      htmlPageCount++

      this.log(`生成单一html文件`)
      let singlePageContent = this.generateSinglePageHtml(ele4SinglePageList)
      epubGenerator.generateSinglePageHtml({ html: singlePageContent })

      this.event({
        jobId,
        eventCode: LogEventCode.OUTPUT_PROGRESS,
        stage: LogStage.OUTPUT,
        status: LogStatus.PROGRESS,
        level: LogLevel.INFO,
        message: 'HTML 渲染完成，准备生成 EPUB 和输出文件',
        details: {
          bookname: epubColumn.bookname,
          htmlPageCount,
          singlePageElementCount: ele4SinglePageList.length,
          imageCount: epubGenerator.imgUriPool.size,
          epubCachePath: epubGenerator.epubCachePath,
          htmlCachePath: epubGenerator.htmlCachePath,
          epubOutputPath: epubGenerator.epubOutputPathUri,
          htmlOutputPath: epubGenerator.htmlOutputPathUri,
        },
      })

      // 生成电子书
      const generateResult = await epubGenerator.asyncGenerateEpub(outputFormats)
      const outputStatus = generateResult.missingImageCount > 0
        ? LogStatus.PARTIAL_SUCCESS
        : LogStatus.SUCCESS
      if (outputStatus === LogStatus.PARTIAL_SUCCESS && this.context) {
        this.hasPartialGenerateOutcome = true
        this.context.outcomeStatus = LogStatus.PARTIAL_SUCCESS
      } else if (outputStatus === LogStatus.PARTIAL_SUCCESS) {
        this.hasPartialGenerateOutcome = true
      }

      const outputDetails = {
        outputFormats,
        epubOutputPath: outputFormats.includes('epub') ? epubGenerator.epubOutputPathUri : undefined,
        htmlOutputPath: outputFormats.includes('html') ? epubGenerator.htmlOutputPathUri : undefined,
      }

      this.event({
        jobId,
        eventCode: LogEventCode.OUTPUT_CREATED,
        stage: LogStage.OUTPUT,
        status: outputStatus,
        level: outputStatus === LogStatus.PARTIAL_SUCCESS ? LogLevel.WARN : LogLevel.INFO,
        message: outputStatus === LogStatus.PARTIAL_SUCCESS ? '单本电子书生成完成，但部分图片缺失' : '单本电子书生成完成',
        durationMs: Date.now() - startedAt,
        details: {
          bookname: epubColumn.bookname,
          htmlPageCount,
          singlePageElementCount: ele4SinglePageList.length,
          imageCount: epubGenerator.imgUriPool.size,
          epubCachePath: epubGenerator.epubCachePath,
          htmlCachePath: epubGenerator.htmlCachePath,
          ...generateResult,
          ...outputDetails,
        },
      })
      this.log(`自定义电子书${epubColumn.bookname}生成完毕`)
    } catch (error) {
      this.event({
        jobId,
        stage: LogStage.OUTPUT,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
        message: '单本电子书生成失败',
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        details: {
          imageQuilty,
          outputFormats,
          book: this.summarizeEpubColumn(epubColumn),
          epubCachePath: epubGenerator?.epubCachePath,
          htmlCachePath: epubGenerator?.htmlCachePath,
          epubOutputPath: epubGenerator?.epubOutputPathUri,
          htmlOutputPath: epubGenerator?.htmlOutputPathUri,
        },
      })
      throw error
    }
  }

  private generateJobCounter = 0
}

export default GenerateWorkflow
