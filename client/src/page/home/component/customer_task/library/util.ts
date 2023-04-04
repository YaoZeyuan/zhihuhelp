import * as TypeTaskConfig from "~/src/resource/type/task_config"
import * as ConstTaskConfig from "~/src/resource/const/task_config"
import querystring from 'query-string'

import { Type_Status, Type_FormValue } from '../state/index'

export type Type_Form_Config = {
    "bookTitle": "知乎助手生成的电子书",
    "taskItemList": {
        "type": TypeTaskConfig.Type_Item_Collection_Type | TypeTaskConfig.Type_Author_Collection_Type,
        "id": "xie-lu-tian-e" | string,
        "rawInputText": "https://www.zhihu.com/people/xie-lu-tian-e/answers" | string,
        skipFetch: boolean
    }[],
    "orderItemList": {
        "orderBy": "asc",
        "orderWith": "createAt"
    }[],
    "imageQuilty": "hd",
    "maxItemInBook": 10000,
    "comment": ""
}

export default class Util {
    /**
     * 将form配置转换为任务配置
     * @param param 
     * @returns 
     */
    static generateTaskConfig(param: Type_Form_Config): TypeTaskConfig.Type_Task_Config {

        let config = {
            ...ConstTaskConfig.Const_Default_Config
        }

        // 抓取任务
        config.fetchTaskList = []
        for (let taskItem of param["taskItemList"]) {

            let fetchTaskItem: TypeTaskConfig.Type_Task_Config['fetchTaskList'][number] = {
                "comment": "",
                "id": taskItem.id,
                "rawInputText": taskItem.rawInputText,
                "skipFetch": taskItem.skipFetch,
                "type": taskItem.type
            }
            if (fetchTaskItem.id === "") {
                // 略过id为空的任务
                continue
            }
            config.fetchTaskList.push(fetchTaskItem)
        }
        // 任务执行配置
        config.generateConfig = {
            "bookTitle": param["bookTitle"],
            imageQuilty: param["imageQuilty"],
            maxItemInBook: param["maxItemInBook"],
            "comment": param.comment,
            "orderByList": [],
            generateType: "merge_by_task"
        }
        // 排序配置
        for (let orderItem of param["orderItemList"]) {
            let orderByItem: TypeTaskConfig.Type_Order_By_Config = {
                orderBy: orderItem.orderBy,
                orderWith: orderItem.orderWith
            }
            config.generateConfig.orderByList.push(orderByItem)
        }

        return config
    }

    static generateStatus(config: TypeTaskConfig.Type_Task_Config): Type_FormValue {
        let formConfig: Type_FormValue = {
            "taskItemList": [],
            "bookTitle": "",
            "comment": "",
            "generateType": "single",
            "imageQuilty": "hd",
            "maxItemInBook": 10000,
            "orderItemList": []
        }

        // 抓取任务
        for (let taskItem of config.fetchTaskList) {
            let fetchTaskItem: Type_FormValue['taskItemList'][number] = {
                "comment": "",
                "id": taskItem.id,
                "rawInputText": taskItem.rawInputText,
                "skipFetch": taskItem.skipFetch,
                "type": taskItem.type
            }
            formConfig['taskItemList'].push(fetchTaskItem)
        }
        // 任务执行配置
        formConfig = {
            "taskItemList": formConfig['taskItemList'],
            "bookTitle": config.generateConfig.bookTitle,
            "imageQuilty": config.generateConfig.imageQuilty,
            "maxItemInBook": config.generateConfig.maxItemInBook,
            "comment": config.generateConfig.comment,
            "orderItemList": [],
            "generateType": config.generateConfig.generateType
        }
        // 排序配置
        for (let orderItem of config.generateConfig.orderByList) {
            let orderByItem: Type_FormValue["orderItemList"][number] = {
                orderBy: orderItem.orderBy,
                orderWith: orderItem.orderWith
            }
            formConfig['orderItemList'].push(orderByItem)
        }

        return formConfig
    }

