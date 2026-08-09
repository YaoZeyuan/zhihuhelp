import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdmZip from 'adm-zip'
import BatchFetchAnswer from '../../src/api/batch/answer'
import AnswerModel from '../../src/model/answer'
import CommonConfig from '../../src/config/common'
import HttpClient from '../../src/library/http'
import InitWorkflow from '../../src/application/workflow/init/init_workflow'
import Knex from '../../src/library/knex'
import PathConfig from '../../src/config/path'
import RunTaskWorkflow from '../../src/application/workflow/run_task/run_task_workflow'
import { MarkdownGenerator } from '../../src/application/workflow/generate/library/markdown'
import { createDefaultTaskConfig } from '../../src/domain/task/task_config'
import { createRunContext } from '../../src/shared/runtime/run_context'
import { writeTaskConfig } from '../../src/shared/config/task_config_parser'
import { LogStatus, StructuredLogRecord } from '../../src/shared/logging/log_contract'
import { validateFixtureEnvelope } from '../helpers/fixture'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

type MutableRuntimeState = {
  configPath: string
  databasePath: string
  outputPath: string
  cachePath: string
  logPath: string
}

function readAnswerFixture() {
  const fixturePath = path.resolve(__dirname, '../../fixtures/zhihu/online/answer-1997069426684610035.json')
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
  validateFixtureEnvelope(fixture)
  const rawEntity = fixture.data?.entity ?? fixture.data
  return {
    ...rawEntity,
    id: String(rawEntity.id),
    type: 'answer',
    content: '<p>offline fixture answer</p>',
    voteup_count: 1,
    comment_count: 0,
    created_time: rawEntity.created_time ?? 1,
    updated_time: rawEntity.updated_time ?? 1,
    author: {
      ...rawEntity.author,
      id: rawEntity.author?.id ?? 'fixture-author-id',
      url_token: 'fixture-author',
      name: rawEntity.author?.name ?? 'Fixture Author',
      avatar_url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
      headline: '',
    },
    question: {
      ...rawEntity.question,
      id: String(rawEntity.question?.id ?? 'fixture-question'),
      title: rawEntity.question?.title ?? 'Fixture Question',
      detail: '',
      answer_count: 1,
      follower_count: 0,
      created: 1,
      updated_time: 1,
    },
  }
}

function listFilesRecursively(rootPath: string): string[] {
  if (!fs.existsSync(rootPath)) {
    return []
  }
  return fs.readdirSync(rootPath, { withFileTypes: true }).flatMap((entry) => {
    const targetPath = path.join(rootPath, entry.name)
    return entry.isDirectory() ? listFilesRecursively(targetPath) : [targetPath]
  })
}

function readRuntimeRecords(logPath: string): StructuredLogRecord[] {
  return fs
    .readdirSync(logPath)
    .filter((fileName) => /^runtime\..+\.jsonl$/.test(fileName))
    .flatMap((fileName) => fs.readFileSync(path.join(logPath, fileName), 'utf8').split(/\r?\n/))
    .filter(Boolean)
    .map((line) => JSON.parse(line) as StructuredLogRecord)
}

function expectCompleteEpub(epubPath: string) {
  const archive = fs.readFileSync(epubPath)
  expect(archive.length).toBeGreaterThan(1024)
  expect(archive.readUInt32LE(0)).toBe(0x04034b50)
  expect(archive.readUInt16LE(8)).toBe(0)
  const firstNameLength = archive.readUInt16LE(26)
  expect(archive.subarray(30, 30 + firstNameLength).toString('utf8')).toBe('mimetype')
  const zip = new AdmZip(archive)
  const entryNames = zip.getEntries().map((entry) => entry.entryName.replace(/\\/g, '/'))
  const entryNameSet = new Set(entryNames)
  expect(entryNameSet.has('META-INF/container.xml')).toBe(true)
  expect(entryNameSet.has('OEBPS/content.opf')).toBe(true)
  expect(entryNameSet.has('OEBPS/toc.xhtml')).toBe(true)
  const htmlEntryNames = entryNames.filter((entryName) => /^OEBPS\/html\/.+\.html$/i.test(entryName))
  expect(htmlEntryNames.length).toBeGreaterThan(0)

  const opf = zip.readAsText('OEBPS/content.opf')
  const manifestItems = [...opf.matchAll(/<item\s+href="([^"]+)"\s+id="([^"]+)"/g)]
  const manifestIds = new Set(manifestItems.map((match) => match[2]))
  const bodyHrefs = manifestItems.map((match) => match[1]).filter((href) => href.startsWith('html/'))
  expect(bodyHrefs.length).toBeGreaterThan(0)
  for (const href of bodyHrefs) {
    expect(entryNameSet.has(`OEBPS/${href}`)).toBe(true)
  }
  const spineIds = [...opf.matchAll(/<itemref\s+idref="([^"]+)"/g)].map((match) => match[1])
  expect(spineIds.length).toBeGreaterThan(0)
  for (const id of spineIds) {
    expect(manifestIds.has(id)).toBe(true)
  }
}

