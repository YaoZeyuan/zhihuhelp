// 数据包裹内并不是单纯的数据, 由于需要支持排序功能, 所以数据中存在状态.
// 因此使用类实现效果更好

import * as Consts from '../const/index'
import * as Types_Task_Config from '~/src/type/task_config'
import * as Consts_Task_Config from '~/src/constant/task_config'

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

type Type_Record_Item_Answer = {
  record: Type_Answer.Record
  recordType: Type_Record_Answer
  actionAt: number
}
type Type_Record_Item_Pin = {
  record: Type_Pin.Record
  recordType: Type_Record_Pin
  actionAt: number
}

type Type_Record_Item_Article = {
  record: Type_Article.Record
  recordType: Type_Record_Article
  actionAt: number
}

type Type_Record_Item = Type_Record_Item_Answer | Type_Record_Item_Pin | Type_Record_Item_Article

interface Interface_Base_Page_Item {
  type: Type_Item_Type
  recordList: Type_Record_Item[]

  /**
   * 添加元素
   * @param record
   */
  add(record: Type_Record_Item): void

  /**
   * 对元素进行排序
   * @param record
   */
  sortRecordList({
    orderWith,
    orderBy,
  }: {
    orderWith: Types_Task_Config.Type_Order_With
    orderBy: Types_Task_Config.Type_Order_By
  }): void

  /**
   * 获取用于排序的属性
   * @param param0
   */
  getOrderProperty({
    item,
    orderWith,
  }: {
    item: Type_Record_Item
    orderWith: Types_Task_Config.Type_Order_With
  }): number
}

export class Page_Question implements Interface_Base_Page_Item {
  readonly type: Type_Item_Question = Consts.Const_Type_Question
  baseInfo: Type_Answer.Question
  recordList: Type_Record_Item_Answer[] = []

  constructor({ baseInfo }: { baseInfo: Type_Answer.Question }) {
    this.baseInfo = baseInfo
  }

  add(record: Type_Record_Item_Answer) {
    this.recordList.push(record)
  }

  getOrderProperty({
    item,
    orderWith,
  }: {
    item: Type_Record_Item_Answer
    orderWith: Types_Task_Config.Type_Order_With
  }): number {
    switch (orderWith) {
      case Consts_Task_Config.Const_Order_With_记录加入时间_首次值:
      case Consts_Task_Config.Const_Order_With_记录加入时间_末次值:
        return item?.actionAt ?? 0
      case Consts_Task_Config.Const_Order_With_创建时间:
        return item?.record?.created_time ?? 0
      case Consts_Task_Config.Const_Order_With_更新时间:
        return item?.record?.updated_time ?? 0
      case Consts_Task_Config.Const_Order_With_评论数:
        return item?.record?.comment_count ?? 0
      case Consts_Task_Config.Const_Order_With_赞同数:
        return item?.record?.voteup_count ?? 0
      case Consts_Task_Config.Const_Order_With_不排序:
        return 0
      default:
        return 0
    }
  }

  sortRecordList({
    orderWith,
    orderBy,
  }: {
    orderWith: Types_Task_Config.Type_Order_With
    orderBy: Types_Task_Config.Type_Order_By
  }) {
    this.recordList.sort((a, b) => {
      let aProperty = this.getOrderProperty({ item: a, orderWith })
      let bProperty = this.getOrderProperty({ item: b, orderWith })
      if (orderBy === Consts_Task_Config.Const_Order_By_Asc) {
        return aProperty - bProperty
      } else {
        return -(aProperty - bProperty)
      }
    })
  }
}

export class Page_Article implements Interface_Base_Page_Item {
  readonly type: Type_Item_Article = Consts.Const_Type_Article
  recordList: Type_Record_Item_Article[] = []
  add(record: Type_Record_Item_Article) {
    this.recordList.push(record)
  }

