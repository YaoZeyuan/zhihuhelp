import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const debugLogMock = vi.hoisted(() => ({
  append: vi.fn(),
  invokeElectronApi: vi.fn(),
}))

vi.mock('~/src/library/debug_log', () => ({ default: debugLogMock }))

import CustomerTask from '../../client/src/page/home/component/customer_task'
import TaskItem from '../../client/src/page/home/component/customer_task/component/task_item'
import Util from '../../client/src/page/home/component/customer_task/library/util'
import * as Context from '../../client/src/page/home/resource/context'
import { Const_Default_Config } from '../../client/src/resource/const/task_config'
import * as ConstsPage from '../../client/src/resource/const/page'

const taskOne = {
  type: 'question' as const,
  id: '1955952667529545081',
  rawInputText: 'https://www.zhihu.com/question/1955952667529545081',
  comment: '保留已有备注',
  skipFetch: true,
}

const taskTwo = {
  type: 'article' as const,
  id: '2044554555665428776',
  rawInputText: 'https://zhuanlan.zhihu.com/p/2044554555665428776',
  comment: '',
  skipFetch: true,
}

function createConfig(tasks = [taskOne]) {
  return {
    ...Const_Default_Config,
    tasks: tasks.map((task) => ({ ...task })),
    generate: {
      ...Const_Default_Config.generate,
      orderBy: [],
    },
  }
}

