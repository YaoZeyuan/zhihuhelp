import { proxy } from 'valtio'

import * as Consts_Task_Config from '~/src/resource/const/task_config'
import * as Types_Task_Config from '~/src/resource/type/task_config'
import * as Consts from '../resource/const/index'
import * as Types from '../resource/type/index'


export type Type_Status = {
    /**
     * 页面状态信息
     */
    forceUpdate: number,
    loading: {
        startTask: boolean,
        checkUpdate: boolean
        checkLogin: boolean
    }
    initComplete: boolean
}

export type Type_FormValue = {
    "taskItemList": Types_Task_Config.Type_Fetch_Task_Config_Item[]
    "imageQuilty": Types_Task_Config.Type_Image_Quilty // 图片质量
    "bookTitle": string // 书名
    comment: string // 备注
    "maxItemInBook": Types_Task_Config.Type_Max_Item_In_Book // 自动分卷: 单本电子书中最大回答/想法/文章数量
    "orderItemList": Types_Task_Config.Type_Order_By_Config_List
    "generateType": Types_Task_Config.Type_Generate_Type
}

export const Const_Default_FormValue: Type_FormValue = {
    "taskItemList": [],
    "imageQuilty": Consts_Task_Config.Const_Image_Quilty_高清,
    "bookTitle": "",
    "comment": "",
    "maxItemInBook": Consts_Task_Config.Const_Max_Question_Or_Article_In_Book,
    "orderItemList": [],
    "generateType": Consts_Task_Config.Const_Generate_Type_合并输出电子书_按任务拆分章节
}

/**
 * 创建store
 */
export function createStatusStore() {
    const store = proxy<Type_Status>({
        forceUpdate: 0,
        loading: {
            startTask: false,
            checkUpdate: false,
            checkLogin: false
        },
        initComplete: false
    })
    return store
}