  getOrderProperty({
    item,
    orderWith,
  }: {
    item: Type_Record_Item_Article
    orderWith: Types_Task_Config.Type_Order_With
  }): number {
    switch (orderWith) {
      case Consts_Task_Config.Const_Order_With_记录加入时间_首次值:
      case Consts_Task_Config.Const_Order_With_记录加入时间_末次值:
        return item?.actionAt ?? 0
      case Consts_Task_Config.Const_Order_With_创建时间:
        return item?.record?.created ?? 0
      case Consts_Task_Config.Const_Order_With_更新时间:
        return item?.record?.updated ?? 0
      case Consts_Task_Config.Const_Order_With_评论数:
        return item?.record?.comment_count ?? 0
      case Consts_Task_Config.Const_Order_With_赞同数:
        return item?.record?.voteup_count ?? 0
      case Consts_Task_Config.Const_Order_With_不排序:
        return 0
      default:
        return 0
    }
  }

  sortRecordList({
    orderWith,
    orderBy,
  }: {
    orderWith: Types_Task_Config.Type_Order_With
    orderBy: Types_Task_Config.Type_Order_By
  }) {
    this.recordList.sort((a, b) => {
      let aProperty = this.getOrderProperty({ item: a, orderWith })
      let bProperty = this.getOrderProperty({ item: b, orderWith })
      if (orderBy === Consts_Task_Config.Const_Order_By_Asc) {
        return aProperty - bProperty
      } else {
        return -(aProperty - bProperty)
      }
    })
  }
}

export class Page_Pin implements Interface_Base_Page_Item {
  readonly type: Type_Item_Pin = Consts.Const_Type_Pin
  recordList: Type_Record_Item_Pin[] = []

  add(record: Type_Record_Item_Pin) {
    this.recordList.push(record)
  }

  getOrderProperty({
    item,
    orderWith,
  }: {
    item: Type_Record_Item_Pin
    orderWith: Types_Task_Config.Type_Order_With
  }): number {
    switch (orderWith) {
      case Consts_Task_Config.Const_Order_With_记录加入时间_首次值:
      case Consts_Task_Config.Const_Order_With_记录加入时间_末次值:
        return item?.actionAt ?? 0
      case Consts_Task_Config.Const_Order_With_创建时间:
        return item?.record?.created ?? 0
      case Consts_Task_Config.Const_Order_With_更新时间:
        return item?.record?.updated ?? 0
      case Consts_Task_Config.Const_Order_With_评论数:
        return item?.record?.comment_count ?? 0
      case Consts_Task_Config.Const_Order_With_赞同数:
        return item?.record?.like_count ?? 0
      case Consts_Task_Config.Const_Order_With_不排序:
        return 0
      default:
        return 0
    }
  }

  sortRecordList({
    orderWith,
    orderBy,
  }: {
    orderWith: Types_Task_Config.Type_Order_With
    orderBy: Types_Task_Config.Type_Order_By
  }) {
    this.recordList.sort((a, b) => {
      let aProperty = this.getOrderProperty({ item: a, orderWith })
      let bProperty = this.getOrderProperty({ item: b, orderWith })
      if (orderBy === Consts_Task_Config.Const_Order_By_Asc) {
        return aProperty - bProperty
      } else {
        return -(aProperty - bProperty)
      }
    })
  }
}

// 实际的item元素-对应每一页的内容
export type Type_Page_Item = Page_Question | Page_Pin | Page_Article
type Type_Unit_Info = Type_Collection.Info | Type_Topic.Info | Type_Column.Record | Type_Author.Record | undefined

interface Interface_Unit_Base {
  pageList: Type_Page_Item[]
  info: Type_Unit_Info

  /**
   * 添加页面
   * @param page
   */
  add(page: Type_Page_Item): void

  /**
   * 对元素进行排序
   * @param record
   */
  sortRecordList({
    orderWith,
    orderBy,
  }: {
    orderWith: Types_Task_Config.Type_Order_With
    orderBy: Types_Task_Config.Type_Order_By
  }): void

  /**
   * 获取用于排序的属性
   * @param param0
   */
  getOrderProperty({ item, orderWith }: { item: Type_Page_Item; orderWith: Types_Task_Config.Type_Order_With }): number
}

class Unit_Base {
  pageList: Type_Page_Item[] = []

  add(page: Type_Page_Item) {
    this.pageList.push(page)
  }

