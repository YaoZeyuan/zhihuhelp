import * as TypeTaskConfig from '~/src/resource/type/task_config'
import * as ConstTaskConfig from '~/src/resource/const/task_config'
import { Type_FormValue } from '../state'

export type Type_Form_Config = Type_FormValue

function createRequiredOutputFormatList(): TypeTaskConfig.Type_Output_Format[] {
  return [...ConstTaskConfig.Const_Required_Output_Format_List]
}

export default class TaskConfigAdapter {
  static formToTaskConfig(param: Type_Form_Config): TypeTaskConfig.Type_Task_Config {
    const taskList: TypeTaskConfig.Type_Task_Config['tasks'] = []

    for (const taskItem of param.taskItemList) {
      const fetchTaskItem: TypeTaskConfig.Type_Task_Config['tasks'][number] = {
        comment: taskItem.comment ?? '',
        id: taskItem.id,
        rawInputText: taskItem.rawInputText,
        skipFetch: taskItem.skipFetch,
        type: taskItem.type,
      }
      if (fetchTaskItem.id === '') {
        continue
      }
      taskList.push(fetchTaskItem)
    }

    return {
      request: {
        ...ConstTaskConfig.Const_Default_Config.request,
      },
      tasks: taskList,
      generate: {
        title: param.bookTitle,
        mode: param.generateType,
        imageQuality: param.imageQuilty,
        maxItemsPerBook: param.maxItemInBook,
        comment: param.comment,
        orderBy: param.orderItemList.map((orderItem) => ({
          orderBy: orderItem.orderBy,
          orderWith: orderItem.orderWith,
        })),
        // The GUI intentionally has no format selector. Ignore stale or
        // manipulated form values and always persist the complete output set.
        outputFormats: createRequiredOutputFormatList(),
      },
    }
  }

  static taskConfigToForm(config: TypeTaskConfig.Type_Task_Config): Type_FormValue {
    return {
      taskItemList: config.tasks.map((taskItem) => ({
        comment: taskItem.comment ?? '',
        id: taskItem.id,
        rawInputText: taskItem.rawInputText,
        skipFetch: taskItem.skipFetch,
        type: taskItem.type,
      })),
      bookTitle: config.generate.title,
      imageQuilty: config.generate.imageQuality,
      maxItemInBook: config.generate.maxItemsPerBook,
      comment: config.generate.comment,
      orderItemList: config.generate.orderBy.map((orderItem) => ({
        orderBy: orderItem.orderBy,
        orderWith: orderItem.orderWith,
      })),
      generateType: config.generate.mode,
      // Older HTML-only/EPUB-only configs are normalized as soon as they are
      // loaded so the next save always writes all required formats.
      outputFormats: createRequiredOutputFormatList(),
    }
  }
}
