import { motion } from 'framer-motion';

const BENCHMARK_METRICS = [
  {
    id: 'closed_sales',
    value: '₱48.5B+',
    label: 'CLOSED SALES HANDED OVER',
    description: 'Over ₱48.5B in closed sales successfully handed over to happy homeowners and families.',
    icon: 'key',
    accent: '#1b4d4b'
  },
  {
    id: 'clean_title',
    value: '100%',
    label: 'CLEAN TITLE GUARANTEE',
    description: 'Every property title is verified with the Registry of Deeds so you never worry about liens or hidden loans.',
    icon: 'task_alt',
    accent: '#1b4d4b'
  },
  {
    id: 'secured',
    value: '35+ Years',
    label: 'SECURED TRANSACTIONS',
    description: 'Three decades of honest, fully secured transactions with zero unresolved disputes or surprises.',
    icon: 'gpp_good',
    accent: '#e28468'
  },
  {
    id: 'licensure',
    value: '100% Legit',
    label: 'LICENSED REAL ESTATE PROS',
    description: 'Work directly with registered PRC and DHSUD professionals who protect your rights and hard-earned savings.',
    icon: 'support_agent',
    accent: '#1b4d4b'
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
    <section className="w-full bg-gradient-to-b from-[#fbfbf9] via-[#f7f7f4] to-[#f2f2ee] border-y border-[#e5e5df] py-16 md:py-24 font-sans text-[#0f1722] relative overflow-hidden">
      {/* Architectural Ambient Grid Texture */}
      <div 
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(#1b4d4b_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.035] pointer-events-none" 
      />

      {/* Subtle Radial Glow Atmosphere */}
      <div 
        aria-hidden="true"
        className="absolute -top-40 right-10 w-[500px] h-[500px] bg-[#1b4d4b]/5 rounded-full blur-3xl pointer-events-none" 
      />
      <div 
        aria-hidden="true"
        className="absolute -bottom-40 left-10 w-[500px] h-[500px] bg-[#e28468]/5 rounded-full blur-3xl pointer-events-none" 
      />

      <div className="relative z-10 w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16">
        
        {/* SECTION HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 md:mb-16">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="w-6 h-[2px] bg-[#1b4d4b]" />
              <span className="text-xs font-bold tracking-[0.25em] text-[#1b4d4b] uppercase">
                YOUR PEACE OF MIND
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f1722] tracking-tight leading-tight">
              We Make Buying Your Dream Home Safe and Stress-Free
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#4a525d] font-normal leading-relaxed max-w-xl">
            Buying a home is one of the biggest moments in your life. We do the heavy lifting—verifying clean titles, checking every document, and keeping your property investment completely secured.
          </p>
        </div>

        {/* 4 BENCHMARK METRIC CARDS (NO NUMBERS, NAKED ICONS WITHOUT CONTAINERS, 5PX CORNERS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(0.875rem,1.5vw,1.25rem)] mb-10 md:mb-12">
          {BENCHMARK_METRICS.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white/95 backdrop-blur-sm rounded-[5px] border border-[#e5e5df] p-7 md:p-8 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-15px_rgba(27,77,75,0.12)] hover:border-[#1b4d4b]/50 hover:-translate-y-1 transition-all duration-500 ease-out group overflow-hidden"
            >
              {/* Dynamic Top Accent Border */}
              <div 
                className="absolute top-0 left-0 right-0 h-[3px] bg-transparent group-hover:bg-[#1b4d4b] transition-colors duration-500" 
              />

              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#1b4d4b]">
                    {metric.label}
                  </span>
                  {/* Naked icon with no container box */}
                  <span className="material-symbols-outlined text-[28px] text-[#1b4d4b] group-hover:scale-110 transition-transform duration-300 select-none shrink-0">
                    {metric.icon}
                  </span>
                </div>
                <div className="font-extrabold text-3xl sm:text-4xl lg:text-[42px] text-[#0f1722] tracking-tight group-hover:text-[#1b4d4b] transition-colors duration-300 leading-none">
                  {metric.value}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#f0f0ed]">
                <p className="text-xs sm:text-[13px] text-[#5a6472] font-normal leading-relaxed">
                  {metric.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* INSTITUTIONAL ACCREDITATIONS STRIP (PROPER ICONS, NO CONTAINERS, 5PX CORNERS) */}
        <div className="bg-white/95 backdrop-blur-sm rounded-[5px] border border-[#e5e5df] p-7 md:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#f0f0ed]">
            <div className="flex items-center gap-3">
              {/* Naked shield icon with no container */}
              <span className="material-symbols-outlined text-[24px] text-[#1b4d4b] select-none">
                verified_user
              </span>
              <span className="font-bold text-xs uppercase tracking-[0.2em] text-[#0f1722]">
                Your Built-In Buyer Safeguards &amp; Protections
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-[#5a6472]">
                Legally Protected Under Philippine Real Estate Laws
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ACCREDITATIONS.map((badge, idx) => (
              <div 
                key={idx} 
                className="rounded-[5px] p-4 bg-[#fbfbf9] border border-[#e5e5df]/80 hover:border-[#1b4d4b]/40 hover:bg-white hover:shadow-sm transition-all duration-300 group/badge flex items-start gap-3"
              >
                {/* NAKED ICON WITH NO CONTAINER BOX */}
                <span className="material-symbols-outlined text-[24px] text-[#1b4d4b] group-hover/badge:scale-110 transition-transform duration-300 shrink-0 mt-0.5 select-none">
                  {badge.icon}
                </span>
                
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-[#0f1722] tracking-tight truncate">
                    {badge.name}
                  </div>
                  <div className="text-[11px] text-[#5a6472] leading-snug mt-0.5 truncate">
                    {badge.subtext}
                  </div>
                  <div className="text-[10px] font-mono font-semibold text-[#1b4d4b] mt-1.5 tracking-wider">
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