  getOrderProperty({
    item,
    orderWith,
  }: {
    item: Type_Page_Item
    orderWith: Types_Task_Config.Type_Order_With
  }): number {
    let pageItem = item
    switch (pageItem.type) {
      case Consts.Const_Type_Article:
        switch (orderWith) {
          case Consts_Task_Config.Const_Order_With_记录加入时间_首次值:
            return pageItem?.recordList?.[0]?.actionAt ?? 0
          case Consts_Task_Config.Const_Order_With_记录加入时间_末次值:
            return pageItem?.recordList?.[pageItem?.recordList.length - 1]?.actionAt ?? 0
          case Consts_Task_Config.Const_Order_With_创建时间:
            return pageItem?.recordList?.[0]?.record?.created ?? 0
          case Consts_Task_Config.Const_Order_With_更新时间:
            return pageItem?.recordList?.[0]?.record?.updated ?? 0
          case Consts_Task_Config.Const_Order_With_评论数:
            return pageItem?.recordList?.[0]?.record?.comment_count ?? 0
          case Consts_Task_Config.Const_Order_With_赞同数:
            return pageItem?.recordList?.[0]?.record?.voteup_count ?? 0
          case Consts_Task_Config.Const_Order_With_不排序:
            // ES2019起可以保证排序的稳定性
            return 0
          default:
            return 0
        }
      case Consts.Const_Type_Pin:
        switch (orderWith) {
          case Consts_Task_Config.Const_Order_With_记录加入时间_首次值:
            return pageItem?.recordList?.[0]?.actionAt ?? 0
          case Consts_Task_Config.Const_Order_With_记录加入时间_末次值:
            return pageItem?.recordList?.[pageItem?.recordList.length - 1]?.actionAt ?? 0
          case Consts_Task_Config.Const_Order_With_创建时间:
            return pageItem?.recordList?.[0]?.record?.created ?? 0
          case Consts_Task_Config.Const_Order_With_更新时间:
            return pageItem?.recordList?.[0]?.record?.updated ?? 0
          case Consts_Task_Config.Const_Order_With_评论数:
            return pageItem?.recordList?.[0]?.record?.comment_count ?? 0
          case Consts_Task_Config.Const_Order_With_赞同数:
            return pageItem?.recordList?.[0]?.record?.like_count ?? 0
          case Consts_Task_Config.Const_Order_With_不排序:
            return 0
          default:
            return 0
        }
      case Consts.Const_Type_Question:
        switch (orderWith) {
          case Consts_Task_Config.Const_Order_With_记录加入时间_首次值:
            return pageItem?.recordList?.[0]?.actionAt ?? 0
          case Consts_Task_Config.Const_Order_With_记录加入时间_末次值:
            return pageItem?.recordList?.[pageItem?.recordList.length - 1]?.actionAt ?? 0
          case Consts_Task_Config.Const_Order_With_创建时间:
            return pageItem?.recordList?.[0]?.record?.created_time ?? 0
          case Consts_Task_Config.Const_Order_With_更新时间:
            return pageItem?.recordList?.[0]?.record?.updated_time ?? 0
          case Consts_Task_Config.Const_Order_With_评论数:
            return pageItem?.recordList?.[0]?.record?.comment_count ?? 0
          case Consts_Task_Config.Const_Order_With_赞同数:
            return pageItem?.recordList?.[0]?.record?.voteup_count ?? 0
          case Consts_Task_Config.Const_Order_With_不排序:
            return 0
          default:
            return 0
        }
      default:
        return 0
    }
  }

