import React from 'react';

function CalibrationModal({ onClose, calibrationStatus, calibrationMass }) {
  const getStepStatus = (step) => {
    if (!calibrationStatus) return 'pending';
    
    switch (step) {
      case 1:
        return calibrationStatus.status === 'started' || calibrationStatus.status === 'tared' 
          || calibrationStatus.status === 'complete' || calibrationStatus.status === 'verified'
          ? 'complete' : 'pending';
      case 2:
        return calibrationStatus.status === 'tared' || calibrationStatus.status === 'complete' 
          || calibrationStatus.status === 'verified'
          ? 'complete' : (calibrationStatus.status === 'started' ? 'active' : 'pending');
      case 3:
        return calibrationStatus.status === 'complete' || calibrationStatus.status === 'verified'
          ? 'complete' : (calibrationStatus.status === 'tared' ? 'active' : 'pending');
      case 4:
        return calibrationStatus.status === 'verified' 
          ? 'complete' : (calibrationStatus.status === 'complete' ? 'active' : 'pending');
      default:
        return 'pending';
    }
  };

  const isComplete = calibrationStatus?.status === 'verified' || calibrationStatus?.status === 'complete';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 animate-scale-in shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Device Calibration</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!calibrationStatus ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-200 mb-2">Ready to Calibrate</h3>
            <p className="text-slate-400 text-sm mb-6">
              Long-press the device button (≥0.7s) to start calibration.
            </p>
            <div className="text-xs text-slate-500">
              Calibration mass: <span className="text-slate-300">{calibrationMass}g</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step 1 */}
            <div className={`flex items-start gap-3 ${getStepStatus(1) === 'pending' ? 'opacity-40' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                getStepStatus(1) === 'complete' ? 'bg-medical-500' : 
                getStepStatus(1) === 'active' ? 'bg-amber-500' : 'bg-slate-600'
              }`}>
                {getStepStatus(1) === 'complete' ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs text-white font-medium">1</span>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Initialize & Tare</div>
                <div className="text-xs text-slate-400">Remove any load from the sensor</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`flex items-start gap-3 ${getStepStatus(2) === 'pending' ? 'opacity-40' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                getStepStatus(2) === 'complete' ? 'bg-medical-500' : 
                getStepStatus(2) === 'active' ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'
              }`}>
                {getStepStatus(2) === 'complete' ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs text-white font-medium">2</span>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Capture Zero</div>
                <div className="text-xs text-slate-400">Press button with no load on sensor</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`flex items-start gap-3 ${getStepStatus(3) === 'pending' ? 'opacity-40' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                getStepStatus(3) === 'complete' ? 'bg-medical-500' : 
                getStepStatus(3) === 'active' ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'
              }`}>
                {getStepStatus(3) === 'complete' ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs text-white font-medium">3</span>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Capture Known Mass</div>
                <div className="text-xs text-slate-400">Place {calibrationMass}g and press button</div>
              </div>
            </div>

            {/* Step 4 */}
            <div className={`flex items-start gap-3 ${getStepStatus(4) === 'pending' ? 'opacity-40' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                getStepStatus(4) === 'complete' ? 'bg-medical-500' : 
                getStepStatus(4) === 'active' ? 'bg-amber-500' : 'bg-slate-600'
              }`}>
                {getStepStatus(4) === 'complete' ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs text-white font-medium">4</span>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Verification</div>
                <div className="text-xs text-slate-400">Calculate and verify calibration</div>
              </div>
            </div>

            {/* Results */}
            {isComplete && (
              <div className="mt-6 p-4 bg-medical-500/10 border border-medical-500/30 rounded-xl animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-medical-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-medical-300 font-medium">Calibration Complete</span>
                </div>
                {calibrationStatus.referenceUnit && (
                  <div className="text-sm text-slate-400">
                    New reference unit: <span className="text-white mono-nums">{calibrationStatus.referenceUnit.toFixed(2)}</span> counts/g
                  </div>
                )}
                {calibrationStatus.verificationGrams && (
                  <div className="text-sm text-slate-400 mt-1">
                    Verification: <span className="text-white mono-nums">{calibrationStatus.verificationGrams.toFixed(2)}</span> g
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            {isComplete ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CalibrationModal;
