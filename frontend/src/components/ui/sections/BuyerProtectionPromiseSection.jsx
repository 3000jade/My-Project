import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  IconShieldCheck, 
  IconCertificate, 
  IconCoinOff, 
  IconFileCheck,
  IconArrowRight,
  IconPhoneCall
} from '@tabler/icons-react';

const PROTECTION_PILLARS = [
  {
    id: 'clean-titles',
    number: '01',
    badge: 'Registry of Deeds Vetted',
    title: '100% Clean Title Guarantee',
    description: 'Every property undergoes rigorous cadastral search, municipal tax clearance, and certified true copy verification. Never worry about fake titles or encumbrances.',
    icon: IconShieldCheck
  },
  {
    id: 'dhsud-licensed',
    number: '02',
    badge: 'Government Compliant',
    title: 'DHSUD & HLURB Accredited',
    description: 'We partner strictly with legitimate developers possessing valid Licenses to Sell (LTS) and Certificates of Registration under Philippine real estate statutes.',
    icon: IconCertificate
  },
  {
    id: 'zero-hidden-fees',
    number: '03',
    badge: 'Transparent Pricing',
    title: 'Zero Hidden Brokerage Fees',
    description: '100% free service for homebuyers. You pay only the developer’s official Total Contract Price with zero markup, unannounced fees, or surprise processing charges.',
    icon: IconCoinOff
  },
  {
    id: 'loan-assistance',
    number: '04',
    badge: 'Stress-Free Paperwork',
    title: 'Free Pag-IBIG & Bank Loan Processing',
    description: 'Our in-house financing officers prepare, submit, and expedite your mortgage dossier across Pag-IBIG and top commercial banks until your keys are turned over.',
    icon: IconFileCheck
  }
];

export default function BuyerProtectionPromiseSection() {
  const navigate = useNavigate();

  return (
    <section 
      id="buyer-protection" 
      className="w-full bg-[#FFFFFF] py-16 md:py-24 border-b border-[#D8DFDF] relative z-20 font-sans"
    >
      <div className="relative z-10 w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="w-6 h-[2px] bg-[#0D4446]" />
              <span className="text-xs font-bold tracking-[0.25em] text-[#0D4446] uppercase">
                The Human Shelter Promise
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#141717] tracking-tight leading-tight font-display">
              4-Point Buyer Protection: Total Peace of Mind for Your Life’s Biggest Investment
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#5C6768] font-normal leading-relaxed max-w-xl">
            Buying a home should bring relief and excitement, not anxiety. For 37 years, our legal and documentation protocols have protected thousands of Filipino families from transaction pitfalls.
          </p>
        </div>

        {/* 4 Protection Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROTECTION_PILLARS.map((pillar, index) => {
            const Icon = pillar.icon;

            return (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative rounded-[18px] p-6 sm:p-7 bg-white border border-[#D8DFDF] hover:border-[#0D4446]/40 shadow-[0_8px_24px_rgba(13,68,70,0.04)] hover:shadow-[0_20px_40px_rgba(13,68,70,0.1)] transition-all duration-400 flex flex-col justify-between hover:-translate-y-1.5"
              >
                <div>
                  {/* Top Datum & Number */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div className="w-12 h-12 rounded-[12px] bg-[#0D4446]/10 text-[#0D4446] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Icon size={24} stroke={2} />
                    </div>
                    <span className="font-mono text-2xl font-extrabold text-[#D8DFDF] select-none">
                      {pillar.number}
                    </span>
                  </div>

                  {/* Stamp Badge */}
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-mono text-[10px] font-bold uppercase tracking-wider mb-3">
                    {pillar.badge}
                  </div>

                  <h3 className="text-lg font-bold text-[#141717] mb-2.5 leading-snug group-hover:text-[#0D4446] transition-colors">
                    {pillar.title}
                  </h3>

                  <p className="text-xs sm:text-[13px] text-[#5C6768] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                {/* Bottom Verification Accent */}
                <div className="mt-6 pt-4 border-t border-[#D8DFDF]/60 flex items-center justify-between text-[11px] font-mono font-semibold text-[#0D4446]">
                  <span className="uppercase tracking-wider">Human Shelter Verified</span>
                  <span className="text-emerald-600">✓ Protected</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Protection Reassurance Strip */}
        <div className="mt-12 rounded-[16px] p-6 sm:p-8 bg-gradient-to-r from-[#0D4446] to-[#082b2d] text-white border border-white/10 shadow-[0_16px_36px_rgba(13,68,70,0.18)] flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center lg:text-left">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#E76F51] font-bold">
              Licensed Professionals & DHSUD Registered Brokerage
            </div>
            <h4 className="text-xl sm:text-2xl font-bold font-display">
              Have Questions About a Property’s Title or Loan Qualification?
            </h4>
            <p className="text-xs sm:text-sm text-white/80 max-w-2xl">
              Talk directly with a licensed Human Shelter broker. We review property documents, compute bank terms, and schedule on-site viewings with zero obligation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/contact')}
              className="h-[52px] px-7 rounded-full bg-[#E76F51] hover:bg-[#d65c3e] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-[0_4px_16px_rgba(231,111,81,0.35)] transition-all cursor-pointer"
            >
              <IconPhoneCall size={18} stroke={2.5} />
              <span>Speak with a Licensed Broker</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
