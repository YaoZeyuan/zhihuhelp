import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const debugLogMock = vi.hoisted(() => ({
  append: vi.fn(),
  invokeElectronApi: vi.fn(),
}))

vi.mock('~/src/library/debug_log', () => ({ default: debugLogMock }))

import DbExplorer from '../../client/src/page/home/component/db_explorer'

describe('数据库浏览器失败状态', () => {
  beforeEach(() => {
    debugLogMock.append.mockReset()
    debugLogMock.invokeElectronApi.mockReset().mockImplementation((channel: string) => {
      if (channel === 'get-db-summary-info') {
        return Promise.reject(new Error('SQLite 文件暂时不可读'))
      }
      if (channel === 'get-db-record-list') {
        return Promise.resolve({
          recordList: [],
          total: 0,
          pageNo: 0,
          pageSize: 5,
        })
      }
      return Promise.resolve(undefined)
    })
  })

  it('汇总 IPC 拒绝时结束加载并显示明确空状态', async () => {
    render(<DbExplorer />)

    expect(await screen.findByText('无法读取数据库汇总')).toBeInTheDocument()
    expect(screen.getByText(/数据库汇总加载失败：SQLite 文件暂时不可读/)).toBeInTheDocument()
    expect(screen.getByText('暂无可用数据库汇总')).toBeInTheDocument()
    expect(screen.getByText('当前分类暂无缓存记录')).toBeInTheDocument()
    expect(screen.queryByText(/回答: /)).not.toBeInTheDocument()
  })

  it('不将记录列表 IPC 拒绝伪装为普通空列表', async () => {
    debugLogMock.invokeElectronApi.mockImplementation((channel: string) => {
      if (channel === 'get-db-summary-info') {
        return Promise.resolve({
          answer: 3,
          article: 0,
          pin: 0,
          author: 0,
          question: 0,
          collection: 0,
          column: 0,
          topic: 0,
        })
      }
      if (channel === 'get-db-record-list') {
        return Promise.reject(new Error('查询回答记录失败'))
      }
      return Promise.resolve(undefined)
    })

    render(<DbExplorer />)

    const alert = (await screen.findByText('无法读取缓存记录')).closest('[role="alert"]')
    expect(alert).not.toBeNull()
    expect(within(alert as HTMLElement).getByText(/缓存记录加载失败：查询回答记录失败/)).toBeInTheDocument()
    expect(screen.getByText('暂无可用缓存记录')).toBeInTheDocument()
    expect(screen.queryByText('当前分类暂无缓存记录')).not.toBeInTheDocument()
    expect(screen.getByText(/回答:\s*3/)).toBeInTheDocument()
  })
})
