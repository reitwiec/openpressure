const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

let mainWindow;
let serialPort = null;
let parser = null;

// Data directory
const DATA_DIR = path.join(app.getPath('home'), 'PressureReadings');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Path helpers
function getUserDir(userId) {
  return path.join(DATA_DIR, userId);
}

function getBodyPartDir(userId, bodyPartId) {
  return path.join(getUserDir(userId), bodyPartId);
}

function ensureUserDir(userId) {
  const userDir = getUserDir(userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

function ensureBodyPartDir(userId, bodyPartId) {
  const dir = getBodyPartDir(userId, bodyPartId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getSessionFilePath(userId, bodyPartId, sessionId) {
  return path.join(getBodyPartDir(userId, bodyPartId), `session_${sessionId}.csv`);
}

function getSessionMetaFilePath(userId, bodyPartId, sessionId) {
  return path.join(getBodyPartDir(userId, bodyPartId), `session_${sessionId}_meta.json`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0f1a',
    show: false,
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serialPort && serialPort.isOpen) {
      serialPort.close();
    }
  });
}

app.whenReady().then(() => {
  ensureDataDir();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ==================== Serial Port Handlers ====================

ipcMain.handle('serial:list', async () => {
  try {
    const ports = await SerialPort.list();
    return ports.filter(p => 
      p.vendorId || p.manufacturer || p.serialNumber
    ).map(p => ({
      path: p.path,
      manufacturer: p.manufacturer || 'Unknown',
      vendorId: p.vendorId,
      productId: p.productId,
    }));
  } catch (error) {
    console.error('Error listing ports:', error);
    return [];
  }
});

ipcMain.handle('serial:connect', async (event, portPath) => {
  try {
    if (serialPort) {
      try {
        if (serialPort.isOpen) {
          await new Promise((resolve, reject) => {
            serialPort.close((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      } catch (closeErr) {
        console.log('Error closing existing port:', closeErr.message);
      }
      serialPort = null;
      parser = null;
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    serialPort = new SerialPort({
      path: portPath,
      baudRate: 115200,
    });

    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

    parser.on('data', (line) => {
      const trimmed = line.trim();
      console.log('Serial:', trimmed);
      
      if (trimmed.startsWith('>>> SNAPSHOT:')) {
        const match = trimmed.match(/SNAPSHOT:\s*([\d.]+)\s*g,\s*([\d.]+)\s*g\/mm/);
        if (match) {
          mainWindow?.webContents.send('serial:reading', {
            grams: parseFloat(match[1]),
            stress: parseFloat(match[2]),
            timestamp: new Date().toISOString(),
          });
        }
      }
      
      if (trimmed.includes('CALIBRATION')) {
        mainWindow?.webContents.send('serial:calibration', { status: 'started' });
      }
      if (trimmed.includes('Tare done')) {
        mainWindow?.webContents.send('serial:calibration', { status: 'tared' });
      }
      if (trimmed.includes('NEW REFERENCE_UNIT')) {
        const match = trimmed.match(/NEW REFERENCE_UNIT:\s*([\d.]+)/);
        mainWindow?.webContents.send('serial:calibration', { 
          status: 'complete',
          referenceUnit: match ? parseFloat(match[1]) : null,
        });
      }
      if (trimmed.includes('Verification reading')) {
        const match = trimmed.match(/Verification reading:\s*([\d.]+)/);
        mainWindow?.webContents.send('serial:calibration', {
          status: 'verified',
          verificationGrams: match ? parseFloat(match[1]) : null,
        });
      }
      
      mainWindow?.webContents.send('serial:message', trimmed);
    });

    serialPort.on('error', (err) => {
      console.error('Serial error:', err);
      mainWindow?.webContents.send('serial:error', err.message);
    });

    serialPort.on('close', () => {
      mainWindow?.webContents.send('serial:disconnected');
    });

    return { success: true };
  } catch (error) {
    console.error('Connection error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('serial:disconnect', async () => {
  try {
    if (serialPort) {
      if (serialPort.isOpen) {
        await new Promise((resolve, reject) => {
          serialPort.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      serialPort = null;
      parser = null;
    }
    return { success: true };
  } catch (error) {
    console.error('Disconnect error:', error);
    serialPort = null;
    parser = null;
    return { success: true };
  }
});

ipcMain.handle('serial:send', async (event, command) => {
  try {
    if (serialPort && serialPort.isOpen) {
      serialPort.write(command + '\n');
      return { success: true };
    }
    return { success: false, error: 'Port not open' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('serial:isConnected', () => {
  return !!(serialPort && serialPort.isOpen);
});

app.on('browser-window-created', (event, window) => {
  window.webContents.on('did-start-loading', async () => {
    if (serialPort && serialPort.isOpen) {
      console.log('Window reloading - closing serial port');
      try {
        await new Promise((resolve) => {
          serialPort.close(() => resolve());
        });
      } catch (err) {
        console.log('Error closing port on reload:', err.message);
      }
      serialPort = null;
      parser = null;
    }
  });
});

// ==================== User Handlers ====================

ipcMain.handle('user:list', async () => {
  try {
    ensureDataDir();
    const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });
    const users = entries
      .filter(e => e.isDirectory())
      .map(e => {
        const userDir = path.join(DATA_DIR, e.name);
        const metaPath = path.join(userDir, 'user_meta.json');
        let meta = { name: e.name };
        if (fs.existsSync(metaPath)) {
          try {
            meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          } catch (err) {
            console.error('Error reading user meta:', err);
          }
        }
        
        // Count body parts
        const bodyPartCount = fs.readdirSync(userDir, { withFileTypes: true })
          .filter(f => f.isDirectory()).length;
        
        return {
          id: e.name,
          name: meta.name || e.name,
          notes: meta.notes || '',
          created: meta.created || null,
          bodyPartCount,
        };
      });
    
    return users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } catch (error) {
    console.error('Error listing users:', error);
    return [];
  }
});

ipcMain.handle('user:create', async (event, { name, notes }) => {
  try {
    ensureDataDir();
    const id = name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').substring(0, 50) + '_' + Date.now();
    const userDir = ensureUserDir(id);
    
    const meta = {
      name,
      notes: notes || '',
      created: new Date().toISOString(),
    };
    
    fs.writeFileSync(path.join(userDir, 'user_meta.json'), JSON.stringify(meta, null, 2));
    
    return { success: true, userId: id, meta };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('user:get', async (event, userId) => {
  try {
    const userDir = getUserDir(userId);
    const metaPath = path.join(userDir, 'user_meta.json');
    
    if (!fs.existsSync(metaPath)) {
      return { success: false, error: 'User not found' };
    }
    
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    
    return { success: true, user: { id: userId, ...meta } };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('user:update', async (event, { userId, name, notes }) => {
  try {
    const userDir = getUserDir(userId);
    const metaPath = path.join(userDir, 'user_meta.json');
    
    if (!fs.existsSync(metaPath)) {
      return { success: false, error: 'User not found' };
    }
    
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    if (name !== undefined) meta.name = name;
    if (notes !== undefined) meta.notes = notes;
    
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('user:delete', async (event, userId) => {
  try {
    const userDir = getUserDir(userId);
    if (fs.existsSync(userDir)) {
      fs.rmSync(userDir, { recursive: true });
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
});

// ==================== Body Part Handlers ====================

ipcMain.handle('bodyPart:list', async (event, userId) => {
  try {
    if (!userId) return [];
    
    const userDir = getUserDir(userId);
    if (!fs.existsSync(userDir)) return [];
    
    const entries = fs.readdirSync(userDir, { withFileTypes: true });
    const bodyParts = entries
      .filter(e => e.isDirectory())
      .map(e => {
        const bpDir = path.join(userDir, e.name);
        const metaPath = path.join(bpDir, 'bodypart_meta.json');
        let meta = { label: e.name };
        if (fs.existsSync(metaPath)) {
          try {
            meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          } catch (err) {
            console.error('Error reading body part meta:', err);
          }
        }
        
        // Count sessions
        const sessionCount = fs.readdirSync(bpDir)
          .filter(f => f.endsWith('_meta.json') && f.startsWith('session_')).length;
        
        return {
          id: e.name,
          label: meta.label || e.name,
          notes: meta.notes || '',
          created: meta.created || null,
          sessionCount,
        };
      });
    
    return bodyParts.sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0));
  } catch (error) {
    console.error('Error listing body parts:', error);
    return [];
  }
});

ipcMain.handle('bodyPart:create', async (event, { userId, label, notes }) => {
  try {
    if (!userId) return { success: false, error: 'No user selected' };
    
    ensureUserDir(userId);
    const id = label.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').substring(0, 50) + '_' + Date.now();
    const bpDir = ensureBodyPartDir(userId, id);
    
    const meta = {
      label,
      notes: notes || '',
      created: new Date().toISOString(),
    };
    
    fs.writeFileSync(path.join(bpDir, 'bodypart_meta.json'), JSON.stringify(meta, null, 2));
    
    return { success: true, bodyPartId: id, meta };
  } catch (error) {
    console.error('Error creating body part:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bodyPart:get', async (event, { userId, bodyPartId }) => {
  try {
    if (!userId || !bodyPartId) return { success: false, error: 'Missing parameters' };
    
    const bpDir = getBodyPartDir(userId, bodyPartId);
    const metaPath = path.join(bpDir, 'bodypart_meta.json');
    
    if (!fs.existsSync(metaPath)) {
      return { success: false, error: 'Body part not found' };
    }
    
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    
    return { success: true, bodyPart: { id: bodyPartId, ...meta } };
  } catch (error) {
    console.error('Error getting body part:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bodyPart:update', async (event, { userId, bodyPartId, label, notes }) => {
  try {
    if (!userId || !bodyPartId) return { success: false, error: 'Missing parameters' };
    
    const bpDir = getBodyPartDir(userId, bodyPartId);
    const metaPath = path.join(bpDir, 'bodypart_meta.json');
    
    if (!fs.existsSync(metaPath)) {
      return { success: false, error: 'Body part not found' };
    }
    
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    if (label !== undefined) meta.label = label;
    if (notes !== undefined) meta.notes = notes;
    
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    
    return { success: true };
  } catch (error) {
    console.error('Error updating body part:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bodyPart:delete', async (event, { userId, bodyPartId }) => {
  try {
    if (!userId || !bodyPartId) return { success: false, error: 'Missing parameters' };
    
    const bpDir = getBodyPartDir(userId, bodyPartId);
    if (fs.existsSync(bpDir)) {
      fs.rmSync(bpDir, { recursive: true });
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting body part:', error);
    return { success: false, error: error.message };
  }
});

// ==================== Session Handlers ====================

ipcMain.handle('session:list', async (event, { userId, bodyPartId }) => {
  try {
    if (!userId || !bodyPartId) {
      console.log('session:list called with missing params');
      return [];
    }
    
    const bpDir = getBodyPartDir(userId, bodyPartId);
    if (!fs.existsSync(bpDir)) return [];
    
    const files = fs.readdirSync(bpDir);
    const metaFiles = files.filter(f => f.endsWith('_meta.json') && f.startsWith('session_'));
    
    const sessions = metaFiles.map(metaFile => {
      const sessionId = metaFile.replace('session_', '').replace('_meta.json', '');
      const metaPath = path.join(bpDir, metaFile);
      const csvPath = getSessionFilePath(userId, bodyPartId, sessionId);
      
      let meta = {};
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      } catch (e) {
        console.error('Error reading meta:', e);
      }
      
      let readingsCount = 0;
      if (fs.existsSync(csvPath)) {
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const records = parse(csvContent, { columns: true });
        readingsCount = records.length;
      }
      
      return {
        id: sessionId,
        ...meta,
        readingsCount,
      };
    });
    
    return sessions.sort((a, b) => new Date(b.created) - new Date(a.created));
  } catch (error) {
    console.error('Error listing sessions:', error);
    return [];
  }
});

ipcMain.handle('session:create', async (event, { userId, bodyPartId, notes, wireDiameter, calibrationMass }) => {
  try {
    if (!userId || !bodyPartId) {
      return { success: false, error: 'Missing user or body part' };
    }
    
    ensureBodyPartDir(userId, bodyPartId);
    const sessionId = new Date().toISOString().replace(/[:.]/g, '-');
    
    const meta = {
      created: new Date().toISOString(),
      notes: notes || '',
      wireDiameter: wireDiameter || 0.7,
      calibrationMass: calibrationMass || 41.0,
    };
    
    fs.writeFileSync(getSessionMetaFilePath(userId, bodyPartId, sessionId), JSON.stringify(meta, null, 2));
    
    const csvHeader = stringify([['slot', 'timestamp', 'grams', 'stress_g_mm2']], { header: false });
    fs.writeFileSync(getSessionFilePath(userId, bodyPartId, sessionId), csvHeader);
    
    return { success: true, sessionId, meta };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('session:get', async (event, { userId, bodyPartId, sessionId }) => {
  try {
    if (!userId || !bodyPartId || !sessionId) {
      return { success: false, error: 'Missing parameters' };
    }
    
    const metaPath = getSessionMetaFilePath(userId, bodyPartId, sessionId);
    const csvPath = getSessionFilePath(userId, bodyPartId, sessionId);
    
    if (!fs.existsSync(metaPath)) {
      return { success: false, error: 'Session not found' };
    }
    
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    
    let readings = [];
    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      readings = parse(csvContent, { columns: true });
      readings = readings.map(r => ({
        slot: parseInt(r.slot),
        timestamp: r.timestamp,
        grams: parseFloat(r.grams),
        stress: parseFloat(r.stress_g_mm2),
      }));
    }
    
    return { success: true, session: { id: sessionId, ...meta, readings } };
  } catch (error) {
    console.error('Error getting session:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('session:addReading', async (event, { userId, bodyPartId, sessionId, slot, grams, stress }) => {
  try {
    if (!userId || !bodyPartId || !sessionId) {
      return { success: false, error: 'Missing parameters' };
    }
    
    const csvPath = getSessionFilePath(userId, bodyPartId, sessionId);
    
    if (!fs.existsSync(csvPath)) {
      return { success: false, error: 'Session not found' };
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    let readings = parse(csvContent, { columns: true });
    
    readings = readings.filter(r => parseInt(r.slot) !== slot);
    
    readings.push({
      slot: slot.toString(),
      timestamp: new Date().toISOString(),
      grams: grams.toFixed(2),
      stress_g_mm2: stress.toFixed(3),
    });
    
    readings.sort((a, b) => parseInt(a.slot) - parseInt(b.slot));
    
    const output = stringify(readings, { header: true, columns: ['slot', 'timestamp', 'grams', 'stress_g_mm2'] });
    fs.writeFileSync(csvPath, output);
    
    return { success: true };
  } catch (error) {
    console.error('Error adding reading:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('session:deleteReading', async (event, { userId, bodyPartId, sessionId, slot }) => {
  try {
    if (!userId || !bodyPartId || !sessionId) {
      return { success: false, error: 'Missing parameters' };
    }
    
    const csvPath = getSessionFilePath(userId, bodyPartId, sessionId);
    
    if (!fs.existsSync(csvPath)) {
      return { success: false, error: 'Session not found' };
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    let readings = parse(csvContent, { columns: true });
    
    readings = readings.filter(r => parseInt(r.slot) !== slot);
    
    const output = stringify(readings, { header: true, columns: ['slot', 'timestamp', 'grams', 'stress_g_mm2'] });
    fs.writeFileSync(csvPath, output);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting reading:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('session:updateNotes', async (event, { userId, bodyPartId, sessionId, notes }) => {
  try {
    if (!userId || !bodyPartId || !sessionId) {
      return { success: false, error: 'Missing parameters' };
    }
    
    const metaPath = getSessionMetaFilePath(userId, bodyPartId, sessionId);
    
    if (!fs.existsSync(metaPath)) {
      return { success: false, error: 'Session not found' };
    }
    
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    meta.notes = notes;
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    
    return { success: true };
  } catch (error) {
    console.error('Error updating notes:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('session:delete', async (event, { userId, bodyPartId, sessionId }) => {
  try {
    if (!userId || !bodyPartId || !sessionId) {
      return { success: false, error: 'Missing parameters' };
    }
    
    const csvPath = getSessionFilePath(userId, bodyPartId, sessionId);
    const metaPath = getSessionMetaFilePath(userId, bodyPartId, sessionId);
    
    if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting session:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('session:export', async (event, { userId, bodyPartId, sessionId }) => {
  try {
    if (!userId || !bodyPartId || !sessionId) {
      return { success: false, error: 'Missing parameters' };
    }
    
    const csvPath = getSessionFilePath(userId, bodyPartId, sessionId);
    const metaPath = getSessionMetaFilePath(userId, bodyPartId, sessionId);
    
    if (!fs.existsSync(csvPath)) {
      return { success: false, error: 'Session not found' };
    }
    
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    
    // Get user and body part info
    const userMetaPath = path.join(getUserDir(userId), 'user_meta.json');
    const bpMetaPath = path.join(getBodyPartDir(userId, bodyPartId), 'bodypart_meta.json');
    
    let userName = userId;
    let bodyPartLabel = bodyPartId;
    
    if (fs.existsSync(userMetaPath)) {
      const userMeta = JSON.parse(fs.readFileSync(userMetaPath, 'utf-8'));
      userName = userMeta.name || userId;
    }
    if (fs.existsSync(bpMetaPath)) {
      const bpMeta = JSON.parse(fs.readFileSync(bpMetaPath, 'utf-8'));
      bodyPartLabel = bpMeta.label || bodyPartId;
    }
    
    const defaultName = `pressure_${userName.replace(/\s+/g, '_')}_${bodyPartLabel.replace(/\s+/g, '_')}_${sessionId}.csv`;
    
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
    });
    
    if (result.canceled) {
      return { success: false, error: 'Export canceled' };
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const exportContent = `# Patient: ${userName}\n# Body Part: ${bodyPartLabel}\n# Session: ${sessionId}\n# Notes: ${meta.notes}\n# Wire Diameter: ${meta.wireDiameter}mm\n# Created: ${meta.created}\n${csvContent}`;
    
    fs.writeFileSync(result.filePath, exportContent);
    
    return { success: true, path: result.filePath };
  } catch (error) {
    console.error('Error exporting session:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sessions:getAllForGraph', async (event, { userId, bodyPartId }) => {
  try {
    if (!userId || !bodyPartId) {
      console.log('sessions:getAllForGraph called with missing params');
      return [];
    }
    
    const bpDir = getBodyPartDir(userId, bodyPartId);
    if (!fs.existsSync(bpDir)) return [];
    
    const files = fs.readdirSync(bpDir);
    const metaFiles = files.filter(f => f.endsWith('_meta.json') && f.startsWith('session_'));
    
    const sessionsData = [];
    
    for (const metaFile of metaFiles) {
      const sessionId = metaFile.replace('session_', '').replace('_meta.json', '');
      const metaPath = path.join(bpDir, metaFile);
      const csvPath = getSessionFilePath(userId, bodyPartId, sessionId);
      
      let meta = {};
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      } catch (e) {
        continue;
      }
      
      if (fs.existsSync(csvPath)) {
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const readings = parse(csvContent, { columns: true });
        
        if (readings.length === 5) {
          const avgGrams = readings.reduce((sum, r) => sum + parseFloat(r.grams), 0) / 5;
          const avgStress = readings.reduce((sum, r) => sum + parseFloat(r.stress_g_mm2), 0) / 5;
          
          sessionsData.push({
            id: sessionId,
            created: meta.created,
            notes: meta.notes,
            avgGrams,
            avgStress,
          });
        }
      }
    }
    
    return sessionsData.sort((a, b) => new Date(a.created) - new Date(b.created));
  } catch (error) {
    console.error('Error getting graph data:', error);
    return [];
  }
});

ipcMain.handle('app:getDataDir', () => DATA_DIR);
