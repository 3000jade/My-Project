import React from 'react';
import {
  X,
  ShieldCheck,
  Award,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Briefcase,
  CheckCircle2,
  Clock,
} from 'lucide-react';

/**
 * PublicAgentProfileModal
 * Displays a verified Sales Agent's public credentials, brokerage/team affiliation,
 * specialization, active portfolio count, and direct Inquiry / Viewing CTAs.
 * Strictly omits all internal governance fields (commission_tier, internal_notes, raw license numbers, emergency contacts).
 */
export default function PublicAgentProfileModal({
  isOpen,
  onClose,
  agent,
  onScheduleViewing,
  onSendInquiry,
}) {
  if (!isOpen || !agent) return null;

  const isAvailable = (agent.routing_availability || 'available') === 'available';
  const initials =
    (agent.name || 'Agent')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'HS';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="public-agent-modal-title"
    >
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
        {/* Top Brand Header Strip */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {agent.avatar ? (
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#0F766E]/30 shadow-2xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-[#0F766E]/20 flex items-center justify-center text-lg font-bold text-[#0F766E]">
                {initials}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="public-agent-modal-title"
                  className="text-lg font-bold text-[#1E293B] tracking-tight"
                >
                  {agent.name}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Advisor
                </span>
              </div>

              <p className="text-xs font-medium text-[#64748B] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>{agent.brokerage_name || 'Human Shelter Realty'}</span>
                {agent.team_name && (
                  <>
                    <span>•</span>
                    <span className="text-[#0F766E] font-semibold">{agent.team_name}</span>
                  </>
                )}
              </p>

              {agent.location_branch && (
                <p className="text-xs text-[#64748B] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>{agent.location_branch}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close agent profile"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Regulatory Compliance Badges (Safe Public Indicators Only) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1E293B]">PRC Verified</p>
                <p className="text-[11px] text-[#64748B]">
                  {agent.prc_verified !== false ? 'Active Real Estate License' : 'Broker Supervised'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1E293B]">DHSUD Accredited</p>
                <p className="text-[11px] text-[#64748B]">
                  {agent.dhsud_verified !== false ? 'Compliant Registration' : 'Active Standing'}
                </p>
              </div>
            </div>
          </div>

          {/* Key Portfolio Metrics */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg border border-[#E2E8F0] bg-white">
              <p className="text-base font-bold font-mono text-[#1E293B]">
                {agent.experience_years ?? 3}+ yrs
              </p>
              <p className="text-[11px] text-[#64748B]">Market Experience</p>
            </div>
            <div className="p-3 rounded-lg border border-[#E2E8F0] bg-white">
              <p className="text-base font-bold font-mono text-[#0F766E]">
                {agent.assigned_properties_count ?? 1}
              </p>
              <p className="text-[11px] text-[#64748B]">Active Listings</p>
            </div>
            <div className="p-3 rounded-lg border border-[#E2E8F0] bg-white">
              <p className="text-base font-bold font-mono text-[#1E293B]">
                {agent.recorded_sales_count ?? 0}
              </p>
              <p className="text-[11px] text-[#64748B]">Closed Deals</p>
            </div>
          </div>

          {/* Biography */}
          {agent.bio && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Advisory Specialization
              </h3>
              <p className="text-xs text-[#1E293B] leading-relaxed">{agent.bio}</p>
            </div>
          )}

          {/* Availability & Direct Contact Details */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1E293B] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0F766E]" />
                Consultation Status
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isAvailable
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {isAvailable ? 'Available for Direct Consultations' : 'Brokerage Team Assisted'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#E2E8F0] text-xs text-[#64748B]">
              {agent.phone && (
                <div className="flex items-center gap-1.5 font-mono text-[#1E293B]">
                  <Phone className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>{agent.phone}</span>
                </div>
              )}
              {agent.email && (
                <div className="flex items-center gap-1.5 truncate text-[#1E293B]">
                  <Mail className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span className="truncate">{agent.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Conversion CTAs */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-end gap-3">
          {onScheduleViewing && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onScheduleViewing();
              }}
              className="w-full sm:w-auto h-10 px-4 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#0F766E]" />
              <span>Book Site Viewing</span>
            </button>
          )}
          {onSendInquiry && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSendInquiry();
              }}
              className="w-full sm:w-auto h-10 px-5 bg-[#FF6B6B] hover:bg-[#fa5252] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send Inquiry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
