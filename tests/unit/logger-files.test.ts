import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PathConfig from '../../src/config/path'
import Logger from '../../src/library/logger'
import { LogEventCode, LogLevel, LogSource, LogStage, LogStatus } from '../../src/shared/logging/log_contract'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

describe('daily log files', () => {
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

  it('writes backend and frontend records to separate daily JSONL files', () => {
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

  it('keeps only the latest five dates for each log kind', () => {
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

  it('appends complete lines and degrades safely when the log path is not writable as a directory', () => {
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

  it('keeps only critical entity events in production and enables verbose records in debug mode', () => {
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
