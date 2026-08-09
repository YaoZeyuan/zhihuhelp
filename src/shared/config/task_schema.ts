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

export const taskTypeList = [Const_Task_Type_用户提问过的所有问题, Const_Task_Type_用户的所有回答, Const_Task_Type_用户发布的所有文章, Const_Task_Type_用户发布的所有想法, Const_Task_Type_用户赞同过的所有回答, Const_Task_Type_用户赞同过的所有文章, Const_Task_Type_用户关注过的所有问题, Const_Task_Type_销号用户的所有回答, Const_Task_Type_话题, Const_Task_Type_收藏夹, Const_Task_Type_专栏, Const_Task_Type_文章, Const_Task_Type_问题, Const_Task_Type_回答, Const_Task_Type_想法] as const

export const Const_Generate_Type_独立输出电子书 = 'single' as const
export const Const_Generate_Type_合并输出电子书_按任务拆分章节 = 'merge_by_task' as const
export const Const_Generate_Type_合并输出电子书_内容打乱重排 = 'merge_by_all' as const
export const generateModeList = [Const_Generate_Type_独立输出电子书, Const_Generate_Type_合并输出电子书_按任务拆分章节, Const_Generate_Type_合并输出电子书_内容打乱重排] as const

// Serialized values are stable: hd is the optimized high-quality image, raw is the original image.
export const Const_Image_Quilty_高清 = 'hd' as const
export const Const_Image_Quilty_原图 = 'raw' as const
export const Const_Image_Quilty_无图 = 'none' as const
export const imageQualityList = [Const_Image_Quilty_高清, Const_Image_Quilty_原图, Const_Image_Quilty_无图] as const

export const Const_Output_Format_Html = 'html' as const
export const Const_Output_Format_Markdown = 'markdown' as const
export const Const_Output_Format_Epub = 'epub' as const
export const outputFormatList = [
  Const_Output_Format_Html,
  Const_Output_Format_Markdown,
  Const_Output_Format_Epub,
] as const

export type TaskType = typeof taskTypeList[number]
export type GenerateMode = typeof generateModeList[number]
export type ImageQuality = typeof imageQualityList[number]
export type OutputFormat = typeof outputFormatList[number]