    static matchId({
        taskType,
        rawInputText
    }: {
        taskType: TypeTaskConfig.Type_Task_Type;
        rawInputText: string
    }
    ) {
        let parseResult = querystring.parseUrl(rawInputText)
        let rawId = ''
        let id = ''
        let rawContent = parseResult.url
        switch (taskType) {
            case ConstTaskConfig.Const_Task_Type_用户提问过的所有问题:
            case ConstTaskConfig.Const_Task_Type_用户的所有回答:
            case ConstTaskConfig.Const_Task_Type_用户发布的所有文章:
            case ConstTaskConfig.Const_Task_Type_用户发布的所有想法:
            case ConstTaskConfig.Const_Task_Type_用户赞同过的所有回答:
            case ConstTaskConfig.Const_Task_Type_用户赞同过的所有文章:
            case ConstTaskConfig.Const_Task_Type_用户关注过的所有问题:
            case ConstTaskConfig.Const_Task_Type_销号用户的所有回答:
                // https://www.zhihu.com/people/404-Page-Not-found/activities
                rawId = rawContent.split('www.zhihu.com/people/')?.[1] ?? ''
                id = rawId.split('/')?.[0] ?? ''
                break
            case ConstTaskConfig.Const_Task_Type_问题:
                // https://www.zhihu.com/question/321773825
                rawId = rawContent.split('www.zhihu.com/question/')?.[1] ?? ''
                id = rawId.split('/')?.[0] ?? ''
                break
            case ConstTaskConfig.Const_Task_Type_回答:
                // https://www.zhihu.com/question/321773825/answer/664230128
                rawId = rawContent.split('/answer/')?.[1] ?? ''
                id = rawId.split('/')?.[0] ?? ''
                break
            case ConstTaskConfig.Const_Task_Type_想法:
                // https://www.zhihu.com/pin/1103720569358385152
                rawId = rawContent.split('/pin/')?.[1] ?? ''
                id = rawId.split('/')?.[0] ?? ''
                break
            case ConstTaskConfig.Const_Task_Type_话题:
                // https://www.zhihu.com/topic/19550517/hot
                rawId = rawContent.split('/topic/')?.[1] ?? ''
                id = rawId.split('/')?.[0] ?? ''
                break
            case ConstTaskConfig.Const_Task_Type_收藏夹:
                // https://www.zhihu.com/collection/63119009
                rawId = rawContent.split('/collection/')?.[1] ?? ''
                id = rawId.split('/')?.[0] ?? ''
                break
            case ConstTaskConfig.Const_Task_Type_专栏:
                // https://zhuanlan.zhihu.com/advancing-react
                rawId = rawContent.split('zhuanlan.zhihu.com/')?.[1] ?? ''
                id = rawId.split('/')?.[0] ?? ''
                break
            case ConstTaskConfig.Const_Task_Type_文章:
                // https://zhuanlan.zhihu.com/p/59993287
                rawId = rawContent.split('zhuanlan.zhihu.com/p/')?.[1] ?? ''
                id = rawId.split('/')?.[0] ?? ''
                break
            default:
                id = ''
        }
        return id
    }

    /**
     * 根据输入, 推断任务类型
     * @param param0 
     * @returns 
     */
    static detectTaskType({
        rawInputText
    }: {
        rawInputText: string
    }
    ) {
        if (rawInputText.includes('www.zhihu.com/people/')) {
            return ConstTaskConfig.Const_Task_Type_用户的所有回答
        }
        if (rawInputText.includes('www.zhihu.com/question/')) {
            return ConstTaskConfig.Const_Task_Type_问题
        }
        if (rawInputText.includes('/answer/')) {
            return ConstTaskConfig.Const_Task_Type_回答
        }
        if (rawInputText.includes('/pin/')) {
            return ConstTaskConfig.Const_Task_Type_想法
        }
        if (rawInputText.includes('/topic/')) {
            return ConstTaskConfig.Const_Task_Type_话题
        }
        if (rawInputText.includes('/collection/')) {
            return ConstTaskConfig.Const_Task_Type_收藏夹
        }
        if (rawInputText.includes('/zhuanlan.zhihu.com/p/')) {
            return ConstTaskConfig.Const_Task_Type_文章
        }
        if (rawInputText.includes('/zhuanlan.zhihu.com/')) {
            return ConstTaskConfig.Const_Task_Type_专栏
        }

        return ConstTaskConfig.Const_Task_Type_用户的所有回答
    }
}