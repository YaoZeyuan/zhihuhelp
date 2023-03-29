import * as Consts from '../const/task_config'

export type Type_Task_Type_用户提问过的所有问题 = typeof Consts.Const_Task_Type_用户提问过的所有问题
export type Type_Task_Type_用户的所有回答 = typeof Consts.Const_Task_Type_用户的所有回答
export type Type_Task_Type_用户发布的所有文章 = typeof Consts.Const_Task_Type_用户发布的所有文章
export type Type_Task_Type_用户发布的所有想法 = typeof Consts.Const_Task_Type_用户发布的所有想法
export type Type_Task_Type_用户赞同过的所有回答 = typeof Consts.Const_Task_Type_用户赞同过的所有回答
export type Type_Task_Type_用户赞同过的所有文章 = typeof Consts.Const_Task_Type_用户赞同过的所有文章
export type Type_Task_Type_用户关注过的所有问题 = typeof Consts.Const_Task_Type_用户关注过的所有问题
export type Type_Task_Type_销号用户的所有回答 = typeof Consts.Const_Task_Type_销号用户的所有回答
export type Type_Task_Type_话题 = typeof Consts.Const_Task_Type_话题
export type Type_Task_Type_收藏夹 = typeof Consts.Const_Task_Type_收藏夹
export type Type_Task_Type_专栏 = typeof Consts.Const_Task_Type_专栏
export type Type_Task_Type_文章 = typeof Consts.Const_Task_Type_文章
export type Type_Task_Type_问题 = typeof Consts.Const_Task_Type_问题
export type Type_Task_Type_回答 = typeof Consts.Const_Task_Type_回答
export type Type_Task_Type_想法 = typeof Consts.Const_Task_Type_想法
export type Type_Task_Type_混合类型 = typeof Consts.Const_Task_Type_混合类型
export type Type_Order_By = typeof Consts.Const_Order_By_Asc | typeof Consts.Const_Order_By_Desc
export type Type_Order_With_记录加入时间_首次值 = typeof Consts.Const_Order_With_记录加入时间_首次值
export type Type_Order_With_记录加入时间_末次值 = typeof Consts.Const_Order_With_记录加入时间_末次值
export type Type_Order_With_创建时间 = typeof Consts.Const_Order_With_创建时间
export type Type_Order_With_更新时间 = typeof Consts.Const_Order_With_更新时间
export type Type_Order_With_赞同数 = typeof Consts.Const_Order_With_赞同数
export type Type_Order_With_评论数 = typeof Consts.Const_Order_With_评论数
export type Type_Image_Quilty_高清 = typeof Consts.Const_Image_Quilty_高清
export type Type_Image_Quilty_原图 = typeof Consts.Const_Image_Quilty_原图
export type Type_Image_Quilty_无图 = typeof Consts.Const_Image_Quilty_无图
export type Type_Author_Collection_Type =
  | Type_Task_Type_用户提问过的所有问题
  | Type_Task_Type_用户的所有回答
  | Type_Task_Type_用户发布的所有文章
  | Type_Task_Type_用户发布的所有想法
  | Type_Task_Type_用户赞同过的所有回答
  | Type_Task_Type_用户赞同过的所有文章
  | Type_Task_Type_用户关注过的所有问题
  | Type_Task_Type_销号用户的所有回答
export type Type_Item_Collection_Type =
  | Type_Task_Type_话题
  | Type_Task_Type_收藏夹
  | Type_Task_Type_专栏
  | Type_Task_Type_文章
  | Type_Task_Type_问题
  | Type_Task_Type_回答
  | Type_Task_Type_想法
export type Type_Order_With =
  | Type_Order_With_记录加入时间_首次值
  | Type_Order_With_记录加入时间_末次值
  | Type_Order_With_创建时间
  | Type_Order_With_更新时间
  | Type_Order_With_赞同数
  | Type_Order_With_评论数

export type Type_Generate_Type_独立输出电子书 = typeof Consts.Const_Generate_Type_独立输出电子书
export type Type_Generate_Type_合并输出电子书_内容打乱重排 =
  typeof Consts.Const_Generate_Type_合并输出电子书_内容打乱重排
export type Type_Generate_Type_合并输出电子书_按任务拆分章节 =
  typeof Consts.Const_Generate_Type_合并输出电子书_按任务拆分章节

export type Type_Generate_Type =
  | Type_Generate_Type_独立输出电子书
  | Type_Generate_Type_合并输出电子书_内容打乱重排
  | Type_Generate_Type_合并输出电子书_按任务拆分章节
export type Type_Image_Quilty = Type_Image_Quilty_高清 | Type_Image_Quilty_原图 | Type_Image_Quilty_无图
export type Type_Task_Type = Type_Author_Collection_Type | Type_Item_Collection_Type

export type Type_Order_By_Config = {
  orderBy: Type_Order_By
  orderWith: Type_Order_With
}
export type Type_Order_By_Config_List = Type_Order_By_Config[]

export type Type_Max_Item_In_Book = number // 自动分卷: 单本电子书中最大问题/文章数量
export type Type_Fetch_Task_Config_Item = {
  type: Type_Item_Collection_Type | Type_Author_Collection_Type
  id: string
  rawInputText: string
  comment: string // 备注
  skipFetch: boolean
}

// 自定义抓取
export type Type_Task_Config = {
  fetchTaskList: Type_Fetch_Task_Config_Item[]
  generateConfig: {
    imageQuilty: Type_Image_Quilty // 图片质量
    bookTitle: string // 书名
    comment: string // 备注
    maxItemInBook: Type_Max_Item_In_Book // 自动分卷: 单本电子书中最大问题/文章数量
    orderByList: Type_Order_By_Config_List
    generateType: Type_Generate_Type
  }
  requestConfig: {
    ua:
    | 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
    | string
    cookie: '' | string
  }
}
