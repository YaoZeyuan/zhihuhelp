const { contextBridge, ipcRenderer } = require('electron')

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args)

contextBridge.exposeInMainWorld('electronAPI', {
  ['get-debug-ipc-channel-list']: async (...args) => invoke('get-debug-ipc-channel-list', ...args),
  ['get-task-default-title']: async (...args) => invoke('get-task-default-title', ...args),
  ['get-common-config']: async (...args) => invoke('get-common-config', ...args),
  ['start-customer-task']: async (...args) => invoke('start-customer-task', ...args),
  ['zhihu-http-get']: async (...args) => invoke('zhihu-http-get', ...args),
  ['open-output-dir']: async (...args) => invoke('open-output-dir', ...args),
  ['open-devtools']: async (...args) => invoke('open-devtools', ...args),
  ['clear-all-session-storage']: async (...args) => invoke('clear-all-session-storage', ...args),
  ['get-db-summary-info']: async (...args) => invoke('get-db-summary-info', ...args),
  ['get-db-record-list']: async (...args) => invoke('get-db-record-list', ...args),
  ['export-db-record-json']: async (...args) => invoke('export-db-record-json', ...args),
  ['import-db-record-json']: async (...args) => invoke('import-db-record-json', ...args),
  ['get-output-history']: async (...args) => invoke('get-output-history', ...args),
  ['export-diagnostic-info']: async (...args) => invoke('export-diagnostic-info', ...args),
  ['open-local-path']: async (...args) => invoke('open-local-path', ...args),
  ['get-log-content']: async (...args) => invoke('get-log-content', ...args),
  ['clear-log-content']: async (...args) => invoke('clear-log-content', ...args),
  ['get-runtime-jsonl-content']: async (...args) => invoke('get-runtime-jsonl-content', ...args),
  ['get-runtime-session-errors']: async (...args) => invoke('get-runtime-session-errors', ...args),
  ['clear-runtime-jsonl-content']: async (...args) => invoke('clear-runtime-jsonl-content', ...args),
  ['open-js-rpc-window-devtools']: async (...args) => invoke('open-js-rpc-window-devtools', ...args),
  ['append-frontend-log-batch']: async (payload = {}) => invoke('append-frontend-log-batch', payload),
})
