import * as Types from '../type'
import * as TypeTaskConfig from "~/src/resource/type/task_config"
import * as ConstTaskConfig from "~/src/resource/const/task_config"

const Translate_Task_Type = {
    [ConstTaskConfig.Const_Task_Type_用户提问过的所有问题]: '用户提问过的所有问题',
    [ConstTaskConfig.Const_Task_Type_用户的所有回答]: '用户的所有回答',
    [ConstTaskConfig.Const_Task_Type_用户发布的所有文章]: '用户发布的所有文章',
    [ConstTaskConfig.Const_Task_Type_问题]: '问题',
    [ConstTaskConfig.Const_Task_Type_回答]: '回答',
    [ConstTaskConfig.Const_Task_Type_想法]: '想法',
    [ConstTaskConfig.Const_Task_Type_用户发布的所有想法]: '用户发布的所有想法',
    [ConstTaskConfig.Const_Task_Type_用户赞同过的所有回答]: '用户赞同过的所有回答',
    [ConstTaskConfig.Const_Task_Type_用户赞同过的所有文章]: '用户赞同过的所有文章',
    [ConstTaskConfig.Const_Task_Type_用户关注过的所有问题]: '用户关注过的所有问题',
    [ConstTaskConfig.Const_Task_Type_话题]: '话题',
    [ConstTaskConfig.Const_Task_Type_收藏夹]: '收藏夹',
    [ConstTaskConfig.Const_Task_Type_专栏]: '专栏',
    [ConstTaskConfig.Const_Task_Type_文章]: '文章',
}

const Translate_Image_Quilty = {
    [ConstTaskConfig.Const_Image_Quilty_高清]: '高清',
    [ConstTaskConfig.Const_Image_Quilty_原图]: '原图',
    [ConstTaskConfig.Const_Image_Quilty_无图]: '无图',
}

let taskTypeList = []
for (let key of (Object.keys(Translate_Task_Type) as (keyof typeof Translate_Task_Type)[])) {
    let option = {
        label: Translate_Task_Type[key],
        value: key,
    }
    taskTypeList.push(option)
}

export const Const_Task_Type_Option_List = taskTypeList

// 作为常量
export const CONST_Task_Type_用户提问过的所有问题 = 'author-ask-question' as const
export const CONST_Task_Type_用户的所有回答 = 'author-answer' as const
export const CONST_Task_Type_用户发布的所有文章 = 'author-article' as const
export const CONST_Task_Type_用户发布的所有想法 = 'author-pin' as const
export const CONST_Task_Type_用户赞同过的所有回答 = 'author-agree-answer' as const
export const CONST_Task_Type_用户赞同过的所有文章 = 'author-agree-article' as const
export const CONST_Task_Type_用户关注过的所有问题 = 'author-watch-question' as const
export const CONST_Task_Type_封号用户的所有回答 = 'block-account-answer' as const
export const CONST_Task_Type_话题 = 'topic' as const
export const CONST_Task_Type_收藏夹 = 'collection' as const
export const CONST_Task_Type_专栏 = 'column' as const
export const CONST_Task_Type_文章 = 'article' as const
export const CONST_Task_Type_问题 = 'question' as const
export const CONST_Task_Type_回答 = 'answer' as const
export const CONST_Task_Type_想法 = 'pin' as const
export const CONST_Order_By_创建时间 = 'createAt' as const
export const CONST_Order_By_更新时间 = 'updateAt' as const
export const CONST_Order_By_赞同数 = 'voteUpCount' as const
export const CONST_Order_By_评论数 = 'commentCount' as const
export const CONST_Order_Desc = 'desc' as const
export const CONST_Order_Asc = 'asc' as const
export const CONST_Image_Quilty_高清 = 'raw' as const
export const CONST_Image_Quilty_原图 = 'hd' as const
export const CONST_Image_Quilty_无图 = 'none' as const