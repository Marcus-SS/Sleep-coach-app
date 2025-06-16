import React from 'react';

interface ProgressStepperProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="w-full flex justify-center">
      <div className="flex items-center space-x-4 overflow-x-auto py-2 px-2 bg-[#0e1a1a] max-w-full">
        {[...Array(totalSteps)].map((_, idx) => {
          const step = idx + 1;
          const isActive = step === currentStep;
          const isLocked = step > currentStep;
          return (
            <div key={step} className="flex flex-col items-center min-w-[40px]">
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                  ${isActive ? 'border-green-400 bg-[#1a2a2a] text-white' : 'border-gray-600 bg-[#1a2a2a] text-gray-400'}
                `}
              >
                {isLocked ? (
                  <span className="text-xs text-gray-500">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M7 11V7a5 5 0 0 1 10 0v4"/><rect width="16" height="10" x="4" y="11" stroke="currentColor" strokeWidth="2" rx="2"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/></svg>
                  </span>
                ) : (
                  <span className="font-semibold">{step}</span>
                )}
                {isActive && (
                  <svg className="absolute inset-0 m-auto" width="32" height="32" style={{zIndex: 0}}>
                    <circle cx="16" cy="16" r="14" stroke="#7fff7f" strokeWidth="2" fill="none" />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressStepper; 