import { Component, type ErrorInfo, type ReactNode } from 'react'
import { LogEventCode, LogStage, LogStatus } from '@shared/logging/log_contract'
import DebugLog from './debug_log'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

export default class FrontendErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  }

  static getDerivedStateFromError(): State {
    return {
      hasError: true,
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    DebugLog.append({
      level: 'error',
      channel: 'react.error-boundary',
      eventCode: LogEventCode.FRONTEND_REACT_ERROR,
      stage: LogStage.FRONTEND,
      status: LogStatus.FAILURE,
      message: 'React 页面渲染失败',
      error,
      details: {
        componentStack: info.componentStack,
      },
    })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main
        role="alert"
        style={{
          maxWidth: 680,
          margin: '72px auto',
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
          lineHeight: 1.6,
        }}
      >
        <h1 style={{ fontSize: 22 }}>页面加载失败</h1>
        <p>错误信息已写入诊断日志。你可以重新加载页面；如果问题仍然存在，请在运行日志中查看对应记录。</p>
        <button
          type="button"
          onClick={() => {
            window.location.reload()
          }}
        >
          重新加载
        </button>
      </main>
    )
  }
}
