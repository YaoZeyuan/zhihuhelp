import { describe, expect, it } from 'vitest'
import TaskConfigAdapter from '../../client/src/page/home/component/customer_task/library/task_config_adapter'
import { Const_Default_Config } from '../../client/src/resource/const/task_config'

describe('客户端任务配置适配器', () => {
  it('保留可编辑字段、隐藏 Cookie 并规范化仅 HTML 配置', () => {
    const config = {
      ...Const_Default_Config,
      request: {
        ...Const_Default_Config.request,
        cookie: 'must-not-leak',
      },
      tasks: [
        {
          type: 'answer' as const,
          id: '1997069426684610035',
          rawInputText: 'https://www.zhihu.com/question/1/answer/1997069426684610035',
          comment: 'test task',
          skipFetch: true,
        },
      ],
      generate: {
        ...Const_Default_Config.generate,
        title: 'test book',
        comment: 'test comment',
        maxItemsPerBook: 12,
        outputFormats: ['html' as const],
      },
    }

    const form = TaskConfigAdapter.taskConfigToForm(config)
    expect(JSON.stringify(form)).not.toContain('must-not-leak')
    expect(form.outputFormats).toEqual(['html', 'markdown', 'epub'])
    const converted = TaskConfigAdapter.formToTaskConfig(form)
    expect(converted.tasks).toEqual(config.tasks)
    expect(converted.generate).toEqual({
      ...config.generate,
      outputFormats: ['html', 'markdown', 'epub'],
    })
    expect(converted.request.cookie).toBe('')
  })

  it('丢弃不完整任务项并忽略被篡改的表单输出格式', () => {
    const form = TaskConfigAdapter.taskConfigToForm(Const_Default_Config)
    form.taskItemList = [
      {
        type: 'answer',
        id: '',
        rawInputText: 'invalid',
        comment: '',
        skipFetch: false,
      },
    ]
    form.outputFormats = ['epub']

    const converted = TaskConfigAdapter.formToTaskConfig(form)
    expect(converted.tasks).toEqual([])
    expect(converted.generate.outputFormats).toEqual(Const_Default_Config.generate.outputFormats)
  })

  it.each([
    [['html'] as const],
    [['epub'] as const],
    [[] as const],
  ])('加载和保存时规范化旧版输出格式子集 %j', (outputFormats) => {
    const legacyConfig = {
      ...Const_Default_Config,
      generate: {
        ...Const_Default_Config.generate,
        outputFormats: [...outputFormats],
      },
    }

    const form = TaskConfigAdapter.taskConfigToForm(legacyConfig)
    expect(form.outputFormats).toEqual(['html', 'markdown', 'epub'])
    expect(TaskConfigAdapter.formToTaskConfig(form).generate.outputFormats).toEqual([
      'html',
      'markdown',
      'epub',
    ])
  })
})
