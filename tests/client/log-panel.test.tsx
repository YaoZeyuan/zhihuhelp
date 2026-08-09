import React from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LogEventCode } from '../../src/shared/logging/log_contract'

vi.mock('ahooks', async () => {
  const ReactModule = await import('react')
  return {
    useInterval: () => undefined,
    useAsyncEffect: (effect: () => Promise<unknown>, dependencyList: React.DependencyList) => {
      ReactModule.useEffect(() => {
        void effect()
      }, dependencyList)
    },
  }
})

vi.mock('rc-virtual-list', () => ({
  default: ({ data, children }: { data: unknown[]; children: (item: unknown, index: number) => React.ReactNode }) => (
    <div>{data.map((item, index) => children(item, index))}</div>
  ),
}))

import LogPanel, {
  buildSessionErrorList,
  buildStageList,
  RendererSessionStartedAt,
  resolveRendererSessionStartedAt,
} from '../../client/src/page/home/component/log'

describe('日志面板', () => {
  it('优先使用 renderer 文档的 performance.timeOrigin 作为会话起点', () => {
    const now = vi.fn(() => 2_000)

    expect(resolveRendererSessionStartedAt({ timeOrigin: 1_000 }, now)).toBe(1_000)
    expect(now).not.toHaveBeenCalled()
    expect(resolveRendererSessionStartedAt({ timeOrigin: Number.NaN }, now)).toBe(2_000)
    expect(resolveRendererSessionStartedAt(null, now)).toBe(2_000)
  })

  it('只保留本会话后端 error 和 failure 事件并按时间倒序排列', () => {
    const toTriggerAt = (timestamp: number) => new Date(timestamp).toISOString()
    const eventList = [
      { triggerAt: toTriggerAt(999), status: 'failure', message: '会话前失败' },
      { triggerAt: toTriggerAt(1_000), status: 'failure', message: '会话起点失败' },
      { triggerAt: toTriggerAt(1_100), level: 'warn', status: 'progress', message: '普通警告' },
      { triggerAt: toTriggerAt(1_200), level: 'error', status: 'partial_success', message: '部分成功' },
      { triggerAt: toTriggerAt(1_300), level: 'warn', status: 'failure', message: '阶段失败' },
      { triggerAt: toTriggerAt(1_400), level: 'error', status: 'success', message: '错误级事件' },
      { triggerAt: 'invalid', level: 'error', message: '无效时间' },
    ]

    expect(buildSessionErrorList(eventList, 1_000).map((item) => item.message)).toEqual([
      '错误级事件',
      '阶段失败',
      '会话起点失败',
    ])
    expect(buildSessionErrorList(eventList, 1_500)).toEqual([])
  })

  it('后续阶段开始后仍将 partial_success 保持为警告终态', () => {
    const stageList = buildStageList([
      { runId: 'run-1', stage: 'fetch', status: 'start', message: 'fetch start' },
      { runId: 'run-1', stage: 'fetch', status: 'partial_success', message: 'fetch partial' },
      { runId: 'run-1', stage: 'generate', status: 'start', message: 'generate start' },
    ])
    expect(stageList.find((item) => item.stage === 'fetch')).toMatchObject({
      status: 'partial_success',
      message: 'fetch partial',
    })
  })

  it('不将可恢复的实体失败转换为致命运行阶段', () => {
    const stageList = buildStageList([
      { runId: 'run-1', stage: 'fetch', status: 'start', message: 'fetch start' },
      { runId: 'run-1', jobId: 'entity-1', stage: 'fetch', status: 'failure', message: 'one failed' },
      { runId: 'run-1', stage: 'fetch', status: 'partial_success', message: 'fetch partial' },
      { runId: 'run-1', stage: 'generate', status: 'success', message: 'generate complete' },
      {
        runId: 'run-1',
        jobId: 'book-1',
        eventCode: LogEventCode.OUTPUT_CREATED,
        stage: 'output',
        status: 'success',
        message: 'book created',
      },
    ])
    expect(stageList.find((item) => item.stage === 'fetch')?.status).toBe('partial_success')
    expect(stageList.find((item) => item.stage === 'generate')?.status).toBe('success')
    expect(stageList.find((item) => item.stage === 'output')?.status).toBe('success')
  })

  it('显示规范配置任务失败而非较早的上下文创建成功', () => {
    const stageList = buildStageList([
      { runId: 'run-1', stage: 'config', status: 'success', message: 'context created' },
      { runId: 'run-1', jobId: 'config-read', stage: 'config', status: 'start', message: 'config read start' },
      { runId: 'run-1', jobId: 'config-read', stage: 'config', status: 'failure', message: 'invalid schema' },
    ])
    expect(stageList.find((item) => item.stage === 'config')).toMatchObject({
      status: 'failure',
      message: 'invalid schema',
    })
  })

  it('父级生成阶段也失败时仍显示输出失败', () => {
    const stageList = buildStageList([
      { runId: 'run-1', stage: 'generate', status: 'start', message: 'generate start' },
      {
        runId: 'run-1',
        jobId: 'generate-book-1',
        stage: 'output',
        status: 'start',
        message: 'output start',
      },
      {
        runId: 'run-1',
        jobId: 'generate-book-1',
        eventCode: LogEventCode.OUTPUT_FAILURE,
        stage: 'output',
        status: 'failure',
        message: 'output failed',
      },
      { runId: 'run-1', stage: 'generate', status: 'failure', message: 'generate failed' },
    ])

    expect(stageList.find((item) => item.stage === 'generate')).toMatchObject({
      status: 'failure',
      message: 'generate failed',
    })
    expect(stageList.find((item) => item.stage === 'output')).toMatchObject({
      status: 'failure',
      message: 'output failed',
    })
  })

  it('在所有已开始书籍到达终态前保持多卷输出运行中', () => {
    const firstBookEvents = [
      { runId: 'run-1', jobId: 'generate-book-1', stage: 'output', status: 'start', message: 'book 1 start' },
      {
        runId: 'run-1',
        jobId: 'generate-book-1',
        eventCode: LogEventCode.OUTPUT_CREATED,
        stage: 'output',
        status: 'success',
        message: 'book 1 created',
      },
      { runId: 'run-1', jobId: 'generate-book-2', stage: 'output', status: 'start', message: 'book 2 start' },
    ]

    expect(buildStageList(firstBookEvents).find((item) => item.stage === 'output')).toMatchObject({
      status: 'running',
      message: 'book 2 start',
    })
    expect(
      buildStageList([
        ...firstBookEvents,
        {
          runId: 'run-1',
          jobId: 'generate-book-2',
          eventCode: LogEventCode.OUTPUT_CREATED,
          stage: 'output',
          status: 'success',
          message: 'book 2 created',
        },
      ]).find((item) => item.stage === 'output'),
    ).toMatchObject({
      status: 'success',
      message: 'book 2 created',
    })
  })

  it('所有书籍终止后将多卷输出汇总为部分成功', () => {
    const stageList = buildStageList([
      { runId: 'run-1', jobId: 'generate-book-1', stage: 'output', status: 'start', message: 'book 1 start' },
      {
        runId: 'run-1',
        jobId: 'generate-book-1',
        eventCode: LogEventCode.OUTPUT_CREATED,
        stage: 'output',
        status: 'partial_success',
        message: 'book 1 missing image',
      },
      { runId: 'run-1', jobId: 'generate-book-2', stage: 'output', status: 'start', message: 'book 2 start' },
      {
        runId: 'run-1',
        jobId: 'generate-book-2',
        eventCode: LogEventCode.OUTPUT_CREATED,
        stage: 'output',
        status: 'success',
        message: 'book 2 created',
      },
    ])

    expect(stageList.find((item) => item.stage === 'output')).toMatchObject({
      status: 'partial_success',
      message: 'book 1 missing image',
    })
  })

  it('仅 Markdown 发布失败时采用书籍的规范部分成功结果', () => {
    const stageList = buildStageList([
      {
        runId: 'run-1',
        jobId: 'generate-book-1',
        eventCode: LogEventCode.OUTPUT_START,
        stage: 'output',
        status: 'start',
        message: 'book start',
      },
      {
        runId: 'run-1',
        jobId: 'markdown-book-1',
        eventCode: LogEventCode.MARKDOWN_FAILURE,
        stage: 'output',
        status: 'failure',
        message: 'markdown failed',
      },
      {
        runId: 'run-1',
        jobId: 'generate-book-1',
        eventCode: LogEventCode.OUTPUT_CREATED,
        stage: 'output',
        status: 'partial_success',
        message: 'HTML and EPUB created',
      },
    ])

    expect(stageList.find((item) => item.stage === 'output')).toMatchObject({
      status: 'partial_success',
      message: 'HTML and EPUB created',
    })
  })

  it('首次晚打开日志时读取完整会话错误，并在刷新失败时保留现有列表', async () => {
    const sessionStartedAt = RendererSessionStartedAt
    const runtimeJsonlContent = [
      '{malformed',
      JSON.stringify({
        runId: 'old-run',
        triggerAt: new Date(sessionStartedAt - 1).toISOString(),
        stage: 'fetch',
        status: 'failure',
        level: 'error',
        message: '会话前失败',
      }),
      JSON.stringify({
        runId: 'run-1',
        triggerAt: new Date(sessionStartedAt + 10).toISOString(),
        stage: 'config',
        status: 'success',
        message: 'config ok',
      }),
      JSON.stringify({
        runId: 'run-1',
        triggerAt: new Date(sessionStartedAt + 20).toISOString(),
        stage: 'fetch',
        status: 'progress',
        level: 'warn',
        message: '普通警告',
      }),
      JSON.stringify({
        runId: 'run-1',
        triggerAt: new Date(sessionStartedAt + 30).toISOString(),
        stage: 'fetch',
        status: 'partial_success',
        level: 'error',
        message: '部分成功',
      }),
      JSON.stringify({
        runId: 'run-1',
        triggerAt: new Date(sessionStartedAt + 40).toISOString(),
        stage: 'generate',
        eventCode: 'generate.failure',
        status: 'failure',
        message: '生成阶段失败',
      }),
      JSON.stringify({
        runId: 'run-1',
        triggerAt: new Date(sessionStartedAt + 50).toISOString(),
        stage: 'ipc',
        eventCode: 'ipc.failure',
        status: 'success',
        level: 'error',
        message: 'IPC 调用失败',
        error: { name: 'ApplicationError', code: 'IPC_FAILED', message: '主进程连接断开' },
      }),
    ].join('\n')
    const sessionErrorEventList = runtimeJsonlContent
      .split('\n')
      .slice(-2)
      .map((line) => JSON.parse(line))
    const runtimeJsonlTailContent = runtimeJsonlContent.split('\n').slice(0, 4).join('\n')
    let resolveClearLog!: () => void
    const clearLogPromise = new Promise<void>((resolve) => {
      resolveClearLog = resolve
    })
    const electronAPI = {
      'get-log-content': vi.fn().mockResolvedValue('line one\nline two'),
      'get-runtime-jsonl-content': vi
        .fn()
        .mockResolvedValueOnce(runtimeJsonlTailContent)
        .mockResolvedValueOnce(runtimeJsonlTailContent)
        .mockResolvedValue(''),
      'get-runtime-session-errors': vi
        .fn()
        .mockResolvedValueOnce(sessionErrorEventList)
        .mockRejectedValueOnce(new Error('temporary read failure'))
        .mockResolvedValue([]),
      'get-output-history': vi.fn().mockResolvedValue(
        Array.from({ length: 10 }, (_, index) => ({
          id: `output-${index}`,
          title: `output-${index}`,
          createdAt: `2026-08-08T00:00:${String(index).padStart(2, '0')}.000Z`,
          outputPath: `D:/test-output/book-${index}`,
        })),
      ),
      'clear-log-content': vi.fn().mockReturnValue(clearLogPromise),
      'clear-runtime-jsonl-content': vi.fn().mockResolvedValue(undefined),
      'export-diagnostic-info': vi.fn().mockResolvedValue(undefined),
      'open-local-path': vi.fn().mockResolvedValue(undefined),
      'open-output-dir': vi.fn().mockResolvedValue(undefined),
      'append-frontend-log-batch': vi.fn((payload: { records: unknown[] }) =>
        Promise.resolve({ acceptedCount: payload.records.length }),
      ),
    }
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      writable: true,
      value: electronAPI,
    })

    const view = render(<LogPanel />)
    await waitFor(() => expect(screen.getByText('output-9')).toBeInTheDocument())
    const autoRefreshCheckbox = screen.getByRole('checkbox', { name: '自动刷新' })
    expect(autoRefreshCheckbox).toBeChecked()
    fireEvent.click(autoRefreshCheckbox)
    await waitFor(() => expect(autoRefreshCheckbox).not.toBeChecked())
    expect(electronAPI['get-log-content']).toHaveBeenCalledTimes(1)
    expect(electronAPI['get-runtime-jsonl-content']).toHaveBeenCalledTimes(1)
    expect(electronAPI['get-runtime-session-errors']).toHaveBeenCalledWith({ since: RendererSessionStartedAt })
    const titleList = [...view.container.querySelectorAll('.output-history-item strong')].map(
      (element) => element.textContent,
    )
    expect(titleList).toEqual(Array.from({ length: 10 }, (_, index) => `output-${9 - index}`))
    expect(screen.getAllByRole('button', { name: '打开文件夹' })).toHaveLength(10)
    expect(screen.queryByRole('button', { name: '打开 HTML' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '打开 Markdown' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '打开 EPUB' })).not.toBeInTheDocument()
    const sessionErrorSection = view.container.querySelector('.session-error-section') as HTMLElement
    expect(sessionErrorSection).not.toBeNull()
    expect([...sessionErrorSection.querySelectorAll('.ant-alert-title')].map((element) => element.textContent)).toEqual(
      ['IPC 调用失败', '生成阶段失败'],
    )
    expect(within(sessionErrorSection).getByText(/ApplicationError \/ IPC_FAILED：主进程连接断开/)).toBeInTheDocument()
    expect(within(sessionErrorSection).queryByText('会话前失败')).not.toBeInTheDocument()
    expect(within(sessionErrorSection).queryByText('普通警告')).not.toBeInTheDocument()
    expect(within(sessionErrorSection).queryByText('部分成功')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '刷新日志' }))
    await waitFor(() => expect(electronAPI['get-runtime-session-errors']).toHaveBeenCalledTimes(2))
    expect(sessionErrorSection.querySelectorAll('.session-error-item')).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('button', { name: '打开文件夹' })[0])
    await waitFor(() => {
      expect(electronAPI['open-local-path']).toHaveBeenCalledWith(
        { targetPath: 'D:/test-output/book-9' },
        expect.objectContaining({ __zhihuhelpTraceId: expect.any(String) }),
      )
    })

    expect(() => view.rerender(<LogPanel />)).not.toThrow()

    fireEvent.click(screen.getByRole('button', { name: '清空日志' }))
    expect(sessionErrorSection.querySelectorAll('.session-error-item')).toHaveLength(2)
    expect(electronAPI['clear-runtime-jsonl-content']).not.toHaveBeenCalled()
    await act(async () => {
      resolveClearLog()
      await clearLogPromise
    })
    await waitFor(() => expect(electronAPI['clear-runtime-jsonl-content']).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(electronAPI['get-runtime-session-errors']).toHaveBeenCalledTimes(3))
    expect(within(sessionErrorSection).getByText('本会话暂无错误。')).toBeInTheDocument()
  }, 15_000)

  it('清空结构化日志失败时保留当前会话错误', async () => {
    const electronAPI = {
      'get-log-content': vi.fn().mockResolvedValue(''),
      'get-runtime-jsonl-content': vi.fn().mockResolvedValue(''),
      'get-runtime-session-errors': vi.fn().mockResolvedValue([
        {
          triggerAt: new Date(RendererSessionStartedAt + 10).toISOString(),
          eventCode: 'ipc.request.failure',
          stage: 'ipc',
          status: 'failure',
          level: 'error',
          message: '清理前错误',
        },
      ]),
      'get-output-history': vi.fn().mockResolvedValue([]),
      'clear-log-content': vi.fn().mockResolvedValue(undefined),
      'clear-runtime-jsonl-content': vi.fn().mockRejectedValue(new Error('clear failed')),
      'export-diagnostic-info': vi.fn().mockResolvedValue(undefined),
      'open-local-path': vi.fn().mockResolvedValue(undefined),
      'open-output-dir': vi.fn().mockResolvedValue(undefined),
      'append-frontend-log-batch': vi.fn((payload: { records: unknown[] }) =>
        Promise.resolve({ acceptedCount: payload.records.length }),
      ),
    }
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      writable: true,
      value: electronAPI,
    })

    render(<LogPanel />)
    await screen.findByText('清理前错误')

    fireEvent.click(screen.getByRole('button', { name: '清空日志' }))
    await waitFor(() => expect(electronAPI['clear-runtime-jsonl-content']).toHaveBeenCalledTimes(1))
    expect(screen.getByText('清理前错误')).toBeInTheDocument()
    expect(electronAPI['get-runtime-session-errors']).toHaveBeenCalledTimes(1)
  })
})
