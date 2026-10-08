import React from 'react';
import { IconClock } from '@tabler/icons-react';

export default function SessionTimeoutModal({
  isOpen,
  secondsRemaining,
  onExtendSession,
  onLogout
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div
        data-lenis-prevent="true"
        className="w-full max-w-md bg-white rounded-2xl border border-[#D8DFDF] p-6 shadow-2xl flex flex-col items-center text-center"
      >
        <div className="w-14 h-14 rounded-full bg-[#E76F51]/10 text-[#E76F51] flex items-center justify-center mb-4">
          <IconClock size={32} />
        </div>

        <h3 className="text-[24px] font-bold font-manrope text-[#141717] mb-2">
          Session Expiring
        </h3>

        <p className="text-[14px] text-[#5C6768] font-inter mb-6">
          Your active session will expire soon due to inactivity. Would you like to extend your session?
        </p>

        <div className="my-2 flex items-center justify-center w-20 h-20 rounded-full border-4 border-[#E76F51]/20 bg-[#FBFBF9] mb-6">
          <span className="text-[24px] font-mono font-bold text-[#E76F51]">
            {secondsRemaining}s
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            type="button"
            onClick={onExtendSession}
            className="flex-1 h-[54px] rounded-lg bg-[#0D4446] hover:bg-[#083335] text-white font-semibold font-inter text-[16px] transition-all flex items-center justify-center active:scale-[0.98]"
          >
            Extend Session
          </button>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 h-[54px] rounded-lg border border-[#D8DFDF] hover:bg-[#F4F5F4] text-[#141717] font-semibold font-inter text-[16px] transition-all flex items-center justify-center active:scale-[0.98]"
            >
              Log Out Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
