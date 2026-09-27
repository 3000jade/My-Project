import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const PARTNER_CATEGORIES = [
  { id: 'all', label: 'All Partners' },
  { id: 'developers', label: 'Prime Developers' },
  { id: 'financial', label: 'Banking & Escrow' },
  { id: 'design', label: 'Architects & Regulators' },
];

const PARTNERS = [
  {
    id: 'ayala',
    category: 'developers',
    name: 'Ayala Land Premier',
    type: 'Prime Real Estate Developer',
    tier: 'Flagship Partner',
    stats: '₱65B+ Projects Managed',
    description: 'The standard for luxury living in the Philippines, developing master-planned residential enclaves in Forbes Park, Ayala Alabang, and Bonifacio Global City.',
    tag: 'Ultra-Prime Estates',
    badge: 'PRC Accredited'
  },
  {
    id: 'rockwell',
    category: 'developers',
    name: 'Rockwell Land',
    type: 'Luxury Residential Developer',
    tier: 'Signature Partner',
    stats: '15+ Communities',
    description: 'Renowned for high-end self-contained communities with unrivaled property management, biometric security, and lush green urban sanctuaries.',
    tag: 'Skyline Residences',
    badge: 'Direct Escrow'
  },
  {
    id: 'shang',
    category: 'developers',
    name: 'Shang Properties',
    type: 'Hospitality & High-Rise Group',
    tier: 'Prime Partner',
    stats: 'Top Tier Hospitality',
    description: 'Pioneering hotel-grade amenities, bespoke concierge services, and timeless architectural aesthetics across Metro Manila’s premier districts.',
    tag: 'Luxury High-Rise',
    badge: 'PRC Accredited'
  },
  {
    id: 'federal',
    category: 'developers',
    name: 'Federal Land',
    type: 'Integrated Township Developer',
    tier: 'Institutional Partner',
    stats: '40+ Years Heritage',
    description: 'Partnered with global luxury brands including Grand Hyatt Manila to deliver visionary township masterplans in BGC and the Manila Bay corridor.',
    tag: 'Township Enclaves',
    badge: 'DHSUD Registered'
  },
  {
    id: 'bdo',
    category: 'financial',
    name: 'BDO Private Bank',
    type: 'Wealth Advisory & Settlement',
    tier: 'Financial Escrow',
    stats: 'Tier-1 Trust Custody',
    description: 'Delivering dedicated escrow custody, zero-cash-risk transactions, and bespoke high-net-worth property acquisition financing.',
    tag: 'Escrow Settlement',
    badge: 'BSP Supervised'
  },
  {
    id: 'bpi',
    category: 'financial',
    name: 'BPI Wealth Management',
    type: 'Institutional Mortgage Partner',
    tier: 'Financial Partner',
    stats: 'Preferred Rates',
    description: 'Providing seamless mortgage fast-tracking, comprehensive property appraisal checks, and privileged cross-border capital settlements.',
    tag: 'Mortgage Solutions',
    badge: 'BSP Supervised'
  },
  {
    id: 'prc',
    category: 'design',
    name: 'PRC & DHSUD Board',
    type: 'Official Regulatory Custodian',
    tier: 'Compliance Safeguard',
    stats: '100% Legal Clearance',
    description: 'Direct integration with Philippine real estate oversight boards guaranteeing zero unlicensed brokers, clean titles, and verified permits to sell.',
    tag: 'Legal Verification',
    badge: 'Government Board'
  },
  {
    id: 'locsin',
    category: 'design',
    name: 'Leandro V. Locsin Partners',
    type: 'Master Architectural Collaborator',
    tier: 'Design Advisory',
    stats: 'National Artist Firm',
    description: 'Consulting on heritage architectural preservation, tropical modernist form, and sustainable luxury villas across the archipelago.',
    tag: 'Architectural Design',
    badge: 'Design Council'
  }
];

export default function PartnersSection() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredPartners = activeCategory === 'all'
    ? PARTNERS
    : PARTNERS.filter((p) => p.category === activeCategory);

  return (
    <section
      id="partners-section"
      className="w-full bg-[#FFFFFF] py-16 md:py-24 border-b border-[#e5e5df] relative z-20 transition-colors duration-500 font-sans text-[#0f1722] overflow-hidden"
    >
      {/* Architectural Ambient Grid Texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(#1b4d4b_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.03] pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16">

        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10 md:mb-14">
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
              We collaborate exclusively with the Philippines' most respected real estate developers, premier wealth management banks, and regulatory bodies to guarantee authentic, title-verified transactions.
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

        {/* Category Filters (54px uniform alignment or compact pills) */}
        <div className="flex flex-wrap items-center gap-2.5 mb-10">
          {PARTNER_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`h-[42px] px-5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${isSelected
                    ? 'bg-[#0D4446] text-white shadow-sm'
                    : 'bg-white/80 border border-[#e5e5df] text-[#4a525d] hover:text-[#0D4446] hover:border-[#0D4446]/40'
                  }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 4-Column Responsive Grid (Matching Closed Handed container geometry with 5px corners) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(0.875rem,1.5vw,1.25rem)] mb-12">
          {filteredPartners.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white/95 rounded-[5px] border border-[#e5e5df] p-6 sm:p-7 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-15px_rgba(27,77,75,0.12)] hover:border-[#1b4d4b]/50 hover:-translate-y-1 transition-all duration-500 ease-out group overflow-hidden"
            >
              {/* Top Accent Border */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] bg-transparent group-hover:bg-[#0D4446] transition-colors duration-500"
              />

              <div>
                {/* Meta Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#0D4446] bg-[#0D4446]/8 px-2.5 py-1 rounded-[3px]">
                    {partner.tag}
                  </span>
                  <span className="text-[10px] font-semibold text-[#5a6472] uppercase tracking-wider">
                    {partner.badge}
                  </span>
                </div>

                {/* Partner Name & Subtitle */}
                <h3 className="font-extrabold text-lg sm:text-xl text-[#0f1722] tracking-tight group-hover:text-[#0D4446] transition-colors duration-300">
                  {partner.name}
                </h3>
                <div className="text-xs text-[#E76F51] font-semibold mt-1 mb-3">
                  {partner.type}
                </div>

                <p className="text-xs sm:text-[13px] text-[#5a6472] font-normal leading-relaxed line-clamp-3">
                  {partner.description}
                </p>
              </div>

              {/* Bottom Telemetry Metric */}
              <div className="pt-4 mt-5 border-t border-[#f0f0ed] flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#7a8594]">
                  {partner.tier}
                </span>
                <span className="text-xs font-mono font-bold text-[#0D4446]">
                  {partner.stats}
                </span>
              </div>
            </motion.div>
          ))}
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
