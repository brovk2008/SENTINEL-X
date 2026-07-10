import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('safetyos', {
  platform: process.platform,
  version: process.env.npm_package_version || '1.0.0',
  isDev: !process.env.ELECTRON_IS_DEV ? false : true
});

export {};
