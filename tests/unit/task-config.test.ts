import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createDefaultTaskConfig, fromLegacyTaskConfig, imageQualityList, toLegacyTaskConfig } from '../../src/domain/task/task_config'
import { parseTaskConfig, readTaskConfig, writeTaskConfig } from '../../src/shared/config/task_config_parser'
import * as SharedTaskSchema from '../../src/shared/config/task_schema'
import * as BackendTaskConstants from '../../src/constant/task_config'
import { createTestSandbox } from '../helpers/sandbox'

describe('任务配置 schema', () => {
  it('从共享 schema 派生后端任务和图片常量', () => {
    expect(BackendTaskConstants.Const_Task_Type_回答).toBe(SharedTaskSchema.Const_Task_Type_回答)
    expect(BackendTaskConstants.Const_Image_Quilty_高清).toBe('hd')
    expect(BackendTaskConstants.Const_Image_Quilty_原图).toBe('raw')
    expect(imageQualityList).toEqual([...SharedTaskSchema.imageQualityList])
  })
  it('在隔离目录中往返读写当前 schema', () => {
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

  it('拒绝旧 schema 并给出诊断，而非迁移', () => {
    expect(() =>
      parseTaskConfig({
        requestConfig: { cookie: '' },
        fetchTaskList: [],
        generateConfig: {},
      }),
    ).toThrow(/schema/i)
  })

  it('将旧输出格式子集规范为三个必需产物', () => {
    const config = createDefaultTaskConfig()
    config.generate.outputFormats = ['html']
    const legacy = toLegacyTaskConfig(config)
    expect(legacy.generateConfig.outputFormats).toEqual(['html', 'markdown', 'epub'])
    legacy.generateConfig.outputFormats = ['epub']
    expect(fromLegacyTaskConfig(legacy).generate.outputFormats).toEqual([
      'html',
      'markdown',
      'epub',
    ])
    expect(
      parseTaskConfig({
        ...config,
        generate: { ...config.generate, outputFormats: ['html'] },
      }).generate.outputFormats,
    ).toEqual(['html', 'markdown', 'epub'])
  })
})
