import { proxy } from 'valtio'
import * as TypeTaskConfig from "~/src/resource/type/task_config"
import * as ConstTaskConfig from "~/src/resource/const/task_config"

type Type_Status = {
    /**
     * 排序字段
     */
    orderWith: TypeTaskConfig.Type_Order_With,
    /**
     * 排序顺序
     */
    orderBy: TypeTaskConfig.Type_Order_By,
}

export const Const_Default_Order_Item: Type_Status = {
    orderWith: ConstTaskConfig.Const_Order_With_创建时间,
    orderBy: ConstTaskConfig.Const_Order_By_Asc,
}

export function createStore(value = {
    ...Const_Default_Order_Item
}) {
    const store = proxy<Type_Status>({
        orderWith: value.orderWith,
        orderBy: value.orderBy,
    })
    return store
}

