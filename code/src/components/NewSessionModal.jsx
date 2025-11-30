import React, { useState } from 'react';

function NewSessionModal({ onClose, onCreate, settings }) {
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ notes });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 animate-scale-in shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">New Session</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">
              Session Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Left heel pressure test, Patient follow-up..."
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-medical-500/50 focus:border-medical-500 resize-none"
            />
          </div>

          {/* Current settings info */}
          <div className="mb-6 p-3 bg-slate-900/50 rounded-lg">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Session Settings</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-500">Wire Ø:</span>
                <span className="text-slate-200 ml-1">{settings.wireDiameter}mm</span>
              </div>
              <div>
                <span className="text-slate-500">Cal Mass:</span>
                <span className="text-slate-200 ml-1">{settings.calibrationMass}g</span>
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Change these in the connection panel
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-medical-600 hover:bg-medical-500 text-white rounded-lg transition-colors font-medium"
            >
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewSessionModal;
