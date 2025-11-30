import React, { useState } from 'react';

function ConnectionPanel({ isConnected, selectedPort, availablePorts, onConnect, onDisconnect, onRefresh, settings, onSettingsChange }) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="w-72 bg-slate-900/50 border-l border-slate-800/50 flex flex-col">
      {/* Connection status */}
      <div className="p-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-400">Device</span>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-medical-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-medical-500"></span>
                </span>
                <span className="text-xs text-medical-400">Connected</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                <span className="text-xs text-slate-500">Disconnected</span>
              </>
            )}
          </div>
        </div>
        
        {isConnected ? (
          <div className="space-y-2">
            <div className="bg-slate-800/50 rounded-lg px-3 py-2">
              <div className="text-xs text-slate-400 mb-0.5">Port</div>
              <div className="text-sm text-white font-mono truncate">{selectedPort}</div>
            </div>
            <button
              onClick={onDisconnect}
              className="w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">Available Ports</span>
              <button
                onClick={onRefresh}
                className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200"
                title="Refresh ports"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {availablePorts.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-sm">
                No devices found
              </div>
            ) : (
              <div className="space-y-1">
                {availablePorts.map((port) => (
                  <button
                    key={port.path}
                    onClick={() => onConnect(port.path)}
                    className="w-full text-left px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors group"
                  >
                    <div className="text-sm text-slate-200 font-mono truncate">
                      {port.path}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {port.manufacturer}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Settings toggle */}
      <div className="p-4 border-b border-slate-800/50">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>Settings</span>
          <svg 
            className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showSettings && (
          <div className="mt-4 space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Wire Diameter (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.wireDiameter}
                onChange={(e) => onSettingsChange({ ...settings, wireDiameter: parseFloat(e.target.value) || 0.7 })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/50 focus:border-medical-500"
              />
            </div>
            
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Calibration Mass (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.calibrationMass}
                onChange={(e) => onSettingsChange({ ...settings, calibrationMass: parseFloat(e.target.value) || 41.0 })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/50 focus:border-medical-500"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="flex-1 p-4">
        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
          Quick Guide
        </h4>
        <div className="space-y-3 text-sm text-slate-500">
          <div className="flex gap-2">
            <span className="text-medical-500">1.</span>
            <span>Connect the KB2040 device via USB</span>
          </div>
          <div className="flex gap-2">
            <span className="text-medical-500">2.</span>
            <span>Select the port and connect</span>
          </div>
          <div className="flex gap-2">
            <span className="text-medical-500">3.</span>
            <span>Create a new session</span>
          </div>
          <div className="flex gap-2">
            <span className="text-medical-500">4.</span>
            <span>Press device button to record (5 readings needed)</span>
          </div>
        </div>
      </div>
      
      {/* Status bar */}
      <div className="p-3 border-t border-slate-800/50 bg-slate-900/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Wire area</span>
          <span className="text-slate-400 mono-nums">
            {(Math.PI * Math.pow(settings.wireDiameter / 2, 2)).toFixed(4)} mm²
          </span>
        </div>
      </div>
    </div>
  );
}

export default ConnectionPanel;
