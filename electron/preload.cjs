const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('mindweaverDisplay', {
  setSize: (width, height) => ipcRenderer.invoke('mindweaver:set-window-size', width, height),
  maximize: () => ipcRenderer.invoke('mindweaver:maximize'),
  toggleFullscreen: () => ipcRenderer.invoke('mindweaver:toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('mindweaver:is-fullscreen'),
});
