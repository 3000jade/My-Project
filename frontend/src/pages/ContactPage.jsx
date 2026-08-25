import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeInput, setActiveInput] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const revealVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 100 }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        e.target.reset();
      }, 3000);
    }, 1500);
  };

  return (
    <div className="bg-[#FDFCF8] text-[#1B1C1A] font-sans overflow-x-hidden min-h-screen">
      <main>
        {/* Luxury Hero Section */}
        <section className="relative min-h-[55vh] flex flex-col justify-center overflow-hidden pt-32 pb-24 lg:pt-48 lg:pb-40 bg-[#0B0C0A] w-full">
          {/* Ambient Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[80%] bg-[#266F71]/30 blur-[150px] rounded-full mix-blend-screen" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[70%] bg-[#F4A261]/20 blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
          </div>
          
          <motion.div 
            className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 relative z-10 w-full"
            initial="hidden"
            animate="visible"
            variants={revealVariants}
          >
            <div className="max-w-4xl">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-bold font-sans bg-white/10 text-white backdrop-blur-md uppercase tracking-[0.2em] mb-8 border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                Strategic Advisory
              </span>
              <h1 className="font-display text-5xl lg:text-7xl xl:text-[80px] text-white mb-8 leading-[1.05] font-extrabold tracking-tight drop-shadow-2xl">
                Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#266F71] to-[#F4A261]">EstateElite</span>
              </h1>
              <p className="font-sans text-white/80 max-w-2xl text-xl leading-[1.8] font-light">
                Secure your position in the Philippines' most exclusive developments. Our elite strategic
                advisory team provides bespoke guidance for discerning institutional investors and private clients.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Contact Grid Section */}
        <section className="-mt-16 relative z-20 pb-32 w-full">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              
              {/* Left: Inquiry Form */}
              <motion.div 
                className="lg:col-span-7 bg-white p-10 lg:p-14 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-[#E5E7EB]"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={revealVariants}
              >
                <div className="mb-12">
                  <h2 className="font-display text-3xl lg:text-4xl text-[#1B1C1A] font-extrabold tracking-tight">Direct Inquiry</h2>
                  <p className="text-gray-500 font-sans mt-3">Please provide your details below and a senior partner will reach out.</p>
                </div>
                
                <form className="space-y-8" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className={`font-sans text-[11px] font-bold uppercase tracking-widest transition-colors ${activeInput === 'name' ? 'text-[#266F71]' : 'text-gray-500'}`}>Full Name</label>
                      <input
                        onFocus={() => setActiveInput('name')}
                        onBlur={() => setActiveInput(null)}
                        className="w-full px-5 py-4 bg-[#F9F9F8] border border-transparent rounded-xl focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] focus:bg-white font-sans text-sm transition-all outline-none"
                        placeholder="e.g. John Doe" type="text" required />
                    </div>
                    <div className="space-y-3">
                      <label className={`font-sans text-[11px] font-bold uppercase tracking-widest transition-colors ${activeInput === 'email' ? 'text-[#266F71]' : 'text-gray-500'}`}>Corporate Email</label>
                      <input
                        onFocus={() => setActiveInput('email')}
                        onBlur={() => setActiveInput(null)}
                        className="w-full px-5 py-4 bg-[#F9F9F8] border border-transparent rounded-xl focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] focus:bg-white font-sans text-sm transition-all outline-none"
                        placeholder="john@company.com" type="email" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className={`font-sans text-[11px] font-bold uppercase tracking-widest transition-colors ${activeInput === 'phone' ? 'text-[#266F71]' : 'text-gray-500'}`}>Phone Number</label>
                      <input
                        onFocus={() => setActiveInput('phone')}
                        onBlur={() => setActiveInput(null)}
                        className="w-full px-5 py-4 bg-[#F9F9F8] border border-transparent rounded-xl focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] focus:bg-white font-sans text-sm transition-all outline-none"
                        placeholder="+63 900 000 0000" type="tel" required />
                    </div>
                    <div className="space-y-3">
                      <label className={`font-sans text-[11px] font-bold uppercase tracking-widest transition-colors ${activeInput === 'type' ? 'text-[#266F71]' : 'text-gray-500'}`}>Inquiry Type</label>
                      <select
                        onFocus={() => setActiveInput('type')}
                        onBlur={() => setActiveInput(null)}
                        className="w-full px-5 py-4 bg-[#F9F9F8] border border-transparent rounded-xl focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] focus:bg-white font-sans text-sm transition-all outline-none text-gray-700 appearance-none"
                        required
                      >
                        <option value="" disabled selected>Select an option</option>
                        <option>Property Acquisition</option>
                        <option>Asset Divestment</option>
                        <option>Strategic Advisory</option>
                        <option>Joint Venture / Partnership</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className={`font-sans text-[11px] font-bold uppercase tracking-widest transition-colors ${activeInput === 'message' ? 'text-[#266F71]' : 'text-gray-500'}`}>Message</label>
                    <textarea
                      onFocus={() => setActiveInput('message')}
                      onBlur={() => setActiveInput(null)}
                      className="w-full px-5 py-4 bg-[#F9F9F8] border border-transparent rounded-xl focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] focus:bg-white font-sans text-sm transition-all outline-none resize-none"
                      placeholder="Please elaborate on your requirements or specific assets of interest..." rows="5" required></textarea>
                  </div>
                  <div className="pt-4">
                    <button
                      className={`w-full md:w-auto px-12 py-5 rounded-xl font-sans font-bold text-[12px] tracking-[0.2em] uppercase transition-all shadow-[0_10px_30px_rgba(38,111,113,0.2)] flex items-center justify-center gap-3 ${isSuccess ? 'bg-[#4ADE80] text-[#1B1C1A]' : 'bg-[#266F71] hover:bg-[#174849] text-white hover:-translate-y-1'}`}
                      type="submit"
                      disabled={isSubmitting || isSuccess}
                    >
                      {isSubmitting ? (
                        <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Transmitting...</>
                      ) : isSuccess ? (
                        <><span className="material-symbols-outlined text-[18px]">check_circle</span> Inquiry Received</>
                      ) : (
                        'Submit Inquiry'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>

              {/* Right: Office Details */}
              <div className="lg:col-span-5 space-y-8 flex flex-col">
                {/* HQ Card */}
                <motion.div 
                  className="flex-1 bg-gradient-to-br from-[#174849] to-[#266F71] text-white p-10 lg:p-14 rounded-[32px] shadow-[0_20px_50px_rgba(38,111,113,0.3)] relative overflow-hidden flex flex-col justify-center"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={revealVariants}
                  transition={{ delay: 0.1 }}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-full backdrop-blur-3xl -z-0"></div>
                  
                  <div className="relative z-10">
                    <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold font-sans uppercase tracking-[0.2em] mb-6 border border-white/20">
                      Global Headquarters
                    </span>
                    <h3 className="font-display text-4xl font-extrabold mb-10 leading-tight">Elite Strategic<br/>Advisory Hub</h3>
                    <div className="space-y-8">
                      <div className="flex gap-4 items-start">
                        <span className="material-symbols-outlined text-[#F4A261] text-[24px]">location_on</span>
                        <div>
                           <p className="font-sans font-bold text-sm tracking-wider uppercase mb-1">Location</p>
                           <p className="font-sans text-base text-white/80 leading-relaxed">28th Floor, One Bonifacio High Street,<br/>BGC, Taguig City, Philippines</p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-start">
                        <span className="material-symbols-outlined text-[#F4A261] text-[24px]">call</span>
                        <div>
                           <p className="font-sans font-bold text-sm tracking-wider uppercase mb-1">Direct Line</p>
                           <p className="font-sans text-base text-white/80">+63 (2) 8888 0000</p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-start">
                        <span className="material-symbols-outlined text-[#F4A261] text-[24px]">mail</span>
                        <div>
                           <p className="font-sans font-bold text-sm tracking-wider uppercase mb-1">Concierge</p>
                           <p className="font-sans text-base text-white/80">concierge@estateelite.ph</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-16 -bottom-16 opacity-5 transform rotate-12 pointer-events-none">
                    <span className="material-symbols-outlined text-[300px]">corporate_fare</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Bottom Row: Hours & Media */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-8 lg:mt-12">
              <motion.div 
                className="bg-white p-10 lg:p-12 rounded-[32px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-[#E5E7EB]"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={revealVariants}
                transition={{ delay: 0.2 }}
              >
                <h3 className="font-display text-2xl font-bold text-[#1B1C1A] mb-8">Business Hours</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-4 border-b border-[#E5E7EB]">
                    <span className="font-sans font-bold text-gray-500 text-sm tracking-wide">Monday - Friday</span>
                    <span className="font-sans font-bold text-[#1B1C1A]">09:00 AM - 06:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-[#E5E7EB]">
                    <span className="font-sans font-bold text-gray-500 text-sm tracking-wide">Saturday</span>
                    <span className="font-sans font-bold text-[#1B1C1A]">10:00 AM - 04:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center py-4">
                    <span className="font-sans font-bold text-gray-500 text-sm tracking-wide">Sunday</span>
                    <span className="inline-block px-3 py-1 bg-[#266F71]/10 text-[#266F71] rounded-full text-[10px] tracking-widest uppercase font-bold">By Appointment Only</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="bg-[#F4A261]/10 border border-[#F4A261]/20 p-10 lg:p-12 rounded-[32px] shadow-sm flex flex-col justify-center relative overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={revealVariants}
                transition={{ delay: 0.3 }}
              >
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 bg-[#F4A261]/20 text-[#D97706] rounded-full text-[10px] tracking-widest uppercase font-bold mb-6">Press & Media</span>
                  <h3 className="font-display text-3xl font-bold text-[#1B1C1A] mb-4">Media Inquiries</h3>
                  <p className="font-sans text-base text-gray-600 leading-relaxed mb-8 max-w-[80%]">For press kits, exclusive property photography, and media interview requests regarding Philippine real estate market insights.</p>
                  <a className="font-sans font-bold text-[12px] tracking-[0.2em] text-[#D97706] uppercase inline-flex items-center gap-2 hover:gap-4 transition-all" href="#">
                    press@estateelite.ph
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </a>
                </div>
                <div className="absolute right-0 bottom-0 opacity-[0.03] text-[#F4A261] -mr-10 -mb-10 pointer-events-none">
                   <span className="material-symbols-outlined text-[200px]">campaign</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Interactive Map Section */}
        <section className="pb-32 px-6 md:px-12 lg:px-24 max-w-[1440px] mx-auto w-full">
          <motion.div 
            className="rounded-[40px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] h-[65vh] relative group border-4 border-white bg-gray-100"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={revealVariants}
          >
            <div className="absolute inset-0 z-0">
              <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
                alt="Map of BGC"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2c0t7GryXhkDNfhQkb1zYr2Yo4hTc8injRoFZ8_AlUQY5rc6ZPsg9EjY-hXxBMaXvW06ariTkrhqtyNkpkNm6RqY60pgSWpO6P9xYfK1bJB0pP_ZtwP_hnLnY7ypbhEbbrV1IAOjnoRcvybdXUBdMA35TvEEqE_w25pRvT5xuUMCepdMimdSeykXKgWZeMpmjAmjpHc6a1x3p0FAfr9j6dPPPC5krEb1uTalAl5IUNniOJd-tIWDPtGBGRl7Kfwm1eSMfhDOt0g5f" />
            </div>
            {/* Map Overlay Card */}
            <div className="absolute top-8 left-8 lg:top-12 lg:left-12 z-10 bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-sm border border-white/50 hidden md:block">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-full bg-[#266F71]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#266F71]">pin_drop</span>
                 </div>
                 <h4 className="font-display text-2xl font-bold text-[#1B1C1A]">BGC Hub</h4>
              </div>
              <p className="font-sans text-gray-600 mb-8 text-sm leading-relaxed">One Bonifacio High Street, Corporate Tower. Valet parking available at the main entrance.</p>
              <button
                className="bg-[#1B1C1A] text-white w-full py-4 rounded-xl flex items-center justify-center gap-2 font-sans font-bold text-[11px] tracking-widest uppercase hover:bg-[#266F71] transition-colors shadow-md">
                <span className="material-symbols-outlined text-[16px]">directions</span>
                Get Directions
              </button>
            </div>
            
            {/* Hover Map Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-end justify-center pb-12">
               <span className="text-white font-sans tracking-widest uppercase text-sm font-bold drop-shadow-md">Explore Global Headquarters</span>
            </div>
          </motion.div>
        </section>

        {/* Secondary CTA Section */}
        <section className="pb-32 px-6 md:px-12 lg:px-24 w-full max-w-[1440px] mx-auto">
          <motion.div 
            className="bg-[#1B1C1A] rounded-[40px] p-12 lg:p-24 shadow-2xl relative overflow-hidden text-center border border-gray-800 w-full"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={revealVariants}
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#266F71] via-[#F4A261] to-[#266F71]"></div>
            
            <div className="max-w-4xl mx-auto space-y-10 relative z-10">
              <span className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] text-white font-bold font-sans uppercase tracking-[0.2em]">
                Exclusive Services
              </span>
              <h2 className="font-display text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight">Request a Private Consultation</h2>
              <p className="font-sans text-lg lg:text-xl text-gray-400 leading-relaxed font-light mx-auto max-w-2xl">
                Discuss your portfolio strategy with our senior executives in a confidential, one-on-one
                environment. Available exclusively for institutional investors and high-net-worth individuals.
              </p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8">
                <button
                  className="bg-[#266F71] text-white px-10 py-5 rounded-xl font-sans font-bold text-[12px] tracking-widest uppercase hover:bg-[#174849] hover:shadow-[0_10px_30px_rgba(38,111,113,0.3)] hover:-translate-y-1 transition-all w-full md:w-auto">
                  Schedule Meeting
                </button>
                <button
                  className="text-white bg-transparent border-2 border-white/20 px-10 py-5 rounded-xl font-sans font-bold text-[12px] tracking-widest uppercase hover:bg-white/10 hover:border-white/40 transition-all w-full md:w-auto">
                  Download Profile
                </button>
              </div>
            </div>
            
            {/* Decorative Background Element */}
            <div className="absolute -left-20 -bottom-20 text-white/5 pointer-events-none">
              <span className="material-symbols-outlined text-[300px]">diamond</span>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
