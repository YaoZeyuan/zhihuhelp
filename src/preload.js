const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  ['get-task-default-title']: async (...args) => ipcRenderer.invoke('get-task-default-title', ...args),
  ['get-common-config']: async () => ipcRenderer.invoke('get-common-config'),
  ['start-customer-task']: async (...args) => ipcRenderer.invoke('start-customer-task', ...args),
  ['zhihu-http-get']: async (...args) => ipcRenderer.invoke('zhihu-http-get', ...args),
  ['open-output-dir']: async () => ipcRenderer.invoke('open-output-dir'),
  ['open-devtools']: async () => ipcRenderer.invoke('open-devtools'),
  ['clear-all-session-storage']: async () => ipcRenderer.invoke('clear-all-session-storage'),
  ['get-db-summary-info']: async () => ipcRenderer.invoke('get-db-summary-info'),
  ['get-log-content']: async () => {
    const res = await ipcRenderer.invoke('get-log-content')
    return res
  },
  ['clear-log-content']: async () => ipcRenderer.invoke('clear-log-content'),
  ['open-js-rpc-window-devtools']: async () => ipcRenderer.invoke('open-js-rpc-window-devtools'),
})
