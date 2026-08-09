import { afterEach, describe, expect, it, vi } from 'vitest'
import GenerateWorkflow from '../../src/application/workflow/generate/customer'
import * as Package from '../../src/application/workflow/generate/resource/library/package'
import * as ConstTaskConfig from '../../src/constant/task_config'
import { AppErrorCode } from '../../src/shared/error/application_error'
import { LogStatus } from '../../src/shared/logging/log_contract'

function createArticlePage(id: string) {
  const page = new Package.Page_Article()
  page.add({
    actionAt: 0,
    record: { id, title: id } as never,
  })
  return page
}

function createSourceUnits() {
  return [
    new Package.Unit_收藏夹({
      info: { id: 'collection-1', title: 'Favorites' } as never,
      pageList: [createArticlePage('article-a')],
    }),
    new Package.Unit_专栏({
      info: { id: 'column-1', title: 'Column' } as never,
      pageList: [createArticlePage('article-b')],
    }),
  ]
}

const fetchTaskList = [
  {
    type: ConstTaskConfig.Const_Task_Type_收藏夹,
    id: 'collection-1',
    rawInputText: 'https://www.zhihu.com/collection/collection-1',
    comment: '',
    skipFetch: false,
  },
  {
    type: ConstTaskConfig.Const_Task_Type_专栏,
    id: 'column-1',
    rawInputText: 'https://www.zhihu.com/column/column-1',
    comment: '',
    skipFetch: false,
  },
]

function createWorkflow() {
  const workflow = new GenerateWorkflow()
  const sourceUnits = createSourceUnits()
  vi.spyOn(workflow as any, 'event').mockImplementation(() => undefined)
  vi.spyOn(workflow as any, 'log').mockImplementation(() => undefined)
  vi.spyOn(workflow as any, 'asyncGetUintPackageByFetchTaskWithLog').mockImplementation(
    async (_task: unknown, index: number) => sourceUnits[index],
  )
  return workflow
}

function createGenerateConfig(generateType: typeof ConstTaskConfig.Const_Default_Config.generateConfig.generateType) {
  return {
    ...ConstTaskConfig.Const_Default_Config.generateConfig,
    bookTitle: 'Configured book',
    maxItemInBook: 100,
    orderByList: [],
    generateType,
  }
}

function unitPageIds(unit: Package.Type_Unit_Item) {
  return unit.pageList.map((page) => {
    if (page.type !== 'article') {
      throw new Error(`unexpected page type: ${page.type}`)
    }
    return String(page.recordList[0].record.id)
  })
}

