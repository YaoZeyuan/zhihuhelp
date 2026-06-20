import fs from 'fs'
import path from 'path'
import semver from 'semver'
import PathConfig from '~/src/config/path'
import CommonConfig from '~/src/config/common'
import CommonUtil from '~/src/library/util/common'
import Base from '~/src/model/base'
import * as TaskConsts from '~/src/constant/task_config'

const Const_Export_Schema = 'zhihuhelp.cache-export.v1'
const Const_Max_Error_Count = 20

type SelectType =
  | typeof TaskConsts.Const_Task_Type_回答
  | typeof TaskConsts.Const_Task_Type_文章
  | typeof TaskConsts.Const_Task_Type_想法
  | typeof TaskConsts.Const_Task_Type_问题
  | typeof TaskConsts.Const_Task_Type_用户的所有回答
  | typeof TaskConsts.Const_Task_Type_专栏
  | typeof TaskConsts.Const_Task_Type_收藏夹
  | typeof TaskConsts.Const_Task_Type_话题

type ExportRequest = {
  type: SelectType
  parentId?: string
}

type PortableRecordKind = 'answer' | 'article' | 'pin'
type PortableIndexKind = 'author' | 'column' | 'collection' | 'topic' | 'question'
type PortableRelationKind = 'collection-record' | 'topic-answer'

type PortableDbInfo = {
  tableName: string
  primaryKey: Record<string, string | number>
  columns: Record<string, string | number>
}

type PortableRecord = {
  kind: PortableRecordKind
  id: string
  db: PortableDbInfo
  display: Record<string, unknown>
  raw: any
}

type PortableIndex = {
  kind: PortableIndexKind
  id: string
  db: PortableDbInfo
  display: Record<string, unknown>
  raw: any
}

type PortableRelation = {
  kind: PortableRelationKind
  id: string
  db: PortableDbInfo
  display: Record<string, unknown>
  raw?: any
}

type ExportSelection = {
  type: SelectType
  parentId?: string
  title: string
  contentKinds: string[]
  total: number
}

type ExportBuildResult = {
  selection: ExportSelection
  fileTitle: string
  records: PortableRecord[]
  indexes: PortableIndex[]
  relations: PortableRelation[]
}

type PortableJson = {
  schema: typeof Const_Export_Schema
  version: string
  exportVersion: string
  exportedAt: string
  app: {
    name: string
    version: string
  }
  selection: ExportSelection
  stats: {
    answer: number
    article: number
    pin: number
    indexes: number
    relations: number
  }
  records: PortableRecord[]
  indexes: PortableIndex[]
  relations: PortableRelation[]
}

type ImportCounter = {
  imported: number
  replaced: number
  skipped: number
  errors: string[]
}

function parseRawJson(rawJson: unknown): any {
  if (typeof rawJson !== 'string') {
    return rawJson ?? {}
  }
  try {
    return JSON.parse(rawJson)
  } catch {
    return {}
  }
}

function stringifyRawJson(raw: unknown) {
  return JSON.stringify(raw ?? {})
}

function toDisplayText(value: unknown, fallback = '') {
  if (typeof value !== 'string') {
    return fallback
  }
  const text = value.trim()
  return text === '' ? fallback : text
}

