// 任务相关配置
import * as Type_TaskConfig from '~/src/type/task_config'

// 常量类别并不多, 因此可以集中编写, 不用额外拆分

// 任务类别
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

// 内容输出策略
export const Const_Generate_Type_独立输出电子书 = 'single' as const
export const Const_Generate_Type_合并输出电子书_内容混排 = 'merge_by_all' as const
export const Const_Generate_Type_合并输出电子书_按内容分章节 = 'merge_by_task' as const

// 排序类目
export const Const_Order_By_创建时间 = 'createAt' as const
export const Const_Order_By_更新时间 = 'updateAt' as const
export const Const_Order_By_赞同数 = 'voteUpCount' as const
export const Const_Order_By_评论数 = 'commentCount' as const

// 排序顺序
export const Const_Order_Desc = 'desc' as const
export const Const_Order_Asc = 'asc' as const

// 图片类别
export const Const_Image_Quilty_高清 = 'raw' as const
export const Const_Image_Quilty_原图 = 'hd' as const
export const Const_Image_Quilty_无图 = 'none' as const

// 默认ua
export const Const_Default_Ua =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36' as const
// 默认cookie
export const Const_Default_Cookie = '' as const

/**
 * 默认任务配置
 */
export const Const_Default_Config: Type_TaskConfig.Type_Task_Config = {
  fetchTaskList: [],
  generateConfig: {
    imageQuilty: 'hd', // 图片质量
    bookTitle: '', // 书名
    comment: '', // 备注
    maxQuestionOrArticleInBook: 10000, // 自动分卷: 单本电子书中最大问题/文章数量
    orderByList: [],
    generateType: Const_Generate_Type_独立输出电子书, // 生成逻辑
  },
  requestConfig: {
    cookie: Const_Default_Cookie,
    ua: Const_Default_Ua,
  },
}
