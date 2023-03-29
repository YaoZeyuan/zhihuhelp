import * as Types from '../type'
import * as TaskConfig_Consts from '../../../../../../resource/const/task_config'

export const Current_Select_Type_专栏 = TaskConfig_Consts.Const_Task_Type_专栏
export const Current_Select_Type_收藏夹 = TaskConfig_Consts.Const_Task_Type_收藏夹
export const Current_Select_Type_话题 = TaskConfig_Consts.Const_Task_Type_话题
export const Current_Select_Type_问题 = TaskConfig_Consts.Const_Task_Type_问题
export const Current_Select_Type_用户的所有回答 = TaskConfig_Consts.Const_Task_Type_用户的所有回答

export const Default_Status: Types.Status = {
    "baseInfo": {
        count: {
            "answer": 0,
            "article": 0,
            "pin": 0,
            "author": 0,
            "question": 0,
            "collection": 0,
            "column": 0,
            "topic": 0
        }
    },
    "currentSelect": {
        "id": "",
        "info": {
            total: 0,
            "pageNo": 0,
            "pageSize": 15,
            "recordList": [],
        },
        "type": Current_Select_Type_用户的所有回答
    },
    "forceUpdate": 0,
    "recordList": []
}
