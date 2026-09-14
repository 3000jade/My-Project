import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

export default function HomeValuationTool() {
  const [step, setStep] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Form State
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [floorArea, setFloorArea] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [condition, setCondition] = useState('');
  
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [valuationResult, setValuationResult] = useState(null);

  const handleCalculate = (e) => {
    e.preventDefault();
    setIsCalculating(true);
    // Simulate algorithmic calculation
    setTimeout(() => {
      setValuationResult({
        low: '₱42,500,000',
        expected: '₱48,250,000',
        high: '₱55,000,000',
        confidence: 85,
        comparables: 12
      });
      setIsCalculating(false);
      setStep(2);
    }, 2000);
  };

  const handleDispatchDossier = (e) => {
    e.preventDefault();
    alert('Full CMA Dossier dispatched to ' + contactEmail);
  };

  return (
    <div className="w-full max-w-[800px] mx-auto bg-white rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden relative">
      <div className="flex h-2 w-full bg-gray-100">
        <motion.div 
          className="h-full bg-[#174849]"
          initial={{ width: '50%' }}
          animate={{ width: step === 1 ? '50%' : '100%' }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="p-8 md:p-12">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <span className="inline-block px-3 py-1 bg-[#174849]/10 text-[#174849] rounded-full text-[10px] font-bold font-sans uppercase tracking-[0.2em] mb-4 border border-[#174849]/20">Step 1 of 2</span>
                <h3 className="text-3xl font-display font-extrabold text-[#174849] tracking-tight mb-2">Property Details</h3>
                <p className="text-gray-500 font-sans">Enter the specifications of your property to generate an algorithmic baseline valuation.</p>
              </div>

              <form onSubmit={handleCalculate} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#174849] mb-2 font-sans">Property Address</label>
                  <input 
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    type="text" 
                    placeholder="Enter complete street address"
                    className="w-full h-[54px] bg-[#F1F0EC] border-2 border-transparent focus:border-[#266F71] rounded-xl px-5 outline-none font-sans transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#174849] mb-2 font-sans">Property Type</label>
                    <div className="relative">
                      <select 
                        required
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="w-full h-[54px] appearance-none bg-[#F1F0EC] border-2 border-transparent focus:border-[#266F71] rounded-xl px-5 outline-none font-sans transition-colors cursor-pointer"
                      >
                        <option value="" disabled>Select Type</option>
                        <option value="House">House</option>
                        <option value="Condo">Condo / Penthouse</option>
                        <option value="Townhouse">Townhouse</option>
                        <option value="Land">Vacant Land</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">expand_more</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#174849] mb-2 font-sans">Floor Area (sqm)</label>
                    <input 
                      required
                      value={floorArea}
                      onChange={(e) => setFloorArea(e.target.value)}
                      type="number" 
                      placeholder="e.g. 250"
                      className="w-full h-[54px] bg-[#F1F0EC] border-2 border-transparent focus:border-[#266F71] rounded-xl px-5 outline-none font-sans transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#174849] mb-2 font-sans">Bedrooms</label>
                    <div className="relative">
                      <select 
                        required
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        className="w-full h-[54px] appearance-none bg-[#F1F0EC] border-2 border-transparent focus:border-[#266F71] rounded-xl px-5 outline-none font-sans transition-colors cursor-pointer"
                      >
                        <option value="" disabled>Select</option>
                        <option value="1">1 Bedroom</option>
                        <option value="2">2 Bedrooms</option>
                        <option value="3">3 Bedrooms</option>
                        <option value="4">4 Bedrooms</option>
                        <option value="5+">5+ Bedrooms</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">expand_more</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#174849] mb-2 font-sans">Condition</label>
                    <div className="relative">
                      <select 
                        required
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-full h-[54px] appearance-none bg-[#F1F0EC] border-2 border-transparent focus:border-[#266F71] rounded-xl px-5 outline-none font-sans transition-colors cursor-pointer"
                      >
                        <option value="" disabled>Select</option>
                        <option value="Excellent">Excellent / Newly Renovated</option>
                        <option value="Good">Good / Minor Updates Needed</option>
                        <option value="Fair">Fair / Major Updates Needed</option>
                        <option value="Poor">Needs Gut Renovation</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    disabled={isCalculating}
                    className={`w-full h-[54px] bg-[#266F71] hover:bg-[#174849] text-white rounded-xl font-sans font-bold tracking-widest uppercase text-[12px] flex items-center justify-center gap-2 ${isCalculating ? 'opacity-80 cursor-not-allowed' : ''}`}
                  >
                    {isCalculating ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span>
                        Analyzing MLS Data...
                      </>
                    ) : (
                      <>
                        Generate Instant Valuation
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <span className="inline-block px-3 py-1 bg-[#174849]/10 text-[#174849] rounded-full text-[10px] font-bold font-sans uppercase tracking-[0.2em] mb-4 border border-[#174849]/20">Step 2 of 2</span>
                  <h3 className="text-3xl font-display font-extrabold text-[#174849] tracking-tight mb-2">Estimated Value</h3>
                  <p className="text-gray-500 font-sans max-w-sm text-sm">Based on {valuationResult.comparables} comparable recent sales in your immediate vicinity.</p>
                </div>
                <button onClick={() => setStep(1)} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[#174849]">edit</span>
                </button>
              </div>

              <div className="bg-[#174849] rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[40px] -mr-20 -mt-20"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center relative z-10">
                  <div className="md:border-r border-white/10 flex flex-col justify-center">
                    <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-2">Low Estimate</span>
                    <span className="text-xl font-display font-bold">{valuationResult.low}</span>
                  </div>
                  <div className="md:border-r border-white/10 flex flex-col justify-center transform scale-110">
                    <span className="text-[10px] text-[#FB8E5D] font-bold uppercase tracking-widest mb-2">Expected Value</span>
                    <span className="text-3xl font-display font-extrabold text-[#FB8E5D]">{valuationResult.expected}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-2">High Estimate</span>
                    <span className="text-xl font-display font-bold">{valuationResult.high}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-sans font-medium text-white/80">Algorithmic Confidence</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-1.5 bg-black/30 rounded-full overflow-hidden">
                      <div className="h-full bg-[#FB8E5D] rounded-full" style={{ width: `${valuationResult.confidence}%` }}></div>
                    </div>
                    <span className="text-xs font-bold font-sans">{valuationResult.confidence}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#174849] mb-4 font-sans text-center">Unlock Full CMA Dossier</h4>
                <p className="text-xs text-gray-500 font-sans text-center mb-6 max-w-sm mx-auto">
                  Receive the complete 24-page PDF analysis including specific comparable properties and market velocity metrics.
                </p>
                <form onSubmit={handleDispatchDossier} className="space-y-4">
                  <input 
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    type="text" 
                    placeholder="Full Name"
                    className="w-full h-[54px] bg-white border border-gray-200 focus:border-[#266F71] rounded-xl px-5 outline-none font-sans transition-colors"
                  />
                  <input 
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    type="email" 
                    placeholder="Email Address"
                    className="w-full h-[54px] bg-white border border-gray-200 focus:border-[#266F71] rounded-xl px-5 outline-none font-sans transition-colors"
                  />
                  <input 
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    type="tel" 
                    placeholder="Phone Number"
                    className="w-full h-[54px] bg-white border border-gray-200 focus:border-[#266F71] rounded-xl px-5 outline-none font-sans transition-colors"
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-[54px] bg-[#174849] hover:bg-[#0f2c2d] text-white rounded-xl font-sans font-bold tracking-widest uppercase text-[12px] flex items-center justify-center gap-2 mt-2"
                  >
                    Send Full Report
                  </Button>
                </form>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
