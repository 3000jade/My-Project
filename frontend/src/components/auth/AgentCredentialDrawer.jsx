import React from 'react';
import {
  IconX,
  IconCertificate,
  IconBuildingStore,
  IconCalendar,
  IconShieldCheck,
  IconAlertCircle,
} from '@tabler/icons-react';

/**
 * AgentCredentialDrawer Component
 * Slide-out detail sheet for inspecting Real Estate Agent PRC & DHSUD accreditation
 */
export default function AgentCredentialDrawer({
  isOpen,
  onClose,
  agent,
}) {
  if (!isOpen || !agent) return null;

  const hasPrc = Boolean(agent.prc_license_no);
  const hasDhsud = Boolean(agent.dhsud_accreditation_no);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#E2E8F0] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 border-b border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-[#0F766E] rounded-lg">
                  <IconCertificate className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1E293B]">
                    Professional Accreditation
                  </h3>
                  <p className="text-xs text-[#64748B]">Regulatory compliance review</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#64748B] hover:text-[#1E293B] rounded-lg transition-colors border border-[#E2E8F0]"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Agent Mini Profile */}
            <div className="mt-4 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm">
                {(agent.fullName || agent.full_name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-[#1E293B] truncate">
                  {agent.fullName || agent.full_name || 'Agent'}
                </h4>
                <p className="text-xs text-[#64748B] truncate">{agent.email}</p>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-teal-100 text-teal-800">
                Agent
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* PRC Accreditation Card */}
            <div className="border border-[#E2E8F0] rounded-xl p-4 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconShieldCheck className="w-4 h-4 text-[#0F766E]" />
                  <span className="text-xs font-semibold text-[#1E293B]">
                    PRC Real Estate Broker/Salesperson License
                  </span>
                </div>
                {hasPrc ? (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                    Registered
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded-full">
                    Unregistered
                  </span>
                )}
              </div>

              {hasPrc ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-[#64748B]">License Number</span>
                    <span className="font-mono font-semibold text-[#0F766E]">
                      {agent.prc_license_no}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#64748B]">Validity Date</span>
                    <span className="font-medium text-[#1E293B]">
                      {agent.prc_validity || 'Valid (On File)'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                  <IconAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    This practitioner has not submitted a verified PRC License number. Public
                    listing creation is restricted.
                  </p>
                </div>
              )}
            </div>

            {/* DHSUD Accreditation Card */}
            <div className="border border-[#E2E8F0] rounded-xl p-4 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconBuildingStore className="w-4 h-4 text-[#0F766E]" />
                  <span className="text-xs font-semibold text-[#1E293B]">
                    DHSUD Housing & Urban Dev Accreditation
                  </span>
                </div>
                {hasDhsud ? (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                    Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                    Not Registered
                  </span>
                )}
              </div>

              {hasDhsud ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-[#64748B]">Registration No</span>
                    <span className="font-mono font-semibold text-[#1E293B]">
                      {agent.dhsud_accreditation_no}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#64748B]">Accreditation Validity</span>
                    <span className="font-medium text-[#1E293B]">
                      {agent.dhsud_validity || 'Active'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">
                  No DHSUD accreditation documents currently attached.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#1E293B] bg-white border border-[#E2E8F0] hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
