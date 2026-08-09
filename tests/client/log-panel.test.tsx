import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

import LogPanel, { buildStageList } from '../../client/src/page/home/component/log'

describe('日志面板', () => {
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
    expect(buildStageList([
      ...firstBookEvents,
      {
        runId: 'run-1',
        jobId: 'generate-book-2',
        eventCode: LogEventCode.OUTPUT_CREATED,
        stage: 'output',
        status: 'success',
        message: 'book 2 created',
      },
    ]).find((item) => item.stage === 'output')).toMatchObject({
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

  it('加载 IPC 数据、容忍损坏 JSONL 并按时间倒序排列输出历史', async () => {
    const electronAPI = {
      'get-log-content': vi.fn().mockResolvedValue('line one\nline two'),
      'get-runtime-jsonl-content': vi
        .fn()
        .mockResolvedValue(
          [
            '{malformed',
            JSON.stringify({ runId: 'run-1', stage: 'config', status: 'success', message: 'config ok' }),
            JSON.stringify({ runId: 'run-1', stage: 'fetch', status: 'failure', level: 'error', message: 'fetch failed' }),
          ].join('\n'),
        ),
      'get-output-history': vi.fn().mockResolvedValue(
        Array.from({ length: 10 }, (_, index) => ({
          id: `output-${index}`,
          title: `output-${index}`,
          createdAt: `2026-08-08T00:00:${String(index).padStart(2, '0')}.000Z`,
          markdownOutputPath: index === 9 ? 'D:/test-output/markdown/book' : undefined,
        })),
      ),
      'clear-log-content': vi.fn().mockResolvedValue(undefined),
      'clear-runtime-jsonl-content': vi.fn().mockResolvedValue(undefined),
      'export-diagnostic-info': vi.fn().mockResolvedValue(undefined),
      'open-local-path': vi.fn().mockResolvedValue(undefined),
      'open-output-dir': vi.fn().mockResolvedValue(undefined),
      'append-frontend-log-batch': vi.fn().mockResolvedValue({ acceptedCount: 1 }),
    }
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      writable: true,
      value: electronAPI,
    })

    const view = render(<LogPanel />)
    await waitFor(() => expect(screen.getByText('output-9')).toBeInTheDocument())
    expect(electronAPI['get-log-content']).toHaveBeenCalledTimes(1)
    expect(electronAPI['get-runtime-jsonl-content']).toHaveBeenCalledTimes(1)
    const titleList = [...view.container.querySelectorAll('.output-history-item strong')].map(
      (element) => element.textContent,
    )
    expect(titleList).toEqual(Array.from({ length: 10 }, (_, index) => `output-${9 - index}`))
    expect(view.container.querySelector('.latest-error')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '打开 Markdown' }))
    await waitFor(() => {
      expect(electronAPI['open-local-path']).toHaveBeenCalledWith(
        { targetPath: 'D:/test-output/markdown/book' },
        expect.objectContaining({ __zhihuhelpTraceId: expect.any(String) }),
      )
    })

    expect(() => view.rerender(<LogPanel />)).not.toThrow()
  })
})
