export namespace TypeTaskConfig {
  type Task_Type_用户提问过的所有问题 = 'author-ask-question'
  type Task_Type_用户的所有回答 = 'author-answer'
  type Task_Type_用户发布的所有想法 = 'author-pin'
  type Task_Type_用户赞同过的所有回答 = 'author-agree-answer'
  type Task_Type_用户赞同过的所有文章 = 'author-agree-article'
  type Task_Type_用户关注过的所有问题 = 'author-watch-question'
  type Task_Type_话题 = 'topic'
  type Task_Type_收藏夹 = 'collection'
  type Task_Type_专栏 = 'column'
  type Task_Type_文章 = 'article'
  type Task_Type_问题 = 'question'
  type Task_Type_回答 = 'answer'
  type Task_Type_想法 = 'pin'
  type Order_By_创建时间 = 'createAt'
  type Order_By_更新时间 = 'updateAt'
  type Order_By_赞同数 = 'voteUpCount'
  type Order_By_评论数 = 'commentCount'
  type Image_Quilty_高清 = 'raw'
  type Image_Quilty_原图 = 'hd'
  type Image_Quilty_无图 = 'none'
  type AuthorCollectionType = Task_Type_用户提问过的所有问题 | Task_Type_用户的所有回答 | Task_Type_用户发布的所有想法 | Task_Type_用户赞同过的所有回答 | Task_Type_用户赞同过的所有文章 | Task_Type_用户关注过的所有问题
  type ItemCollectionType = Task_Type_话题 | Task_Type_收藏夹 | Task_Type_专栏 | Task_Type_文章 | Task_Type_问题 | Task_Type_回答 | Task_Type_想法
  type OrderBy = Order_By_创建时间 | Order_By_更新时间 | Order_By_赞同数 | Order_By_评论数
  type ImageQuilty = Image_Quilty_高清 | Image_Quilty_原图 | Image_Quilty_无图
  type TaskType = AuthorCollectionType | ItemCollectionType
  // 作为常量
  const CONST_Task_Type_用户提问过的所有问题 = 'author-ask-question'
  const CONST_Task_Type_用户的所有回答 = 'author-answer'
  const CONST_Task_Type_用户发布的所有想法 = 'author-pin'
  const CONST_Task_Type_用户赞同过的所有回答 = 'author-agree-answer'
  const CONST_Task_Type_用户赞同过的所有文章 = 'author-agree-article'
  const CONST_Task_Type_用户关注过的所有问题 = 'author-watch-question'
  const CONST_Task_Type_话题 = 'topic'
  const CONST_Task_Type_收藏夹 = 'collection'
  const CONST_Task_Type_专栏 = 'column'
  const CONST_Task_Type_文章 = 'article'
  const CONST_Task_Type_问题 = 'question'
  const CONST_Task_Type_回答 = 'answer'
  const CONST_Task_Type_想法 = 'pin'
  const CONST_Order_By_创建时间 = 'createAt'
  const CONST_Order_By_更新时间 = 'updateAt'
  const CONST_Order_By_赞同数 = 'voteUpCount'
  const CONST_Order_By_评论数 = 'commentCount'
  const CONST_Order_Desc = 'desc'
  const CONST_Order_Asc = 'asc'
  const CONST_Image_Quilty_高清 = 'raw'
  const CONST_Image_Quilty_原图 = 'hd'
  const CONST_Image_Quilty_无图 = 'none'

  type ConfigItem = {
    type: ItemCollectionType | AuthorCollectionType
    id: string
    rawInputText: string
    comment: string // 备注
  }
  type Record = {
    configList: Array<ConfigItem>
    orderBy: OrderBy
    order: 'asc' | 'desc'
    bookTitle: string
    imageQuilty: ImageQuilty // 图片质量
    coverImage: string // 封面图, 默认为王闹海
    comment: string // 备注
  }
}
