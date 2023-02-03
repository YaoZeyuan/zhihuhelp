import { proxy } from 'valtio'
import * as TypeTaskConfig from "~/src/resource/type/task_config"
import * as ConstTaskConfig from "~/src/resource/const/task_config"

type Type_Status = {
    /**
     * 任务类别
     */
    type: TypeTaskConfig.Type_Task_Type,
    /**
     * 排序字段
     */
    orderWith: TypeTaskConfig.Type_Order_With,
    /**
     * 排序顺序
     */
    orderBy: TypeTaskConfig.Type_Order_By,
    /**
     * 匹配到的id
     */
    id: string,
    /**
     * 原始输入
    */
    rawInputText: string,
    /**
     * 备注
     */
    comment: string,
}

export const store = proxy<Type_Status>({
    type: ConstTaskConfig.Const_Task_Type_用户的所有回答,
    orderWith: ConstTaskConfig.Const_Order_With_创建时间,
    orderBy: ConstTaskConfig.Const_Order_By_Asc,
    id: '',
    rawInputText: '',
    comment: '',
})