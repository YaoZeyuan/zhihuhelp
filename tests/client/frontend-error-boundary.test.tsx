import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LogEventCode, LogStatus } from '../../src/shared/logging/log_contract'
import DebugLog from '../../client/src/library/debug_log'
import FrontendErrorBoundary from '../../client/src/library/frontend_error_boundary'

function BrokenPage(): never {
  throw new Error('render failed')
}

describe('前端错误边界', () => {
  afterEach(async () => {
    await DebugLog.flush()
    vi.restoreAllMocks()
  })

  it('渲染可恢复后备界面并立即记录 React 错误', () => {
    const appendBatch = vi.fn().mockResolvedValue({ acceptedCount: 1 })
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      writable: true,
      value: {
        'append-frontend-log-batch': appendBatch,
      },
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <FrontendErrorBoundary>
        <BrokenPage />
      </FrontendErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('页面加载失败')
    expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument()
    expect(appendBatch).toHaveBeenCalledTimes(1)
    expect(appendBatch.mock.calls[0][0].records[0]).toMatchObject({
      eventCode: LogEventCode.FRONTEND_REACT_ERROR,
      status: LogStatus.FAILURE,
    })
  })
})
