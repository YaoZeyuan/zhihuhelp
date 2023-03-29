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


const Translate_Order_With = {
    [ConstTaskConfig.Const_Order_With_创建时间]: '创建时间',
    [ConstTaskConfig.Const_Order_With_更新时间]: '更新时间',
    [ConstTaskConfig.Const_Order_With_记录加入时间_末次值]: '记录加入时间_末次值',
    [ConstTaskConfig.Const_Order_With_记录加入时间_首次值]: '记录加入时间_首次值',
    [ConstTaskConfig.Const_Order_With_评论数]: '评论数',
    [ConstTaskConfig.Const_Order_With_赞同数]: '赞同数',
}

export const Translate_Order_By_Type = {
    [ConstTaskConfig.Const_Order_With_创建时间]: {
        [ConstTaskConfig.Const_Order_By_Asc]: '最早的记录在最前',
        [ConstTaskConfig.Const_Order_By_Desc]: '最晚的记录在最前',
    },
    [ConstTaskConfig.Const_Order_With_更新时间]: {
        [ConstTaskConfig.Const_Order_By_Asc]: '最早的记录在最前',
        [ConstTaskConfig.Const_Order_By_Desc]: '最晚的记录在最前',
    },
    [ConstTaskConfig.Const_Order_With_记录加入时间_末次值]: {
        [ConstTaskConfig.Const_Order_By_Asc]: '最早的记录在最前',
        [ConstTaskConfig.Const_Order_By_Desc]: '最晚的记录在最前',
    },
    [ConstTaskConfig.Const_Order_With_记录加入时间_首次值]: {
        [ConstTaskConfig.Const_Order_By_Asc]: '最早的记录在最前',
        [ConstTaskConfig.Const_Order_By_Desc]: '最晚的记录在最前',
    },
    [ConstTaskConfig.Const_Order_With_评论数]: {
        [ConstTaskConfig.Const_Order_By_Asc]: '评论最少的在最前',
        [ConstTaskConfig.Const_Order_By_Desc]: '评论最多的在最前',
    },
    [ConstTaskConfig.Const_Order_With_赞同数]: {
        [ConstTaskConfig.Const_Order_By_Asc]: '赞同最少的在最前',
        [ConstTaskConfig.Const_Order_By_Desc]: '赞同最多的在最前',
    },
}

let taskTypeList = []
for (let key of (Object.keys(Translate_Task_Type) as (keyof typeof Translate_Task_Type)[])) {
    let option = {
        label: Translate_Task_Type[key],
        value: key,
    }
    taskTypeList.push(option)
}

let orderWithList = []
for (let key of (Object.keys(Translate_Order_With) as (keyof typeof Translate_Order_With)[])) {
    let option = {
        label: Translate_Order_With[key],
        value: key,
    }
    orderWithList.push(option)
}

export const Const_Task_Type_Option_List = taskTypeList
export const Const_Default_Task_Type = ConstTaskConfig.Const_Task_Type_用户的所有回答
export const Const_Default_Fetch_Task_Item: TypeTaskConfig.Type_Fetch_Task_Config_Item = {
    type: Const_Default_Task_Type,
    "rawInputText": "https://www.zhihu.com/people/xie-lu-tian-e/answers",
    "id": "xie-lu-tian-e",
    "comment": "",
    "skipFetch": false,
}

export const Const_Order_With_Option_List = orderWithList
export const Const_Default_Order_With = ConstTaskConfig.Const_Order_With_创建时间
export const Const_Default_Order_Item: TypeTaskConfig.Type_Order_By_Config = {
    orderWith: Const_Default_Order_With,
    orderBy: ConstTaskConfig.Const_Order_By_Asc,
}

const placeholderDemo = {
    用户提问过的所有问题: 'https://www.zhihu.com/people/xie-lu-tian-e/asks',
    用户的所有回答: 'https://www.zhihu.com/people/xie-lu-tian-e/answers',
    用户发布的所有文章: 'https://www.zhihu.com/people/xie-lu-tian-e/posts',
    用户发布的所有想法: 'https://www.zhihu.com/people/xie-lu-tian-e/pins',
    用户赞同过的所有回答: 'https://www.zhihu.com/people/xie-lu-tian-e/agree/answers',
    用户赞同过的所有文章: 'https://www.zhihu.com/people/xie-lu-tian-e/agree/posts',
    用户关注过的所有问题: 'https://www.zhihu.com/people/xie-lu-tian-e/following/questions',
    问题: "https://www.zhihu.com/question/23933304",
    回答: "https://www.zhihu.com/question/23933304/answer/2889800041",
    想法: "https://www.zhihu.com/pin/1610559069437259776",
    话题: "https://www.zhihu.com/topic/19553176",
    收藏夹: "https://www.zhihu.com/collection/233649233",
    专栏: "https://www.zhihu.com/column/c_1509142397108228096",
    文章: "https://zhuanlan.zhihu.com/p/559569255"
}

export const Placeholder_By_Task_Type: { [key: string]: string } = {
    [ConstTaskConfig.Const_Task_Type_用户提问过的所有问题]: placeholderDemo.用户提问过的所有问题,
    [ConstTaskConfig.Const_Task_Type_用户的所有回答]: placeholderDemo.用户的所有回答,
    [ConstTaskConfig.Const_Task_Type_用户发布的所有文章]: placeholderDemo.用户发布的所有文章,
    [ConstTaskConfig.Const_Task_Type_用户发布的所有想法]: placeholderDemo.用户发布的所有想法,
    [ConstTaskConfig.Const_Task_Type_用户赞同过的所有回答]: placeholderDemo.用户赞同过的所有回答,
    [ConstTaskConfig.Const_Task_Type_用户赞同过的所有文章]: placeholderDemo.用户赞同过的所有文章,
    [ConstTaskConfig.Const_Task_Type_用户关注过的所有问题]: placeholderDemo.用户关注过的所有问题,
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
    '任务类型': 5,
    '待抓取url': 10,
    '任务id': 4,
    '操作': 2,
}

export const CONST_Order_Item_Width = {
    '排序指标': 3,
    '规则': 17,
    '操作': 2,
}