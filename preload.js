// The page's only way to reach the main process: the API key and Claude calls for statement reading.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('budgeterDesktop', {
  hasKey: () => ipcRenderer.invoke('claude:hasKey'),
  setKey: key => ipcRenderer.invoke('claude:setKey', key),
  clearKey: () => ipcRenderer.invoke('claude:clearKey'),
  read: req => ipcRenderer.invoke('claude:read', req)
});
