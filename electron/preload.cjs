const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("docFlowDesktop", {
  platform: process.platform,
  isElectron: true,
});
