import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BatchFetchCollection from '../../src/api/batch/collection'
import { BatchFetchError } from '../../src/api/batch/base'
import BatchFetchAnswer from '../../src/api/batch/answer'
import BatchFetchArticle from '../../src/api/batch/article'
import BatchFetchPin from '../../src/api/batch/pin'
import CollectionApi from '../../src/api/single/collection'
import CollectionModel from '../../src/model/collection'
import PathConfig from '../../src/config/path'
import { createPartialOutcome, createSuccessOutcome } from '../../src/shared/runtime/execution_outcome'
import { AppErrorCode } from '../../src/shared/error/application_error'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

describe('收藏夹混合内容展开', () => {
  let sandbox: TestSandbox
  let originalLogPath: string

  beforeEach(() => {
    sandbox = createTestSandbox('collection-mixed')
    originalLogPath = PathConfig.logPath
    PathConfig.setLogPath(sandbox.logPath)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    PathConfig.setLogPath(originalLogPath)
    vi.restoreAllMocks()
    sandbox.cleanup()
  })

  it('根据捕获的混合 fixture 使用 item_count 并分派文章与想法关联', async () => {
    const fixture = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'fixtures/zhihu/online/collection-37171281.json'), 'utf8'),
    )
    const entity = fixture.data.entity
    const itemList = fixture.data.pages.flatMap((page: any) => page.items).map((item: any) => ({
      content: { id: item.id, type: item.type },
    }))

    vi.spyOn(CollectionApi, 'asyncGetCollectionInfo').mockResolvedValue({
      ...entity,
      answer_count: 0,
      item_count: itemList.length,
    } as never)
    const listSpy = vi.spyOn(CollectionApi, 'asyncGetItemList').mockResolvedValue(itemList as never)
    vi.spyOn(CollectionModel, 'asyncReplaceCollectionInfo').mockResolvedValue(undefined as never)
    vi.spyOn(CollectionModel, 'asyncReplaceCollectionRecord').mockResolvedValue(undefined as never)
    const answerSpy = vi
      .spyOn(BatchFetchAnswer.prototype, 'fetchListAndSaveToDb')
      .mockResolvedValue(createSuccessOutcome(0))
    const pinSpy = vi
      .spyOn(BatchFetchPin.prototype, 'fetchListAndSaveToDb')
      .mockResolvedValue(createSuccessOutcome(1))
    const articleSpy = vi
      .spyOn(BatchFetchArticle.prototype, 'fetchListAndSaveToDb')
      .mockResolvedValue(createSuccessOutcome(1))

    const outcome = await new BatchFetchCollection().fetch(String(entity.id))

    expect(listSpy).toHaveBeenCalledWith(String(entity.id), 0, 20)
    expect(answerSpy).toHaveBeenCalledWith([])
    expect(articleSpy).toHaveBeenCalledWith([expect.stringMatching(/^\d+$/)])
    expect(pinSpy).toHaveBeenCalledWith([expect.stringMatching(/^\d+$/)])
    expect(outcome).toMatchObject({ status: 'success', successCount: 2, failureCount: 0 })

    const persistRecords = fs
      .readdirSync(sandbox.logPath)
      .filter((fileName) => /^runtime\..+\.jsonl$/.test(fileName))
      .flatMap((fileName) => fs.readFileSync(path.join(sandbox.logPath, fileName), 'utf8').split(/\r?\n/))
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((record) => record.stage === 'persist')
    const startList = persistRecords.filter((record) => record.status === 'start')
    expect(startList).toHaveLength(itemList.length + 1)
    expect(new Set(startList.map((record) => record.jobId)).size).toBe(startList.length)
    for (const startRecord of startList) {
      expect(
        persistRecords.filter((record) =>
          record.jobId === startRecord.jobId
          && ['success', 'partial_success', 'failure'].includes(record.status),
        ),
      ).toHaveLength(1)
    }
  })

  it('回答子批次仅有可恢复失败时继续处理想法和文章子项', async () => {
    vi.spyOn(CollectionApi, 'asyncGetCollectionInfo').mockResolvedValue({
      id: 1,
      title: 'mixed',
      item_count: 3,
      answer_count: 1,
    } as never)
    vi.spyOn(CollectionApi, 'asyncGetItemList').mockResolvedValue([
      { content: { id: 'missing-answer', type: 'answer' } },
      { content: { id: 'valid-pin', type: 'pin' } },
      { content: { id: 'valid-article', type: 'article' } },
    ] as never)
    vi.spyOn(CollectionModel, 'asyncReplaceCollectionInfo').mockResolvedValue(undefined as never)
    vi.spyOn(CollectionModel, 'asyncReplaceCollectionRecord').mockResolvedValue(undefined as never)
    vi.spyOn(BatchFetchAnswer.prototype, 'fetchListAndSaveToDb').mockRejectedValue(
      new BatchFetchError('answer', createPartialOutcome(0, [
        {
          entityType: 'answer',
          entityId: 'missing-answer',
          error: {
            name: 'ApplicationError',
            message: 'not found',
            code: AppErrorCode.ENTITY_NOT_FOUND,
          },
        },
      ])),
    )
    const pinSpy = vi
      .spyOn(BatchFetchPin.prototype, 'fetchListAndSaveToDb')
      .mockResolvedValue(createSuccessOutcome(1))
    const articleSpy = vi
      .spyOn(BatchFetchArticle.prototype, 'fetchListAndSaveToDb')
      .mockResolvedValue(createSuccessOutcome(1))

    const outcome = await new BatchFetchCollection().fetch('1')

    expect(pinSpy).toHaveBeenCalledWith(['valid-pin'])
    expect(articleSpy).toHaveBeenCalledWith(['valid-article'])
    expect(outcome).toMatchObject({ status: 'partial_success', successCount: 2, failureCount: 1 })
  })

  it('持久化实体前拒绝小数形式的收藏夹数量', async () => {
    vi.spyOn(CollectionApi, 'asyncGetCollectionInfo').mockResolvedValue({
      id: 1,
      title: 'invalid count',
      item_count: 1.5,
    } as never)
    const persistSpy = vi.spyOn(CollectionModel, 'asyncReplaceCollectionInfo').mockResolvedValue(undefined as never)

    await expect(new BatchFetchCollection().fetch('1')).rejects.toMatchObject({
      code: AppErrorCode.PAGINATION_RESPONSE_INVALID,
    })
    expect(persistSpy).not.toHaveBeenCalled()
  })
})
