export namespace TypeTaskConfig {
  export type Task_Type_用户提问过的所有问题 = 'author-ask-question'
  export type Task_Type_用户的所有回答 = 'author-answer'
  export type Task_Type_用户发布的所有想法 = 'author-pin'
  export type Task_Type_用户赞同过的所有回答 = 'author-agree-answer'
  export type Task_Type_用户赞同过的所有文章 = 'author-agree-article'
  export type Task_Type_用户关注过的所有问题 = 'author-watch-question'
  export type Task_Type_话题 = 'topic'
  export type Task_Type_收藏夹 = 'collection'
  export type Task_Type_专栏 = 'column'
  export type Task_Type_文章 = 'article'
  export type Task_Type_问题 = 'question'
  export type Task_Type_回答 = 'answer'
  export type Task_Type_想法 = 'pin'
  export type Order_By_创建时间 = 'createAt'
  export type Order_By_更新时间 = 'updateAt'
  export type Order_By_赞同数 = 'voteUpCount'
  export type Order_By_评论数 = 'commentCount'
  export type Image_Quilty_高清 = 'raw'
  export type Image_Quilty_原图 = 'hd'
  export type Image_Quilty_无图 = 'none'
  export type AuthorCollectionType = Task_Type_用户提问过的所有问题 | Task_Type_用户的所有回答 | Task_Type_用户发布的所有想法 | Task_Type_用户赞同过的所有回答 | Task_Type_用户赞同过的所有文章 | Task_Type_用户关注过的所有问题
  export type ItemCollectionType = Task_Type_话题 | Task_Type_收藏夹 | Task_Type_专栏 | Task_Type_文章 | Task_Type_问题 | Task_Type_回答 | Task_Type_想法
  export type OrderBy = Order_By_创建时间 | Order_By_更新时间 | Order_By_赞同数 | Order_By_评论数
  export type ImageQuilty = Image_Quilty_高清 | Image_Quilty_原图 | Image_Quilty_无图
  export type TaskType = AuthorCollectionType | ItemCollectionType

  export type ConfigItem = {
    type: ItemCollectionType | AuthorCollectionType
    id: string
    rawInputText: string
    comment: string // 备注
  }
  export type Record = {
    configList: Array<ConfigItem>
    orderBy: OrderBy
    order: 'asc' | 'desc'
    bookTitle: string
    imageQuilty: ImageQuilty // 图片质量
    coverImage: string // 封面图, 默认为王闹海
    comment: string // 备注
  }

  // 作为常量
  export const CONST_Task_Type_用户提问过的所有问题 = 'author-ask-question'
  export const CONST_Task_Type_用户的所有回答 = 'author-answer'
  export const CONST_Task_Type_用户发布的所有想法 = 'author-pin'
  export const CONST_Task_Type_用户赞同过的所有回答 = 'author-agree-answer'
  export const CONST_Task_Type_用户赞同过的所有文章 = 'author-agree-article'
  export const CONST_Task_Type_用户关注过的所有问题 = 'author-watch-question'
  export const CONST_Task_Type_话题 = 'topic'
  export const CONST_Task_Type_收藏夹 = 'collection'
  export const CONST_Task_Type_专栏 = 'column'
  export const CONST_Task_Type_文章 = 'article'
  export const CONST_Task_Type_问题 = 'question'
  export const CONST_Task_Type_回答 = 'answer'
  export const CONST_Task_Type_想法 = 'pin'
  export const CONST_Order_By_创建时间 = 'createAt'
  export const CONST_Order_By_更新时间 = 'updateAt'
  export const CONST_Order_By_赞同数 = 'voteUpCount'
  export const CONST_Order_By_评论数 = 'commentCount'
  export const CONST_Order_Desc = 'desc'
  export const CONST_Order_Asc = 'asc'
  export const CONST_Image_Quilty_高清 = 'raw'
  export const CONST_Image_Quilty_原图 = 'hd'
  export const CONST_Image_Quilty_无图 = 'none'
}
