import React, { useRef, useEffect } from 'react';

function DeviceLog({ messages, onClose }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="w-80 bg-slate-900/70 border-l border-slate-800/50 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-800/50 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">Device Log</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div 
        ref={logRef}
        className="flex-1 overflow-auto p-3 font-mono text-xs space-y-1"
      >
        {messages.length === 0 ? (
          <div className="text-slate-500 text-center py-4">
            No messages yet
          </div>
        ) : (
          messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex gap-2 ${msg.isError ? 'text-red-400' : 'text-slate-400'}`}
            >
              <span className="text-slate-600 flex-shrink-0">{msg.time}</span>
              <span className="break-all">{msg.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DeviceLog;
