import React, { useState } from 'react';

function SessionView({ session, pendingReading, onAddReading, onDeleteReading, onClearPending, isConnected }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Create array of 5 slots
  const slots = [1, 2, 3, 4, 5].map(slotNum => {
    const reading = session.readings?.find(r => r.slot === slotNum);
    return {
      slot: slotNum,
      reading,
      isEmpty: !reading,
    };
  });
  
  const completedCount = slots.filter(s => !s.isEmpty).length;
  const isComplete = completedCount === 5;
  
  // Calculate averages if we have readings
  const avgGrams = completedCount > 0
    ? slots.reduce((sum, s) => sum + (s.reading?.grams || 0), 0) / completedCount
    : 0;
  const avgStress = completedCount > 0
    ? slots.reduce((sum, s) => sum + (s.reading?.stress || 0), 0) / completedCount
    : 0;

  const handleSlotClick = (slot) => {
    if (pendingReading) {
      setSelectedSlot(slot);
    }
  };

  const confirmAddReading = () => {
    if (selectedSlot && pendingReading) {
      onAddReading(selectedSlot);
      setSelectedSlot(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Session header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-white">
                {new Date(session.created).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h1>
              {isComplete && (
                <span className="px-2 py-1 bg-medical-600/20 text-medical-400 text-xs font-medium rounded-full">
                  Complete
                </span>
              )}
            </div>
            <p className="text-slate-400">
              {new Date(session.created).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {session.notes && ` • ${session.notes}`}
            </p>
          </div>
          
          {/* Progress indicator */}
          <div className="text-right">
            <div className="text-3xl font-bold text-white mono-nums">
              {completedCount}<span className="text-slate-600">/5</span>
            </div>
            <div className="text-xs text-slate-500">readings</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-medical-600 to-medical-400 transition-all duration-500"
            style={{ width: `${(completedCount / 5) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Pending reading alert */}
      {pendingReading && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-scale-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <div className="text-amber-200 font-medium">New Reading Received</div>
                <div className="text-amber-300/70 text-sm mono-nums">
                  {pendingReading.grams.toFixed(2)} g • {pendingReading.stress.toFixed(3)} g/mm²
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-amber-300/70">Select a slot below to save</span>
              <button
                onClick={onClearPending}
                className="p-1.5 hover:bg-amber-500/20 rounded-lg transition-colors text-amber-400"
                title="Discard reading"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reading slots grid */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {slots.map(({ slot, reading, isEmpty }) => (
          <div
            key={slot}
            onClick={() => handleSlotClick(slot)}
            className={`reading-card relative rounded-xl p-4 transition-all ${
              pendingReading
                ? 'cursor-pointer hover:ring-2 hover:ring-medical-500/50'
                : ''
            } ${
              selectedSlot === slot
                ? 'ring-2 ring-medical-500 bg-medical-500/10'
                : isEmpty
                  ? 'bg-slate-800/30 border border-dashed border-slate-700'
                  : 'bg-slate-800/50 border border-slate-700/50'
            }`}
          >
            {/* Slot number badge */}
            <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              isEmpty ? 'bg-slate-700 text-slate-400' : 'bg-medical-600 text-white'
            }`}>
              {slot}
            </div>
            
            {isEmpty ? (
              <div className="h-20 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-6 h-6 mx-auto text-slate-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs text-slate-500">Empty</span>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <div className="text-2xl font-bold text-white mono-nums mb-1">
                  {reading.grams.toFixed(1)}
                  <span className="text-sm text-slate-400 font-normal ml-1">g</span>
                </div>
                <div className="text-sm text-slate-400 mono-nums">
                  {reading.stress.toFixed(2)} g/mm²
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  {new Date(reading.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteReading(slot);
                  }}
                  className="absolute top-2 right-2 p-1 rounded opacity-0 hover:opacity-100 focus:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                  title="Delete and re-record"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Confirmation dialog for adding reading */}
      {selectedSlot && pendingReading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 animate-scale-in">
            <h3 className="text-lg font-semibold text-white mb-2">
              {slots[selectedSlot - 1].reading ? 'Replace Reading?' : 'Save Reading?'}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {slots[selectedSlot - 1].reading
                ? `This will replace the existing reading in slot ${selectedSlot}.`
                : `Save this reading to slot ${selectedSlot}?`
              }
            </p>
            <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
              <div className="text-xl font-bold text-white mono-nums">
                {pendingReading.grams.toFixed(2)} g
              </div>
              <div className="text-sm text-slate-400 mono-nums">
                {pendingReading.stress.toFixed(3)} g/mm²
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedSlot(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddReading}
                className="flex-1 px-4 py-2 bg-medical-600 hover:bg-medical-500 text-white rounded-lg transition-colors"
              >
                {slots[selectedSlot - 1].reading ? 'Replace' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary section */}
      {completedCount > 0 && (
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
            Session Summary
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-bold gradient-text mono-nums">
                {avgGrams.toFixed(2)}
              </div>
              <div className="text-slate-400 text-sm">Average Weight (g)</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text mono-nums">
                {avgStress.toFixed(3)}
              </div>
              <div className="text-slate-400 text-sm">Average Stress (g/mm²)</div>
            </div>
          </div>
          
          {!isComplete && (
            <div className="mt-4 pt-4 border-t border-slate-700/30">
              <p className="text-sm text-slate-500">
                {isConnected
                  ? `Take ${5 - completedCount} more reading${5 - completedCount > 1 ? 's' : ''} to complete this session. Press the button on the device.`
                  : 'Connect to device to take readings.'
                }
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Empty state when no readings */}
      {completedCount === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">Ready to Record</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            {isConnected
              ? 'Press the button on the device to take a pressure reading. You need 5 readings to complete this session.'
              : 'Connect to the device using the panel on the right, then press the button to take readings.'
            }
          </p>
        </div>
      )}
    </div>
  );
}

export default SessionView;
