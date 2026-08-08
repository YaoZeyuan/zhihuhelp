import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import CacheJsonTransfer from '../../src/application/cache_transfer/json_transfer'
import CommonConfig from '../../src/config/common'
import Knex from '../../src/library/knex'
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

describe('cache JSON import result contract', () => {
  let sandbox: TestSandbox
  let originalDatabasePath: string

  beforeEach(async () => {
    await Knex.destroy()
    sandbox = createTestSandbox('cache-transfer')
    originalDatabasePath = CommonConfig.db_uri
    CommonConfig.setDatabaseUri(sandbox.databasePath)
  })

  afterEach(async () => {
    await Knex.destroy()
    CommonConfig.setDatabaseUri(originalDatabasePath)
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

  it('rejects an otherwise compatible payload with malformed record arrays', async () => {
    const result = await CacheJsonTransfer.importDbRecordJson(writePayload(createPayload({ records: {} })))

    expect(result).toMatchObject({
      status: 'failure',
      imported: 0,
      replaced: 0,
    })
  })

  it('rejects a scalar raw payload without poisoning the database', async () => {
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

  it('reports partial_success when valid records are imported beside invalid ones', async () => {
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
})
