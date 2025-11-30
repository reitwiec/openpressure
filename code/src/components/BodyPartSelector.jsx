import React from 'react';

function BodyPartSelector({ bodyParts, currentUser, onSelectBodyPart, onNewBodyPart, onDeleteBodyPart, onBack }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{currentUser.name}</h1>
            <p className="text-slate-400 text-sm">Select a folder or create a new one</p>
          </div>
        </div>

        {/* New Folder Button */}
        <button
          onClick={onNewBodyPart}
          className="w-full mb-6 px-6 py-4 bg-medical-600 hover:bg-medical-500 text-white rounded-xl transition-colors btn-press flex items-center justify-center gap-3 font-medium shadow-lg shadow-medical-600/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Folder
        </button>

        {/* Folders List */}
        {bodyParts.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/30">
            <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-slate-500">No folders yet</p>
            <p className="text-slate-600 text-sm mt-1">Create a folder to organize sessions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bodyParts.map((bp) => (
              <div
                key={bp.id}
                className="group relative bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 rounded-xl transition-all cursor-pointer"
              >
                <button
                  onClick={() => onSelectBodyPart(bp.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-medium text-white truncate">{bp.label}</div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span>{bp.sessionCount} session{bp.sessionCount !== 1 ? 's' : ''}</span>
                      {bp.notes && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="truncate">{bp.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBodyPart(bp.id);
                  }}
                  className="absolute top-3 right-14 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                  title="Delete folder"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

export default BodyPartSelector;
