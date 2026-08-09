/**
 * 集中提供前端需要的工具函数
 */
import type * as Type_Task_Config from '~/src/type/task_config.js'
import * as Const_Task_Config from '~/src/constant/task_config.js'
import AutorApi from '~/src/api/single/author.js'
import TopicApi from '~/src/api/single/topic.js'
import CollectionApi from '~/src/api/single/collection.js'
import ColumnApi from '~/src/api/single/column.js'
import { getCanonicalAuthorUrlToken, getStableAuthorId } from '~/src/domain/author/identity.js'
import type * as TypeAuthor from '~/src/type/zhihu/author.js'

function getAuthorTitleIdentity(
  info: TypeAuthor.Record | undefined,
  taskId: string,
  requireRequestedIdentityMatch = false,
): { userName: string; displayIdentifier: string } {
  const userName = info?.name || taskId
  const stableId = info === undefined ? '' : getStableAuthorId(info)
  const canonicalUrlToken = info === undefined ? '' : getCanonicalAuthorUrlToken(info)
  const canUseCanonicalIdentity =
    requireRequestedIdentityMatch === false || stableId === taskId || canonicalUrlToken === taskId

  return {
    userName,
    displayIdentifier: canUseCanonicalIdentity ? canonicalUrlToken || taskId : taskId,
  }
}

export async function asyncGetTaskDefaultTitle(taskType: Type_Task_Config.Type_Task_Type, taskId: string) {
  let bookTitle = ''
  switch (taskType) {
    case Const_Task_Config.Const_Task_Type_问题:
      bookTitle = `问题_${taskId}`
      break
    case Const_Task_Config.Const_Task_Type_回答:
      bookTitle = `回答_${taskId}`
      break
    case Const_Task_Config.Const_Task_Type_想法:
      bookTitle = `想法_${taskId}`
      break
    case Const_Task_Config.Const_Task_Type_文章:
      bookTitle = `文章_${taskId}`
      break
    case Const_Task_Config.Const_Task_Type_用户提问过的所有问题:
      {
        let info = await AutorApi.asyncGetAutherInfo(taskId)
        const { userName, displayIdentifier } = getAuthorTitleIdentity(info, taskId)
        bookTitle = `${userName}(${displayIdentifier})的知乎提问合集`
      }
      break
    case Const_Task_Config.Const_Task_Type_用户的所有回答:
      {
        let info = await AutorApi.asyncGetAutherInfo(taskId)
        const { userName, displayIdentifier } = getAuthorTitleIdentity(info, taskId)
        bookTitle = `${userName}(${displayIdentifier})的知乎回答合集`
      }
      break
    case Const_Task_Config.Const_Task_Type_用户发布的所有文章:
      {
        let info = await AutorApi.asyncGetAutherInfo(taskId)
        const { userName, displayIdentifier } = getAuthorTitleIdentity(info, taskId)
        bookTitle = `${userName}(${displayIdentifier})的知乎文章合集`
      }
      break
    case Const_Task_Config.Const_Task_Type_销号用户的所有回答:
      {
        let info = await AutorApi.asyncGetBlockAccountAutherInfo(taskId)
        const { userName, displayIdentifier } = getAuthorTitleIdentity(info, taskId, true)
        bookTitle = `${userName}(${displayIdentifier})的知乎回答合集`
      }
      break
    case Const_Task_Config.Const_Task_Type_用户发布的所有想法:
      {
        let info = await AutorApi.asyncGetAutherInfo(taskId)
        const { userName, displayIdentifier } = getAuthorTitleIdentity(info, taskId)
        bookTitle = `${userName}(${displayIdentifier})发布过的想法合集`
      }
      break
    case Const_Task_Config.Const_Task_Type_用户赞同过的所有回答:
      {
        let info = await AutorApi.asyncGetAutherInfo(taskId)
        const { userName, displayIdentifier } = getAuthorTitleIdentity(info, taskId)
        bookTitle = `${userName}(${displayIdentifier})赞同过的回答合集`
      }
      break
    case Const_Task_Config.Const_Task_Type_用户赞同过的所有文章:
      {
        let info = await AutorApi.asyncGetAutherInfo(taskId)
        const { userName, displayIdentifier } = getAuthorTitleIdentity(info, taskId)
        bookTitle = `${userName}(${displayIdentifier})赞同过的文章合集`
      }
      break
    case Const_Task_Config.Const_Task_Type_用户关注过的所有问题:
      {
        let info = await AutorApi.asyncGetAutherInfo(taskId)
        const { userName, displayIdentifier } = getAuthorTitleIdentity(info, taskId)
        bookTitle = `${userName}(${displayIdentifier})关注过的问题合集`
      }
      break
    case Const_Task_Config.Const_Task_Type_话题:
      {
        let info = await TopicApi.asyncGetTopicInfo(taskId)
        let name = info?.name || taskId
        bookTitle = `话题_${name}(${taskId})下精选回答合集`
      }
      break
    case Const_Task_Config.Const_Task_Type_收藏夹:
      {
        let info = await CollectionApi.asyncGetCollectionInfo(taskId)
        let name = info?.title || taskId
        bookTitle = `收藏夹_${name}(${taskId})回答合集`
      }
      break
    case Const_Task_Config.Const_Task_Type_专栏:
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
