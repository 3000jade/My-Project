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
    badge: 'Smart Discovery',
    title: 'Platform Search & Discovery',
    shortDesc: 'Leverage our advanced filters, saved searches, and real-time alerts to find your perfect property.',
    extendedDesc: 'Start your journey by utilizing Human Shelter’s advanced search algorithms. Filter properties by location, type, price range, bedrooms, and specific amenities. Create custom saved searches to receive real-time email alerts for price drops and new listings. We empower you to interpret listing details like a pro—from virtual tours and floor plans to analyzing HOA/maintenance fees and days on market.',
    stats: [
      { label: 'Search Filters', value: '50+' },
      { label: 'Alert Speed', value: 'Real-time' }
    ],
    icon: IconSearch
  },
  {
    id: 'financial-prep',
    number: '02',
    badge: 'Budget Mastery',
    title: 'Financial Preparation & Budgeting',
    shortDesc: 'Determine your true affordability and secure mortgage pre-approval before touring.',
    extendedDesc: 'Knowing your budget is crucial. We help you calculate true affordability beyond the listing price—factoring in closing costs, property taxes, insurance, and maintenance. Use our integrated mortgage and payment calculators to estimate monthly costs, and learn the critical difference between getting pre-qualified versus pre-approved so you can shop with verified confidence.',
    stats: [
      { label: 'Integrated Calcs', value: '100%' },
      { label: 'Hidden Fees', value: 'Zero' }
    ],
    icon: IconCalculator
  },
  {
    id: 'evaluation-inquiry',
    number: '03',
    badge: 'Smart Inquiry',
    title: 'The Evaluation & Inquiry Process',
    shortDesc: 'Spot red flags in listings and safely contact agents directly through our platform.',
    extendedDesc: 'Learn to spot red flags and green flags in online listing photos and descriptions before committing your time. When you are ready, safely contact listing agents or sellers directly through our secure platform messaging. We even provide you with a list of recommended, hard-hitting questions to ask before booking a tour so you have all the leverage.',
    stats: [
      { label: 'Verified Agents', value: '100%' },
      { label: 'Secure Messages', value: 'E2E' }
    ],
    icon: IconMessageCircle
  },
  {
    id: 'viewings-checklist',
    number: '04',
    badge: 'Thorough Inspection',
    title: 'In-Person & Virtual Viewings',
    shortDesc: 'Inspect structural conditions and evaluate the neighborhood with our curated diligence checklist.',
    extendedDesc: 'During open houses or private viewings, rely on our curated checklist to inspect key items: structural condition, natural light, neighborhood noise, and storage space. Beyond the property lines, we guide your neighborhood diligence—evaluating transit access, school ratings, walkability, and checking municipal records for future zoning developments.',
    stats: [
      { label: 'Tour Checklist', value: '25-Pt' },
      { label: 'Zoning Checks', value: 'Vital' }
    ],
    icon: IconEye
  },
  {
    id: 'offer-closing',
    number: '05',
    badge: 'Secure Acquisition',
    title: 'Making an Offer to Closing',
    shortDesc: 'Craft competitive offers, navigate inspections, and conquer the closing process.',
    extendedDesc: 'Crafting a competitive offer requires strategy. We guide you through the intricacies of contingencies, earnest money, and offer price strategies. Once accepted, we break down the home inspection and appraisal process so there are no surprises. Finally, we provide a step-by-step summary of the closing process, ensuring your keys are turned over smoothly.',
    stats: [
      { label: 'Closing Success', value: '99%' },
      { label: 'Offer Strategy', value: 'Data-led' }
    ],
    icon: IconHomeDollar
  },
  {
    id: 'safety-fraud',
    number: '06',
    badge: 'Total Protection',
    title: 'Buyer Safety & Fraud Prevention',
    shortDesc: 'Recognize common scams and keep your personal financial data completely secure.',
    extendedDesc: 'Your security is paramount. We train you to recognize common online property scams, including wire fraud, duplicate listings, and unverified sellers. Our platform utilizes bank-grade encryption, and we provide stringent best practices for keeping your personal and financial data locked down while using the site. Peace of mind is our ultimate amenity.',
    stats: [
      { label: 'Data Security', value: '256-bit' },
      { label: 'Fraud Prevention', value: 'Active' }
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
      className="w-full bg-[#FBFBF9] py-16 md:py-24 border-b border-[#D8DFDF] relative z-20 font-sans"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-10 lg:px-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-6 h-[2px] bg-[#0D4446]" />
            <span className="text-xs font-bold tracking-[0.25em] text-[#0D4446] uppercase">
              Buy With Human Shelter
            </span>
            <span className="w-6 h-[2px] bg-[#0D4446]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#141717] tracking-tight leading-tight font-display mb-6">
            The 6-Step Homebuyer's Guide
          </h2>
          <p className="text-base sm:text-lg text-[#5C6768] font-normal leading-relaxed">
            Acquiring your dream property shouldn't be daunting. Our comprehensive guide walks you through the entire journey—from maximizing search filters and evaluating red flags, to crafting winning offers and avoiding real estate fraud.
          </p>
        </div>

        {/* Interactive Vertical Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          
          {/* Left Column: Timeline Steps Navigation */}
          <div className="lg:col-span-5 relative">
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-[#D8DFDF] hidden sm:block" />
            
            <div className="space-y-4">
              {BUYERS_GUIDE_STEPS.map((step) => {
                const isActive = activeStep === step.id;
                
                return (
                  <div 
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`relative flex items-start gap-4 sm:gap-6 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      isActive ? 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-[#0D4446]/20' : 'hover:bg-black/5 border border-transparent'
                    }`}
                  >
                    <div className={`relative z-10 shrink-0 w-12 h-12 rounded-full border-[3px] flex items-center justify-center font-mono font-bold transition-colors duration-300 ${
                      isActive ? 'bg-[#0D4446] border-[#0D4446] text-white' : 'bg-[#FBFBF9] border-[#D8DFDF] text-[#5C6768]'
                    }`}>
                      {step.number}
                    </div>
                    <div className="pt-2">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0D4446] mb-1">
                        {step.badge}
                      </div>
                      <h3 className={`text-lg font-bold mb-1 transition-colors ${isActive ? 'text-[#141717]' : 'text-[#5C6768]'}`}>
                        {step.title}
                      </h3>
                      <p className={`text-sm leading-relaxed transition-all duration-300 ${isActive ? 'text-[#5C6768] h-auto opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
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
        <div className="mt-20 rounded-[16px] p-6 sm:p-10 bg-[#0D4446] text-white shadow-[0_20px_50px_rgba(13,68,70,0.25)] flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 opacity-5 pointer-events-none">
            <IconSearch size={300} />
          </div>
          <div className="space-y-2 text-center lg:text-left relative z-10">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#E76F51] font-bold">
              Secure Your Dream Property
            </div>
            <h4 className="text-2xl sm:text-3xl font-bold font-display mb-2">
              Ready to Start Your Home Search?
            </h4>
            <p className="text-sm sm:text-base text-white/80 max-w-2xl">
              Talk directly with a licensed Human Shelter broker today to get pre-qualified and start viewing exclusive listings that match your criteria.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/contact')}
              className="h-14 px-8 rounded-full bg-[#E76F51] hover:bg-[#d65c3e] text-white font-bold text-sm uppercase tracking-wider flex items-center gap-3 shadow-[0_8px_24px_rgba(231,111,81,0.4)] transition-all cursor-pointer active:scale-95"
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