function renderCustomerTask(tasks = [taskOne]) {
  debugLogMock.invokeElectronApi.mockImplementation((channel: string) => {
    if (channel === 'get-common-config') {
      return Promise.resolve(createConfig(tasks))
    }
    if (channel === 'zhihu-http-get') {
      return new Promise(() => {})
    }
    if (channel === 'get-task-default-title') {
      return Promise.resolve('测试书名')
    }
    return Promise.resolve(undefined)
  })

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

describe('自定义任务管理', () => {
  beforeEach(() => {
    debugLogMock.append.mockReset()
    debugLogMock.invokeElectronApi.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('全局跳过抓取与逐行抓取设置双向联动', async () => {
    renderCustomerTask([taskOne, taskTwo])

    const globalSwitch = await screen.findByRole('switch', { name: '全局跳过抓取' })
    await waitFor(() => {
      expect(globalSwitch).toBeChecked()
      expect(screen.getAllByRole('checkbox', { name: /抓取任务/ })).toHaveLength(2)
    })

    const taskCheckboxList = screen.getAllByRole('checkbox', { name: /抓取任务/ })
    expect(taskCheckboxList[0]).not.toBeChecked()
    expect(taskCheckboxList[1]).not.toBeChecked()

    fireEvent.click(globalSwitch)
    await waitFor(() => {
      expect(globalSwitch).not.toBeChecked()
      expect(taskCheckboxList[0]).toBeChecked()
      expect(taskCheckboxList[1]).toBeChecked()
    })

    fireEvent.click(globalSwitch)
    await waitFor(() => {
      expect(globalSwitch).toBeChecked()
      expect(taskCheckboxList[0]).not.toBeChecked()
      expect(taskCheckboxList[1]).not.toBeChecked()
    })

    fireEvent.click(screen.getByRole('checkbox', { name: '抓取任务 1' }))
    await waitFor(
      () => {
        expect(globalSwitch).not.toBeChecked()
        expect(screen.getByRole('checkbox', { name: '抓取任务 1' })).toBeChecked()
      },
      { timeout: 3_000 },
    )

    fireEvent.click(screen.getByRole('checkbox', { name: '抓取任务 1' }))
    await waitFor(
      () => {
        expect(globalSwitch).toBeChecked()
        expect(screen.getByRole('checkbox', { name: '抓取任务 1' })).not.toBeChecked()
      },
      { timeout: 3_000 },
    )

    fireEvent.click(screen.getByRole('button', { name: '批量编辑' }))
    const batchInput = await screen.findByRole('textbox', { name: '任务列表' })
    fireEvent.change(batchInput, {
      target: { value: 'https://www.zhihu.com/question/4' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'OK' }))
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox', { name: /抓取任务/ })).toHaveLength(1)
      expect(screen.getByRole('checkbox', { name: '抓取任务 1' })).not.toBeChecked()
      expect(globalSwitch).toBeChecked()
    })
  }, 15_000)

  it('快捷识别使用 leading 和 trailing 节流并让新任务继承全局跳过抓取', async () => {
    const createTaskListSpy = vi.spyOn(Util, 'createTaskItemListFromText')
    renderCustomerTask([taskOne])
    const quickInput = await screen.findByPlaceholderText(/粘贴知乎链接，每行一个/)
    const globalSwitch = screen.getByRole('switch', { name: '全局跳过抓取' })

    await waitFor(() => {
      expect(quickInput).toHaveValue(taskOne.rawInputText)
      expect(globalSwitch).toBeChecked()
    })
    expect(createTaskListSpy).not.toHaveBeenCalled()

    vi.useFakeTimers()
    fireEvent.change(quickInput, {
      target: { value: 'https://www.zhihu.com/question/1' },
    })
    expect(createTaskListSpy).toHaveBeenCalledTimes(1)

    fireEvent.change(quickInput, {
      target: { value: 'https://www.zhihu.com/question/2' },
    })
    fireEvent.change(quickInput, {
      target: { value: 'https://www.zhihu.com/question/3' },
    })
    expect(createTaskListSpy).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(999)
    })
    expect(createTaskListSpy).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(createTaskListSpy).toHaveBeenCalledTimes(2)
    expect(createTaskListSpy).toHaveBeenLastCalledWith({
      rawInputText: 'https://www.zhihu.com/question/3',
    })
    expect(screen.getByRole('checkbox', { name: '抓取任务 1' })).not.toBeChecked()
    expect(globalSwitch).toBeChecked()
  })

  it('手动识别会取消 trailing 调用，清空输入则静默清空任务', async () => {
    const createTaskListSpy = vi.spyOn(Util, 'createTaskItemListFromText')
    renderCustomerTask([taskOne])
    const quickInput = await screen.findByPlaceholderText(/粘贴知乎链接，每行一个/)
    await waitFor(() => expect(quickInput).toHaveValue(taskOne.rawInputText))

    vi.useFakeTimers()
    fireEvent.change(quickInput, {
      target: { value: 'https://www.zhihu.com/question/1' },
    })
    fireEvent.change(quickInput, {
      target: { value: 'https://www.zhihu.com/question/2' },
    })
    expect(createTaskListSpy).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: '识别链接' }))
    expect(createTaskListSpy).toHaveBeenCalledTimes(2)
    expect(createTaskListSpy).toHaveBeenLastCalledWith({
      rawInputText: 'https://www.zhihu.com/question/2',
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(createTaskListSpy).toHaveBeenCalledTimes(2)

    fireEvent.change(quickInput, { target: { value: '' } })
    expect(createTaskListSpy).toHaveBeenLastCalledWith({ rawInputText: '' })
    expect(screen.queryByText('请先粘贴至少一个知乎链接')).not.toBeInTheDocument()
    expect(screen.getByRole('switch', { name: '全局跳过抓取' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: '抓取任务 1' })).not.toBeChecked()

    fireEvent.change(quickInput, {
      target: { value: 'https://www.zhihu.com/question/3' },
    })
    expect(createTaskListSpy).toHaveBeenLastCalledWith({
      rawInputText: 'https://www.zhihu.com/question/3',
    })
    expect(screen.getByRole('switch', { name: '全局跳过抓取' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: '抓取任务 1' })).not.toBeChecked()

    fireEvent.change(quickInput, { target: { value: '' } })

    fireEvent.click(screen.getByRole('button', { name: '识别链接' }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByText('请先粘贴至少一个知乎链接')).toBeInTheDocument()
  })

  it('组件卸载时取消尚未执行的 trailing 调用', async () => {
    const createTaskListSpy = vi.spyOn(Util, 'createTaskItemListFromText')
    const view = renderCustomerTask([taskOne])
    const quickInput = await screen.findByPlaceholderText(/粘贴知乎链接，每行一个/)
    await waitFor(() => expect(quickInput).toHaveValue(taskOne.rawInputText))

    vi.useFakeTimers()
    fireEvent.change(quickInput, {
      target: { value: 'https://www.zhihu.com/question/1' },
    })
    fireEvent.change(quickInput, {
      target: { value: 'https://www.zhihu.com/question/2' },
    })
    expect(createTaskListSpy).toHaveBeenCalledTimes(1)

    view.unmount()
    await vi.advanceTimersByTimeAsync(1000)
    expect(createTaskListSpy).toHaveBeenCalledTimes(1)
  })

  it('TaskItem 在父表单批量修改 skipFetch 后立即同步抓取状态', async () => {
    const action = {
      add: vi.fn(),
      remove: vi.fn(),
    }
    const onChange = vi.fn()
    const view = render(
      <TaskItem fieldIndex={0} action={action} onChange={onChange} value={{ ...taskOne, skipFetch: false }} />,
    )
    const checkbox = screen.getByRole('checkbox', { name: '抓取任务 1' })
    expect(checkbox).toBeChecked()

    view.rerender(
      <TaskItem fieldIndex={0} action={action} onChange={onChange} value={{ ...taskOne, skipFetch: true }} />,
    )
    await waitFor(() => expect(checkbox).not.toBeChecked())
  })
})
