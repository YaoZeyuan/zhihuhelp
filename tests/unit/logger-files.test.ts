import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PathConfig from '../../src/config/path'
import Logger from '../../src/library/logger'
import { LogEventCode, LogLevel, LogSource, LogStage, LogStatus } from '../../src/shared/logging/log_contract'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

describe('每日日志文件', () => {
  let sandbox: TestSandbox
  let previousLogPath: string

  beforeEach(() => {
    sandbox = createTestSandbox('logger')
    previousLogPath = PathConfig.logPath
    PathConfig.setLogPath(sandbox.logPath)
    Logger.setDebugMode(true)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    PathConfig.setLogPath(previousLogPath)
    Logger.setDebugMode(true)
    vi.restoreAllMocks()
    sandbox.cleanup()
  })

  it('将后端和前端记录分别写入每日 JSONL 文件', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 8, 12, 0, 0))

    Logger.event({
      eventCode: LogEventCode.FETCH_SUCCESS,
      level: LogLevel.INFO,
      stage: LogStage.FETCH,
      status: LogStatus.SUCCESS,
      message: 'backend record',
    })
    Logger.event({
      eventCode: LogEventCode.FRONTEND_ACTION,
      source: LogSource.FRONTEND,
      level: LogLevel.INFO,
      stage: LogStage.FRONTEND,
      status: LogStatus.SUCCESS,
      message: 'frontend record',
    })

    expect(Logger.getLogFileList('runtime-jsonl').map((filePath) => path.basename(filePath))).toEqual([
      'runtime.2026-08-08.jsonl',
    ])
    expect(Logger.getLogFileList('frontend-jsonl').map((filePath) => path.basename(filePath))).toEqual([
      'frontend.runtime.2026-08-08.jsonl',
    ])
    expect(Logger.getLogFileList('runtime-text').map((filePath) => path.basename(filePath))).toEqual([
      'runtime.2026-08-08.log',
    ])
  })

  it('每类日志仅保留最近五个日期', () => {
    vi.useFakeTimers()
    for (let day = 1; day <= 6; day += 1) {
      vi.setSystemTime(new Date(2026, 0, day, 12, 0, 0))
      Logger.event({
        eventCode: LogEventCode.RUNTIME_GENERIC,
        level: LogLevel.INFO,
        message: `day-${day}`,
      })
    }

    expect(Logger.getLogFileList('runtime-jsonl').map((filePath) => path.basename(filePath))).toEqual([
      'runtime.2026-01-02.jsonl',
      'runtime.2026-01-03.jsonl',
      'runtime.2026-01-04.jsonl',
      'runtime.2026-01-05.jsonl',
      'runtime.2026-01-06.jsonl',
    ])
    expect(Logger.readRecentLogContent('runtime-jsonl')).not.toContain('day-1')
    expect(Logger.readRecentLogContent('runtime-jsonl')).toContain('day-6')
  })

  it('追加完整行，并在日志路径无法作为目录写入时安全降级', () => {
    for (let index = 0; index < 25; index += 1) {
      Logger.event({
        level: LogLevel.INFO,
        message: `record-${index}`,
      })
    }
    const lineList = fs.readFileSync(PathConfig.runtimeJsonlUri, 'utf8').trim().split('\n')
    expect(lineList).toHaveLength(25)
    expect(lineList.every((line) => JSON.parse(line).schemaVersion === 1)).toBe(true)

    const invalidDirectory = path.join(sandbox.rootPath, 'not-a-directory')
    fs.writeFileSync(invalidDirectory, 'file')
    PathConfig.setLogPath(invalidDirectory)
    expect(() => Logger.event({ level: LogLevel.ERROR, message: 'write failure' })).not.toThrow()
    expect(Logger.getLastWriteFailure()).not.toBe('')
  })

  it('生产模式仅保留关键实体事件，调试模式启用详细记录', () => {
    Logger.setDebugMode(false)
    Logger.event({
      eventCode: LogEventCode.FETCH_START,
      jobId: 'entity-job',
      level: LogLevel.INFO,
      stage: LogStage.FETCH,
      status: LogStatus.START,
      message: 'verbose entity event',
    })
    expect(Logger.getLogFileList('runtime-jsonl')).toEqual([])

    Logger.event({
      eventCode: LogEventCode.WORKFLOW_START,
      level: LogLevel.INFO,
      stage: LogStage.CLI,
      status: LogStatus.START,
      message: 'critical workflow event',
    })
    expect(Logger.readRecentLogContent('runtime-jsonl')).toContain('critical workflow event')

    Logger.event({
      eventCode: LogEventCode.INIT_START,
      jobId: 'stage-init-run',
      level: LogLevel.INFO,
      stage: LogStage.INIT,
      status: LogStatus.START,
      message: 'canonical init start',
    })
    Logger.event({
      eventCode: LogEventCode.INIT_SUCCESS,
      jobId: 'stage-init-run',
      level: LogLevel.INFO,
      stage: LogStage.INIT,
      status: LogStatus.SUCCESS,
      message: 'canonical init success',
    })
    const productionLog = Logger.readRecentLogContent('runtime-jsonl')
    expect(productionLog).toContain('canonical init start')
    expect(productionLog).toContain('canonical init success')

    Logger.event({
      eventCode: LogEventCode.OUTPUT_START,
      jobId: 'generate-book-1',
      level: LogLevel.INFO,
      stage: LogStage.OUTPUT,
      status: LogStatus.START,
      message: 'production output start',
    })
    Logger.event({
      eventCode: LogEventCode.OUTPUT_PROGRESS,
      jobId: 'generate-book-1',
      level: LogLevel.INFO,
      stage: LogStage.OUTPUT,
      status: LogStatus.PROGRESS,
      message: 'production output progress',
    })
    const productionOutputLog = Logger.readRecentLogContent('runtime-jsonl')
    expect(productionOutputLog).toContain('production output start')
    expect(productionOutputLog).toContain('production output progress')

    Logger.setDebugMode(true)
    Logger.event({
      eventCode: LogEventCode.FETCH_START,
      jobId: 'entity-job',
      level: LogLevel.INFO,
      stage: LogStage.FETCH,
      status: LogStatus.START,
      message: 'debug entity event',
    })
    expect(Logger.readRecentLogContent('runtime-jsonl')).toContain('debug entity event')
  })
})
