import { proxy } from 'valtio'
import * as TypeTaskConfig from "~/src/resource/type/task_config"
import * as ConstTaskConfig from "~/src/resource/const/task_config"
import querystring from 'query-string'

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
}

export const Const_Default_Task_Item: Type_Status = {
    type: ConstTaskConfig.Const_Task_Type_用户的所有回答,
    id: "",
    rawInputText: "",
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

            let parseResult = querystring.parseUrl(content)
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
        },
        rawInputText: value.rawInputText,
    })
    return store
} 