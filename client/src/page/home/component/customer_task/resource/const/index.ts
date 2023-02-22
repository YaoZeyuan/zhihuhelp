import * as Types from '../type'
import * as TypeTaskConfig from "~/src/resource/type/task_config"
import * as ConstTaskConfig from "~/src/resource/const/task_config"

const Translate_Task_Type = {
    [ConstTaskConfig.Const_Task_Type_用户提问过的所有问题]: '用户提问过的所有问题',
    [ConstTaskConfig.Const_Task_Type_用户的所有回答]: '用户的所有回答',
    [ConstTaskConfig.Const_Task_Type_用户发布的所有文章]: '用户发布的所有文章',
    [ConstTaskConfig.Const_Task_Type_用户发布的所有想法]: '用户发布的所有想法',
    [ConstTaskConfig.Const_Task_Type_用户赞同过的所有回答]: '用户赞同过的所有回答',
    [ConstTaskConfig.Const_Task_Type_用户赞同过的所有文章]: '用户赞同过的所有文章',
    [ConstTaskConfig.Const_Task_Type_用户关注过的所有问题]: '用户关注过的所有问题',
    [ConstTaskConfig.Const_Task_Type_问题]: '问题',
    [ConstTaskConfig.Const_Task_Type_回答]: '回答',
    [ConstTaskConfig.Const_Task_Type_想法]: '想法',
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
export const Const_Default_Task_Type = ConstTaskConfig.Const_Task_Type_用户的所有回答

const placeholderDemo = {
    用户相关: 'https://www.zhihu.com/people/mai-xiao-dou-dou-43',
    问题: "https://www.zhihu.com/question/584124868",
    回答: "https://www.zhihu.com/question/584124868/answer/2903748169",
    想法: "https://www.zhihu.com/pin/1545015868832333824",
    话题: "https://www.zhihu.com/topic/19550874",
    收藏夹: "https://www.zhihu.com/collection/294901110",
    专栏: "https://www.zhihu.com/column/c_1318131368866705408",
    文章: "https://zhuanlan.zhihu.com/p/597709030"
}

export const Placeholder_By_Task_Type: { [key: string]: string } = {
    [ConstTaskConfig.Const_Task_Type_用户提问过的所有问题]: placeholderDemo.用户相关,
    [ConstTaskConfig.Const_Task_Type_用户的所有回答]: placeholderDemo.用户相关,
    [ConstTaskConfig.Const_Task_Type_用户发布的所有文章]: placeholderDemo.用户相关,
    [ConstTaskConfig.Const_Task_Type_用户发布的所有想法]: placeholderDemo.用户相关,
    [ConstTaskConfig.Const_Task_Type_用户赞同过的所有回答]: placeholderDemo.用户相关,
    [ConstTaskConfig.Const_Task_Type_用户赞同过的所有文章]: placeholderDemo.用户相关,
    [ConstTaskConfig.Const_Task_Type_用户关注过的所有问题]: placeholderDemo.用户相关,
    [ConstTaskConfig.Const_Task_Type_问题]: placeholderDemo.问题,
    [ConstTaskConfig.Const_Task_Type_回答]: placeholderDemo.回答,
    [ConstTaskConfig.Const_Task_Type_想法]: placeholderDemo.想法,
    [ConstTaskConfig.Const_Task_Type_话题]: placeholderDemo.话题,
    [ConstTaskConfig.Const_Task_Type_收藏夹]: placeholderDemo.收藏夹,
    [ConstTaskConfig.Const_Task_Type_专栏]: placeholderDemo.专栏,
    [ConstTaskConfig.Const_Task_Type_文章]: placeholderDemo.文章,
}

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


export const CONST_Task_Item_Width = {
    '任务类型': 6,
    '待抓取url': 6,
    '任务id': 5,
    '跳过抓取': 5,
    '操作': 5,
}

export const CONST_Order_Item_Width = {
    '排序指标': 6,
    '规则': 6,
    '操作': 5,
}