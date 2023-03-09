import * as TypeTaskConfig from "~/src/resource/type/task_config"
import * as ConstTaskConfig from "~/src/resource/const/task_config"

type Type_Form_Config = {
    "book-title": "知乎助手生成的电子书",
    "task-item-list": [
        {
            "type": "author-answer",
            "id": "xie-lu-tian-e",
            "rawInputText": "https://www.zhihu.com/people/xie-lu-tian-e/answers"
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
                "skipFetch": false,
                "type": taskItem.type
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
}