import { describe, expect, it } from 'vitest'
import Util from '../../client/src/page/home/component/customer_task/library/util'

describe('task URL input', () => {
  it.each([
    ['author', 'https://www.zhihu.com/people/jin-xu-liang', 'jin-xu-liang'],
    ['question', 'https://www.zhihu.com/question/1955952667529545081', '1955952667529545081'],
    [
      'answer',
      'https://www.zhihu.com/question/1955952667529545081/answer/1997069426684610035',
      '1997069426684610035',
    ],
    ['article', 'https://zhuanlan.zhihu.com/p/2044554555665428776', '2044554555665428776'],
    ['pin', 'https://www.zhihu.com/pin/2067239959539487399', '2067239959539487399'],
    ['topic', 'https://www.zhihu.com/topic/19659568/hot', '19659568'],
    ['collection', 'https://www.zhihu.com/collection/37171281', '37171281'],
    ['column', 'https://www.zhihu.com/column/c_144661311', 'c_144661311'],
  ])('extracts the %s identifier', (_label, rawInputText, expectedId) => {
    expect(Util.createTaskItemFromRawInput({ rawInputText }).id).toBe(expectedId)
  })

  it('trims and filters multiline input, and marks unsupported URLs invalid', () => {
    const taskList = Util.createTaskItemListFromText({
      rawInputText: '\n https://www.zhihu.com/question/1955952667529545081 \n\ninvalid-url\n',
    })
    expect(taskList).toHaveLength(2)
    expect(taskList[0].rawInputText).toBe('https://www.zhihu.com/question/1955952667529545081')
    expect(taskList[1].id).toBe('')
    expect(Util.getTaskItemError(taskList[1])).not.toBe('')
  })
})
