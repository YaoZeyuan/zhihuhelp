const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onEncryptString: (callback) => {
    ipcRenderer.on('encrypt-string', callback)
  },
})
