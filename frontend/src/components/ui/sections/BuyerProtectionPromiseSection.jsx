import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconSearch,
  IconCalculator,
  IconMessageCircle,
  IconEye,
  IconHomeDollar,
  IconShieldCheck,
  IconPhoneCall
} from '@tabler/icons-react';

const BUYERS_GUIDE_STEPS = [
  {
    id: 'platform-search',
    number: '01',
    badge: 'Step Label',
    title: 'Step 1',
    shortDesc: 'Short summary for step 1.',
    extendedDesc: 'Detailed description for step 1.',
    stats: [
      { label: 'Metric 1', value: '--' },
      { label: 'Metric 2', value: '--' }
    ],
    icon: IconSearch
  },
  {
    id: 'financial-prep',
    number: '02',
    badge: 'Step Label',
    title: 'Step 2',
    shortDesc: 'Short summary for step 2.',
    extendedDesc: 'Detailed description for step 2.',
    stats: [
      { label: 'Metric 1', value: '--' },
      { label: 'Metric 2', value: '--' }
    ],
    icon: IconCalculator
  },
  {
    id: 'evaluation-inquiry',
    number: '03',
    badge: 'Step Label',
    title: 'Step 3',
    shortDesc: 'Short summary for step 3.',
    extendedDesc: 'Detailed description for step 3.',
    stats: [
      { label: 'Metric 1', value: '--' },
      { label: 'Metric 2', value: '--' }
    ],
    icon: IconMessageCircle
  },
  {
    id: 'viewings-checklist',
    number: '04',
    badge: 'Step Label',
    title: 'Step 4',
    shortDesc: 'Short summary for step 4.',
    extendedDesc: 'Detailed description for step 4.',
    stats: [
      { label: 'Metric 1', value: '--' },
      { label: 'Metric 2', value: '--' }
    ],
    icon: IconEye
  },
  {
    id: 'offer-closing',
    number: '05',
    badge: 'Step Label',
    title: 'Step 5',
    shortDesc: 'Short summary for step 5.',
    extendedDesc: 'Detailed description for step 5.',
    stats: [
      { label: 'Metric 1', value: '--' },
      { label: 'Metric 2', value: '--' }
    ],
    icon: IconHomeDollar
  },
  {
    id: 'safety-fraud',
    number: '06',
    badge: 'Step Label',
    title: 'Step 6',
    shortDesc: 'Short summary for step 6.',
    extendedDesc: 'Detailed description for step 6.',
    stats: [
      { label: 'Metric 1', value: '--' },
      { label: 'Metric 2', value: '--' }
    ],
    icon: IconShieldCheck
  }
];

export default function BuyerProtectionPromiseSection() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(BUYERS_GUIDE_STEPS[0].id);

  return (
    <section 
      id="buyer-protection" 
      className="w-full bg-white py-16 md:py-24 border-b border-[#E2E8F0] relative z-20 font-sans text-[#1E293B]"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-10 lg:px-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-6 h-[2px] bg-[#0F766E]" />
            <span className="text-xs font-bold tracking-[0.25em] text-[#0F766E] uppercase">
              Subtitle
            </span>
            <span className="w-6 h-[2px] bg-[#0F766E]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight font-display mb-6">
            Section Title
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] font-normal leading-relaxed">
            Section description.
          </p>
        </div>

        {/* Interactive Vertical Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          
          {/* Left Column: Timeline Steps Navigation */}
          <div className="lg:col-span-5 relative">
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-[#CBD5E1] hidden sm:block" />
            
            <div className="space-y-4">
              {BUYERS_GUIDE_STEPS.map((step) => {
                const isActive = activeStep === step.id;
                
                return (
                  <div 
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`relative flex items-start gap-4 sm:gap-6 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      isActive ? 'bg-white shadow-md border border-[#E2E8F0]' : 'hover:bg-[#1E293B]/5 border border-transparent'
                    }`}
                  >
                    <div className={`relative z-10 shrink-0 w-12 h-12 rounded-full border-[3px] flex items-center justify-center font-mono font-bold transition-colors duration-300 ${
                      isActive ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-white border-[#CBD5E1] text-[#64748B]'
                    }`}>
                      {step.number}
                    </div>
                    <div className="pt-2">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0F766E] mb-1">
                        {step.badge}
                      </div>
                      <h3 className={`text-lg font-bold mb-1 transition-colors ${isActive ? 'text-[#1E293B]' : 'text-[#64748B]'}`}>
                        {step.title}
                      </h3>
                      <p className={`text-sm leading-relaxed transition-all duration-300 ${isActive ? 'text-[#64748B] h-auto opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
                        {step.shortDesc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Info Panel */}
          <div className="lg:col-span-7">
            <div className="sticky top-32 bg-white rounded-3xl p-8 sm:p-10 border border-[#D8DFDF] shadow-[0_20px_60px_rgba(13,68,70,0.08)]">
              <AnimatePresence mode="wait">
                {BUYERS_GUIDE_STEPS.map((step) => {
                  if (activeStep !== step.id) return null;
                  const Icon = step.icon;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col h-full"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-[#0D4446]/5 text-[#0D4446] flex items-center justify-center mb-8">
                        <Icon size={32} stroke={2} />
                      </div>
                      
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-[#141717] mb-6 leading-tight">
                        {step.title}
                      </h3>
                      
                      <p className="text-base sm:text-lg text-[#5C6768] leading-relaxed mb-10">
                        {step.extendedDesc}
                      </p>

                      <div className="grid grid-cols-2 gap-6 mt-auto pt-8 border-t border-[#D8DFDF]">
                        {step.stats.map((stat, i) => (
                          <div key={i}>
                            <div className="text-3xl font-mono font-bold text-[#0D4446] mb-1">
                              {stat.value}
                            </div>
                            <div className="text-xs uppercase tracking-wider font-bold text-[#8E9A9B]">
                              {stat.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Action Banner */}
        <div className="mt-20 rounded-[16px] p-6 sm:p-10 bg-[#0F766E] text-white shadow-lg flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 opacity-5 pointer-events-none">
            <IconSearch size={300} />
          </div>
          <div className="space-y-2 text-center lg:text-left relative z-10">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#CCFBF1] font-bold">
              Subtitle
            </div>
            <h4 className="text-2xl sm:text-3xl font-bold font-display mb-2">
              Banner Title
            </h4>
            <p className="text-sm sm:text-base text-white/85 max-w-2xl">
              Banner description.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/contact')}
              className="h-14 px-8 rounded-full bg-[#FF8559] hover:bg-[#F07144] text-white font-bold text-sm uppercase tracking-wider flex items-center gap-3 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <IconPhoneCall size={20} stroke={2.5} />
              <span>Talk to a Buyer's Agent</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