  sortRecordList({
    orderWith,
    orderBy,
  }: {
    orderWith: Types_Task_Config.Type_Order_With
    orderBy: Types_Task_Config.Type_Order_By
  }) {
    let typeMap = {
      [Consts.Const_Type_Question]: 3,
      [Consts.Const_Type_Pin]: 2,
      [Consts.Const_Type_Article]: 1,
    }

    this.pageList.sort((a, b) => {
      let aProperty = 0
      let bProperty = 0
      if (a.type !== b.type) {
        // 非类型页面, 无法比较
        aProperty = typeMap[a.type]
        bProperty = typeMap[b.type]
        // 跨页面比较时, 除了三种特殊情况外, 总是按照问题/想法/文章的顺序进行展示
        switch (orderWith) {
          case Consts_Task_Config.Const_Order_With_不排序:
            return 0
          case Consts_Task_Config.Const_Order_With_记录加入时间_首次值:
          case Consts_Task_Config.Const_Order_With_记录加入时间_末次值: {
            let aProperty = this.getOrderProperty({ item: a, orderWith })
            let bProperty = this.getOrderProperty({ item: b, orderWith })
            if (orderBy === Consts_Task_Config.Const_Order_By_Asc) {
              return aProperty - bProperty
            } else {
              return -(aProperty - bProperty)
            }
          }
          default:
            return aProperty - bProperty
        }
      } else {
        aProperty = this.getOrderProperty({ item: a, orderWith })
        bProperty = this.getOrderProperty({ item: b, orderWith })
        if (orderBy === Consts_Task_Config.Const_Order_By_Asc) {
          return aProperty - bProperty
        } else {
          return -(aProperty - bProperty)
        }
      }
    })
  }
}

export class Unit_收藏夹 extends Unit_Base implements Interface_Unit_Base {
  readonly type: Types_Task_Config.Type_Task_Type_收藏夹 = Consts_Task_Config.Const_Task_Type_收藏夹
  info: Type_Collection.Info
  pageList: Type_Page_Item[] = []
  constructor({ info, pageList }: { info: Type_Collection.Info; pageList: Type_Page_Item[] }) {
    super()
    this.info = info
    this.pageList = pageList
  }
}

export class Unit_话题 extends Unit_Base implements Interface_Unit_Base {
  readonly type: Types_Task_Config.Type_Task_Type_话题 = Consts_Task_Config.Const_Task_Type_话题
  info: Type_Topic.Info
  pageList: Type_Page_Item[] = []
  constructor({ info, pageList }: { info: Type_Topic.Info; pageList: Type_Page_Item[] }) {
    super()
    this.info = info
    this.pageList = pageList
  }
}

export class Unit_专栏 extends Unit_Base implements Interface_Unit_Base {
  readonly type: Types_Task_Config.Type_Task_Type_专栏 = Consts_Task_Config.Const_Task_Type_专栏
  info: Type_Column.Record
  pageList: Type_Page_Item[] = []
  constructor({ info, pageList }: { info: Type_Column.Record; pageList: Type_Page_Item[] }) {
    super()
    this.info = info
    this.pageList = pageList
  }
}
export class Unit_用户 extends Unit_Base implements Interface_Unit_Base {
  readonly type: Types_Task_Config.Type_Author_Collection_Type
  info: Type_Author.Record
  pageList: Type_Page_Item[] = []
  constructor({
    info,
    pageList,
    type,
  }: {
    type: Types_Task_Config.Type_Author_Collection_Type
    info: Type_Author.Record
    pageList: Type_Page_Item[]
  }) {
    super()
    this.type = type
    this.info = info
    this.pageList = pageList
  }
}

export class Unit_混合类型 extends Unit_Base implements Interface_Unit_Base {
  readonly type: Types_Task_Config.Type_Task_Type_混合类型 = Consts_Task_Config.Const_Task_Type_混合类型
  info = undefined
  pageList: Type_Page_Item[] = []
  constructor({ pageList }: { pageList: Type_Page_Item[] }) {
    super()
    this.pageList = pageList
  }
}

/**
 * 单元类型
 */
export type Type_Unit_Item =
  | typeof Unit_收藏夹
  | typeof Unit_话题
  | typeof Unit_专栏
  | typeof Unit_用户
  | typeof Unit_混合类型

/**
 * 电子书分卷信息
 */
export class Ebook_Column {
  /**
   * 电子书名
   */
  private bookname: string
  /**
   * 分卷信息
   */
  private unitList: Type_Unit_Item[]
  constructor({ bookname, unitList }: { bookname: string; unitList: Type_Unit_Item[] }) {
    this.bookname = bookname
    this.unitList = unitList
  }
}
