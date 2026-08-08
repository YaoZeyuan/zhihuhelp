import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const debugLogMock = vi.hoisted(() => ({
  append: vi.fn(),
  invokeElectronApi: vi.fn(),
}))

vi.mock('~/src/library/debug_log', () => ({ default: debugLogMock }))
vi.mock('../../client/src/page/home/component/customer_task/component/task_item/index', () => ({
  default: () => React.createElement('div', { 'data-testid': 'default-task-row' }),
}))
vi.mock('../../client/src/page/home/component/customer_task/component/order_item/index', () => ({
  default: () => React.createElement('div', { 'data-testid': 'default-order-row' }),
}))

import CustomerTask from '../../client/src/page/home/component/customer_task'
import TaskConfigAdapter from '../../client/src/page/home/component/customer_task/library/task_config_adapter'
import * as Context from '../../client/src/page/home/resource/context'
import * as ConstsPage from '../../client/src/resource/const/page'

function renderCustomerTask() {
  return render(
    <Context.CurrentTab.Provider
      value={{
        currentTab: ConstsPage.Const_Page_任务管理,
        setCurrentTab: vi.fn(),
      }}
    >
      <CustomerTask />
    </Context.CurrentTab.Provider>,
  )
}

describe('customer task config failure state', () => {
  beforeEach(() => {
    debugLogMock.append.mockReset()
    debugLogMock.invokeElectronApi.mockReset().mockImplementation((channel: string) => {
      if (channel === 'zhihu-http-get') {
        return Promise.resolve({})
      }
      if (channel === 'get-task-default-title') {
        return Promise.resolve('')
      }
      return Promise.resolve(undefined)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps a safe default form and blocks start when config IPC rejects', async () => {
    const adapterSpy = vi.spyOn(TaskConfigAdapter, 'taskConfigToForm')
    debugLogMock.invokeElectronApi.mockImplementation((channel: string) => {
      if (channel === 'get-common-config') {
        return Promise.reject(new Error('旧 schemaVersion=1 已被拒绝'))
      }
      if (channel === 'zhihu-http-get') {
        return Promise.resolve({})
      }
      return Promise.resolve('')
    })

    renderCustomerTask()

    const alert = (await screen.findByText('任务配置不可用')).closest('[role="alert"]')
    expect(alert).not.toBeNull()
    expect(within(alert as HTMLElement).getByText(/旧 schemaVersion=1 已被拒绝/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/粘贴知乎链接，每行一个/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /开\s*始/ })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'HTML' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'EPUB' })).toBeChecked()
    expect(adapterSpy).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /开\s*始/ }))
    await waitFor(() => {
      expect(debugLogMock.invokeElectronApi).not.toHaveBeenCalledWith(
        'start-customer-task',
        expect.anything(),
      )
    })
  })

  it('catches an invalid config payload without blanking the page', async () => {
    debugLogMock.invokeElectronApi.mockImplementation((channel: string) => {
      if (channel === 'get-common-config') {
        return Promise.resolve({ schemaVersion: 2, request: {} })
      }
      if (channel === 'zhihu-http-get') {
        return Promise.resolve({})
      }
      return Promise.resolve('')
    })

    renderCustomerTask()

    const alert = (await screen.findByText('任务配置不可用')).closest('[role="alert"]')
    expect(alert).not.toBeNull()
    expect(within(alert as HTMLElement).getByText(/任务配置加载失败/)).toBeInTheDocument()
    expect(within(alert as HTMLElement).getByText(/当前已载入安全默认值/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /开\s*始/ })).toBeDisabled()
    expect(screen.getByPlaceholderText(/粘贴知乎链接，每行一个/)).toBeInTheDocument()
  })
})
