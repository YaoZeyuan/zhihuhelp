import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createDefaultTaskConfig, fromLegacyTaskConfig, toLegacyTaskConfig } from '../../src/domain/task/task_config'
import { parseTaskConfig, readTaskConfig, writeTaskConfig } from '../../src/shared/config/task_config_parser'
import { createTestSandbox } from '../helpers/sandbox'

describe('task config schema', () => {
  it('round-trips the current schema in an isolated directory', () => {
    const sandbox = createTestSandbox('task-config')
    try {
      const config = createDefaultTaskConfig()
      config.request.cookie = 'test-only-cookie'
      writeTaskConfig(sandbox.configPath, config)

      expect(readTaskConfig(sandbox.configPath)).toEqual(config)
      expect(fs.readFileSync(sandbox.configPath, 'utf8')).toContain('test-only-cookie')
    } finally {
      sandbox.cleanup()
    }
  })

  it('rejects the legacy schema with a diagnostic instead of migrating it', () => {
    expect(() =>
      parseTaskConfig({
        requestConfig: { cookie: '' },
        fetchTaskList: [],
        generateConfig: {},
      }),
    ).toThrow(/schema/i)
  })

  it('preserves selected output formats through the internal legacy workflow adapter', () => {
    const config = createDefaultTaskConfig()
    config.generate.outputFormats = ['html']
    const legacy = toLegacyTaskConfig(config)
    expect(legacy.generateConfig.outputFormats).toEqual(['html'])
    expect(fromLegacyTaskConfig(legacy).generate.outputFormats).toEqual(['html'])
  })
})
