import { describe, expect, it } from 'vitest'
import GenerateWorkflow from '../../src/application/workflow/generate/customer'
import * as Package from '../../src/application/workflow/generate/resource/library/package'
import * as ConstTaskConfig from '../../src/constant/task_config'

function createUnit(itemCount: number): Package.Unit_混合类型 {
  const page = new Package.Page_Article()
  for (let index = 0; index < itemCount; index += 1) {
    page.add({
      actionAt: index,
      record: {
        id: `article-${index}`,
        title: `article-${index}`,
      } as never,
    })
  }
  return new Package.Unit_混合类型({ pageList: itemCount === 0 ? [] : [page] })
}

function split(itemCountList: number[], maxItemInBook: number) {
  const workflow = new GenerateWorkflow()
  const generateConfig = {
    ...ConstTaskConfig.Const_Default_Config.generateConfig,
    maxItemInBook,
  }
  return workflow.autoSplitUnitPackage({
    unitItemList: itemCountList.map(createUnit),
    booktitle: 'boundary',
    generateConfig,
  })
}

function getColumnCounts(columnList: Package.Ebook_Column[]) {
  return columnList.map((column) => column.unitList.reduce((sum, unit) => sum + unit.getItemCount(), 0))
}

describe('ebook volume boundaries', () => {
  it.each([
    { items: [0], max: 10, expected: [0] },
    { items: [9], max: 10, expected: [9] },
    { items: [10], max: 10, expected: [10] },
    { items: [11], max: 10, expected: [10, 1] },
    { items: [4, 6, 3], max: 10, expected: [10, 3] },
    { items: [21], max: 10, expected: [10, 10, 1] },
  ])('splits $items with max=$max', ({ items, max, expected }) => {
    expect(getColumnCounts(split(items, max))).toEqual(expected)
  })

  it('rejects a non-positive maximum', () => {
    expect(() => split([1], 0)).toThrow('maxItemInBook 必须大于 0')
  })
})
