/**
 * 集中提供前端需要的工具函数
 */
import TypeTaskConfig from '~/src/type/namespace/task_config'
import ConstTaskConfig from '~/src/type/namespace/task_config_const'
import AutorApi from '~/src/api/author'
import TopicApi from '~/src/api/topic'
import CollectionApi from '~/src/api/collection'
import ColumnApi from '~/src/api/column'

export async function asyncGetTaskDefaultTitle(taskType: TypeTaskConfig.TaskType, taskId: string) {
    let bookTitle = ''
    switch (taskType) {
        case ConstTaskConfig.CONST_Task_Type_问题:
            bookTitle = `问题_${taskId}`
            break
        case ConstTaskConfig.CONST_Task_Type_回答:
            bookTitle = `回答_${taskId}`
            break
        case ConstTaskConfig.CONST_Task_Type_想法:
            bookTitle = `想法_${taskId}`
            break
        case ConstTaskConfig.CONST_Task_Type_文章:
            bookTitle = `文章_${taskId}`
            break
        case ConstTaskConfig.CONST_Task_Type_用户提问过的所有问题:
            {
                let info = await AutorApi.asyncGetAutherInfo(taskId)
                let userName = info?.name || taskId
                bookTitle = `${userName}(${taskId})的知乎提问合集`
            }
            break
        case ConstTaskConfig.CONST_Task_Type_用户的所有回答:
            {
                let info = await AutorApi.asyncGetAutherInfo(taskId)
                let userName = info?.name || taskId
                bookTitle = `${userName}(${taskId})的知乎回答合集`
            }
            break
        case ConstTaskConfig.CONST_Task_Type_用户发布的所有文章:
            {
                let info = await AutorApi.asyncGetAutherInfo(taskId)
                let userName = info?.name || taskId
                bookTitle = `${userName}(${taskId})的知乎文章合集`
            }
            break
        case ConstTaskConfig.CONST_Task_Type_销号用户的所有回答:
            {
                let info = await AutorApi.asyncGetBlockAccountAutherInfo(taskId)
                let userName = info?.name || taskId
                bookTitle = `${userName}(${taskId})的知乎回答合集`
            }
            break
        case ConstTaskConfig.CONST_Task_Type_用户发布的所有想法:
            {
                let info = await AutorApi.asyncGetAutherInfo(taskId)
                let userName = info?.name || taskId
                bookTitle = `${userName}(${taskId})发布过的想法合集`
            }
            break
        case ConstTaskConfig.CONST_Task_Type_用户赞同过的所有回答:
            {
                let info = await AutorApi.asyncGetAutherInfo(taskId)
                let userName = info?.name || taskId
                bookTitle = `${userName}(${taskId})赞同过的回答合集`
            }
            break
        case ConstTaskConfig.CONST_Task_Type_用户赞同过的所有文章:
            {
                let info = await AutorApi.asyncGetAutherInfo(taskId)
                let userName = info?.name || taskId
                bookTitle = `${userName}(${taskId})赞同过的文章合集`
            }
            break
        case ConstTaskConfig.CONST_Task_Type_用户关注过的所有问题:
            {
                let info = await AutorApi.asyncGetAutherInfo(taskId)
                let userName = info?.name || taskId
                bookTitle = `${userName}(${taskId})关注过的问题合集`
            }
            break
        case ConstTaskConfig.CONST_Task_Type_话题:
            {
                let info = await TopicApi.asyncGetTopicInfo(taskId)
                let name = info?.name || taskId
                bookTitle = `话题_${name}(${taskId})下精选回答合集`
            }
            break
        case ConstTaskConfig.CONST_Task_Type_收藏夹:
            {
                let info = await CollectionApi.asyncGetCollectionInfo(taskId)
                let name = info?.collection?.title || taskId
                bookTitle = `收藏夹_${name}(${taskId})回答合集`
            }
            break
        case ConstTaskConfig.CONST_Task_Type_专栏:
            {
                let info = await ColumnApi.asyncGetColumnInfo(taskId)
                let name = info?.title || taskId
                bookTitle = `知乎专栏_${name}(${taskId})文章合集`
            }
            break
        default:
            bookTitle = `任务${taskType}_${taskId}`
    }

    return bookTitle
}