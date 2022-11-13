const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateCounter: (callback) => {
    console.log("receive onUpdateCounter call")
    ipcRenderer.on('update-counter', callback),
  }
})
