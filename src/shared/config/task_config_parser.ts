import fs from 'fs'
import path from 'path'
import json5 from 'json5'
import * as ConstTaskConfig from '~/src/constant/task_config.js'
import {
  createDefaultTaskConfig,
  generateModeList,
  imageQualityList,
  OutputFormat,
  outputFormatList,
  TaskConfig,
  TaskItem,
  taskTypeList,
} from '~/src/domain/task/task_config.js'
import * as LegacyTaskConfig from '~/src/type/task_config.js'

type UnknownRecord = {
  [key: string]: unknown
}

const orderByList: LegacyTaskConfig.Type_Order_By[] = [
  ConstTaskConfig.Const_Order_By_Asc,
  ConstTaskConfig.Const_Order_By_Desc,
]

const orderWithList: LegacyTaskConfig.Type_Order_With[] = [
  ConstTaskConfig.Const_Order_With_记录加入时间_首次值,
  ConstTaskConfig.Const_Order_With_记录加入时间_末次值,
  ConstTaskConfig.Const_Order_With_不排序,
  ConstTaskConfig.Const_Order_With_创建时间,
  ConstTaskConfig.Const_Order_With_更新时间,
  ConstTaskConfig.Const_Order_With_赞同数,
  ConstTaskConfig.Const_Order_With_评论数,
]

/**
 * 确保配置文件存在。不存在时写入新 schema 的默认配置。
 */
export function ensureTaskConfigFile(configPath: string): void {
  if (fs.existsSync(configPath)) {
    return
  }
  ensureDirectory(path.dirname(configPath))
  fs.writeFileSync(configPath, JSON.stringify(createDefaultTaskConfig(), null, 2))
}

/**
 * 读取并校验新 schema 任务配置。
 */
export function readTaskConfig(configPath: string): TaskConfig {
  ensureTaskConfigFile(configPath)
  const content = fs.readFileSync(configPath).toString()
  const rawConfig = json5.parse(content) as unknown
  return parseTaskConfig(rawConfig)
}

/**
 * 写入新 schema 任务配置。
 */
export function writeTaskConfig(configPath: string, config: TaskConfig): void {
  ensureDirectory(path.dirname(configPath))
  fs.writeFileSync(configPath, JSON.stringify(parseTaskConfig(config), null, 2))
}

export function parseTaskConfig(rawConfig: unknown): TaskConfig {
  const root = expectRecord(rawConfig, 'config')
  if ('fetchTaskList' in root || 'generateConfig' in root || 'requestConfig' in root) {
    throw new Error('检测到旧 config schema。新 CLI 只接受 request/tasks/generate 配置。')
  }

  const request = expectRecord(root.request, 'config.request')
  const generate = expectRecord(root.generate, 'config.generate')
  const rawTaskList = expectArray(root.tasks, 'config.tasks')
  const defaultConfig = createDefaultTaskConfig()

  return {
    request: {
      ua: expectString(request.ua, 'config.request.ua'),
      cookie: expectString(request.cookie, 'config.request.cookie'),
    },
    tasks: rawTaskList.map((task, index) => parseTaskItem(task, `config.tasks[${index}]`)),
    generate: {
      title: expectString(generate.title, 'config.generate.title'),
      mode: parseGenerateMode(generate.mode, 'config.generate.mode'),
      imageQuality: parseImageQuality(generate.imageQuality, 'config.generate.imageQuality'),
      maxItemsPerBook: expectPositiveInteger(generate.maxItemsPerBook, 'config.generate.maxItemsPerBook'),
      orderBy: parseOrderByList(generate.orderBy ?? defaultConfig.generate.orderBy, 'config.generate.orderBy'),
      outputFormats: parseOutputFormats(
        generate.outputFormats ?? defaultConfig.generate.outputFormats,
        'config.generate.outputFormats',
      ),
      comment: expectOptionalString(generate.comment, 'config.generate.comment') ?? '',
    },
  }
}

function parseTaskItem(rawTask: unknown, pathLabel: string): TaskItem {
  const task = expectRecord(rawTask, pathLabel)
  const type = expectString(task.type, `${pathLabel}.type`)
  if (taskTypeList.includes(type as TaskItem['type']) === false) {
    throw new Error(`${pathLabel}.type 不支持: ${type}`)
  }

  return {
    type: type as TaskItem['type'],
    id: expectString(task.id, `${pathLabel}.id`),
    rawInputText: expectOptionalString(task.rawInputText, `${pathLabel}.rawInputText`) ?? '',
    comment: expectOptionalString(task.comment, `${pathLabel}.comment`) ?? '',
    skipFetch: expectOptionalBoolean(task.skipFetch, `${pathLabel}.skipFetch`) ?? false,
  }
}

