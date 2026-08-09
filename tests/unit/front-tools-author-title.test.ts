import { afterEach, describe, expect, it, vi } from 'vitest'
import AuthorApi from '../../src/api/single/author'
import * as ConstTaskConfig from '../../src/constant/task_config'
import { asyncGetTaskDefaultTitle } from '../../src/library/util/front_tools'

const stableAuthorId = '7eb8dd6d1e665c9b53832a0d8ab3a4c2'
const canonicalUrlToken = 'Hentioe'

const ordinaryAuthorTaskCases = [
  ConstTaskConfig.Const_Task_Type_用户提问过的所有问题,
  ConstTaskConfig.Const_Task_Type_用户的所有回答,
  ConstTaskConfig.Const_Task_Type_用户发布的所有文章,
  ConstTaskConfig.Const_Task_Type_用户发布的所有想法,
  ConstTaskConfig.Const_Task_Type_用户赞同过的所有回答,
  ConstTaskConfig.Const_Task_Type_用户赞同过的所有文章,
  ConstTaskConfig.Const_Task_Type_用户关注过的所有问题,
] as const

function createAuthorRecord(urlToken = canonicalUrlToken) {
  return {
    id: stableAuthorId,
    url_token: urlToken,
    name: '测试作者',
  }
}

describe('GUI 用户任务默认标题', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(ordinaryAuthorTaskCases)('普通用户任务 %s 使用接口返回的规范 token', async (taskType) => {
    vi.spyOn(AuthorApi, 'asyncGetAutherInfo').mockResolvedValue(createAuthorRecord() as never)

    const title = await asyncGetTaskDefaultTitle(taskType, stableAuthorId)

    expect(title).toContain(`测试作者(${canonicalUrlToken})`)
    expect(title).not.toContain(stableAuthorId)
  })

  it('规范 token 缺失时使用接口返回的稳定 ID', async () => {
    vi.spyOn(AuthorApi, 'asyncGetAutherInfo').mockResolvedValue(createAuthorRecord('') as never)

    const title = await asyncGetTaskDefaultTitle(ConstTaskConfig.Const_Task_Type_用户的所有回答, 'request-alias')

    expect(title).toContain(`测试作者(${stableAuthorId})`)
    expect(title).not.toContain('request-alias')
  })

  it('销号接口返回无关模板身份时保留原始任务标识', async () => {
    vi.spyOn(AuthorApi, 'asyncGetBlockAccountAutherInfo').mockResolvedValue({
      id: 'deleted-template-id',
      url_token: 'zhihuadmin',
      name: '已注销账号',
    } as never)

    const title = await asyncGetTaskDefaultTitle(ConstTaskConfig.Const_Task_Type_销号用户的所有回答, stableAuthorId)

    expect(title).toContain(`已注销账号(${stableAuthorId})`)
    expect(title).not.toContain('zhihuadmin')
  })

  it('销号接口返回可对应的真实身份时显示规范 token', async () => {
    vi.spyOn(AuthorApi, 'asyncGetBlockAccountAutherInfo').mockResolvedValue(createAuthorRecord() as never)

    const title = await asyncGetTaskDefaultTitle(ConstTaskConfig.Const_Task_Type_销号用户的所有回答, stableAuthorId)

    expect(title).toContain(`测试作者(${canonicalUrlToken})`)
  })
})