function expectEveryStartedOperationToHaveOneTerminal(records: StructuredLogRecord[]) {
  const terminalStatusSet = new Set([
    LogStatus.SUCCESS,
    LogStatus.PARTIAL_SUCCESS,
    LogStatus.FAILURE,
  ])
  for (const startRecord of records.filter((record) => record.status === LogStatus.START)) {
    const matchingTerminalList = records.filter((record) =>
      record.runId === startRecord.runId
      && record.stage === startRecord.stage
      && (record.jobId ?? '__stage__') === (startRecord.jobId ?? '__stage__')
      && terminalStatusSet.has(record.status as typeof LogStatus.SUCCESS),
    )
    expect(
      matchingTerminalList,
      `expected one terminal for ${startRecord.stage}/${startRecord.jobId ?? '__stage__'}`,
    ).toHaveLength(1)
  }
}

describe('fixture-driven persistence and sandbox workflow', () => {
  let sandbox: TestSandbox
  let originalState: MutableRuntimeState

  beforeEach(() => {
    sandbox = createTestSandbox('fixture-workflow')
    originalState = {
      configPath: PathConfig.configUri,
      databasePath: CommonConfig.db_uri,
      outputPath: PathConfig.outputPath,
      cachePath: PathConfig.cachePath,
      logPath: PathConfig.logPath,
    }
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(async () => {
    await Knex.destroy()
    PathConfig.setConfigUri(originalState.configPath)
    PathConfig.setOutputPath(originalState.outputPath)
    PathConfig.setCachePath(originalState.cachePath)
    PathConfig.setLogPath(originalState.logPath)
    CommonConfig.setDatabaseUri(originalState.databasePath)
    vi.restoreAllMocks()
    sandbox.cleanup()
  })

  it('feeds a captured fixture through the single API and real Answer model into isolated SQLite', async () => {
    const answerRecord = readAnswerFixture()
    const context = createRunContext({
      configPath: sandbox.configPath,
      databasePath: sandbox.databasePath,
      cachePath: sandbox.cachePath,
      logPath: sandbox.logPath,
      outputPath: sandbox.outputPath,
      skipUpgradeCheck: true,
      traceId: 'fixture-persistence',
    })
    await new InitWorkflow().execute({ rebase: false }, context)
    const getSpy = vi.spyOn(HttpClient, 'get').mockResolvedValue(answerRecord as never)

    const outcome = await new BatchFetchAnswer().fetchListAndSaveToDb([answerRecord.id])
    const persistedRecord = await AnswerModel.asyncGetAnswer(answerRecord.id)

    expect(getSpy).toHaveBeenCalledWith(
      `https://api.zhihu.com/answers/${answerRecord.id}`,
      expect.objectContaining({ params: expect.any(Object) }),
    )
    expect(persistedRecord).toMatchObject({
      id: answerRecord.id,
      author: { id: answerRecord.author.id },
      question: { id: answerRecord.question.id },
    })
    expect(outcome).toMatchObject({ status: 'success', successCount: 1, failureCount: 0 })
    expect(await AnswerModel.asyncGetAnswerCount()).toBe(1)
    const runtimeLog = fs
      .readdirSync(sandbox.logPath)
      .filter((fileName) => /^runtime\..+\.jsonl$/.test(fileName))
      .map((fileName) => fs.readFileSync(path.join(sandbox.logPath, fileName), 'utf8'))
      .join('\n')
    expect(runtimeLog).toContain('"stage":"persist"')
    expect(runtimeLog).toContain('"jobId":"fetch-BatchFetchAnswer-1-')
    expect(fs.realpathSync(sandbox.databasePath).startsWith(fs.realpathSync(sandbox.rootPath))).toBe(true)
  })

  it('runs init, skipped fetch, database-backed generation and forced HTML/Markdown/EPUB output entirely in the sandbox', async () => {
    const answerRecord = readAnswerFixture()
    const config = createDefaultTaskConfig()
    config.tasks = [
      {
        type: 'answer',
        id: answerRecord.id,
        rawInputText: `fixture://answer/${answerRecord.id}`,
        comment: 'offline integration fixture',
        skipFetch: true,
      },
    ]
    config.generate.title = 'fixture-workflow-book'
    config.generate.imageQuality = 'none'
    config.generate.maxItemsPerBook = 10
    config.generate.outputFormats = ['html', 'epub']
    writeTaskConfig(sandbox.configPath, config)

    const options = {
      configPath: sandbox.configPath,
      databasePath: sandbox.databasePath,
      cachePath: sandbox.cachePath,
      logPath: sandbox.logPath,
      outputPath: sandbox.outputPath,
      skipUpgradeCheck: true,
      traceId: 'fixture-full-run',
      runId: 'fixture-full-run-id',
      trigger: 'cli' as const,
      rebase: false,
    }
    const workflow = new RunTaskWorkflow()
    // Database setup is a separate workflow and therefore uses its own runId.
    await workflow.init({
      ...options,
      traceId: 'fixture-setup',
      runId: 'fixture-setup-run-id',
    })
    await AnswerModel.asyncReplaceAnswer(answerRecord as never)

    const result = await workflow.run(options)
    const outputFileList = listFilesRecursively(sandbox.outputPath)
    const runtimeLog = fs
      .readdirSync(sandbox.logPath)
      .filter((fileName) => /^runtime\..+\.jsonl$/.test(fileName))
      .map((fileName) => fs.readFileSync(path.join(sandbox.logPath, fileName), 'utf8'))
      .join('\n')

    expect(result.outcomeStatus).toBe('success')
    expect(result.runId).toBe('fixture-full-run-id')
    expect(outputFileList.some((filePath) => filePath.endsWith('.epub'))).toBe(true)
    expect(outputFileList.some((filePath) => filePath.endsWith('.html'))).toBe(true)
    expect(outputFileList.some((filePath) => filePath.endsWith('.md'))).toBe(true)
    expect(outputFileList.filter((filePath) => filePath.endsWith('.md'))).toHaveLength(
      outputFileList.filter((filePath) => filePath.endsWith('.html')).length,
    )
    expect(runtimeLog).toContain('"stage":"init"')
    expect(runtimeLog).toContain('"stage":"fetch"')
    expect(runtimeLog).toContain('"stage":"generate"')
    expect(runtimeLog).toContain('"eventCode":"output.created"')
    expect(runtimeLog).toContain('"eventCode":"output.markdown.success"')
    expect(runtimeLog).toContain('"outputFormats":["html","markdown","epub"]')
    expect(outputFileList.every((filePath) => filePath.startsWith(sandbox.rootPath))).toBe(true)
    outputFileList.filter((filePath) => filePath.endsWith('.epub')).forEach(expectCompleteEpub)
    expectEveryStartedOperationToHaveOneTerminal(readRuntimeRecords(sandbox.logPath))
  })

  it('creates distinct real HTML, Markdown and EPUB files for a long-title two-volume book', async () => {
    const firstAnswer = readAnswerFixture()
    const secondAnswer = {
      ...firstAnswer,
      id: `${firstAnswer.id}-second`,
      content: '<p>second offline fixture answer</p>',
    }
    const config = createDefaultTaskConfig()
    config.tasks = [{
      type: 'question',
      id: String(firstAnswer.question.id),
      rawInputText: `fixture://question/${firstAnswer.question.id}`,
      comment: 'two-volume offline fixture',
      skipFetch: true,
    }]
    config.generate.title = `${'超长书名'.repeat(35)} /:*?`
    config.generate.mode = 'merge_by_task'
    config.generate.imageQuality = 'none'
    config.generate.maxItemsPerBook = 1
    config.generate.outputFormats = ['html', 'epub']
    writeTaskConfig(sandbox.configPath, config)

    const options = {
      configPath: sandbox.configPath,
      databasePath: sandbox.databasePath,
      cachePath: sandbox.cachePath,
      logPath: sandbox.logPath,
      outputPath: sandbox.outputPath,
      skipUpgradeCheck: true,
      traceId: 'fixture-two-volume',
      trigger: 'cli' as const,
      rebase: false,
    }
    const workflow = new RunTaskWorkflow()
    await workflow.init(options)
    await AnswerModel.asyncReplaceAnswer(firstAnswer as never)
    await AnswerModel.asyncReplaceAnswer(secondAnswer as never)

    await workflow.run(options)

    const outputFileList = listFilesRecursively(sandbox.outputPath)
    const epubFileList = outputFileList.filter((filePath) => filePath.endsWith('.epub'))
    const htmlIndexList = outputFileList.filter((filePath) => filePath.endsWith(`${path.sep}index.html`))
    const markdownIndexList = outputFileList.filter((filePath) => filePath.endsWith(`${path.sep}index.md`))
    expect(epubFileList).toHaveLength(2)
    expect(htmlIndexList).toHaveLength(2)
    expect(markdownIndexList).toHaveLength(2)
    expect(new Set(epubFileList.map((filePath) => path.basename(filePath))).size).toBe(2)
    expect(epubFileList.every((filePath) => path.basename(filePath).length <= 120)).toBe(true)
    epubFileList.forEach(expectCompleteEpub)
    expect(outputFileList.every((filePath) => filePath.startsWith(sandbox.rootPath))).toBe(true)
    expectEveryStartedOperationToHaveOneTerminal(readRuntimeRecords(sandbox.logPath))
  })

  it('keeps HTML and EPUB usable and reports partial_success when Markdown publishing fails', async () => {
    const answerRecord = readAnswerFixture()
    const config = createDefaultTaskConfig()
    config.tasks = [{
      type: 'answer',
      id: answerRecord.id,
      rawInputText: `fixture://answer/${answerRecord.id}`,
      comment: 'markdown failure fixture',
      skipFetch: true,
    }]
    config.generate.imageQuality = 'none'
    writeTaskConfig(sandbox.configPath, config)

    const options = {
      configPath: sandbox.configPath,
      databasePath: sandbox.databasePath,
      cachePath: sandbox.cachePath,
      logPath: sandbox.logPath,
      outputPath: sandbox.outputPath,
      skipUpgradeCheck: true,
      traceId: 'fixture-markdown-failure',
      runId: 'fixture-markdown-failure-run-id',
      trigger: 'cli' as const,
      rebase: false,
    }
    const workflow = new RunTaskWorkflow()
    await workflow.init({ ...options, runId: 'fixture-markdown-failure-setup' })
    await AnswerModel.asyncReplaceAnswer(answerRecord as never)
    vi.spyOn(MarkdownGenerator.prototype, 'generate').mockRejectedValue(
      new Error('fixture Markdown output is unavailable'),
    )

    const result = await workflow.run(options)
    const outputFileList = listFilesRecursively(sandbox.outputPath)
    const runtimeRecords = readRuntimeRecords(sandbox.logPath)

    expect(result.outcomeStatus).toBe(LogStatus.PARTIAL_SUCCESS)
    expect(outputFileList.some((filePath) => filePath.endsWith('.html'))).toBe(true)
    expect(outputFileList.some((filePath) => filePath.endsWith('.epub'))).toBe(true)
    expect(outputFileList.some((filePath) => filePath.endsWith('.md'))).toBe(false)
    outputFileList.filter((filePath) => filePath.endsWith('.epub')).forEach(expectCompleteEpub)
    expect(runtimeRecords).toEqual(expect.arrayContaining([
      expect.objectContaining({
        eventCode: 'output.markdown.failure',
        status: LogStatus.FAILURE,
      }),
      expect.objectContaining({
        eventCode: 'output.created',
        status: LogStatus.PARTIAL_SUCCESS,
      }),
    ]))
    expectEveryStartedOperationToHaveOneTerminal(runtimeRecords)
  })
})