describe('generation strategies', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('single creates one book per source unit and derives each title from that unit', async () => {
    const workflow = createWorkflow()

    const books = await workflow.asyncGetColumnPackage({
      fetchTaskList,
      generateConfig: createGenerateConfig(ConstTaskConfig.Const_Generate_Type_独立输出电子书),
    })

    expect(books.map((book) => book.bookname)).toEqual([
      '收藏夹_Favorites(collection-1)',
      '专栏_Column(column-1)',
    ])
    expect(books.map((book) => book.unitList.map((unit) => unit.type))).toEqual([['collection'], ['column']])
    expect(books.map((book) => unitPageIds(book.unitList[0]))).toEqual([['article-a'], ['article-b']])
  })

  it('merge_by_task keeps source units as ordered chapters in one configured-title book', async () => {
    const workflow = createWorkflow()

    const books = await workflow.asyncGetColumnPackage({
      fetchTaskList,
      generateConfig: createGenerateConfig(
        ConstTaskConfig.Const_Generate_Type_合并输出电子书_按任务拆分章节,
      ),
    })

    expect(books).toHaveLength(1)
    expect(books[0].bookname).toBe('Configured book')
    expect(books[0].unitList.map((unit) => unit.type)).toEqual(['collection', 'column'])
    expect(books[0].unitList.map(unitPageIds)).toEqual([['article-a'], ['article-b']])
  })

  it('merge_by_all flattens source chapters into one mixed unit without changing page order', async () => {
    const workflow = createWorkflow()

    const books = await workflow.asyncGetColumnPackage({
      fetchTaskList,
      generateConfig: createGenerateConfig(
        ConstTaskConfig.Const_Generate_Type_合并输出电子书_内容打乱重排,
      ),
    })

    expect(books).toHaveLength(1)
    expect(books[0].bookname).toBe('Configured book')
    expect(books[0].unitList).toHaveLength(1)
    expect(books[0].unitList[0].type).toBe('mix')
    expect(unitPageIds(books[0].unitList[0])).toEqual(['article-a', 'article-b'])
  })

  it.each([
    ConstTaskConfig.Const_Generate_Type_独立输出电子书,
    ConstTaskConfig.Const_Generate_Type_合并输出电子书_按任务拆分章节,
    ConstTaskConfig.Const_Generate_Type_合并输出电子书_内容打乱重排,
  ])('fails %s generation when configured tasks all resolve to missing database entities', async (generateType) => {
    const workflow = new GenerateWorkflow()
    vi.spyOn(workflow as any, 'event').mockImplementation(() => undefined)
    vi.spyOn(workflow as any, 'log').mockImplementation(() => undefined)
    vi.spyOn(workflow, 'asyncGetUintPackageByFetchTask').mockResolvedValue(undefined)

    await expect(
      workflow.execute({
        fetchTaskList: [fetchTaskList[0]],
        generateConfig: createGenerateConfig(generateType),
        requestConfig: { ua: 'fixture', cookie: '' },
      } as any),
    ).rejects.toMatchObject({ code: AppErrorCode.BATCH_FAILED })
  })

  it('does not attribute an upstream partial outcome to a successful generate stage', async () => {
    const workflow = new GenerateWorkflow()
    const eventSpy = vi.spyOn(workflow as any, 'event').mockImplementation(() => undefined)
    vi.spyOn(workflow as any, 'log').mockImplementation(() => undefined)
    vi.spyOn(workflow, 'asyncGetUintPackageByFetchTask').mockResolvedValue(createSourceUnits()[0])
    vi.spyOn(workflow, 'generateEpub').mockResolvedValue(undefined)
    const context = { outcomeStatus: LogStatus.PARTIAL_SUCCESS } as any

    await expect(workflow.execute({
      fetchTaskList: [fetchTaskList[0]],
      generateConfig: createGenerateConfig(ConstTaskConfig.Const_Generate_Type_独立输出电子书),
      requestConfig: { ua: 'fixture', cookie: '' },
    } as any, context)).resolves.toBe(LogStatus.SUCCESS)

    const executeTerminal = eventSpy.mock.calls
      .map(([entry]) => entry)
      .find((entry) => entry.jobId === 'generate-execute' && entry.status !== LogStatus.START && entry.status !== LogStatus.PROGRESS)
    expect(executeTerminal?.status).toBe(LogStatus.SUCCESS)
    expect(context.outcomeStatus).toBe(LogStatus.PARTIAL_SUCCESS)
  })

  it('marks generation partial when one entity is missing but another book is generated', async () => {
    const workflow = new GenerateWorkflow()
    const sourceUnits = createSourceUnits()
    vi.spyOn(workflow as any, 'event').mockImplementation(() => undefined)
    vi.spyOn(workflow as any, 'log').mockImplementation(() => undefined)
    vi.spyOn(workflow, 'asyncGetUintPackageByFetchTask')
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(sourceUnits[1])
    const outputSpy = vi.spyOn(workflow, 'generateEpub').mockResolvedValue(undefined)
    const context = { outcomeStatus: LogStatus.SUCCESS } as any

    await expect(workflow.execute({
      fetchTaskList,
      generateConfig: createGenerateConfig(ConstTaskConfig.Const_Generate_Type_独立输出电子书),
      requestConfig: { ua: 'fixture', cookie: '' },
    } as any, context)).resolves.toBe(LogStatus.PARTIAL_SUCCESS)

    expect(outputSpy).toHaveBeenCalledTimes(1)
    expect(context.outcomeStatus).toBe(LogStatus.PARTIAL_SUCCESS)
  })
})
