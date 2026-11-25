import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';
import { Search, Tag, Home, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import houseHeroImg from '../../../assets/House_Herosection.webp';

const ALL_VALUE = 'all';

const STATUS_OPTIONS = [
  { value: ALL_VALUE, label: 'All Property Status' },
  { value: 'For Sale', label: 'For Sale' },
  { value: 'For Rent', label: 'For Rent' },
  { value: 'Pre-Selling', label: 'Pre-Selling' },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: ALL_VALUE, label: 'All Property Types' },
  { value: 'House & Lot', label: 'House & Lot' },
  { value: 'Condominium', label: 'Condominium' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Lot Only', label: 'Lot Only' },
];

const PRICE_OPTIONS = [
  { value: ALL_VALUE, label: 'Any Property Price' },
  { value: 'under-3m', label: 'Under ₱3M' },
  { value: '3m-8m', label: '₱3M – ₱8M' },
  { value: 'above-8m', label: '₱8M+' },
];

export default function ListingHeroGallery({
  onBookTour,
  onViewGallery,
  onViewProperties,
  onConsultAgent,
  onInquireNow
}) {
  const heroRef = useRef(null);
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [searchQuery, setSearchQuery] = useState('');
  const [propertyStatus, setPropertyStatus] = useState(ALL_VALUE);
  const [propertyType, setPropertyType] = useState(ALL_VALUE);
  const [propertyPrice, setPropertyPrice] = useState(ALL_VALUE);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const trimmed = searchQuery.trim();
    if (trimmed) params.set('search', trimmed);
    if (propertyStatus !== ALL_VALUE) params.set('status', propertyStatus);
    if (propertyType !== ALL_VALUE) params.set('type', propertyType);
    if (propertyPrice !== ALL_VALUE) params.set('budget', propertyPrice);
    const query = params.toString();
    navigate(query ? `/properties?${query}` : '/properties');
  };

  // Parallax motion tracking with Hyper-Depth 2.5x intensity
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });

  // Spring physics for smooth momentum scrolling with Lenis
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 24,
    mass: 0.2
  });

  // Hyper-Depth 2.5x layer transformations
  const yHeroHouse = useTransform(smoothProgress, [0, 1], ['0px', '220px']);
  const scaleHeroHouse = useTransform(smoothProgress, [0, 1], [1, 1.12]);
  const yHeadlineText = useTransform(smoothProgress, [0, 1], ['0px', '-35px']);
  const ySkyClouds = useTransform(smoothProgress, [0, 1], ['0px', '55px']);
  const opacitySkyGlow = useTransform(smoothProgress, [0, 0.85], [1, 0.45]);

  return (
    <section ref={heroRef} className="relative w-full bg-white flex flex-col justify-start items-center overflow-hidden pt-20 sm:pt-22 md:pt-24 pb-0 min-h-0 transition-colors duration-500">

      {/* ─── PURE MORNING SKY WITH TEXTURED NATURAL CLOUDS IN THE MIDDLE ─── */}
      <motion.div
        style={{ y: ySkyClouds, opacity: opacitySkyGlow }}
        className="absolute inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-500"
      >
        {/* SVG Definition for Organic Realistic Cloud Turbulence & Displacement */}
        <svg className="absolute w-0 h-0 pointer-events-none">
          <filter id="cloud-filter-main" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="5" result="noise" seed="42" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="35" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="cloud-filter-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="4" result="noise" seed="18" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="25" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="smoke-filter" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="5" result="smoke" seed="88" />
            <feDisplacementMap in="SourceGraphic" in2="smoke" scale="40" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        {/* Light Ocean Blue Sky Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#5BC0DE] via-[#9ADFF0]/80 to-[#F0FAFC] transition-colors duration-500" />

        {/* ─── CONTINUOUS STREAM OF CLOUDS (True Endless Flow Across Sky) ─── */}
        {/* Lane 1: Upper Sky Stream (High Altitude Cumulus) */}
        <div
          className="cloud-flow absolute top-[100px] sm:top-[110px] md:top-[120px] left-0 w-[420px] sm:w-[480px] h-[125px] pointer-events-none z-[1]"
          style={{ animationDuration: '65s', animationDelay: '-32s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_12px_24px_rgba(100,160,220,0.35)]">
            <div className="absolute bottom-2 left-6 w-[86%] h-[65px] bg-white/95 rounded-full" />
            <div className="absolute top-2 left-[18%] w-[160px] h-[92px] bg-white rounded-full" />
            <div className="absolute top-0 left-[44%] w-[180px] h-[105px] bg-white rounded-full" />
            <div className="absolute top-5 left-[66%] w-[140px] h-[80px] bg-white/95 rounded-full" />
            <div className="absolute -top-1 left-[36%] w-[90px] h-[48px] bg-white/90 rounded-full blur-[2px]" />
            <div className="absolute top-7 -left-[2%] w-[95px] h-[50px] bg-white/80 rounded-full blur-[3px]" />
          </div>
        </div>
        <div
          className="cloud-flow absolute top-[95px] sm:top-[105px] md:top-[115px] left-0 w-[400px] sm:w-[460px] h-[120px] pointer-events-none z-[1]"
          style={{ animationDuration: '65s', animationDelay: '0s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_12px_24px_rgba(100,160,220,0.35)]">
            <div className="absolute bottom-2 left-6 w-[86%] h-[62px] bg-white/95 rounded-full" />
            <div className="absolute top-2 left-[20%] w-[150px] h-[88px] bg-white rounded-full" />
            <div className="absolute top-0 left-[46%] w-[170px] h-[100px] bg-white rounded-full" />
            <div className="absolute top-5 left-[68%] w-[130px] h-[75px] bg-white/95 rounded-full" />
            <div className="absolute -top-1 left-[38%] w-[85px] h-[45px] bg-white/90 rounded-full blur-[2px]" />
          </div>
        </div>

        {/* Lane 2: Mid Sky Stream (Parallel to Headline/Subheadline) */}
        <div
          className="cloud-flow absolute top-[180px] sm:top-[195px] md:top-[210px] left-0 w-[360px] sm:w-[420px] h-[110px] pointer-events-none z-[1]"
          style={{ animationDuration: '55s', animationDelay: '-18s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_10px_20px_rgba(100,160,220,0.3)]">
            <div className="absolute bottom-2 left-5 w-[85%] h-[58px] bg-white/90 rounded-full" />
            <div className="absolute top-2 left-[20%] w-[140px] h-[82px] bg-white rounded-full" />
            <div className="absolute top-0 left-[45%] w-[155px] h-[95px] bg-white rounded-full" />
            <div className="absolute top-4 left-[64%] w-[120px] h-[72px] bg-white/95 rounded-full" />
            <div className="absolute -top-1 left-[32%] w-[80px] h-[44px] bg-white/85 rounded-full blur-[2px]" />
          </div>
        </div>
        <div
          className="cloud-flow absolute top-[190px] sm:top-[205px] md:top-[220px] left-0 w-[340px] sm:w-[390px] h-[105px] pointer-events-none z-[1]"
          style={{ animationDuration: '55s', animationDelay: '-45s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_10px_20px_rgba(100,160,220,0.3)]">
            <div className="absolute bottom-2 left-5 w-[85%] h-[55px] bg-white/90 rounded-full" />
            <div className="absolute top-2 left-[18%] w-[130px] h-[78px] bg-white rounded-full" />
            <div className="absolute top-0 left-[42%] w-[145px] h-[90px] bg-white rounded-full" />
            <div className="absolute top-4 left-[62%] w-[115px] h-[68px] bg-white/95 rounded-full" />
            <div className="absolute -top-1 left-[30%] w-[75px] h-[40px] bg-white/85 rounded-full blur-[2px]" />
          </div>
        </div>

        {/* Lane 3: Lower Sky Stream (Directly Above Townhouse Rooflines) */}
        <div
          className="cloud-flow absolute top-[280px] sm:top-[300px] md:top-[315px] left-0 w-[280px] sm:w-[330px] h-[85px] pointer-events-none z-[1]"
          style={{ animationDuration: '70s', animationDelay: '-24s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_8px_16px_rgba(100,160,220,0.25)]">
            <div className="absolute bottom-1 left-4 w-[84%] h-[45px] bg-white/90 rounded-full" />
            <div className="absolute top-1 left-[16%] w-[105px] h-[60px] bg-white rounded-full" />
            <div className="absolute top-0 left-[42%] w-[120px] h-[70px] bg-white rounded-full" />
            <div className="absolute top-3 left-[65%] w-[90px] h-[50px] bg-white/90 rounded-full" />
            <div className="absolute -top-1 left-[35%] w-[65px] h-[34px] bg-white/80 rounded-full blur-[2px]" />
          </div>
        </div>
        <div
          className="cloud-flow absolute top-[290px] sm:top-[310px] md:top-[325px] left-0 w-[260px] sm:w-[300px] h-[80px] pointer-events-none z-[1]"
          style={{ animationDuration: '70s', animationDelay: '-58s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_8px_16px_rgba(100,160,220,0.25)]">
            <div className="absolute bottom-1 left-4 w-[84%] h-[42px] bg-white/90 rounded-full" />
            <div className="absolute top-1 left-[18%] w-[95px] h-[55px] bg-white rounded-full" />
            <div className="absolute top-0 left-[44%] w-[110px] h-[65px] bg-white rounded-full" />
            <div className="absolute top-3 left-[68%] w-[80px] h-[45px] bg-white/90 rounded-full" />
            <div className="absolute -top-1 left-[38%] w-[55px] h-[30px] bg-white/80 rounded-full blur-[2px]" />
          </div>
        </div>

        {/* Lane 4: Distant Roof Apex Horizon Stream */}
        <div
          className="cloud-flow absolute top-[345px] sm:top-[360px] md:top-[375px] left-0 w-[200px] sm:w-[240px] h-[65px] pointer-events-none z-[1]"
          style={{ animationDuration: '80s', animationDelay: '-12s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_6px_14px_rgba(100,160,220,0.2)]">
            <div className="absolute bottom-1 left-3 w-[84%] h-[35px] bg-white/85 rounded-full" />
            <div className="absolute top-0 left-[20%] w-[80px] h-[48px] bg-white/95 rounded-full" />
            <div className="absolute top-1 left-[48%] w-[88px] h-[52px] bg-white/90 rounded-full" />
            <div className="absolute -top-1 left-[32%] w-[50px] h-[26px] bg-white/75 rounded-full blur-[2px]" />
          </div>
        </div>
        <div
          className="cloud-flow absolute top-[350px] sm:top-[365px] md:top-[380px] left-0 w-[180px] sm:w-[220px] h-[60px] pointer-events-none z-[1]"
          style={{ animationDuration: '80s', animationDelay: '-52s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_6px_14px_rgba(100,160,220,0.2)]">
            <div className="absolute bottom-1 left-3 w-[84%] h-[32px] bg-white/85 rounded-full" />
            <div className="absolute top-0 left-[22%] w-[70px] h-[42px] bg-white/95 rounded-full" />
            <div className="absolute top-1 left-[50%] w-[78px] h-[46px] bg-white/90 rounded-full" />
            <div className="absolute -top-1 left-[34%] w-[45px] h-[24px] bg-white/75 rounded-full blur-[2px]" />
          </div>
        </div>

        {/* Soft White Morning Radiance from the Left */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 65% 75% at 0% 25%, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.35) 30%, rgba(255, 255, 255, 0.08) 55%, transparent 75%)'
          }}
        />
      </motion.div>

      {/* ─── CENTERED QUICK PROPERTY SEARCH BAR ─── */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={shouldReduceMotion ? undefined : { y: yHeadlineText }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-20 w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 flex flex-col items-center justify-center pt-4 sm:pt-10 md:pt-14 lg:pt-16 will-change-transform"
      >
        {/* ─── INTEGRATED QUICK SEARCH BAR (35% Glassmorphic + Teal Highlights) ─── */}
        <form
          onSubmit={handleSearchSubmit}
          aria-label="Search properties"
          className="w-full max-w-xl lg:max-w-2xl p-3 rounded-xl bg-white/35 backdrop-blur-md shadow-md grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-stretch z-30"
        >
          {/* Search Input */}
          <div className="sm:col-span-12 min-w-0 relative flex items-center">
            <Search className="size-4 text-[#0F766E] absolute left-3.5 pointer-events-none shrink-0" aria-hidden="true" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location, subdivision, or keyword..."
              aria-label="Search location, subdivision, or keyword"
              className="w-full h-12 pl-10 pr-4 rounded-lg bg-white/55 hover:bg-white/75 focus:bg-white/90 border border-[#0F766E]/25 hover:border-[#0F766E]/50 text-sm font-medium text-[#1E293B] placeholder:text-[#64748B] focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/25 shadow-2xs transition-colors"
            />
          </div>

          {/* Property Status Select */}
          <div className="sm:col-span-6 min-w-0">
            <Select modal={false} value={propertyStatus} onValueChange={setPropertyStatus}>
              <SelectTrigger
                aria-label="Property Status"
                className="w-full data-[size=default]:h-12 h-12 rounded-lg bg-white/55 hover:bg-white/75 border border-[#0F766E]/25 hover:border-[#0F766E]/50 px-3.5 text-sm font-medium text-[#1E293B] focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/25 shadow-2xs transition-colors"
              >
                <span className="flex items-center gap-2 min-w-0 flex-1 text-left">
                  <Tag className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                  <SelectValue placeholder="All Property Status" className="truncate">
                    {STATUS_OPTIONS.find((o) => o.value === propertyStatus)?.label}
                  </SelectValue>
                </span>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width) rounded-xl bg-white border border-[#0F766E]/25 shadow-md">
                <SelectGroup>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Property Type Select */}
          <div className="sm:col-span-6 min-w-0">
            <Select modal={false} value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger
                aria-label="Property Type"
                className="w-full data-[size=default]:h-12 h-12 rounded-lg bg-white/55 hover:bg-white/75 border border-[#0F766E]/25 hover:border-[#0F766E]/50 px-3.5 text-sm font-medium text-[#1E293B] focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/25 shadow-2xs transition-colors"
              >
                <span className="flex items-center gap-2 min-w-0 flex-1 text-left">
                  <Home className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                  <SelectValue placeholder="All Property Types" className="truncate">
                    {PROPERTY_TYPE_OPTIONS.find((o) => o.value === propertyType)?.label}
                  </SelectValue>
                </span>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width) rounded-xl bg-white border border-[#0F766E]/25 shadow-md">
                <SelectGroup>
                  {PROPERTY_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Property Price Select */}
          <div className="sm:col-span-6 min-w-0">
            <Select modal={false} value={propertyPrice} onValueChange={setPropertyPrice}>
              <SelectTrigger
                aria-label="Property Price"
                className="w-full data-[size=default]:h-12 h-12 rounded-lg bg-white/55 hover:bg-white/75 border border-[#0F766E]/25 hover:border-[#0F766E]/50 px-3.5 text-sm font-medium text-[#1E293B] focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/25 shadow-2xs transition-colors"
              >
                <span className="flex items-center gap-2 min-w-0 flex-1 text-left">
                  <Coins className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                  <SelectValue placeholder="Any Property Price" className="truncate">
                    {PRICE_OPTIONS.find((o) => o.value === propertyPrice)?.label}
                  </SelectValue>
                </span>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width) rounded-xl bg-white border border-[#0F766E]/25 shadow-md">
                <SelectGroup>
                  {PRICE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Coral CTA Button */}
          <div className="sm:col-span-6 min-w-0">
            <Button
              type="submit"
              variant="coral"
              size="lg"
              className="w-full h-12 px-4 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm motion-safe:active:scale-[0.98]"
            >
              <Search className="size-4 shrink-0" aria-hidden="true" />
              <span>Find Homes</span>
            </Button>
          </div>
        </form>
      </motion.div>

      {/* ─── FULL-WIDTH HOUSE ILLUSTRATION (Hyper-Depth 2.5x Parallax Plane) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ y: yHeroHouse, scale: scaleHeroHouse }}
        transition={{ duration: 1, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 w-full flex justify-center items-center mx-auto leading-none mt-4 sm:-mt-8 md:-mt-20 lg:-mt-32 xl:-mt-36 pointer-events-none origin-center will-change-transform"
      >
        <div className="relative w-full flex justify-center items-center">
          <img
            src={houseHeroImg}
            alt="Human Shelter - Selling Homes, Building Dreams"
            className="w-full min-w-full max-w-none min-h-[220px] sm:min-h-0 h-auto object-cover object-bottom sm:object-center block drop-shadow-[0_20px_40px_rgba(0,0,0,0.05)]"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />

          {/* Dynamic Soft White Morning Radiance Wash from Left */}
          <motion.div
            animate={{ opacity: [0.18, 0.32, 0.18] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-white/45 via-white/15 to-transparent pointer-events-none mix-blend-soft-light"
          />
        </div>
      </motion.div>
    </section>
  );
}
