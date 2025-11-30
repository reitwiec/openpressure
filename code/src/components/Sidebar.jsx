import React from 'react';

function Sidebar({ sessions, currentSession, onSelectSession, onNewSession, onDeleteSession, view, onViewChange, currentUser, currentBodyPart }) {
  return (
    <div className="w-64 bg-slate-900/50 border-r border-slate-800/50 flex flex-col">
      {/* User & Folder info */}
      {currentUser && currentBodyPart && (
        <div className="p-3 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{currentBodyPart.label}</div>
              <div className="text-xs text-slate-500">{currentUser.name}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* View switcher */}
      <div className="p-3 border-b border-slate-800/50">
        <div className="flex bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => onViewChange('session')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-all ${
              view === 'session'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Session
          </button>
          <button
            onClick={() => onViewChange('history')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-all ${
              view === 'history'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            History
          </button>
        </div>
      </div>
      
      {/* New session button */}
      <div className="p-3">
        <button
          onClick={onNewSession}
          className="w-full px-4 py-2.5 bg-medical-600 hover:bg-medical-500 text-white rounded-lg transition-colors btn-press flex items-center justify-center gap-2 font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Session
        </button>
      </div>
      
      {/* Sessions list */}
      <div className="flex-1 overflow-auto px-3 pb-3">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-2">
          Recent Sessions
        </div>
        
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No sessions yet
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative rounded-lg transition-all cursor-pointer ${
                  currentSession?.id === session.id
                    ? 'bg-slate-700/70'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <button
                  onClick={() => onSelectSession(session.id)}
                  className="w-full text-left px-3 py-2.5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      currentSession?.id === session.id ? 'text-white' : 'text-slate-200'
                    }`}>
                      {new Date(session.created).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      session.readingsCount === 5
                        ? 'bg-medical-600/20 text-medical-400'
                        : 'bg-amber-600/20 text-amber-400'
                    }`}>
                      {session.readingsCount}/5
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(session.created).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {session.notes && (
                    <div className="text-xs text-slate-500 mt-1 truncate">
                      {session.notes}
                    </div>
                  )}
                </button>
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                  title="Delete session"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
