import Base from '~/src/command/base'
import * as Consts from './resource/const/index'
import * as Const_TaskConfig from '~/src/constant/task_config'
import TypeTaskConfig, { Type_Task_Config } from '~/src/type/task_config'
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
import CommonUtil from "~/src/library/util/common"

import HtmlRender from './library/html_render'
import fs from 'fs'
import * as Date_Format from '~/src/constant/date_format'

import * as Package from './resource/library/package'

import EpubGenerator from './library/epub_generator'
import moment from 'moment'
import { ReactElement } from 'react'

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
    let imageQuilty = generateConfig.imageQuilty

    // 根据生成类型, 制定最终结果数据集

    // 最终电子书数据列表

    // 生成最终结果集

    // 按配置拆分电子书

    let epubColumnList = await this.asyncGetColumnPackage({ fetchTaskList, generateConfig })

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
      })
      this.log(`电子书:${bookname}输出完毕`)
    }
    this.log(`所有电子书输出完毕`)
    // 全部完成后打开文件夹
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
    for (let fetchTask of fetchTaskList) {
      let unitPackage = await this.asyncGetUintPackageByFetchTask(fetchTask)
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
    return epubRecordList
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
      let bookname = `${booktitle}_${currentBookColumnIndex}/${totalColumnCount}卷`

      let currentUnitList: Package.Type_Unit_Item[] = []
      let currentItemCount = 0
      // 取出第一个unit
      let nextUnit = processUnitList.shift() as Package.Type_Unit_Item
      if (nextUnit === undefined) {
        continue
      }

      while (currentItemCount + nextUnit.getItemCount() < generateConfig.maxItemInBook) {
        currentUnitList.push(nextUnit)
        nextUnit = processUnitList.shift() as Package.Type_Unit_Item
        if (nextUnit === undefined) {
          break
        }
      }
      // 判断nextUnit的情况
      // 若nextUnit为undefined, 说明所有数据均已取出, 可以正常构建epub代码
      // 若不为undefined, 说明currentPageCount + nextUnit的值超过了阈值, 需要对nextUnit进行拆分
      if (nextUnit === undefined) {
        let epubItem = new Package.Ebook_Column({
          bookname: bookname,
          unitList: currentUnitList,
        })
        epubItemList.push(epubItem)
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
  }: {
    imageQuilty: TypeTaskConfig.Type_Image_Quilty
    epubColumn: Package.Ebook_Column
  }) {
    // 初始化资源, 重置所有静态类变量

    let epubGenerator = new EpubGenerator({ bookname: epubColumn.bookname, imageQuilty })

    // 单独记录生成的元素, 以便输出成单页
    let ele4SinglePageList: ReactElement[] = []
    this.log(`生成问题html列表`)
    let indexRecordList: Type_Index_Record[] = []
    for (let unit of epubColumn.unitList) {
      // 生成信息页
      let { filename, title, html, ele4SinglePage: unitEle4SinglePage } = this.generateUnitInfoHtml(unit)
      ele4SinglePageList.push(unitEle4SinglePage)
      let uri = epubGenerator.addHtml({
        filename,
        title,
        html,
      })
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
        let pageRecord: Type_Index_Record['pageList'][number] = {
          title: title,
          uri: uri,
        }
        unitRecord.pageList.push(pageRecord)
      }
      indexRecordList.push(unitRecord)
    }
    let indexPage = this.generateIndexHtml(indexRecordList)
    let indexUri = epubGenerator.addIndexHtml({
      filename: indexPage.filename,
      title: indexPage.title,
      html: indexPage.html,
    })

    this.log(`生成单一html文件`)
    let singlePageContent = this.generateSinglePageHtml(ele4SinglePageList)
    epubGenerator.generateSinglePageHtml({ html: singlePageContent })

    // 生成电子书
    await epubGenerator.asyncGenerateEpub()

    this.log(`自定义电子书${epubColumn.bookname}生成完毕`)
  }
}

export default GenerateCustomer
