import type * as Type_TaskConfig from '../type/task_config'

export const Const_Task_Type_用户提问过的所有问题 = 'author-ask-question' as const
export const Const_Task_Type_用户的所有回答 = 'author-answer' as const
export const Const_Task_Type_用户发布的所有文章 = 'author-article' as const
export const Const_Task_Type_用户发布的所有想法 = 'author-pin' as const
export const Const_Task_Type_用户赞同过的所有回答 = 'author-agree-answer' as const
export const Const_Task_Type_用户赞同过的所有文章 = 'author-agree-article' as const
export const Const_Task_Type_用户关注过的所有问题 = 'author-watch-question' as const
export const Const_Task_Type_销号用户的所有回答 = 'block-account-answer' as const
export const Const_Task_Type_话题 = 'topic' as const
export const Const_Task_Type_收藏夹 = 'collection' as const
export const Const_Task_Type_专栏 = 'column' as const
export const Const_Task_Type_文章 = 'article' as const
export const Const_Task_Type_问题 = 'question' as const
export const Const_Task_Type_回答 = 'answer' as const
export const Const_Task_Type_想法 = 'pin' as const
export const Const_Task_Type_混合类型 = 'mix' as const

export const Const_Generate_Type_独立输出电子书 = 'single' as const
export const Const_Generate_Type_合并输出电子书_内容打乱重排 = 'merge_by_all' as const
export const Const_Generate_Type_合并输出电子书_按任务拆分章节 = 'merge_by_task' as const

export const Const_Order_With_不排序 = 'none' as const
export const Const_Order_With_记录加入时间_首次值 = 'firstRecordAt' as const
export const Const_Order_With_记录加入时间_末次值 = 'lastRecordAt' as const
export const Const_Order_With_创建时间 = 'createAt' as const
export const Const_Order_With_更新时间 = 'updateAt' as const
export const Const_Order_With_赞同数 = 'voteUpCount' as const
export const Const_Order_With_评论数 = 'commentCount' as const

export const Const_Order_By_Desc = 'desc' as const
export const Const_Order_By_Asc = 'asc' as const

export const Const_Image_Quilty_高清 = 'hd' as const
export const Const_Image_Quilty_原图 = 'raw' as const
export const Const_Image_Quilty_无图 = 'none' as const

export const Const_Default_Ua =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36' as const
export const Const_Default_Cookie = '' as const
export const Const_Max_Question_Or_Article_In_Book = 10000 as const

export const Const_Output_Format_Html = 'html' as const
export const Const_Output_Format_Epub = 'epub' as const

export const Const_Default_Config: Type_TaskConfig.Type_Task_Config = {
  request: {
    cookie: Const_Default_Cookie,
    ua: Const_Default_Ua,
  },
  tasks: [],
  generate: {
    title: '知乎助手生成的电子书',
    mode: Const_Generate_Type_合并输出电子书_按任务拆分章节,
    imageQuality: Const_Image_Quilty_高清,
    maxItemsPerBook: Const_Max_Question_Or_Article_In_Book,
    orderBy: [],
    outputFormats: [Const_Output_Format_Html, Const_Output_Format_Epub],
    comment: '',
  },
}
