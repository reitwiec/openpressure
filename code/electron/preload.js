const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Serial port operations
  serial: {
    list: () => ipcRenderer.invoke('serial:list'),
    connect: (portPath) => ipcRenderer.invoke('serial:connect', portPath),
    disconnect: () => ipcRenderer.invoke('serial:disconnect'),
    send: (command) => ipcRenderer.invoke('serial:send', command),
    isConnected: () => ipcRenderer.invoke('serial:isConnected'),
    onReading: (callback) => {
      ipcRenderer.on('serial:reading', (event, data) => callback(data));
    },
    onCalibration: (callback) => {
      ipcRenderer.on('serial:calibration', (event, data) => callback(data));
    },
    onMessage: (callback) => {
      ipcRenderer.on('serial:message', (event, message) => callback(message));
    },
    onError: (callback) => {
      ipcRenderer.on('serial:error', (event, error) => callback(error));
    },
    onDisconnected: (callback) => {
      ipcRenderer.on('serial:disconnected', () => callback());
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('serial:reading');
      ipcRenderer.removeAllListeners('serial:calibration');
      ipcRenderer.removeAllListeners('serial:message');
      ipcRenderer.removeAllListeners('serial:error');
      ipcRenderer.removeAllListeners('serial:disconnected');
    },
  },
  
  // User operations
  user: {
    list: () => ipcRenderer.invoke('user:list'),
    create: (data) => ipcRenderer.invoke('user:create', data),
    get: (userId) => ipcRenderer.invoke('user:get', userId),
    update: (data) => ipcRenderer.invoke('user:update', data),
    delete: (userId) => ipcRenderer.invoke('user:delete', userId),
  },
  
  // Body part operations
  bodyPart: {
    list: (userId) => ipcRenderer.invoke('bodyPart:list', userId),
    create: (data) => ipcRenderer.invoke('bodyPart:create', data),
    get: (data) => ipcRenderer.invoke('bodyPart:get', data),
    update: (data) => ipcRenderer.invoke('bodyPart:update', data),
    delete: (data) => ipcRenderer.invoke('bodyPart:delete', data),
  },
  
  // Session operations
  session: {
    list: (data) => ipcRenderer.invoke('session:list', data),
    create: (data) => ipcRenderer.invoke('session:create', data),
    get: (data) => ipcRenderer.invoke('session:get', data),
    addReading: (data) => ipcRenderer.invoke('session:addReading', data),
    deleteReading: (data) => ipcRenderer.invoke('session:deleteReading', data),
    updateNotes: (data) => ipcRenderer.invoke('session:updateNotes', data),
    delete: (data) => ipcRenderer.invoke('session:delete', data),
    export: (data) => ipcRenderer.invoke('session:export', data),
    getAllForGraph: (data) => ipcRenderer.invoke('sessions:getAllForGraph', data),
  },
  
  // App info
  app: {
    getDataDir: () => ipcRenderer.invoke('app:getDataDir'),
  },
});
