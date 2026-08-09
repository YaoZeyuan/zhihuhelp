import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import CommonConfig from '../../src/config/common'
import { createAuthorProfileUrl, getCanonicalAuthorUrlToken } from '../../src/domain/author/identity'
import Knex from '../../src/library/knex'
import Activity from '../../src/model/activity'
import Answer from '../../src/model/answer'
import Article from '../../src/model/article'
import Author from '../../src/model/author'
import AuthorAskQuestion from '../../src/model/author_ask_question'
import Pin from '../../src/model/pin'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

const stableAuthorId = '7eb8dd6d1e665c9b53832a0d8ab3a4c2'
const canonicalUrlToken = 'Hentioe'

async function createIdentityTables(): Promise<void> {
  await Knex.raw('CREATE TABLE Author (id TEXT PRIMARY KEY, url_token TEXT, raw_json TEXT)')
  await Knex.raw(
    'CREATE TABLE Answer (answer_id TEXT PRIMARY KEY, question_id TEXT, author_url_token TEXT, author_id TEXT, raw_json TEXT)',
  )
  await Knex.raw(
    'CREATE TABLE Article (article_id TEXT PRIMARY KEY, author_url_token TEXT, author_id TEXT, column_id TEXT, raw_json TEXT)',
  )
  await Knex.raw('CREATE TABLE Pin (pin_id TEXT PRIMARY KEY, author_url_token TEXT, author_id TEXT, raw_json TEXT)')
  await Knex.raw(
    'CREATE TABLE Author_Ask_Question (question_id TEXT PRIMARY KEY, author_url_token TEXT, author_id TEXT, raw_json TEXT)',
  )
  await Knex.raw(
    'CREATE TABLE Activity (id TEXT, url_token TEXT, verb TEXT, raw_json TEXT, PRIMARY KEY (id, url_token))',
  )
}

async function insertRelationFixtures(): Promise<void> {
  const relationFixtures = [
    {
      table: 'Answer',
      idColumn: 'answer_id',
      stableId: 'answer-by-id',
      aliasId: 'answer-by-token',
      unrelatedId: 'answer-unrelated',
      extraColumns: { question_id: 'question-1' },
    },
    {
      table: 'Article',
      idColumn: 'article_id',
      stableId: 'article-by-id',
      aliasId: 'article-by-token',
      unrelatedId: 'article-unrelated',
      extraColumns: { column_id: 'column-1' },
    },
    {
      table: 'Pin',
      idColumn: 'pin_id',
      stableId: 'pin-by-id',
      aliasId: 'pin-by-token',
      unrelatedId: 'pin-unrelated',
      extraColumns: {},
    },
  ]

  for (const fixture of relationFixtures) {
    for (const [id, authorId, urlToken] of [
      [fixture.stableId, stableAuthorId, 'old-token'],
      [fixture.aliasId, 'legacy-id', canonicalUrlToken],
      [fixture.unrelatedId, 'unrelated-id', 'unrelated-token'],
    ]) {
      await Knex.raw(
        `INSERT INTO ${fixture.table} (${fixture.idColumn}, author_url_token, author_id, raw_json${
          Object.keys(fixture.extraColumns).length > 0 ? `, ${Object.keys(fixture.extraColumns).join(', ')}` : ''
        }) VALUES (?, ?, ?, ?${Object.keys(fixture.extraColumns)
          .map(() => ', ?')
          .join('')})`,
        [id, urlToken, authorId, JSON.stringify({ id }), ...Object.values(fixture.extraColumns)],
      )
    }
  }

  await Knex.raw(
    `INSERT INTO Author_Ask_Question (question_id, author_url_token, author_id, raw_json)
     VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)`,
    [
      'question-by-id',
      'old-token',
      stableAuthorId,
      '{}',
      'question-by-token',
      canonicalUrlToken,
      'legacy-id',
      '{}',
      'question-unrelated',
      'unrelated-token',
      'unrelated-id',
      '{}',
    ],
  )

  for (const [id, urlToken, targetId, createdTime] of [
    ['activity-by-id', stableAuthorId, 'target-by-id', 10],
    ['activity-by-token', canonicalUrlToken, 'target-by-token', 20],
    ['activity-alias-duplicate', canonicalUrlToken, 'target-by-id', 10],
    ['activity-unrelated', 'unrelated-token', 'target-unrelated', 30],
  ]) {
    await Knex.raw('INSERT INTO Activity (id, url_token, verb, raw_json) VALUES (?, ?, ?, ?)', [
      id,
      urlToken,
      Activity.VERB_ANSWER_VOTE_UP,
      JSON.stringify({
        id,
        verb: Activity.VERB_ANSWER_VOTE_UP,
        created_time: createdTime,
        actor: { id: stableAuthorId, url_token: canonicalUrlToken },
        target: { id: targetId },
      }),
    ])
  }
}

