import * as TypeTaskConfig from "~/src/resource/type/task_config"
import * as ConstTaskConfig from "~/src/resource/const/task_config"
import querystring from 'query-string'

export default class Util {
    static createTaskItemFromRawInput({
        rawInputText
    }: {
        rawInputText: string
    }): TypeTaskConfig.Type_Fetch_Task_Config_Item {
        const normalizedInput = rawInputText.trim()
        const type = Util.detectTaskType({
            rawInputText: normalizedInput
        })
        const id = Util.matchId({
            taskType: type,
            rawInputText: normalizedInput
        })
        return {
            comment: '',
            id,
            rawInputText: normalizedInput,
            skipFetch: false,
            type,
        }
    }

    static createTaskItemListFromText({
        rawInputText
    }: {
        rawInputText: string
    }): TypeTaskConfig.Type_Fetch_Task_Config_Item[] {
        return rawInputText
            .split('\n')
            .map((item) => item.trim())
            .filter((item) => item !== '')
            .map((item) => Util.createTaskItemFromRawInput({
                rawInputText: item
            }))
    }

    static getTaskItemError(taskItem: Pick<TypeTaskConfig.Type_Fetch_Task_Config_Item, 'rawInputText' | 'id'>) {
        if ((taskItem.rawInputText ?? '').trim() === '') {
            return '请输入知乎链接'
        }
        if ((taskItem.id ?? '').trim() === '') {
            return '未解析到任务 id，请检查链接是否为支持的知乎内容地址'
        }
        return ''
    }

    static matchId({
        taskType,
        rawInputText
    }: {
        taskType: TypeTaskConfig.Type_Task_Type;
        rawInputText: string
    }
    ) {
        let parseResult = querystring.parseUrl(rawInputText)
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
            case ConstTaskConfig.Const_Task_Type_销号用户的所有回答:
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
                rawId = rawContent.includes('www.zhihu.com/column/')
                    ? rawContent.split('www.zhihu.com/column/')?.[1] ?? ''
                    : rawContent.split('zhuanlan.zhihu.com/')?.[1] ?? ''
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
    }

    /**
     * 根据输入, 推断任务类型
     * @param param0 
     * @returns 
     */
    static detectTaskType({
        rawInputText
    }: {
        rawInputText: string
    }
    ) {
        if (rawInputText.includes('/answer/')) {
            return ConstTaskConfig.Const_Task_Type_回答
        }
        if (rawInputText.includes('zhuanlan.zhihu.com/p/')) {
            return ConstTaskConfig.Const_Task_Type_文章
        }
        if (rawInputText.includes('www.zhihu.com/people/')) {
            return ConstTaskConfig.Const_Task_Type_用户的所有回答
        }
        if (rawInputText.includes('www.zhihu.com/question/')) {
            return ConstTaskConfig.Const_Task_Type_问题
        }
        if (rawInputText.includes('/pin/')) {
            return ConstTaskConfig.Const_Task_Type_想法
        }
        if (rawInputText.includes('/topic/')) {
            return ConstTaskConfig.Const_Task_Type_话题
        }
        if (rawInputText.includes('/collection/')) {
            return ConstTaskConfig.Const_Task_Type_收藏夹
        }
        if (rawInputText.includes('www.zhihu.com/column/') || rawInputText.includes('zhuanlan.zhihu.com/')) {
            return ConstTaskConfig.Const_Task_Type_专栏
        }

        return ConstTaskConfig.Const_Task_Type_用户的所有回答
    }
}
