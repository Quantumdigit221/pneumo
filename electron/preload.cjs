const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('chreinDesktop', {
  isElectron: true,
  platform: process.platform
});
