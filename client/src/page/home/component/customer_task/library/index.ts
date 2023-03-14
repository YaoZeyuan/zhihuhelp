import * as TypeTaskConfig from "~/src/resource/type/task_config"
import * as ConstTaskConfig from "~/src/resource/const/task_config"
import { Type_Status } from '../state/index'

export type Type_Form_Config = {
    "book-title": "知乎助手生成的电子书",
    "task-item-list": [
        {
            "type": "author-answer",
            "id": "xie-lu-tian-e",
            "rawInputText": "https://www.zhihu.com/people/xie-lu-tian-e/answers",
            skipFetch: boolean
        }
    ],
    "order-item-list": [
        {
            "orderBy": "asc",
            "orderWith": "createAt"
        }
    ],
    "image-quilty": "hd",
    "max-item-in-book": 10000,
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
        for (let taskItem of param["task-item-list"]) {

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
            "bookTitle": param["book-title"],
            imageQuilty: param["image-quilty"],
            maxItemInBook: param["max-item-in-book"],
            "comment": param.comment,
            "orderByList": [],
            generateType: "merge_by_all"
        }
        // 排序配置
        for (let orderItem of param["order-item-list"]) {
            let orderByItem: TypeTaskConfig.Type_Order_By_Config = {
                orderBy: orderItem.orderBy,
                orderWith: orderItem.orderWith
            }
            config.generateConfig.orderByList.push(orderByItem)
        }

        return config
    }

    static generateStatus(config: TypeTaskConfig.Type_Task_Config): Type_Status {
        let status: Type_Status = {
            status: {
                forceUpdate: 0,
            },
            "fetchTaskList": [],
            "generateConfig": {
                "bookTitle": "",
                "comment": "",
                "generateType": "single",
                "imageQuilty": "hd",
                "maxItemInBook": 10000,
                "orderByList": []
            }
        }

        // 抓取任务
        status.fetchTaskList = []
        for (let taskItem of config.fetchTaskList) {
            let fetchTaskItem: Type_Status['fetchTaskList'][number] = {
                "comment": "",
                "id": taskItem.id,
                "rawInputText": taskItem.rawInputText,
                "skipFetch": taskItem.skipFetch,
                "type": taskItem.type
            }
            status.fetchTaskList.push(fetchTaskItem)
        }
        // 任务执行配置
        status.generateConfig = {
            "bookTitle": config.generateConfig.bookTitle,
            imageQuilty: config.generateConfig.imageQuilty,
            maxItemInBook: config.generateConfig.maxItemInBook,
            "comment": config.generateConfig.comment,
            "orderByList": [],
            generateType: config.generateConfig.generateType
        }
        // 排序配置
        for (let orderItem of config.generateConfig.orderByList) {
            let orderByItem: Type_Status['generateConfig']['orderByList'][number] = {
                orderBy: orderItem.orderBy,
                orderWith: orderItem.orderWith
            }
            status.generateConfig.orderByList.push(orderByItem)
        }

        return status
    }
}