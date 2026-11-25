import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import cmsService from '@/services/cmsService';

// Simple mocked data for the marquees (we just repeat the same structure)
const DEVELOPER_MOCKS = Array.from({ length: 8 }, (_, i) => ({ id: `dev-${i}` }));
const BANK_MOCKS = Array.from({ length: 8 }, (_, i) => ({ id: `bank-${i}` }));

function repeatForMarquee(items, minCount = 6) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const repeated = [];
  while (repeated.length < minCount) {
    repeated.push(...items);
  }
  return repeated;
}

function getSafeHttpUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

function PartnerMarqueeRow({ title, cmsItems, fallbackMocks, fallbackAlt, animateX, wrapperClassName }) {
  const hasCms = cmsItems.length > 0;
  const stripItems = hasCms
    ? repeatForMarquee(cmsItems, 6)
    : fallbackMocks;
  const doubledStrip = [...stripItems, ...stripItems];

  return (
    <div className={wrapperClassName}>
      <h3 className="text-lg font-bold text-[#0F766E] mb-6 uppercase tracking-widest pl-2">
        {title}
      </h3>
      <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
        <motion.div
          className="flex items-center gap-6 pr-6"
          animate={{ x: animateX }}
          transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
        >
          {doubledStrip.map((item, idx) => {
            if (!hasCms) {
              return (
                <div
                  key={`${item.id}-${idx}`}
                  role="img"
                  aria-label={fallbackAlt}
                  className="w-48 h-32 shrink-0 border border-[#E2E8F0] rounded-[5px] bg-white flex items-center justify-center p-4 hover:border-[#0D4446] transition-colors"
                >
                  <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">
                    Logo
                  </span>
                </div>
              );
            }

            const safeUrl = getSafeHttpUrl(item.payload?.website_url);
            const cardInner = (
              <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">
                Logo
              </span>
            );

            const cardClassName =
              'w-48 h-32 shrink-0 border border-[#E2E8F0] rounded-[5px] bg-white flex items-center justify-center p-4 hover:border-[#0D4446] transition-colors';

            if (safeUrl) {
              return (
                <a
                  key={`${item.id}-${idx}`}
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.title}
                  title={item.title}
                  className={`${cardClassName} focus-visible:outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20`}
                >
                  {cardInner}
                </a>
              );
            }

            return (
              <div key={`${item.id}-${idx}`} className={cardClassName}>
                {cardInner}
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

export default function PartnersSection() {
  const [cmsPartners, setCmsPartners] = useState([]);

  useEffect(() => {
    let mounted = true;
    cmsService
      .getPublicContents('partner')
      .then((items) => {
        if (mounted && Array.isArray(items)) {
          setCmsPartners(items);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const developers = cmsPartners.filter((item) => item?.payload?.partner_type !== 'bank');
  const banks = cmsPartners.filter((item) => item?.payload?.partner_type === 'bank');

  return (
    <section
      id="partners-section"
      className="w-full bg-[#F8FAFC] py-16 md:py-24 border-b border-[#E2E8F0] relative z-20 font-sans text-[#1E293B] overflow-hidden"
    >
      <div className="relative z-10 w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16">
        
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="w-6 h-[2px] bg-[#0F766E]" />
              <span className="text-xs font-bold tracking-[0.25em] text-[#0F766E] uppercase">
                Subtitle
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
              Section Title
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] font-normal leading-relaxed">
              Section description.
            </p>
          </div>
          
          <Link
            to="/contact"
            className="self-start lg:self-auto h-[48px] px-6 rounded-full border border-[#0F766E]/30 text-[#0F766E] hover:bg-[#0F766E]/5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer group shrink-0"
          >
            <span>Learn About Partnerships</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* Marquee 1: Partner Developers */}
        <PartnerMarqueeRow
          title="Group 1"
          cmsItems={developers}
          fallbackMocks={DEVELOPER_MOCKS}
          fallbackAlt="Partner logo"
          animateX={['0%', '-50%']}
          wrapperClassName="mb-12"
        />

        {/* Marquee 2: Partner Banks */}
        <PartnerMarqueeRow
          title="Group 2"
          cmsItems={banks}
          fallbackMocks={BANK_MOCKS}
          fallbackAlt="Partner logo"
          animateX={['-50%', '0%']}
          wrapperClassName="mb-16"
        />

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
                Banner Title
              </h4>
              <p className="text-xs sm:text-[13px] text-[#5a6472] mt-0.5">
                Banner description.
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
