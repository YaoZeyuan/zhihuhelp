import { describe, expect, it } from 'vitest'
import Util from '../../client/src/page/home/component/customer_task/library/util'

describe('任务 URL 输入', () => {
  it.each([
    ['用户', 'https://www.zhihu.com/people/jin-xu-liang', 'jin-xu-liang'],
    ['问题', 'https://www.zhihu.com/question/1955952667529545081', '1955952667529545081'],
    [
      '回答',
      'https://www.zhihu.com/question/1955952667529545081/answer/1997069426684610035',
      '1997069426684610035',
    ],
    ['文章', 'https://zhuanlan.zhihu.com/p/2044554555665428776', '2044554555665428776'],
    ['想法', 'https://www.zhihu.com/pin/2067239959539487399', '2067239959539487399'],
    ['话题', 'https://www.zhihu.com/topic/19659568/hot', '19659568'],
    ['收藏夹', 'https://www.zhihu.com/collection/37171281', '37171281'],
    ['专栏', 'https://www.zhihu.com/column/c_144661311', 'c_144661311'],
  ])('提取%s的标识符', (_label, rawInputText, expectedId) => {
    expect(Util.createTaskItemFromRawInput({ rawInputText }).id).toBe(expectedId)
  })

  it('修剪并过滤多行输入，并将不支持的 URL 标记为无效', () => {
    const taskList = Util.createTaskItemListFromText({
      rawInputText: '\n https://www.zhihu.com/question/1955952667529545081 \n\ninvalid-url\n',
    })
    expect(taskList).toHaveLength(2)
    expect(taskList[0].rawInputText).toBe('https://www.zhihu.com/question/1955952667529545081')
    expect(taskList[1].id).toBe('')
    expect(Util.getTaskItemError(taskList[1])).not.toBe('')
  })
})
