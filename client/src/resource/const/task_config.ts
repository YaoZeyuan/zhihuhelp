import type * as TypeTaskConfig from '../type/task_config'
import * as SharedTaskSchema from '@shared/config/task_schema'

export * from '@shared/config/task_schema'

export const Const_Order_With_不排序 = 'none' as const
export const Const_Order_With_记录加入时间_首次值 = 'firstRecordAt' as const
export const Const_Order_With_记录加入时间_末次值 = 'lastRecordAt' as const
export const Const_Order_With_创建时间 = 'createAt' as const
export const Const_Order_With_更新时间 = 'updateAt' as const
export const Const_Order_With_赞同数 = 'voteUpCount' as const
export const Const_Order_With_评论数 = 'commentCount' as const
export const Const_Order_By_Desc = 'desc' as const
export const Const_Order_By_Asc = 'asc' as const
export const Const_Default_Ua =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36' as const
export const Const_Default_Cookie = '' as const
export const Const_Max_Question_Or_Article_In_Book = 10000 as const
export const Const_Required_Output_Format_List = [
  SharedTaskSchema.Const_Output_Format_Html,
  SharedTaskSchema.Const_Output_Format_Markdown,
  SharedTaskSchema.Const_Output_Format_Epub,
] as const

export const Const_Default_Config: TypeTaskConfig.Type_Task_Config = {
  request: { cookie: Const_Default_Cookie, ua: Const_Default_Ua },
  tasks: [],
  generate: {
    title: '知乎助手生成的电子书',
    mode: SharedTaskSchema.Const_Generate_Type_合并输出电子书_按任务拆分章节,
    imageQuality: SharedTaskSchema.Const_Image_Quilty_高清,
    maxItemsPerBook: Const_Max_Question_Or_Article_In_Book,
    orderBy: [],
    outputFormats: [...Const_Required_Output_Format_List],
    comment: '',
  },
}
