import { describe, expect, it } from 'vitest'
import * as Package from '../../src/application/workflow/generate/resource/library/package'
import * as ConstTaskConfig from '../../src/constant/task_config'

type ArticleSeed = {
  id: string
  actionAt: number
  created?: number
  updated?: number
  voteup_count?: number
  comment_count?: number
}

function createArticlePage(seedList: ArticleSeed[]) {
  const page = new Package.Page_Article()
  for (const seed of seedList) {
    const { actionAt, ...record } = seed
    page.add({
      actionAt,
      record: {
        title: seed.id,
        ...record,
      } as never,
    })
  }
  return page
}

function recordIds(page: Package.Page_Article) {
  return page.recordList.map((item) => String(item.record.id))
}

function pageIds(unit: Package.Unit_混合类型) {
  return unit.pageList.map((page) => {
    if (page.type !== 'article') {
      throw new Error(`unexpected page type: ${page.type}`)
    }
    return String(page.recordList[0].record.id)
  })
}

const seedList: ArticleSeed[] = [
  { id: 'middle', actionAt: 20, created: 200, updated: 2000, voteup_count: 2, comment_count: 20 },
  { id: 'low', actionAt: 10, created: 100, updated: 1000, voteup_count: 1, comment_count: 10 },
  { id: 'high', actionAt: 30, created: 300, updated: 3000, voteup_count: 3, comment_count: 30 },
]

describe('generation ordering', () => {
  it.each([
    ConstTaskConfig.Const_Order_With_记录加入时间_首次值,
    ConstTaskConfig.Const_Order_With_记录加入时间_末次值,
    ConstTaskConfig.Const_Order_With_创建时间,
    ConstTaskConfig.Const_Order_With_更新时间,
    ConstTaskConfig.Const_Order_With_赞同数,
    ConstTaskConfig.Const_Order_With_评论数,
  ])('sorts %s in both ascending and descending order', (orderWith) => {
    const ascending = createArticlePage(seedList)
    const descending = createArticlePage(seedList)

    ascending.sortRecordList({ orderWith, orderBy: ConstTaskConfig.Const_Order_By_Asc })
    descending.sortRecordList({ orderWith, orderBy: ConstTaskConfig.Const_Order_By_Desc })

    expect(recordIds(ascending)).toEqual(['low', 'middle', 'high'])
    expect(recordIds(descending)).toEqual(['high', 'middle', 'low'])
  })

  it('keeps insertion order for the none metric and for equal values', () => {
    const unsorted = createArticlePage(seedList)
    const equalValues = createArticlePage(
      seedList.map((seed) => ({ ...seed, voteup_count: 1 })),
    )

    unsorted.sortRecordList({
      orderWith: ConstTaskConfig.Const_Order_With_不排序,
      orderBy: ConstTaskConfig.Const_Order_By_Desc,
    })
    equalValues.sortRecordList({
      orderWith: ConstTaskConfig.Const_Order_With_赞同数,
      orderBy: ConstTaskConfig.Const_Order_By_Asc,
    })

    expect(recordIds(unsorted)).toEqual(['middle', 'low', 'high'])
    expect(recordIds(equalValues)).toEqual(['middle', 'low', 'high'])
  })

  it('normalizes a missing numeric property to zero', () => {
    const page = createArticlePage([
      { id: 'two', actionAt: 0, voteup_count: 2 },
      { id: 'missing', actionAt: 0 },
      { id: 'one', actionAt: 0, voteup_count: 1 },
    ])

    page.sortRecordList({
      orderWith: ConstTaskConfig.Const_Order_With_赞同数,
      orderBy: ConstTaskConfig.Const_Order_By_Asc,
    })

    expect(recordIds(page)).toEqual(['missing', 'one', 'two'])
  })

  it('applies multiple criteria with the first configured criterion as primary', () => {
    const unit = new Package.Unit_混合类型({
      pageList: [
        createArticlePage([{ id: 'a', actionAt: 0, voteup_count: 1, comment_count: 2 }]),
        createArticlePage([{ id: 'b', actionAt: 0, voteup_count: 2, comment_count: 3 }]),
        createArticlePage([{ id: 'c', actionAt: 0, voteup_count: 1, comment_count: 1 }]),
      ],
    })
    const orderByList = [
      { orderWith: ConstTaskConfig.Const_Order_With_赞同数, orderBy: ConstTaskConfig.Const_Order_By_Desc },
      { orderWith: ConstTaskConfig.Const_Order_With_评论数, orderBy: ConstTaskConfig.Const_Order_By_Asc },
    ]

    for (const orderConfig of [...orderByList].reverse()) {
      unit.sortPageList(orderConfig)
    }

    expect(pageIds(unit)).toEqual(['b', 'c', 'a'])
  })
})