function stripHtml(content: unknown) {
  if (typeof content !== 'string') {
    return ''
  }
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function limitText(content: unknown, maxLength = 180) {
  const text = stripHtml(content)
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength)}...`
}

function dedupeById<T extends { kind: string; id: string }>(list: T[]) {
  const map = new Map<string, T>()
  for (const item of list) {
    map.set(`${item.kind}:${item.id}`, item)
  }
  return [...map.values()]
}

function getPackageName() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PathConfig.packageJsonUri, 'utf-8'))
    return String(packageJson?.name ?? 'zhihuhelp')
  } catch {
    return 'zhihuhelp'
  }
}

function ensureDir(dirPath: string) {
  if (fs.existsSync(dirPath) === false) {
    fs.mkdirSync(dirPath)
  }
}

function getUniqueFilePath(dirPath: string, rawFilename: string) {
  const safeFilename = CommonUtil.encodeFilename(rawFilename)
  let filePath = path.resolve(dirPath, `${safeFilename}.json`)
  if (fs.existsSync(filePath) === false) {
    return filePath
  }
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '')
  filePath = path.resolve(dirPath, `${safeFilename}_${timestamp}.json`)
  return filePath
}

function addImportError(counter: ImportCounter, message: string) {
  counter.skipped++
  if (counter.errors.length < Const_Max_Error_Count) {
    counter.errors.push(message)
  }
}

async function existsInTable(tableName: string, where: Record<string, string | number>) {
  const query = Base.db.select(Object.keys(where)).from(tableName)
  for (const [key, value] of Object.entries(where)) {
    query.where(key, '=', value)
  }
  const recordList = await query.limit(1).catch(() => [])
  return recordList.length > 0
}

async function replaceIntoWithCounter(
  counter: ImportCounter,
  tableName: string,
  primaryKey: Record<string, string | number>,
  data: Record<string, unknown>,
) {
  const existed = await existsInTable(tableName, primaryKey)
  await Base.replaceInto(data, tableName)
  if (existed) {
    counter.replaced++
  } else {
    counter.imported++
  }
}

export default class CacheJsonTransfer {
  static async exportDbRecordJson(request: ExportRequest) {
    const exportResult = await CacheJsonTransfer.buildExportResult(request)
    const version = CommonConfig.version
    const payload: PortableJson = {
      schema: Const_Export_Schema,
      version,
      exportVersion: version,
      exportedAt: new Date().toISOString(),
      app: {
        name: getPackageName(),
        version,
      },
      selection: exportResult.selection,
      stats: {
        answer: exportResult.records.filter((item) => item.kind === 'answer').length,
        article: exportResult.records.filter((item) => item.kind === 'article').length,
        pin: exportResult.records.filter((item) => item.kind === 'pin').length,
        indexes: exportResult.indexes.length,
        relations: exportResult.relations.length,
      },
      records: exportResult.records,
      indexes: exportResult.indexes,
      relations: exportResult.relations,
    }

    ensureDir(PathConfig.outputPath)
    const exportDir = path.resolve(PathConfig.outputPath, 'json')
    ensureDir(exportDir)
    const exportPath = getUniqueFilePath(exportDir, exportResult.fileTitle)
    fs.writeFileSync(exportPath, JSON.stringify(payload, null, 2), 'utf-8')
    return {
      status: 'success',
      exportPath,
      filePath: exportPath,
      selection: payload.selection,
      stats: payload.stats,
    }
  }

  static async importDbRecordJson(filePath: string) {
    const counter: ImportCounter = {
      imported: 0,
      replaced: 0,
      skipped: 0,
      errors: [],
    }
    let payload: PortableJson
    try {
      payload = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch {
      return {
        status: 'failure',
        filePath,
        message: 'JSON 文件读取失败或格式不正确。',
        ...counter,
      }
    }

    const versionCheck = CacheJsonTransfer.validateImportVersion(payload)
    if (versionCheck.status === 'failure') {
      return {
        status: 'failure',
        filePath,
        message: versionCheck.message,
        ...counter,
      }
    }

    for (const index of payload.indexes ?? []) {
      await CacheJsonTransfer.importIndex(index, counter)
    }
    for (const record of payload.records ?? []) {
      await CacheJsonTransfer.importRecord(record, counter)
    }
    for (const relation of payload.relations ?? []) {
      await CacheJsonTransfer.importRelation(relation, counter)
    }

    return {
      status: 'success',
      filePath,
      message: `导入完成：新增 ${counter.imported} 条，覆盖 ${counter.replaced} 条，跳过 ${counter.skipped} 条。`,
      ...counter,
    }
  }

  private static validateImportVersion(payload: any) {
    if (payload?.schema !== Const_Export_Schema) {
      return {
        status: 'failure' as const,
        message: 'JSON schema 不匹配，无法导入。',
      }
    }
    const exportVersion = String(payload?.exportVersion ?? payload?.version ?? '')
    const currentVersion = CommonConfig.version
    if (!semver.valid(exportVersion)) {
      return {
        status: 'failure' as const,
        message: 'JSON 缺少有效的 exportVersion/version 字段，无法导入。',
      }
    }
    if (!semver.valid(currentVersion)) {
      return {
        status: 'failure' as const,
        message: `当前知乎助手版本号 ${currentVersion} 不是有效 semver，无法判断兼容性。`,
      }
    }
    if (semver.gt(exportVersion, currentVersion)) {
      return {
        status: 'failure' as const,
        message: `该 JSON 由知乎助手 ${exportVersion} 导出，当前知乎助手版本为 ${currentVersion}，不支持导入。请下载 ${exportVersion} 或更高版本的知乎助手后再导入。`,
      }
    }
    return {
      status: 'success' as const,
    }
  }

  private static async buildExportResult(request: ExportRequest): Promise<ExportBuildResult> {
    switch (request.type) {
      case TaskConsts.Const_Task_Type_回答:
        return CacheJsonTransfer.buildAllAnswerExport()
      case TaskConsts.Const_Task_Type_文章:
        return CacheJsonTransfer.buildAllArticleExport()
      case TaskConsts.Const_Task_Type_想法:
        return CacheJsonTransfer.buildAllPinExport()
      case TaskConsts.Const_Task_Type_问题:
        return CacheJsonTransfer.buildQuestionExport(request.parentId)
      case TaskConsts.Const_Task_Type_用户的所有回答:
        return CacheJsonTransfer.buildAuthorExport(request.parentId)
      case TaskConsts.Const_Task_Type_专栏:
        return CacheJsonTransfer.buildColumnExport(request.parentId)
      case TaskConsts.Const_Task_Type_收藏夹:
        return CacheJsonTransfer.buildCollectionExport(request.parentId)
      case TaskConsts.Const_Task_Type_话题:
        return CacheJsonTransfer.buildTopicExport(request.parentId)
      default:
        throw new Error(`不支持导出该类型：${request.type}`)
    }
  }

  private static async buildAllAnswerExport(): Promise<ExportBuildResult> {
    const answerRecordList = await CacheJsonTransfer.selectAnswerRows()
    const records = answerRecordList.map(CacheJsonTransfer.formatAnswerRecord)
    const indexes = CacheJsonTransfer.collectIndexesFromRecords(records)
    return CacheJsonTransfer.createExportResult({
      type: TaskConsts.Const_Task_Type_回答,
      title: '所有回答',
      fileTitle: '导出所有回答记录',
      contentKinds: ['answer'],
      records,
      indexes,
      relations: [],
    })
  }

  private static async buildAllArticleExport(): Promise<ExportBuildResult> {
    const articleRecordList = await CacheJsonTransfer.selectArticleRows()
    const records = articleRecordList.map(CacheJsonTransfer.formatArticleRecord)
    const indexes = CacheJsonTransfer.collectIndexesFromRecords(records)
    return CacheJsonTransfer.createExportResult({
      type: TaskConsts.Const_Task_Type_文章,
      title: '所有文章',
      fileTitle: '导出所有文章记录',
      contentKinds: ['article'],
      records,
      indexes,
      relations: [],
    })
  }

  private static async buildAllPinExport(): Promise<ExportBuildResult> {
    const pinRecordList = await CacheJsonTransfer.selectPinRows()
    const records = pinRecordList.map(CacheJsonTransfer.formatPinRecord)
    const indexes = CacheJsonTransfer.collectIndexesFromRecords(records)
    return CacheJsonTransfer.createExportResult({
      type: TaskConsts.Const_Task_Type_想法,
      title: '所有想法',
      fileTitle: '导出所有想法记录',
      contentKinds: ['pin'],
      records,
      indexes,
      relations: [],
    })
  }

  private static async buildQuestionExport(parentId?: string): Promise<ExportBuildResult> {
    if (parentId) {
      const answerRecordList = await CacheJsonTransfer.selectAnswerRows({ question_id: parentId })
      const records = answerRecordList.map(CacheJsonTransfer.formatAnswerRecord)
      const questionIndex = CacheJsonTransfer.createQuestionIndexFromAnswerRecord(answerRecordList[0], parentId)
      const title = toDisplayText(questionIndex?.display?.title, `问题 ${parentId}`)
      return CacheJsonTransfer.createExportResult({
        type: TaskConsts.Const_Task_Type_问题,
        parentId,
        title,
        fileTitle: `导出${title}下的回答记录`,
        contentKinds: ['answer'],
        records,
        indexes: questionIndex ? [questionIndex, ...CacheJsonTransfer.collectIndexesFromRecords(records)] : CacheJsonTransfer.collectIndexesFromRecords(records),
        relations: [],
      })
    }
    const indexes = await CacheJsonTransfer.buildQuestionIndexList()
    return CacheJsonTransfer.createExportResult({
      type: TaskConsts.Const_Task_Type_问题,
      title: '所有问题索引',
      fileTitle: '导出所有问题索引记录',
      contentKinds: ['question-index'],
      records: [],
      indexes,
      relations: [],
    })
  }

  private static async buildAuthorExport(parentId?: string): Promise<ExportBuildResult> {
    if (parentId) {
      const answerRecordList = await CacheJsonTransfer.selectAnswerRows({ author_url_token: parentId })
      const articleRecordList = await CacheJsonTransfer.selectArticleRows({ author_url_token: parentId })
      const pinRecordList = await CacheJsonTransfer.selectPinRows({ author_url_token: parentId })
      const records = [
        ...answerRecordList.map(CacheJsonTransfer.formatAnswerRecord),
        ...articleRecordList.map(CacheJsonTransfer.formatArticleRecord),
        ...pinRecordList.map(CacheJsonTransfer.formatPinRecord),
      ]
      const authorIndex = await CacheJsonTransfer.getAuthorIndex(parentId, records)
      const userName = toDisplayText(authorIndex?.display?.name, parentId)
      return CacheJsonTransfer.createExportResult({
        type: TaskConsts.Const_Task_Type_用户的所有回答,
        parentId,
        title: `${userName}的缓存内容`,
        fileTitle: `导出${userName}的缓存内容记录`,
        contentKinds: ['answer', 'article', 'pin'],
        records,
        indexes: authorIndex ? [authorIndex, ...CacheJsonTransfer.collectIndexesFromRecords(records)] : CacheJsonTransfer.collectIndexesFromRecords(records),
        relations: [],
      })
    }
    const indexes = await CacheJsonTransfer.selectIndexRows('Author', ['id', 'url_token', 'raw_json'])
    return CacheJsonTransfer.createExportResult({
      type: TaskConsts.Const_Task_Type_用户的所有回答,
      title: '所有用户索引',
      fileTitle: '导出所有用户索引记录',
      contentKinds: ['author-index'],
      records: [],
      indexes: indexes.map(CacheJsonTransfer.formatAuthorIndex),
      relations: [],
    })
  }

  private static async buildColumnExport(parentId?: string): Promise<ExportBuildResult> {
    if (parentId) {
      const articleRecordList = await CacheJsonTransfer.selectArticleRows({ column_id: parentId })
      const records = articleRecordList.map(CacheJsonTransfer.formatArticleRecord)
      const columnIndex = await CacheJsonTransfer.getColumnIndex(parentId, records)
      const title = toDisplayText(columnIndex?.display?.title, parentId)
      return CacheJsonTransfer.createExportResult({
        type: TaskConsts.Const_Task_Type_专栏,
        parentId,
        title,
        fileTitle: `导出${title}的所有文章列表`,
        contentKinds: ['article'],
        records,
        indexes: columnIndex ? [columnIndex, ...CacheJsonTransfer.collectIndexesFromRecords(records)] : CacheJsonTransfer.collectIndexesFromRecords(records),
        relations: [],
      })
    }
    const indexes = await CacheJsonTransfer.selectIndexRows('Column', ['column_id', 'raw_json'])
    return CacheJsonTransfer.createExportResult({
      type: TaskConsts.Const_Task_Type_专栏,
      title: '所有专栏索引',
      fileTitle: '导出所有专栏索引记录',
      contentKinds: ['column-index'],
      records: [],
      indexes: indexes.map(CacheJsonTransfer.formatColumnIndex),
      relations: [],
    })
  }

  private static async buildCollectionExport(parentId?: string): Promise<ExportBuildResult> {
    if (parentId) {
      const relationRows = await CacheJsonTransfer.selectCollectionRelationRows(parentId)
      const relations = relationRows.map(CacheJsonTransfer.formatCollectionRelation)
      const records = await CacheJsonTransfer.getCollectionContentRecords(relationRows)
      const collectionIndex = await CacheJsonTransfer.getCollectionIndex(parentId)
      const title = toDisplayText(collectionIndex?.display?.title, parentId)
      return CacheJsonTransfer.createExportResult({
        type: TaskConsts.Const_Task_Type_收藏夹,
        parentId,
        title,
        fileTitle: `导出${title}的收藏记录`,
        contentKinds: ['answer', 'article', 'pin'],
        records,
        indexes: collectionIndex ? [collectionIndex, ...CacheJsonTransfer.collectIndexesFromRecords(records)] : CacheJsonTransfer.collectIndexesFromRecords(records),
        relations,
      })
    }
    const indexes = await CacheJsonTransfer.selectIndexRows('Collection', ['collection_id', 'raw_json'])
    return CacheJsonTransfer.createExportResult({
      type: TaskConsts.Const_Task_Type_收藏夹,
      title: '所有收藏夹索引',
      fileTitle: '导出所有收藏夹索引记录',
      contentKinds: ['collection-index'],
      records: [],
      indexes: indexes.map(CacheJsonTransfer.formatCollectionIndex),
      relations: [],
    })
  }

  private static async buildTopicExport(parentId?: string): Promise<ExportBuildResult> {
    if (parentId) {
      const relationRows = await CacheJsonTransfer.selectTopicRelationRows(parentId)
      const relations = relationRows.map(CacheJsonTransfer.formatTopicRelation)
      const answerIdList = relationRows.map((item: any) => String(item.answer_id))
      const answerRecordList = answerIdList.length === 0 ? [] : await Base.db
        .select(['answer_id', 'question_id', 'author_url_token', 'author_id', 'raw_json'])
        .from('Answer')
        .whereIn('answer_id', answerIdList)
        .catch(() => [])
      const records = answerRecordList.map(CacheJsonTransfer.formatAnswerRecord)
      const topicIndex = await CacheJsonTransfer.getTopicIndex(parentId)
      const title = toDisplayText(topicIndex?.display?.name, parentId)
      return CacheJsonTransfer.createExportResult({
        type: TaskConsts.Const_Task_Type_话题,
        parentId,
        title,
        fileTitle: `导出${title}下的回答记录`,
        contentKinds: ['answer'],
        records,
        indexes: topicIndex ? [topicIndex, ...CacheJsonTransfer.collectIndexesFromRecords(records)] : CacheJsonTransfer.collectIndexesFromRecords(records),
        relations,
      })
    }
    const indexes = await CacheJsonTransfer.selectIndexRows('Topic', ['topic_id', 'raw_json'])
    return CacheJsonTransfer.createExportResult({
      type: TaskConsts.Const_Task_Type_话题,
      title: '所有话题索引',
      fileTitle: '导出所有话题索引记录',
      contentKinds: ['topic-index'],
      records: [],
      indexes: indexes.map(CacheJsonTransfer.formatTopicIndex),
      relations: [],
    })
  }

  private static createExportResult({
    type,
    parentId,
    title,
    fileTitle,
    contentKinds,
    records,
    indexes,
    relations,
  }: {
    type: SelectType
    parentId?: string
    title: string
    fileTitle: string
    contentKinds: string[]
    records: PortableRecord[]
    indexes: PortableIndex[]
    relations: PortableRelation[]
  }): ExportBuildResult {
    const uniqueRecords = dedupeById(records)
    const uniqueIndexes = dedupeById(indexes)
    const uniqueRelations = dedupeById(relations)
    return {
      selection: {
        type,
        parentId,
        title,
        contentKinds,
        total: uniqueRecords.length || uniqueIndexes.length || uniqueRelations.length,
      },
      fileTitle,
      records: uniqueRecords,
      indexes: uniqueIndexes,
      relations: uniqueRelations,
    }
  }

  private static async selectAnswerRows(where: Record<string, string | number> = {}) {
    return CacheJsonTransfer.selectRows('Answer', ['answer_id', 'question_id', 'author_url_token', 'author_id', 'raw_json'], where)
  }

  private static async selectArticleRows(where: Record<string, string | number> = {}) {
    return CacheJsonTransfer.selectRows('Article', ['article_id', 'author_url_token', 'author_id', 'column_id', 'raw_json'], where)
  }

  private static async selectPinRows(where: Record<string, string | number> = {}) {
    return CacheJsonTransfer.selectRows('Pin', ['pin_id', 'author_url_token', 'author_id', 'raw_json'], where)
  }

  private static async selectRows(tableName: string, columns: string[], where: Record<string, string | number> = {}) {
    const query = Base.db.select(columns).from(tableName)
    for (const [key, value] of Object.entries(where)) {
      query.where(key, '=', value)
    }
    return query.catch(() => [])
  }

  private static async selectIndexRows(tableName: string, columns: string[]) {
    return Base.db.select(columns).from(tableName).catch(() => [])
  }

  private static async selectCollectionRelationRows(collectionId: string) {
    return Base.db
      .select(['collection_id', 'record_type', 'record_id', 'record_at', 'raw_json'])
      .from('Collection_Record')
      .where('collection_id', '=', collectionId)
      .catch(() => [])
  }

  private static async selectTopicRelationRows(topicId: string) {
    return Base.db
      .select(['topic_id', 'answer_id'])
      .from('Topic_Answer')
      .where('topic_id', '=', topicId)
      .catch(() => [])
  }

  private static formatAnswerRecord(record: any): PortableRecord {
    const raw = parseRawJson(record.raw_json)
    const id = String(record.answer_id ?? raw?.id ?? '')
    const title = toDisplayText(raw?.question?.title, `回答 ${id}`)
    return {
      kind: 'answer',
      id,
      db: {
        tableName: 'Answer',
        primaryKey: { answer_id: id },
        columns: {
          answer_id: id,
          question_id: String(record.question_id ?? raw?.question?.id ?? ''),
          author_url_token: String(record.author_url_token ?? raw?.author?.url_token ?? ''),
          author_id: String(record.author_id ?? raw?.author?.id ?? ''),
        },
      },
      display: {
        title,
        description: limitText(raw?.excerpt ?? raw?.content),
        authorName: raw?.author?.name,
        sourceUrl: `https://www.zhihu.com/question/${raw?.question?.id ?? record.question_id}/answer/${id}`,
        createdAt: Number(raw?.created_time ?? 0),
        updatedAt: Number(raw?.updated_time ?? 0),
      },
      raw,
    }
  }

  private static formatArticleRecord(record: any): PortableRecord {
    const raw = parseRawJson(record.raw_json)
    const id = String(record.article_id ?? raw?.id ?? '')
    const title = toDisplayText(raw?.title, `文章 ${id}`)
    return {
      kind: 'article',
      id,
      db: {
        tableName: 'Article',
        primaryKey: { article_id: id },
        columns: {
          article_id: id,
          author_url_token: String(record.author_url_token ?? raw?.author?.url_token ?? ''),
          author_id: String(record.author_id ?? raw?.author?.id ?? ''),
          column_id: String(record.column_id ?? raw?.column?.id ?? 'ColumnNotExists'),
        },
      },
      display: {
        title,
        description: limitText(raw?.excerpt ?? raw?.content),
        authorName: raw?.author?.name,
        columnTitle: raw?.column?.title,
        sourceUrl: raw?.url ?? `https://zhuanlan.zhihu.com/p/${id}`,
        createdAt: Number(raw?.created ?? 0),
        updatedAt: Number(raw?.updated ?? 0),
      },
      raw,
    }
  }

  private static formatPinRecord(record: any): PortableRecord {
    const raw = parseRawJson(record.raw_json)
    const id = String(record.pin_id ?? raw?.id ?? '')
    const title = toDisplayText(limitText(raw?.excerpt_title, 80), `想法 ${id}`)
    return {
      kind: 'pin',
      id,
      db: {
        tableName: 'Pin',
        primaryKey: { pin_id: id },
        columns: {
          pin_id: id,
          author_url_token: String(record.author_url_token ?? raw?.author?.url_token ?? ''),
          author_id: String(record.author_id ?? raw?.author?.id ?? ''),
        },
      },
      display: {
        title,
        description: limitText(raw?.content_html ?? raw?.excerpt_title),
        authorName: raw?.author?.name,
        sourceUrl: raw?.url ?? `https://www.zhihu.com/pin/${id}`,
        createdAt: Number(raw?.created ?? 0),
        updatedAt: Number(raw?.updated ?? 0),
      },
      raw,
    }
  }

  private static formatAuthorIndex(record: any): PortableIndex {
    const raw = parseRawJson(record.raw_json)
    const id = String(record.url_token ?? raw?.url_token ?? raw?.id ?? '')
    return {
      kind: 'author',
      id,
      db: {
        tableName: 'Author',
        primaryKey: { id: String(record.id ?? raw?.id ?? id) },
        columns: {
          id: String(record.id ?? raw?.id ?? id),
          url_token: id,
        },
      },
      display: {
        name: toDisplayText(raw?.name, id),
        headline: raw?.headline,
      },
      raw,
    }
  }

  private static formatColumnIndex(record: any): PortableIndex {
    const raw = parseRawJson(record.raw_json)
    const id = String(record.column_id ?? raw?.id ?? '')
    return {
      kind: 'column',
      id,
      db: {
        tableName: 'Column',
        primaryKey: { column_id: id },
        columns: { column_id: id },
      },
      display: {
        title: toDisplayText(raw?.title ?? raw?.name, id),
        description: raw?.description,
      },
      raw,
    }
  }

  private static formatCollectionIndex(record: any): PortableIndex {
    const raw = parseRawJson(record.raw_json)
    const id = String(record.collection_id ?? raw?.id ?? '')
    return {
      kind: 'collection',
      id,
      db: {
        tableName: 'Collection',
        primaryKey: { collection_id: id },
        columns: { collection_id: id },
      },
      display: {
        title: toDisplayText(raw?.title, id),
        description: raw?.description,
      },
      raw,
    }
  }

  private static formatTopicIndex(record: any): PortableIndex {
    const raw = parseRawJson(record.raw_json)
    const id = String(record.topic_id ?? raw?.id ?? '')
    return {
      kind: 'topic',
      id,
      db: {
        tableName: 'Topic',
        primaryKey: { topic_id: id },
        columns: { topic_id: id },
      },
      display: {
        name: toDisplayText(raw?.name, id),
        description: raw?.excerpt ?? raw?.introduction,
      },
      raw,
    }
  }

  private static createQuestionIndexFromAnswerRecord(record: any, fallbackId = ''): PortableIndex | undefined {
    const raw = parseRawJson(record?.raw_json)
    const question = raw?.question
    const id = String(question?.id ?? record?.question_id ?? fallbackId)
    if (id === '') {
      return undefined
    }
    return {
      kind: 'question',
      id,
      db: {
        tableName: 'Question',
        primaryKey: { question_id: id },
        columns: { question_id: id },
      },
      display: {
        title: toDisplayText(question?.title, `问题 ${id}`),
        description: question?.detail ?? question?.excerpt,
      },
      raw: question ?? {},
    }
  }

  private static async buildQuestionIndexList() {
    const recordList = await Base.db
      .select(['question_id', 'raw_json'])
      .from('Answer')
      .groupBy('question_id')
      .catch(() => [])
    return recordList
      .map((record: any) => CacheJsonTransfer.createQuestionIndexFromAnswerRecord(record))
      .filter((item): item is PortableIndex => item !== undefined)
  }

  private static collectIndexesFromRecords(records: PortableRecord[]) {
    const indexes: PortableIndex[] = []
    for (const record of records) {
      const authorIndex = CacheJsonTransfer.createAuthorIndexFromRaw(record.raw?.author)
      if (authorIndex) {
        indexes.push(authorIndex)
      }
      const columnIndex = CacheJsonTransfer.createColumnIndexFromRaw(record.raw?.column)
      if (columnIndex) {
        indexes.push(columnIndex)
      }
      if (record.kind === 'answer') {
        const question = record.raw?.question
        if (question?.id) {
          indexes.push({
            kind: 'question',
            id: String(question.id),
            db: {
              tableName: 'Question',
              primaryKey: { question_id: String(question.id) },
              columns: { question_id: String(question.id) },
            },
            display: {
              title: toDisplayText(question.title, `问题 ${question.id}`),
              description: question.detail ?? question.excerpt,
            },
            raw: question,
          })
        }
      }
    }
    return dedupeById(indexes)
  }

  private static createAuthorIndexFromRaw(author: any): PortableIndex | undefined {
    const id = String(author?.url_token ?? author?.id ?? '')
    const authorId = String(author?.id ?? id)
    if (id === '') {
      return undefined
    }
    return {
      kind: 'author',
      id,
      db: {
        tableName: 'Author',
        primaryKey: { id: authorId },
        columns: {
          id: authorId,
          url_token: id,
        },
      },
      display: {
        name: toDisplayText(author?.name, id),
        headline: author?.headline,
      },
      raw: author,
    }
  }

  private static createColumnIndexFromRaw(column: any): PortableIndex | undefined {
    const id = String(column?.id ?? '')
    if (id === '') {
      return undefined
    }
    return {
      kind: 'column',
      id,
      db: {
        tableName: 'Column',
        primaryKey: { column_id: id },
        columns: { column_id: id },
      },
      display: {
        title: toDisplayText(column?.title ?? column?.name, id),
        description: column?.description,
      },
      raw: column,
    }
  }

  private static async getAuthorIndex(authorUrlToken: string, records: PortableRecord[]) {
    const rows = await CacheJsonTransfer.selectIndexRows('Author', ['id', 'url_token', 'raw_json'])
    const row = rows.find((item: any) => String(item.url_token) === authorUrlToken)
    if (row) {
      return CacheJsonTransfer.formatAuthorIndex(row)
    }
    return CacheJsonTransfer.collectIndexesFromRecords(records).find((item) => item.kind === 'author' && item.id === authorUrlToken)
  }

  private static async getColumnIndex(columnId: string, records: PortableRecord[]) {
    const rows = await CacheJsonTransfer.selectIndexRows('Column', ['column_id', 'raw_json'])
    const row = rows.find((item: any) => String(item.column_id) === columnId)
    if (row) {
      return CacheJsonTransfer.formatColumnIndex(row)
    }
    return CacheJsonTransfer.collectIndexesFromRecords(records).find((item) => item.kind === 'column' && item.id === columnId)
  }

  private static async getCollectionIndex(collectionId: string) {
    const rows = await CacheJsonTransfer.selectIndexRows('Collection', ['collection_id', 'raw_json'])
    const row = rows.find((item: any) => String(item.collection_id) === collectionId)
    return row ? CacheJsonTransfer.formatCollectionIndex(row) : undefined
  }

  private static async getTopicIndex(topicId: string) {
    const rows = await CacheJsonTransfer.selectIndexRows('Topic', ['topic_id', 'raw_json'])
    const row = rows.find((item: any) => String(item.topic_id) === topicId)
    return row ? CacheJsonTransfer.formatTopicIndex(row) : undefined
  }

  private static formatCollectionRelation(record: any): PortableRelation {
    const collectionId = String(record.collection_id)
    const recordType = String(record.record_type)
    const recordId = String(record.record_id)
    return {
      kind: 'collection-record',
      id: `${collectionId}:${recordType}:${recordId}`,
      db: {
        tableName: 'Collection_Record',
        primaryKey: {
          collection_id: collectionId,
          record_type: recordType,
          record_id: recordId,
        },
        columns: {
          collection_id: collectionId,
          record_type: recordType,
          record_id: recordId,
          record_at: Number(record.record_at ?? 0),
        },
      },
      display: {
        collectionId,
        recordType,
        recordId,
        recordAt: Number(record.record_at ?? 0),
      },
      raw: parseRawJson(record.raw_json),
    }
  }

  private static formatTopicRelation(record: any): PortableRelation {
    const topicId = String(record.topic_id)
    const answerId = String(record.answer_id)
    return {
      kind: 'topic-answer',
      id: `${topicId}:${answerId}`,
      db: {
        tableName: 'Topic_Answer',
        primaryKey: {
          topic_id: topicId,
          answer_id: answerId,
        },
        columns: {
          topic_id: topicId,
          answer_id: answerId,
        },
      },
      display: {
        topicId,
        answerId,
      },
    }
  }

  private static async getCollectionContentRecords(relationRows: any[]) {
    const answerIdList = relationRows.filter((item) => item.record_type === 'answer').map((item) => String(item.record_id))
    const articleIdList = relationRows.filter((item) => item.record_type === 'article').map((item) => String(item.record_id))
    const pinIdList = relationRows.filter((item) => item.record_type === 'pin').map((item) => String(item.record_id))
    const records: PortableRecord[] = []
    if (answerIdList.length > 0) {
      const rows = await Base.db
        .select(['answer_id', 'question_id', 'author_url_token', 'author_id', 'raw_json'])
        .from('Answer')
        .whereIn('answer_id', answerIdList)
        .catch(() => [])
      records.push(...rows.map(CacheJsonTransfer.formatAnswerRecord))
    }
    if (articleIdList.length > 0) {
      const rows = await Base.db
        .select(['article_id', 'author_url_token', 'author_id', 'column_id', 'raw_json'])
        .from('Article')
        .whereIn('article_id', articleIdList)
        .catch(() => [])
      records.push(...rows.map(CacheJsonTransfer.formatArticleRecord))
    }
    if (pinIdList.length > 0) {
      const rows = await Base.db
        .select(['pin_id', 'author_url_token', 'author_id', 'raw_json'])
        .from('Pin')
        .whereIn('pin_id', pinIdList)
        .catch(() => [])
      records.push(...rows.map(CacheJsonTransfer.formatPinRecord))
    }
    return records
  }

  private static buildRecordImportData(record: PortableRecord) {
    const raw = record.raw ?? {}
    const columns = record.db?.columns ?? {}
    if (record.kind === 'answer') {
      const answerId = String(columns.answer_id ?? record.id ?? raw?.id ?? '')
      if (answerId === '') {
        return undefined
      }
      return {
        tableName: 'Answer',
        primaryKey: { answer_id: answerId },
        data: {
          answer_id: answerId,
          question_id: String(columns.question_id ?? raw?.question?.id ?? ''),
          author_url_token: String(columns.author_url_token ?? raw?.author?.url_token ?? ''),
          author_id: String(columns.author_id ?? raw?.author?.id ?? ''),
          raw_json: stringifyRawJson(raw),
        },
      }
    }
    if (record.kind === 'article') {
      const articleId = String(columns.article_id ?? record.id ?? raw?.id ?? '')
      if (articleId === '') {
        return undefined
      }
      return {
        tableName: 'Article',
        primaryKey: { article_id: articleId },
        data: {
          article_id: articleId,
          author_url_token: String(columns.author_url_token ?? raw?.author?.url_token ?? ''),
          author_id: String(columns.author_id ?? raw?.author?.id ?? ''),
          column_id: String(columns.column_id ?? raw?.column?.id ?? 'ColumnNotExists'),
          raw_json: stringifyRawJson(raw),
        },
      }
    }
    if (record.kind === 'pin') {
      const pinId = String(columns.pin_id ?? record.id ?? raw?.id ?? '')
      if (pinId === '') {
        return undefined
      }
      return {
        tableName: 'Pin',
        primaryKey: { pin_id: pinId },
        data: {
          pin_id: pinId,
          author_url_token: String(columns.author_url_token ?? raw?.author?.url_token ?? ''),
          author_id: String(columns.author_id ?? raw?.author?.id ?? ''),
          raw_json: stringifyRawJson(raw),
        },
      }
    }
    return undefined
  }

  private static buildIndexImportData(index: PortableIndex) {
    const raw = index.raw ?? {}
    const columns = index.db?.columns ?? {}
    if (index.kind === 'question') {
      return undefined
    }
    if (index.kind === 'author') {
      const id = String(columns.id ?? raw?.id ?? index.id ?? '')
      const urlToken = String(columns.url_token ?? raw?.url_token ?? index.id ?? '')
      if (id === '' || urlToken === '') {
        return undefined
      }
      return {
        tableName: 'Author',
        primaryKey: { id },
        data: {
          id,
          url_token: urlToken,
          raw_json: stringifyRawJson(raw),
        },
      }
    }
    if (index.kind === 'column') {
      const columnId = String(columns.column_id ?? raw?.id ?? index.id ?? '')
      if (columnId === '') {
        return undefined
      }
      return {
        tableName: 'Column',
        primaryKey: { column_id: columnId },
        data: {
          column_id: columnId,
          raw_json: stringifyRawJson(raw),
        },
      }
    }
    if (index.kind === 'collection') {
      const collectionId = String(columns.collection_id ?? raw?.id ?? index.id ?? '')
      if (collectionId === '') {
        return undefined
      }
      return {
        tableName: 'Collection',
        primaryKey: { collection_id: collectionId },
        data: {
          collection_id: collectionId,
          raw_json: stringifyRawJson(raw),
        },
      }
    }
    if (index.kind === 'topic') {
      const topicId = String(columns.topic_id ?? raw?.id ?? index.id ?? '')
      if (topicId === '') {
        return undefined
      }
      return {
        tableName: 'Topic',
        primaryKey: { topic_id: topicId },
        data: {
          topic_id: topicId,
          raw_json: stringifyRawJson(raw),
        },
      }
    }
    return undefined
  }

  private static buildRelationImportData(relation: PortableRelation) {
    const columns = relation.db?.columns ?? {}
    if (relation.kind === 'collection-record') {
      const collectionId = String(columns.collection_id ?? '')
      const recordType = String(columns.record_type ?? '')
      const recordId = String(columns.record_id ?? '')
      if (collectionId === '' || recordType === '' || recordId === '') {
        return undefined
      }
      return {
        tableName: 'Collection_Record',
        primaryKey: {
          collection_id: collectionId,
          record_type: recordType,
          record_id: recordId,
        },
        data: {
          collection_id: collectionId,
          record_type: recordType,
          record_id: recordId,
          record_at: Number(columns.record_at ?? 0),
          raw_json: stringifyRawJson(relation.raw),
        },
      }
    }
    if (relation.kind === 'topic-answer') {
      const topicId = String(columns.topic_id ?? '')
      const answerId = String(columns.answer_id ?? '')
      if (topicId === '' || answerId === '') {
        return undefined
      }
      return {
        tableName: 'Topic_Answer',
        primaryKey: {
          topic_id: topicId,
          answer_id: answerId,
        },
        data: {
          topic_id: topicId,
          answer_id: answerId,
        },
      }
    }
    return undefined
  }

  private static async importIndex(index: PortableIndex, counter: ImportCounter) {
    try {
      const importData = CacheJsonTransfer.buildIndexImportData(index)
      if (!importData) {
        return
      }
      await replaceIntoWithCounter(counter, importData.tableName, importData.primaryKey, importData.data)
    } catch (error: any) {
      addImportError(counter, `索引 ${index.kind}:${index.id} 导入失败：${error?.message ?? error}`)
    }
  }

  private static async importRecord(record: PortableRecord, counter: ImportCounter) {
    try {
      const importData = CacheJsonTransfer.buildRecordImportData(record)
      if (!importData) {
        addImportError(counter, `记录 ${record.kind}:${record.id} 缺少必要字段，已跳过。`)
        return
      }
      await replaceIntoWithCounter(counter, importData.tableName, importData.primaryKey, importData.data)
    } catch (error: any) {
      addImportError(counter, `记录 ${record.kind}:${record.id} 导入失败：${error?.message ?? error}`)
    }
  }

  private static async importRelation(relation: PortableRelation, counter: ImportCounter) {
    try {
      const importData = CacheJsonTransfer.buildRelationImportData(relation)
      if (!importData) {
        addImportError(counter, `关系 ${relation.kind}:${relation.id} 缺少必要字段，已跳过。`)
        return
      }
      await replaceIntoWithCounter(counter, importData.tableName, importData.primaryKey, importData.data)
    } catch (error: any) {
      addImportError(counter, `关系 ${relation.kind}:${relation.id} 导入失败：${error?.message ?? error}`)
    }
  }
}
