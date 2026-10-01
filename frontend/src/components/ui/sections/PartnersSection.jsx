import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Simple mocked data for the marquees (we just repeat the same structure)
const DEVELOPER_MOCKS = Array.from({ length: 8 }, (_, i) => ({ id: `dev-${i}` }));
const BANK_MOCKS = Array.from({ length: 8 }, (_, i) => ({ id: `bank-${i}` }));

export default function PartnersSection() {
  return (
    <section
      id="partners-section"
      className="w-full bg-[#FFFFFF] py-16 md:py-24 border-b border-[#e5e5df] relative z-20 font-sans text-[#0f1722] overflow-hidden"
    >
      {/* Architectural Ambient Grid Texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(#1b4d4b_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.03] pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16">
        
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="w-6 h-[2px] bg-[#0D4446]" />
              <span className="text-xs font-bold tracking-[0.25em] text-[#0D4446] uppercase">
                Collaboration &amp; Network
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f1722] tracking-tight leading-tight">
              Our Trusted Industry Partners
            </h2>
            <p className="text-sm sm:text-base text-[#4a525d] font-normal leading-relaxed">
              We collaborate exclusively with the Philippines' most respected real estate developers and premier wealth management banks to guarantee authentic, title-verified transactions.
            </p>
          </div>
          
          <Link
            to="/our-partner"
            className="self-start lg:self-auto h-[48px] px-6 rounded-full border border-[#0D4446]/30 text-[#0D4446] hover:bg-[#0D4446]/5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer group shrink-0"
          >
            <span>Learn About Partnerships</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* Marquee 1: Partner Developers */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-[#0D4446] mb-6 uppercase tracking-widest pl-2">
            Partner Developers
          </h3>
          <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
            <motion.div
              className="flex items-center gap-6 pr-6"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            >
              {[...DEVELOPER_MOCKS, ...DEVELOPER_MOCKS].map((mock, idx) => (
                <div
                  key={`dev-mock-${idx}`}
                  className="w-48 h-32 shrink-0 border-2 border-dashed border-[#e5e5df] rounded-[5px] bg-[#FBFBF9] flex items-center justify-center p-4 hover:border-[#0D4446] transition-colors"
                >
                  <img
                    src="/placeholder-logo.jpg"
                    alt="Partner Developer Mockup"
                    className="max-w-full max-h-full object-contain opacity-80 mix-blend-multiply"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Marquee 2: Partner Banks */}
        <div className="mb-16">
          <h3 className="text-lg font-bold text-[#0D4446] mb-6 uppercase tracking-widest pl-2">
            Partner Banks
          </h3>
          <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
            <motion.div
              className="flex items-center gap-6 pr-6"
              animate={{ x: ["-50%", "0%"] }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            >
              {[...BANK_MOCKS, ...BANK_MOCKS].map((mock, idx) => (
                <div
                  key={`bank-mock-${idx}`}
                  className="w-48 h-32 shrink-0 border-2 border-dashed border-[#e5e5df] rounded-[5px] bg-[#FBFBF9] flex items-center justify-center p-4 hover:border-[#0D4446] transition-colors"
                >
                  <img
                    src="/placeholder-logo.jpg"
                    alt="Partner Bank Mockup"
                    className="max-w-full max-h-full object-contain opacity-80 mix-blend-multiply"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Partnership Impact Banner */}
        <div className="bg-white/95 rounded-[5px] border border-[#e5e5df] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-4 text-left">
            <span className="w-12 h-12 rounded-full bg-[#0D4446]/10 text-[#0D4446] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">
                handshake
              </span>
            </span>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-[#0f1722]">
                Are You a Licensed Real Estate Developer or Advisory Firm?
              </h4>
              <p className="text-xs sm:text-[13px] text-[#5a6472] mt-0.5">
                Join our curated national network of accredited institutional partners and reach qualified luxury homebuyers.
              </p>
            </div>
          </div>

          <Link
            to="/contact"
            className="h-[48px] px-7 rounded-full bg-[#0D4446] hover:bg-[#082b2d] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <span>Inquire for Accreditation</span>
            <span className="material-symbols-outlined text-[16px]">
              arrow_forward
            </span>
          </Link>
        </div>

      </div>
    </section>
  );
}