describe('author identity model', () => {
  let sandbox: TestSandbox
  let originalDatabasePath: string

  beforeEach(async () => {
    await Knex.destroy()
    sandbox = createTestSandbox('author-identity-model')
    originalDatabasePath = CommonConfig.db_uri
    CommonConfig.setDatabaseUri(sandbox.databasePath)
    await createIdentityTables()
    await Knex.raw('INSERT INTO Author (id, url_token, raw_json) VALUES (?, ?, ?)', [
      stableAuthorId,
      canonicalUrlToken,
      JSON.stringify({ id: stableAuthorId, url_token: canonicalUrlToken, name: 'Canonical Author' }),
    ])
  })

  afterEach(async () => {
    await Knex.destroy()
    CommonConfig.setDatabaseUri(originalDatabasePath)
    sandbox.cleanup()
  })

  it('resolves stable id first and falls back to the canonical url token', async () => {
    const byId = await Author.asyncResolveIdentity(stableAuthorId)
    const byToken = await Author.asyncResolveIdentity(canonicalUrlToken)

    expect(byId).toMatchObject({
      requestedIdentifier: stableAuthorId,
      authorId: stableAuthorId,
      urlToken: canonicalUrlToken,
      aliases: [canonicalUrlToken, stableAuthorId],
    })
    expect(byToken).toMatchObject({
      requestedIdentifier: canonicalUrlToken,
      authorId: stableAuthorId,
      urlToken: canonicalUrlToken,
      aliases: [canonicalUrlToken, stableAuthorId],
    })
    await expect(Author.asyncGetAuthor(stableAuthorId)).resolves.toMatchObject({
      id: stableAuthorId,
      url_token: canonicalUrlToken,
    })
    await expect(Author.asyncGetAuthor(canonicalUrlToken)).resolves.toMatchObject({
      id: stableAuthorId,
      url_token: canonicalUrlToken,
    })
    await expect(Author.asyncResolveIdentity('missing-author')).resolves.toBeUndefined()
  })

  it('uses an id match before a conflicting token match', async () => {
    await Knex.raw('INSERT INTO Author (id, url_token, raw_json) VALUES (?, ?, ?)', [
      canonicalUrlToken,
      'different-token',
      JSON.stringify({ id: canonicalUrlToken, url_token: 'different-token' }),
    ])

    await expect(Author.asyncResolveIdentity(canonicalUrlToken)).resolves.toMatchObject({
      authorId: canonicalUrlToken,
      urlToken: 'different-token',
    })
  })

  it('uses the persisted token before the stable-id display fallback', async () => {
    const persistedOnlyId = 'persisted-token-author-id'
    await Knex.raw('INSERT INTO Author (id, url_token, raw_json) VALUES (?, ?, ?)', [
      persistedOnlyId,
      'persisted-canonical-token',
      JSON.stringify({ id: persistedOnlyId, url_token: '' }),
    ])

    await expect(Author.asyncResolveIdentity(persistedOnlyId)).resolves.toMatchObject({
      authorId: persistedOnlyId,
      urlToken: 'persisted-canonical-token',
      aliases: [persistedOnlyId, 'persisted-canonical-token'],
      author: {
        id: persistedOnlyId,
        url_token: 'persisted-canonical-token',
      },
    })
  })

  it('normalizes the public token and falls back to the stable id for display', () => {
    expect(getCanonicalAuthorUrlToken({ id: stableAuthorId, url_token: '  Hentioe  ' } as never)).toBe(
      canonicalUrlToken,
    )
    expect(getCanonicalAuthorUrlToken({ id: stableAuthorId, url_token: '  ' } as never)).toBe(stableAuthorId)
    expect(createAuthorProfileUrl({ id: stableAuthorId, url_token: 'display token' } as never)).toBe(
      'https://www.zhihu.com/people/display%20token',
    )
  })

  it('queries relations by stable id and compatible token aliases', async () => {
    await insertRelationFixtures()
    const aliases = [canonicalUrlToken]

    await expect(Answer.asyncGetAnswerListByAuthorIdentity(stableAuthorId, aliases)).resolves.toEqual([
      { id: 'answer-by-id' },
      { id: 'answer-by-token' },
    ])
    await expect(Article.asyncGetArticleListByAuthorIdentity(stableAuthorId, aliases)).resolves.toEqual([
      { id: 'article-by-id' },
      { id: 'article-by-token' },
    ])
    await expect(Pin.asyncGetPinListByAuthorIdentity(stableAuthorId, aliases)).resolves.toEqual([
      { id: 'pin-by-id' },
      { id: 'pin-by-token' },
    ])
    await expect(
      AuthorAskQuestion.asyncGetAuthorAskQuestionIdListByAuthorIdentity(stableAuthorId, aliases),
    ).resolves.toEqual(['question-by-id', 'question-by-token'])
  })

  it('queries Activity through every resolved alias without changing its schema', async () => {
    await insertRelationFixtures()
    const aliases = [stableAuthorId, canonicalUrlToken]

    await expect(Activity.asyncGetAllActivityTargetIdListByAuthorAliases(aliases)).resolves.toEqual([
      'target-by-id',
      'target-by-token',
    ])
    await expect(Activity.asyncGetAllActionRecordMapByAuthorAliases(aliases)).resolves.toEqual({
      'target-by-id': 10,
      'target-by-token': 20,
    })
  })

  it('keeps token-based public methods compatible', async () => {
    await insertRelationFixtures()

    await expect(Answer.asyncGetAnswerListByAuthorUrlToken(canonicalUrlToken)).resolves.toEqual([
      { id: 'answer-by-token' },
    ])
    await expect(AuthorAskQuestion.asyncGetAuthorAskQuestionIdList(canonicalUrlToken)).resolves.toEqual([
      'question-by-token',
    ])
    await expect(Activity.asyncGetAllActivityTargetIdList(canonicalUrlToken)).resolves.toEqual([
      'target-by-token',
      'target-by-id',
    ])
  })
})
