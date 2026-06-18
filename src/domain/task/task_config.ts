import * as ConstTaskConfig from '~/src/constant/task_config'
import * as LegacyTaskConfig from '~/src/type/task_config'

export type TaskType = LegacyTaskConfig.Type_Task_Type
export type GenerateMode = LegacyTaskConfig.Type_Generate_Type
export type ImageQuality = LegacyTaskConfig.Type_Image_Quilty
export type OutputFormat = 'html' | 'epub'

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

export const taskTypeList: TaskType[] = [
  ConstTaskConfig.Const_Task_Type_用户提问过的所有问题,
  ConstTaskConfig.Const_Task_Type_用户的所有回答,
  ConstTaskConfig.Const_Task_Type_用户发布的所有文章,
  ConstTaskConfig.Const_Task_Type_用户发布的所有想法,
  ConstTaskConfig.Const_Task_Type_用户赞同过的所有回答,
  ConstTaskConfig.Const_Task_Type_用户赞同过的所有文章,
  ConstTaskConfig.Const_Task_Type_用户关注过的所有问题,
  ConstTaskConfig.Const_Task_Type_销号用户的所有回答,
  ConstTaskConfig.Const_Task_Type_话题,
  ConstTaskConfig.Const_Task_Type_收藏夹,
  ConstTaskConfig.Const_Task_Type_专栏,
  ConstTaskConfig.Const_Task_Type_文章,
  ConstTaskConfig.Const_Task_Type_问题,
  ConstTaskConfig.Const_Task_Type_回答,
  ConstTaskConfig.Const_Task_Type_想法,
]

export const generateModeList: GenerateMode[] = [
  ConstTaskConfig.Const_Generate_Type_独立输出电子书,
  ConstTaskConfig.Const_Generate_Type_合并输出电子书_按任务拆分章节,
  ConstTaskConfig.Const_Generate_Type_合并输出电子书_内容打乱重排,
]

export const imageQualityList: ImageQuality[] = [
  ConstTaskConfig.Const_Image_Quilty_高清,
  ConstTaskConfig.Const_Image_Quilty_原图,
  ConstTaskConfig.Const_Image_Quilty_无图,
]

export const outputFormatList: OutputFormat[] = ['html', 'epub']

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
      outputFormats: ['html', 'epub'],
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
      outputFormats: ['html', 'epub'],
      comment: config.generateConfig.comment,
    },
  }
}
