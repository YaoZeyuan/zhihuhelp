import { createRoot } from 'react-dom/client'
import { LogEventCode, LogStage, LogStatus } from '@shared/logging/log_contract'
import App from './app'
import DebugLog from './library/debug_log'
import FrontendErrorBoundary from './library/frontend_error_boundary'

async function bootstrap() {
  const isDocsScreenshotPreview =
    import.meta.env.DEV &&
    import.meta.env.VITE_DOCS_SCREENSHOT_MODE === '1' &&
    new URLSearchParams(window.location.search).get('docs-preview') === 'app'

  if (isDocsScreenshotPreview) {
    const { installDocsScreenshotPreview } = await import('./docs_preview/install')
    installDocsScreenshotPreview()
  }

  const container = document.getElementById('app')
  DebugLog.installGlobalErrorRecorder()
  DebugLog.append({
    level: 'info',
    channel: 'application',
    eventCode: LogEventCode.FRONTEND_APP_START,
    stage: LogStage.APP,
    status: LogStatus.SUCCESS,
    message: '前端应用已启动',
  })
  const root = createRoot(container!)
  root.render(
    <FrontendErrorBoundary>
      <App />
    </FrontendErrorBoundary>,
  )
}

void bootstrap()
