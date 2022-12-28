import { proxy } from 'valtio'

import * as Consts_Task_Config from '~/src/resource/const/task_config'
import * as Types_Task_Config from '~/src/resource/type/task_config'
import * as Consts from '../resource/const/index'
import * as Types from '../resource/type/index'


type Type_Status = {
    forceUpdate: number,
    taskList: Types_Task_Config.Type_Task_Config[],
}

export const store = proxy<Type_Status>({
    forceUpdate: 0,
    // 一次只能创建一个任务
    taskList: [] as Types_Task_Config.Type_Task_Config[],
})