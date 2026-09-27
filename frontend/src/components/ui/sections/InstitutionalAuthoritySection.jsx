import { motion } from 'framer-motion';

const BENCHMARK_METRICS = [
  {
    id: 'closed_sales',
    value: '₱48.5B+',
    label: 'CLOSED SALES HANDED OVER',
    description: 'Over ₱48.5B in closed sales successfully handed over to happy homeowners and families.',
    icon: 'key',
    accent: '#0D4446'
  },
  {
    id: 'clean_title',
    value: '100%',
    label: 'CLEAN TITLE GUARANTEE',
    description: 'Every property title is verified with the Registry of Deeds so you never worry about liens or hidden loans.',
    icon: 'task_alt',
    accent: '#0D4446'
  },
  {
    id: 'secured',
    value: '35+ Years',
    label: 'SECURED TRANSACTIONS',
    description: 'Three decades of honest, fully secured transactions with zero unresolved disputes or surprises.',
    icon: 'gpp_good',
    accent: '#E76F51'
  },
  {
    id: 'licensure',
    value: '100% Legit',
    label: 'LICENSED REAL ESTATE PROS',
    description: 'Work directly with registered PRC and DHSUD professionals who protect your rights and hard-earned savings.',
    icon: 'support_agent',
    accent: '#0D4446'
  }
];

const ACCREDITATIONS = [
  {
    name: 'PRC Licensed Broker',
    subtext: 'Anti-Scam Protection',
    badge: 'PRC-REB #0019284',
    icon: 'verified'
  },
  {
    name: 'DHSUD Registered',
    subtext: 'Official License to Sell',
    badge: 'DHSUD-NCR-B-08/21',
    icon: 'home'
  },
  {
    name: '100% Clean Title Check',
    subtext: 'Registry of Deeds Verified',
    badge: 'Zero Adverse Liens',
    icon: 'assignment_turned_in'
  },
  {
    name: 'Secured Direct Payments',
    subtext: 'Official Bank Escrow',
    badge: 'Zero Cash Risk',
    icon: 'lock'
  }
];

export default function InstitutionalAuthoritySection() {
  return (
    <section className="w-full bg-[#FBFBF9] border-b border-[#D1D5DB] py-16 md:py-24 font-sans text-[#141717] relative overflow-hidden transition-colors duration-500">
      <div className="relative z-10 w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16">

        {/* SECTION HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10 md:mb-14">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="w-6 h-[2px] bg-[#0D4446]" />
              <span className="text-xs font-bold tracking-[0.25em] text-[#0D4446] uppercase">
                YOUR PEACE OF MIND
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#141717] tracking-tight leading-tight">
              We Make Buying Your Dream Home Safe and Stress-Free
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#5C6768] font-normal leading-relaxed max-w-xl">
            Buying a home is one of the biggest moments in your life. We do the heavy lifting—verifying clean titles, checking every document, and keeping your property investment completely secured.
          </p>
        </div>

        {/* 4 BENCHMARK METRIC CARDS (CRISP WHITE CARDS WITH SLATE BORDERS & DEEP SHADOWS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(0.875rem,1.5vw,1.25rem)] mb-10 md:mb-12">
          {BENCHMARK_METRICS.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white rounded-[5px] border border-[#D1D5DB] p-7 md:p-8 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] hover:border-[#141717] hover:-translate-y-1.5 transition-all duration-500 ease-out group overflow-hidden"
            >
              {/* Dynamic Top Accent Border */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] bg-transparent group-hover:bg-[#141717] transition-colors duration-500"
              />

              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#0D4446]">
                    {metric.label}
                  </span>
                  {/* Naked icon with no container box */}
                  <span
                    style={{ color: metric.accent }}
                    className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform duration-300 select-none shrink-0"
                  >
                    {metric.icon}
                  </span>
                </div>
                <div className="font-extrabold text-3xl sm:text-4xl lg:text-[42px] text-[#141717] tracking-tight group-hover:text-[#0D4446] transition-colors duration-300 leading-none font-sans">
                  {metric.value}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#E5E7EB]">
                <p className="text-xs sm:text-[13px] text-[#5C6768] font-normal leading-relaxed">
                  {metric.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* INSTITUTIONAL ACCREDITATIONS STRIP */}
        <div className="bg-white rounded-[5px] border border-[#D1D5DB] p-7 md:p-9 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              {/* Naked shield icon with no container */}
              <span className="material-symbols-outlined text-[24px] text-[#0D4446] select-none">
                verified_user
              </span>
              <span className="font-bold text-xs uppercase tracking-[0.2em] text-[#141717]">
                Your Built-In Buyer Safeguards &amp; Protections
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-[#5C6768]">
                Legally Protected Under Philippine Real Estate Laws
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ACCREDITATIONS.map((badge, idx) => (
              <div
                key={idx}
                className="rounded-[5px] p-4 bg-[#F9FAFB] border border-[#D1D5DB] hover:border-[#141717] hover:bg-white hover:shadow-sm transition-all duration-300 group/badge flex items-start gap-3"
              >
                {/* NAKED ICON WITH NO CONTAINER BOX */}
                <span className="material-symbols-outlined text-[24px] text-[#0D4446] group-hover/badge:scale-110 transition-transform duration-300 shrink-0 mt-0.5 select-none">
                  {badge.icon}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-[#141717] tracking-tight truncate">
                    {badge.name}
                  </div>
                  <div className="text-[11px] text-[#5C6768] leading-snug mt-0.5 truncate">
                    {badge.subtext}
                  </div>
                  <div className="text-[10px] font-mono font-semibold text-[#0D4446] mt-1.5 tracking-wider">
                    {badge.badge}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
