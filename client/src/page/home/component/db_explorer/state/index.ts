import { proxy } from 'valtio'

import * as Consts_Task_Config from '~/src/resource/const/task_config'
import * as Types_Task_Config from '~/src/resource/type/task_config'
import * as Consts from '../resource/const/index'
import * as Types from '../resource/type/index'



/**
 * 创建store
 */
export function createStore() {
    const store = proxy<Types.Status>({
        ...Consts.Default_Status
    })
    return store
}