import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import CommonConfig from '../../src/config/common'
import PathConfig from '../../src/config/path'
import InitWorkflow from '../../src/application/workflow/init/init_workflow'
import Knex from '../../src/library/knex'
import { createRunContext } from '../../src/shared/runtime/run_context'
import { createDefaultTaskConfig } from '../../src/domain/task/task_config'
import { readTaskConfig, writeTaskConfig } from '../../src/shared/config/task_config_parser'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

describe('隔离运行时初始化', () => {
  let sandbox: TestSandbox
  let originalConfigPath: string
  let originalDatabasePath: string
  let originalOutputPath: string
  let originalCachePath: string
  let originalLogPath: string

  beforeEach(() => {
    sandbox = createTestSandbox('integration-init')
    originalConfigPath = PathConfig.configUri
    originalDatabasePath = CommonConfig.db_uri
    originalOutputPath = PathConfig.outputPath
    originalCachePath = PathConfig.cachePath
    originalLogPath = PathConfig.logPath
  })

  afterEach(async () => {
    await Knex.destroy()
    PathConfig.setConfigUri(originalConfigPath)
    PathConfig.setOutputPath(originalOutputPath)
    PathConfig.setCachePath(originalCachePath)
    PathConfig.setLogPath(originalLogPath)
    CommonConfig.setDatabaseUri(originalDatabasePath)
    sandbox.cleanup()
  })

  it('仅在沙箱内创建配置、SQLite schema、缓存、日志和输出', async () => {
    const config = createDefaultTaskConfig()
    writeTaskConfig(sandbox.configPath, config)
    const context = createRunContext({
      configPath: sandbox.configPath,
      databasePath: sandbox.databasePath,
      cachePath: sandbox.cachePath,
      logPath: sandbox.logPath,
      outputPath: sandbox.outputPath,
      skipUpgradeCheck: true,
      traceId: 'integration-trace',
      trigger: 'cli',
    })

    await new InitWorkflow().execute({ rebase: false }, context)

    expect(readTaskConfig(sandbox.configPath)).toEqual(config)
    expect(fs.existsSync(sandbox.databasePath)).toBe(true)
    expect(fs.existsSync(sandbox.cachePath)).toBe(true)
    expect(fs.existsSync(sandbox.logPath)).toBe(true)
    expect(fs.existsSync(sandbox.outputPath)).toBe(true)
    for (const legacyFormatDirectory of ['html', 'markdown', 'epub']) {
      expect(fs.existsSync(path.join(sandbox.outputPath, legacyFormatDirectory))).toBe(false)
    }

    const tableRows = await Knex.raw("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    expect(JSON.stringify(tableRows)).toContain('Answer')
    expect(JSON.stringify(tableRows)).toContain('Author')
  })
})
