import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import SessionView from './components/SessionView';
import HistoryGraph from './components/HistoryGraph';
import ConnectionPanel from './components/ConnectionPanel';
import CalibrationModal from './components/CalibrationModal';
import NewSessionModal from './components/NewSessionModal';
import NewUserModal from './components/NewUserModal';
import NewBodyPartModal from './components/NewBodyPartModal';
import UserSelector from './components/UserSelector';
import BodyPartSelector from './components/BodyPartSelector';
import DeviceLog from './components/DeviceLog';

function App() {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [availablePorts, setAvailablePorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState(null);
  const [deviceMessages, setDeviceMessages] = useState([]);
  
  // Navigation state: 'users' | 'bodyParts' | 'sessions'
  const [screen, setScreen] = useState('users');
  
  // User state
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Body part state
  const [bodyParts, setBodyParts] = useState([]);
  const [currentBodyPart, setCurrentBodyPart] = useState(null);
  
  // Session state
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [pendingReading, setPendingReading] = useState(null);
  
  // UI state
  const [view, setView] = useState('session'); // 'session' | 'history'
  const [showCalibration, setShowCalibration] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const [showNewUser, setShowNewUser] = useState(false);
  const [showNewBodyPart, setShowNewBodyPart] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [calibrationStatus, setCalibrationStatus] = useState(null);
  
  // Settings
  const [settings, setSettings] = useState({
    wireDiameter: 0.7,
    calibrationMass: 41.0,
  });

  // Load users on mount
  useEffect(() => {
    loadUsers();
    
    const checkConnection = async () => {
      if (window.electronAPI) {
        const connected = await window.electronAPI.serial.isConnected();
        setIsConnected(connected);
      }
    };
    checkConnection();
  }, []);

  // Load body parts when user changes
  useEffect(() => {
    if (currentUser) {
      loadBodyParts(currentUser.id);
    } else {
      setBodyParts([]);
      setCurrentBodyPart(null);
    }
  }, [currentUser]);

  // Load sessions when body part changes
  useEffect(() => {
    if (currentUser && currentBodyPart) {
      loadSessions(currentUser.id, currentBodyPart.id);
    } else {
      setSessions([]);
      setCurrentSession(null);
    }
  }, [currentUser, currentBodyPart]);

  // Setup serial listeners
  useEffect(() => {
    if (!window.electronAPI) return;

    const { serial } = window.electronAPI;
    
    serial.onReading((data) => {
      console.log('Received reading:', data);
      setPendingReading(data);
    });
    
    serial.onCalibration((data) => {
      console.log('Calibration update:', data);
      setCalibrationStatus(data);
    });
    
    serial.onMessage((message) => {
      setDeviceMessages(prev => [...prev.slice(-99), { 
        time: new Date().toLocaleTimeString(), 
        text: message 
      }]);
    });
    
    serial.onError((error) => {
      console.error('Serial error:', error);
      setDeviceMessages(prev => [...prev.slice(-99), { 
        time: new Date().toLocaleTimeString(), 
        text: `ERROR: ${error}`,
        isError: true,
      }]);
    });
    
    serial.onDisconnected(() => {
      setIsConnected(false);
      setSelectedPort(null);
    });

    return () => {
      serial.removeAllListeners();
    };
  }, []);

  // Data loading functions
  const loadUsers = async () => {
    if (!window.electronAPI) return;
    const list = await window.electronAPI.user.list();
    setUsers(list);
  };

  const loadBodyParts = async (userId) => {
    if (!window.electronAPI || !userId) return;
    const list = await window.electronAPI.bodyPart.list(userId);
    setBodyParts(list);
  };

  const loadSessions = async (userId, bodyPartId) => {
    if (!window.electronAPI || !userId || !bodyPartId) return;
    const list = await window.electronAPI.session.list({ userId, bodyPartId });
    setSessions(list);
  };

  // Port functions
  const refreshPorts = useCallback(async () => {
    if (!window.electronAPI) return;
    const ports = await window.electronAPI.serial.list();
    setAvailablePorts(ports);
  }, []);

  useEffect(() => {
    refreshPorts();
    const interval = setInterval(refreshPorts, 3000);
    return () => clearInterval(interval);
  }, [refreshPorts]);

  const connectToPort = async (portPath) => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.serial.connect(portPath);
    if (result.success) {
      setIsConnected(true);
      setSelectedPort(portPath);
      setDeviceMessages([{ 
        time: new Date().toLocaleTimeString(), 
        text: `Connected to ${portPath}` 
      }]);
    } else {
      alert(`Failed to connect: ${result.error}`);
    }
  };

  const disconnect = async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.serial.disconnect();
    setIsConnected(false);
    setSelectedPort(null);
  };

  // User functions
  const selectUser = async (userId) => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.user.get(userId);
    if (result.success) {
      setCurrentUser(result.user);
      setCurrentBodyPart(null);
      setCurrentSession(null);
      setScreen('bodyParts');
    }
  };

  const createUser = async (data) => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.user.create(data);
    if (result.success) {
      await loadUsers();
      await selectUser(result.userId);
      setShowNewUser(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.electronAPI) return;
    if (!confirm('Are you sure you want to delete this patient and all their data?')) return;
    
    await window.electronAPI.user.delete(userId);
    if (currentUser?.id === userId) {
      setCurrentUser(null);
      setCurrentBodyPart(null);
      setCurrentSession(null);
      setScreen('users');
    }
    await loadUsers();
  };

  // Body part functions
  const selectBodyPart = async (bodyPartId) => {
    if (!window.electronAPI || !currentUser) return;
    const result = await window.electronAPI.bodyPart.get({ userId: currentUser.id, bodyPartId });
    if (result.success) {
      setCurrentBodyPart(result.bodyPart);
      setCurrentSession(null);
      setScreen('sessions');
      setView('session');
    }
  };

  const createBodyPart = async (data) => {
    if (!window.electronAPI || !currentUser) return;
    const result = await window.electronAPI.bodyPart.create({
      userId: currentUser.id,
      label: data.label,
      notes: data.notes,
    });
    if (result.success) {
      await loadBodyParts(currentUser.id);
      await selectBodyPart(result.bodyPartId);
      setShowNewBodyPart(false);
    }
  };

  const deleteBodyPart = async (bodyPartId) => {
    if (!window.electronAPI || !currentUser) return;
    if (!confirm('Are you sure you want to delete this body part and all its sessions?')) return;
    
    await window.electronAPI.bodyPart.delete({ userId: currentUser.id, bodyPartId });
    if (currentBodyPart?.id === bodyPartId) {
      setCurrentBodyPart(null);
      setCurrentSession(null);
      setScreen('bodyParts');
    }
    await loadBodyParts(currentUser.id);
  };

  // Session functions
  const openSession = async (sessionId) => {
    if (!window.electronAPI || !currentUser || !currentBodyPart) return;
    const result = await window.electronAPI.session.get({ 
      userId: currentUser.id, 
      bodyPartId: currentBodyPart.id,
      sessionId 
    });
    if (result.success) {
      setCurrentSession(result.session);
      setView('session');
    }
  };

  const createSession = async (data) => {
    if (!window.electronAPI || !currentUser || !currentBodyPart) return;
    const result = await window.electronAPI.session.create({
      userId: currentUser.id,
      bodyPartId: currentBodyPart.id,
      notes: data.notes,
      wireDiameter: settings.wireDiameter,
      calibrationMass: settings.calibrationMass,
    });
    if (result.success) {
      await loadSessions(currentUser.id, currentBodyPart.id);
      await openSession(result.sessionId);
      setShowNewSession(false);
    }
  };

  const addReadingToSession = async (slot) => {
    if (!currentSession || !pendingReading || !window.electronAPI || !currentUser || !currentBodyPart) return;
    
    const result = await window.electronAPI.session.addReading({
      userId: currentUser.id,
      bodyPartId: currentBodyPart.id,
      sessionId: currentSession.id,
      slot,
      grams: pendingReading.grams,
      stress: pendingReading.stress,
    });
    
    if (result.success) {
      setPendingReading(null);
      await openSession(currentSession.id);
      await loadSessions(currentUser.id, currentBodyPart.id);
    }
  };

  const deleteReading = async (slot) => {
    if (!currentSession || !window.electronAPI || !currentUser || !currentBodyPart) return;
    
    const result = await window.electronAPI.session.deleteReading({
      userId: currentUser.id,
      bodyPartId: currentBodyPart.id,
      sessionId: currentSession.id,
      slot,
    });
    
    if (result.success) {
      await openSession(currentSession.id);
      await loadSessions(currentUser.id, currentBodyPart.id);
    }
  };

  const exportSession = async () => {
    if (!currentSession || !window.electronAPI || !currentUser || !currentBodyPart) return;
    const result = await window.electronAPI.session.export({ 
      userId: currentUser.id,
      bodyPartId: currentBodyPart.id,
      sessionId: currentSession.id 
    });
    if (result.success) {
      setDeviceMessages(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        text: `Exported to ${result.path}`,
      }]);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!window.electronAPI || !currentUser || !currentBodyPart) return;
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    await window.electronAPI.session.delete({ 
      userId: currentUser.id,
      bodyPartId: currentBodyPart.id,
      sessionId 
    });
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
    await loadSessions(currentUser.id, currentBodyPart.id);
  };

  // Navigation helpers
  const goToUsers = () => {
    setCurrentUser(null);
    setCurrentBodyPart(null);
    setCurrentSession(null);
    setScreen('users');
  };

  const goToBodyParts = () => {
    setCurrentBodyPart(null);
    setCurrentSession(null);
    setScreen('bodyParts');
  };

  // Render user selection screen
  if (screen === 'users') {
    return (
      <div className="h-screen flex flex-col bg-slate-950">
        <div className="drag-region h-8 bg-slate-900/50 flex items-center px-20 border-b border-slate-800/50">
          <span className="text-xs text-slate-500 font-medium tracking-wide">PRESSURE MONITOR</span>
        </div>
        
        <div className="flex-1 flex">
          <UserSelector
            users={users}
            onSelectUser={selectUser}
            onNewUser={() => setShowNewUser(true)}
            onDeleteUser={deleteUser}
          />
          
          <ConnectionPanel
            isConnected={isConnected}
            selectedPort={selectedPort}
            availablePorts={availablePorts}
            onConnect={connectToPort}
            onDisconnect={disconnect}
            onRefresh={refreshPorts}
            settings={settings}
            onSettingsChange={setSettings}
          />
        </div>
        
        {showNewUser && (
          <NewUserModal
            onClose={() => setShowNewUser(false)}
            onCreate={createUser}
          />
        )}
      </div>
    );
  }

  // Render body part selection screen
  if (screen === 'bodyParts') {
    return (
      <div className="h-screen flex flex-col bg-slate-950">
        <div className="drag-region h-8 bg-slate-900/50 flex items-center px-20 border-b border-slate-800/50">
          <span className="text-xs text-slate-500 font-medium tracking-wide">PRESSURE MONITOR</span>
        </div>
        
        <div className="flex-1 flex">
          <BodyPartSelector
            bodyParts={bodyParts}
            currentUser={currentUser}
            onSelectBodyPart={selectBodyPart}
            onNewBodyPart={() => setShowNewBodyPart(true)}
            onDeleteBodyPart={deleteBodyPart}
            onBack={goToUsers}
          />
          
          <ConnectionPanel
            isConnected={isConnected}
            selectedPort={selectedPort}
            availablePorts={availablePorts}
            onConnect={connectToPort}
            onDisconnect={disconnect}
            onRefresh={refreshPorts}
            settings={settings}
            onSettingsChange={setSettings}
          />
        </div>
        
        {showNewBodyPart && (
          <NewBodyPartModal
            onClose={() => setShowNewBodyPart(false)}
            onCreate={createBodyPart}
          />
        )}
      </div>
    );
  }

  // Render session screen
  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Title bar */}
      <div className="drag-region h-8 bg-slate-900/50 flex items-center justify-between px-4 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <button
            onClick={goToUsers}
            className="no-drag text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Patients
          </button>
          <span className="text-slate-600">/</span>
          <button
            onClick={goToBodyParts}
            className="no-drag text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {currentUser?.name}
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-xs text-slate-200 font-medium">{currentBodyPart?.label}</span>
        </div>
        <span className="text-xs text-slate-500 font-medium tracking-wide">PRESSURE MONITOR</span>
        <div className="w-32"></div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          sessions={sessions}
          currentSession={currentSession}
          onSelectSession={openSession}
          onNewSession={() => setShowNewSession(true)}
          onDeleteSession={deleteSession}
          view={view}
          onViewChange={setView}
          currentUser={currentUser}
          currentBodyPart={currentBodyPart}
        />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="h-14 border-b border-slate-800/50 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              {view === 'session' && currentSession && (
                <h2 className="text-lg font-semibold text-slate-200">
                  Session: <span className="text-slate-400 font-normal">
                    {new Date(currentSession.created).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </h2>
              )}
              {view === 'history' && (
                <h2 className="text-lg font-semibold text-slate-200">
                  History: <span className="text-slate-400 font-normal">{currentBodyPart?.label}</span>
                </h2>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLog(!showLog)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showLog 
                    ? 'bg-slate-700 text-slate-200' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Device Log
              </button>
              
              <button
                onClick={() => setShowCalibration(true)}
                disabled={!isConnected}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Calibrate
              </button>
              
              {currentSession && (
                <button
                  onClick={exportSession}
                  className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Export CSV
                </button>
              )}
            </div>
          </div>
          
          {/* Content area */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-auto p-6">
              {view === 'session' ? (
                currentSession ? (
                  <SessionView
                    session={currentSession}
                    pendingReading={pendingReading}
                    onAddReading={addReadingToSession}
                    onDeleteReading={deleteReading}
                    onClearPending={() => setPendingReading(null)}
                    isConnected={isConnected}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-slate-400 mb-4">No session selected</p>
                      <button
                        onClick={() => setShowNewSession(true)}
                        className="px-4 py-2 bg-medical-600 hover:bg-medical-500 text-white rounded-lg transition-colors btn-press"
                      >
                        Start New Session
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <HistoryGraph userId={currentUser?.id} bodyPartId={currentBodyPart?.id} />
              )}
            </div>
            
            {showLog && (
              <DeviceLog messages={deviceMessages} onClose={() => setShowLog(false)} />
            )}
          </div>
        </div>
        
        {/* Connection panel */}
        <ConnectionPanel
          isConnected={isConnected}
          selectedPort={selectedPort}
          availablePorts={availablePorts}
          onConnect={connectToPort}
          onDisconnect={disconnect}
          onRefresh={refreshPorts}
          settings={settings}
          onSettingsChange={setSettings}
        />
      </div>
      
      {/* Modals */}
      {showCalibration && (
        <CalibrationModal
          onClose={() => {
            setShowCalibration(false);
            setCalibrationStatus(null);
          }}
          calibrationStatus={calibrationStatus}
          calibrationMass={settings.calibrationMass}
        />
      )}
      
      {showNewSession && (
        <NewSessionModal
          onClose={() => setShowNewSession(false)}
          onCreate={createSession}
          settings={settings}
        />
      )}
    </div>
  );
}

export default App;
