const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  registerEncryptCallback: (callback) => {
    // 当收到来自主进程encrypt-string调用时，执行回调函数
    ipcRenderer.on('encrypt-string', callback)
  },
  // 作为中转层, 向主进程转发encrypt-string调用结果
  jsRpcResponse: async ({ id, value }) => {
    await ipcRenderer.invoke('js-rpc-response', { id, value })
    return
  },
})
