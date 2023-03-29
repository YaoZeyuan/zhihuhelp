import { proxy } from 'valtio'
import * as TypeTaskConfig from "~/src/resource/type/task_config"
import * as ConstTaskConfig from "~/src/resource/const/task_config"
import Util from '../../../library/util'

type Type_Status = {
    /**
     * 任务类别
     */
    type: TypeTaskConfig.Type_Task_Type,
    /**
     * 计算属性-匹配到的id
     */
    id: string,
    /**
     * 原始输入
    */
    rawInputText: string,
    /**
     * 是否跳过抓取
     */
    skipFetch: boolean,
}

export const Const_Default_Task_Item: Type_Status = {
    type: ConstTaskConfig.Const_Task_Type_用户的所有回答,
    id: "",
    rawInputText: "",
    skipFetch: false,
}

export function createStore(value: Type_Status = {
    ...Const_Default_Task_Item
}) {
    const store = proxy<Type_Status>({
        type: value.type,
        get id() {
            // 根据type和rawInputText自动计算id
            const content = this.rawInputText
            const taskType = this.type

            const id = Util.matchId({
                taskType,
                "rawInputText": content
            })
            return id
        },
        rawInputText: value.rawInputText,
        skipFetch: value.skipFetch,
    })
    return store
} 