// 数据包裹内并不是单纯的数据, 由于需要支持排序功能, 所以数据中存在状态.
// 因此使用类实现效果更好

import * as Consts from '../const/index'
import * as Types from '~/src/type/task_config'

import * as Type_Activity from '~/src/type/zhihu/activity'
import * as Type_Answer from '~/src/type/zhihu/answer'
import * as Type_Article from '~/src/type/zhihu/article'
import * as Type_Author from '~/src/type/zhihu/author'
import * as Type_Collection from '~/src/type/zhihu/collection'
import * as Type_Column from '~/src/type/zhihu/column'
import * as Type_Pin from '~/src/type/zhihu/pin'
import * as Type_Question from '~/src/type/zhihu/question'
import * as Type_Topic from '~/src/type/zhihu/topic'

// 基本设计思路
// 页的上一级是单元, 每个单元的顺序为: 单元信息页 + 后续问题/文章/想法页
// 单元的上一级是卷, 每个卷中可包含多个单元
// 卷中页码容量不能超过限制, 如果超过, 需要将溢出单元拆分为两个单元, 归属到下一卷

type Type_Record_Answer = typeof Consts.Const_Record_Type_Answer
type Type_Record_Article = typeof Consts.Const_Record_Type_Article
type Type_Record_Pin = typeof Consts.Const_Record_Type_Pin

type Type_Record_Type = Type_Record_Answer | Type_Record_Article | Type_Record_Pin

type Type_Item_Question = typeof Consts.Const_Type_Question
type Type_Item_Article = typeof Consts.Const_Type_Article
type Type_Item_Pin = typeof Consts.Const_Type_Pin

type Type_Item_Type = Type_Item_Question | Type_Item_Article | Type_Item_Pin

export type Type_Answer_Record = Type_Answer.Record
export type Type_Article_Record = Type_Article.Record
export type Type_Pin_Record = Type_Pin.Record
type Type_Record_Item = Type_Answer.Record | Type_Article.Record | Type_Pin.Record

interface Interface_Base_Page_Item {
  type: Type_Item_Type
  recordList: {
    /**
     * 记录值
     */
    record: Type_Record_Item
    /**
     * 记录类型
     */
    recordType: Type_Record_Type
    /**
     * 记录添加时间
     */
    actionAt: number
  }[]
}

export class Page_Question implements Interface_Base_Page_Item {
  readonly type: Type_Item_Question = Consts.Const_Type_Question
  baseInfo: Type_Answer.Question
  recordList: {
    record: Type_Answer.Record
    recordType: Type_Record_Answer
    actionAt: number
  }[] = []

  constructor({
    baseInfo,
    recordList,
  }: {
    baseInfo: Type_Answer.Question
    recordList: {
      record: Type_Answer.Record
      recordType: Type_Record_Answer
      actionAt: number
    }[]
  }) {
    this.baseInfo = baseInfo
    this.recordList = recordList
  }
}

export class Page_Article implements Interface_Base_Page_Item {
  readonly type: Type_Item_Article = Consts.Const_Type_Article
  recordList: {
    record: Type_Article.Record
    recordType: Type_Record_Article
    actionAt: number
  }[] = []

  constructor({
    recordList,
  }: {
    recordList: {
      record: Type_Article.Record
      recordType: Type_Record_Article
      actionAt: number
    }[]
  }) {
    this.recordList = recordList
  }
}

export class Page_Pin implements Interface_Base_Page_Item {
  readonly type: Type_Item_Pin = Consts.Const_Type_Pin
  recordList: {
    record: Type_Article.Record
    recordType: Type_Record_Article
    actionAt: number
  }[] = []

  constructor({
    recordList,
  }: {
    recordList: {
      record: Type_Article.Record
      recordType: Type_Record_Article
      actionAt: number
    }[]
  }) {
    this.recordList = recordList
  }
}
