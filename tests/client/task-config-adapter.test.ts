import { describe, expect, it } from 'vitest'
import TaskConfigAdapter from '../../client/src/page/home/component/customer_task/library/task_config_adapter'
import { Const_Default_Config } from '../../client/src/resource/const/task_config'

describe('client task config adapter', () => {
  it('preserves editable fields, hides Cookie and normalizes an HTML-only config', () => {
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

  it('drops incomplete task items and ignores manipulated form output formats', () => {
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
  ])('normalizes legacy output format subset %j when loading and saving', (outputFormats) => {
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
