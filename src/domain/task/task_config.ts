import * as ConstTaskConfig from '~/src/constant/task_config.js'
import * as LegacyTaskConfig from '~/src/type/task_config.js'
import * as TaskSchema from '~/src/shared/config/task_schema.js'

export type TaskType = LegacyTaskConfig.Type_Task_Type
export type GenerateMode = LegacyTaskConfig.Type_Generate_Type
export type ImageQuality = LegacyTaskConfig.Type_Image_Quilty
export type OutputFormat = TaskSchema.OutputFormat

export type TaskItem = {
  type: TaskType
  id: string
  rawInputText: string
  comment: string
  skipFetch: boolean
}

export type TaskConfig = {
  request: {
    ua: string
    cookie: string
  }
  tasks: TaskItem[]
  generate: {
    title: string
    mode: GenerateMode
    imageQuality: ImageQuality
    maxItemsPerBook: number
    orderBy: LegacyTaskConfig.Type_Order_By_Config_List
    outputFormats: OutputFormat[]
    comment: string
  }
}

export const taskTypeList: TaskType[] = [...TaskSchema.taskTypeList]

export const generateModeList: GenerateMode[] = [...TaskSchema.generateModeList]

export const imageQualityList: ImageQuality[] = [...TaskSchema.imageQualityList]

export const outputFormatList: OutputFormat[] = [...TaskSchema.outputFormatList]

export function createDefaultTaskConfig(): TaskConfig {
  return {
    request: {
      ua: ConstTaskConfig.Const_Default_Ua,
      cookie: ConstTaskConfig.Const_Default_Cookie,
    },
    tasks: [],
    generate: {
      title: '',
      mode: ConstTaskConfig.Const_Generate_Type_独立输出电子书,
      imageQuality: ConstTaskConfig.Const_Image_Quilty_原图,
      maxItemsPerBook: 10000,
      orderBy: [],
      outputFormats: [...outputFormatList],
      comment: '',
    },
  }
}

export function toLegacyTaskConfig(config: TaskConfig): LegacyTaskConfig.Type_Task_Config {
  return {
    fetchTaskList: config.tasks.map((task) => ({
      type: task.type,
      id: task.id,
      rawInputText: task.rawInputText,
      comment: task.comment,
      skipFetch: task.skipFetch,
    })),
    generateConfig: {
      imageQuilty: config.generate.imageQuality,
      bookTitle: config.generate.title,
      comment: config.generate.comment,
      maxItemInBook: config.generate.maxItemsPerBook,
      orderByList: config.generate.orderBy,
      generateType: config.generate.mode,
      outputFormats: [...outputFormatList],
    },
    requestConfig: {
      ua: config.request.ua,
      cookie: config.request.cookie,
    },
  }
}

export function fromLegacyTaskConfig(config: LegacyTaskConfig.Type_Task_Config): TaskConfig {
  return {
    request: {
      ua: config.requestConfig.ua,
      cookie: config.requestConfig.cookie,
    },
    tasks: config.fetchTaskList.map((task) => ({
      type: task.type,
      id: task.id,
      rawInputText: task.rawInputText,
      comment: task.comment,
      skipFetch: task.skipFetch,
    })),
    generate: {
      title: config.generateConfig.bookTitle,
      mode: config.generateConfig.generateType,
      imageQuality: config.generateConfig.imageQuilty,
      maxItemsPerBook: config.generateConfig.maxItemInBook,
      orderBy: config.generateConfig.orderByList,
      outputFormats: [...outputFormatList],
      comment: config.generateConfig.comment,
    },
  }
}
