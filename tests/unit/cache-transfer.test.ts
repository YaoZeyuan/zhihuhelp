import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import CacheJsonTransfer from '../../src/application/cache_transfer/json_transfer'
import CommonConfig from '../../src/config/common'
import Knex from '../../src/library/knex'
import PathConfig from '../../src/config/path'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

function createPayload(overrides: Record<string, unknown> = {}) {
  return {
    schema: 'zhihuhelp.cache-export.v1',
    version: CommonConfig.version,
    exportVersion: CommonConfig.version,
    exportedAt: '2026-08-09T00:00:00.000Z',
    app: { name: 'zhihuhelp', version: CommonConfig.version },
    selection: { type: '回答', title: 'fixture', contentKinds: ['answer'], total: 0 },
    stats: { answer: 0, article: 0, pin: 0, indexes: 0, relations: 0 },
    records: [],
    indexes: [],
    relations: [],
    ...overrides,
  }
}

describe('缓存 JSON 导入结果契约', () => {
  let sandbox: TestSandbox
  let originalDatabasePath: string
  let originalOutputPath: string

  beforeEach(async () => {
    await Knex.destroy()
    sandbox = createTestSandbox('cache-transfer')
    originalDatabasePath = CommonConfig.db_uri
    originalOutputPath = PathConfig.outputPath
    CommonConfig.setDatabaseUri(sandbox.databasePath)
    PathConfig.setOutputPath(sandbox.outputPath)
  })

  afterEach(async () => {
    await Knex.destroy()
    CommonConfig.setDatabaseUri(originalDatabasePath)
    PathConfig.setOutputPath(originalOutputPath)
    sandbox.cleanup()
  })

  function writePayload(payload: unknown) {
    const filePath = path.join(sandbox.rootPath, 'import.json')
    fs.writeFileSync(filePath, JSON.stringify(payload), 'utf8')
    return filePath
  }

  async function createAnswerTable() {
    await Knex.raw(`
      CREATE TABLE Answer (
        answer_id TEXT PRIMARY KEY,
        question_id TEXT,
        author_url_token TEXT,
        author_id TEXT,
        raw_json TEXT
      )
    `)
  }

  it('拒绝记录数组格式错误但其余部分兼容的数据包', async () => {
    const result = await CacheJsonTransfer.importDbRecordJson(writePayload(createPayload({ records: {} })))

    expect(result).toMatchObject({
      status: 'failure',
      imported: 0,
      replaced: 0,
    })
  })

  it('拒绝标量 raw 数据且不污染数据库', async () => {
    await createAnswerTable()
    const result = await CacheJsonTransfer.importDbRecordJson(writePayload(createPayload({
      records: [{
        kind: 'answer',
        id: 'poison-answer',
        raw: 'bad',
        db: { columns: { answer_id: 'poison-answer' } },
      }],
    })))

    expect(result).toMatchObject({
      status: 'failure',
      imported: 0,
      skipped: 1,
    })
    await expect(
      Knex.queryBuilder().select(['answer_id']).from('Answer').where({ answer_id: 'poison-answer' }),
    ).resolves.toEqual([])
  })

  it('有效记录与无效记录同时导入时报告 partial_success', async () => {
    await createAnswerTable()
    const result = await CacheJsonTransfer.importDbRecordJson(writePayload(createPayload({
      records: [
        {
          kind: 'answer',
          id: 'answer-1',
          db: { columns: { answer_id: 'answer-1', question_id: 'question-1' } },
          raw: { id: 'answer-1', question: { id: 'question-1', title: 'fixture' } },
        },
        {
          kind: 'answer',
          id: 'poison-answer',
          raw: [],
          db: { columns: { answer_id: 'poison-answer' } },
        },
      ],
    })))

    expect(result).toMatchObject({
      status: 'partial_success',
      imported: 1,
      skipped: 1,
    })
    await expect(
      Knex.queryBuilder().select(['answer_id']).from('Answer').where({ answer_id: 'answer-1' }).first(),
    ).resolves.toMatchObject({ answer_id: 'answer-1' })
    await expect(
      Knex.queryBuilder().select(['answer_id']).from('Answer').where({ answer_id: 'poison-answer' }),
    ).resolves.toEqual([])
  })

  it('仅当导入内容较新时更新现有记录', async () => {
    await createAnswerTable()
    await Knex.queryBuilder().insert({ answer_id: 'answer-1', question_id: 'local', raw_json: JSON.stringify({ id: 'answer-1', updated_time: 20 }) }).into('Answer')
    const payloadRecord = (updated_time: number, question_id: string) => ({
      kind: 'answer', id: 'answer-1', db: { columns: { answer_id: 'answer-1', question_id } }, raw: { id: 'answer-1', updated_time },
    })

    const older = await CacheJsonTransfer.importDbRecordJson(writePayload(createPayload({ records: [payloadRecord(10, 'older')] })))
    expect(older).toMatchObject({ updated: 0, preserved: 1 })
    expect(await Knex.queryBuilder().from('Answer').where({ answer_id: 'answer-1' }).first()).toMatchObject({ question_id: 'local' })

    const newer = await CacheJsonTransfer.importDbRecordJson(writePayload(createPayload({ records: [payloadRecord(30, 'newer')] })))
    expect(newer).toMatchObject({ updated: 1, preserved: 0 })
    expect(await Knex.queryBuilder().from('Answer').where({ answer_id: 'answer-1' }).first()).toMatchObject({ question_id: 'newer' })
  })

  it('按 record_at 比较收藏关联，并保留时间戳相同的记录', async () => {
    await Knex.raw('CREATE TABLE Collection_Record (collection_id TEXT, record_type TEXT, record_id TEXT, record_at INTEGER, raw_json TEXT, PRIMARY KEY (collection_id, record_type, record_id))')
    await Knex.queryBuilder().insert({ collection_id: 'c1', record_type: 'answer', record_id: 'a1', record_at: 20, raw_json: '{}' }).into('Collection_Record')
    const relation = (record_at: number) => ({ kind: 'collection-record', id: 'c1:answer:a1', db: { columns: { collection_id: 'c1', record_type: 'answer', record_id: 'a1', record_at } }, raw: {} })

    expect(await CacheJsonTransfer.importDbRecordJson(writePayload(createPayload({ relations: [relation(20)] })))).toMatchObject({ updated: 0, preserved: 1 })
    expect(await CacheJsonTransfer.importDbRecordJson(writePayload(createPayload({ relations: [relation(30)] })))).toMatchObject({ updated: 1, preserved: 0 })
    expect(await Knex.queryBuilder().from('Collection_Record').first()).toMatchObject({ record_at: 30 })
  })

  it('将全部缓存表导出到一个可移植数据包', async () => {
    const statements = [
      'CREATE TABLE Answer (answer_id TEXT PRIMARY KEY, question_id TEXT, author_url_token TEXT, author_id TEXT, raw_json TEXT)',
      'CREATE TABLE Article (article_id TEXT PRIMARY KEY, author_url_token TEXT, author_id TEXT, column_id TEXT, raw_json TEXT)',
      'CREATE TABLE Pin (pin_id TEXT PRIMARY KEY, author_url_token TEXT, author_id TEXT, raw_json TEXT)',
      'CREATE TABLE Author (id TEXT PRIMARY KEY, url_token TEXT, raw_json TEXT)',
      'CREATE TABLE Activity (id TEXT, url_token TEXT, verb TEXT, raw_json TEXT, PRIMARY KEY (id, url_token))',
      'CREATE TABLE Author_Ask_Question (question_id TEXT PRIMARY KEY, author_url_token TEXT, author_id TEXT, raw_json TEXT)',
      'CREATE TABLE Column (column_id TEXT PRIMARY KEY, raw_json TEXT)',
      'CREATE TABLE Collection (collection_id TEXT PRIMARY KEY, raw_json TEXT)',
      'CREATE TABLE Collection_Record (collection_id TEXT, record_type TEXT, record_id TEXT, record_at INTEGER, raw_json TEXT, PRIMARY KEY (collection_id, record_type, record_id))',
      'CREATE TABLE Topic (topic_id TEXT PRIMARY KEY, raw_json TEXT)',
      'CREATE TABLE Topic_Answer (topic_id TEXT, answer_id TEXT, PRIMARY KEY (topic_id, answer_id))',
    ]
    for (const statement of statements) await Knex.raw(statement)
    const result = await CacheJsonTransfer.exportDbRecordJson({ type: 'all' })
    const payload = JSON.parse(fs.readFileSync(result.exportPath, 'utf8'))
    expect(payload.selection).toMatchObject({ type: 'all', total: 0 })
    expect(payload.selection.contentKinds).toHaveLength(11)
    expect(payload).toMatchObject({ records: [], indexes: [], relations: [] })
  })
})