function parseGenerateMode(rawMode: unknown, pathLabel: string): TaskConfig['generate']['mode'] {
  const mode = expectString(rawMode, pathLabel)
  if (generateModeList.includes(mode as TaskConfig['generate']['mode']) === false) {
    throw new Error(`${pathLabel} 不支持: ${mode}`)
  }
  return mode as TaskConfig['generate']['mode']
}

function parseImageQuality(rawQuality: unknown, pathLabel: string): TaskConfig['generate']['imageQuality'] {
  const quality = expectString(rawQuality, pathLabel)
  if (imageQualityList.includes(quality as TaskConfig['generate']['imageQuality']) === false) {
    throw new Error(`${pathLabel} 不支持: ${quality}`)
  }
  return quality as TaskConfig['generate']['imageQuality']
}

function parseOrderByList(rawList: unknown, pathLabel: string): LegacyTaskConfig.Type_Order_By_Config_List {
  return expectArray(rawList, pathLabel).map((rawItem, index) => {
    const item = expectRecord(rawItem, `${pathLabel}[${index}]`)
    const orderBy = expectString(item.orderBy, `${pathLabel}[${index}].orderBy`)
    const orderWith = expectString(item.orderWith, `${pathLabel}[${index}].orderWith`)
    if (orderByList.includes(orderBy as LegacyTaskConfig.Type_Order_By) === false) {
      throw new Error(`${pathLabel}[${index}].orderBy 不支持: ${orderBy}`)
    }
    if (orderWithList.includes(orderWith as LegacyTaskConfig.Type_Order_With) === false) {
      throw new Error(`${pathLabel}[${index}].orderWith 不支持: ${orderWith}`)
    }
    return {
      orderBy: orderBy as LegacyTaskConfig.Type_Order_By,
      orderWith: orderWith as LegacyTaskConfig.Type_Order_With,
    }
  })
}

function parseOutputFormats(rawList: unknown, pathLabel: string): OutputFormat[] {
  const recordList = expectArray(rawList, pathLabel)
  if (recordList.length === 0) {
    throw new Error(`${pathLabel} 至少需要一个输出格式`)
  }
  recordList.forEach((rawFormat, index) => {
    const format = expectString(rawFormat, `${pathLabel}[${index}]`)
    if (outputFormatList.includes(format as OutputFormat) === false) {
      throw new Error(`${pathLabel}[${index}] 不支持: ${format}`)
    }
  })
  // 问题 9 起三种格式为固定产物；旧配置中的子集仅用于兼容读取。
  return [...outputFormatList]
}

function expectRecord(value: unknown, pathLabel: string): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${pathLabel} 必须是对象`)
  }
  return value as UnknownRecord
}

function expectArray(value: unknown, pathLabel: string): unknown[] {
  if (Array.isArray(value) === false) {
    throw new Error(`${pathLabel} 必须是数组`)
  }
  return value
}

function expectString(value: unknown, pathLabel: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${pathLabel} 必须是字符串`)
  }
  return value
}

function expectOptionalString(value: unknown, pathLabel: string): string | undefined {
  if (value === undefined) {
    return undefined
  }
  return expectString(value, pathLabel)
}

function expectOptionalBoolean(value: unknown, pathLabel: string): boolean | undefined {
  if (value === undefined) {
    return undefined
  }
  if (typeof value !== 'boolean') {
    throw new Error(`${pathLabel} 必须是布尔值`)
  }
  return value
}

function expectPositiveInteger(value: unknown, pathLabel: string): number {
  if (typeof value !== 'number' || Number.isInteger(value) === false || value <= 0) {
    throw new Error(`${pathLabel} 必须是正整数`)
  }
  return value
}

function ensureDirectory(directoryPath: string): void {
  if (fs.existsSync(directoryPath)) {
    return
  }
  const parentPath = path.dirname(directoryPath)
  if (parentPath !== directoryPath) {
    ensureDirectory(parentPath)
  }
  fs.mkdirSync(directoryPath)
}
