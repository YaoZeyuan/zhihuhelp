import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const debugLogMock = vi.hoisted(() => ({
  append: vi.fn(),
  invokeElectronApi: vi.fn(),
}))

vi.mock('~/src/library/debug_log', () => ({ default: debugLogMock }))

vi.mock('antd', async () => {
  const ReactModule = await import('react')
  return {
    Switch: ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) =>
      ReactModule.createElement(
        'button',
        {
          type: 'button',
          role: 'switch',
          'aria-checked': checked,
          onClick: () => onChange(!checked),
        },
        checked ? 'enabled' : 'disabled',
      ),
    Tabs: ({
      items,
      activeKey,
      onChange,
      tabBarExtraContent,
    }: {
      items: Array<{ key: string; label: React.ReactNode; children: React.ReactNode }>
      activeKey: string
      onChange: (key: string) => void
      tabBarExtraContent: React.ReactNode
    }) => {
      const activeItem = items.find((item) => item.key === activeKey)
      return ReactModule.createElement(
        'div',
        null,
        ReactModule.createElement(
          'div',
          { role: 'tablist' },
          ...items.map((item) =>
            ReactModule.createElement(
              'button',
              {
                type: 'button',
                role: 'tab',
                key: item.key,
                'aria-selected': item.key === activeKey,
                onClick: () => onChange(item.key),
              },
              item.label,
            ),
          ),
        ),
        tabBarExtraContent,
        ReactModule.createElement('main', null, activeItem?.children),
      )
    },
  }
})

vi.mock('../../client/src/page/home/component/customer_task', () => ({
  default: () => React.createElement('div', null, 'task-page'),
}))
vi.mock('../../client/src/page/home/component/log', () => ({
  default: () => React.createElement('div', null, 'log-page'),
}))
vi.mock('../../client/src/page/home/component/debug', () => ({
  default: () => React.createElement('div', null, 'debug-page'),
}))
vi.mock('../../client/src/page/home/component/db_explorer', () => ({
  default: () => React.createElement('div', null, 'database-page'),
}))
vi.mock('../../client/src/page/home/component/login', () => ({
  default: () => React.createElement('div', null, 'login-page'),
}))

import Home from '../../client/src/page/home'

describe('home developer mode', () => {
  beforeEach(() => {
    localStorage.clear()
    debugLogMock.append.mockReset()
    debugLogMock.invokeElectronApi.mockReset().mockResolvedValue({ isDebug: false })
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      writable: true,
      value: {
        'get-debug-ipc-channel-list': vi.fn().mockResolvedValue({ isDebug: false }),
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('can add and remove the debug tab without changing the component Hook order', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<Home />)

    await waitFor(() => expect(debugLogMock.invokeElectronApi).toHaveBeenCalledTimes(1))
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      '任务管理',
      '运行日志',
      '数据浏览',
      '登录',
    ])
    expect(screen.queryByRole('tab', { name: '调试面板' })).not.toBeInTheDocument()
    expect(screen.getByText('task-page')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('switch'))
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      '任务管理',
      '运行日志',
      '调试面板',
      '数据浏览',
      '登录',
    ])
    fireEvent.click(screen.getByRole('tab', { name: '调试面板' }))
    expect(screen.getByText('debug-page')).toBeInTheDocument()
    expect(localStorage.getItem('zhihuhelp_developer_mode')).toBe('true')

    fireEvent.click(screen.getByRole('switch'))
    await waitFor(() => expect(screen.queryByRole('tab', { name: '调试面板' })).not.toBeInTheDocument())
    expect(screen.getByText('task-page')).toBeInTheDocument()
    expect(localStorage.getItem('zhihuhelp_developer_mode')).toBe('false')

    const errorText = consoleError.mock.calls.flat().map(String).join('\n')
    expect(errorText).not.toContain('change in the order of Hooks')
    expect(errorText).not.toContain('Rendered more hooks')
    expect(errorText).not.toContain('Rendered fewer hooks')
  })

  it('restores developer mode from local storage before the first render', async () => {
    localStorage.setItem('zhihuhelp_developer_mode', 'true')
    render(<Home />)

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('tab', { name: '调试面板' })).toBeInTheDocument()
    await waitFor(() => expect(debugLogMock.invokeElectronApi).toHaveBeenCalledTimes(1))
  })

  it('enables developer mode when the Electron debug runtime reports it', async () => {
    debugLogMock.invokeElectronApi.mockResolvedValue({ isDebug: true })
    render(<Home />)

    await waitFor(() => expect(screen.getByRole('tab', { name: '调试面板' })).toBeInTheDocument())
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })
})
