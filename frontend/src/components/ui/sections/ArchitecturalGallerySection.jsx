import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { 
  IconEye, 
  IconX, 
  IconArrowRight, 
  IconChevronLeft, 
  IconChevronRight, 
  IconDimensions, 
  IconBed, 
  IconCar,
  IconMapPin
} from '@tabler/icons-react';

const GALLERY_ITEMS = [
  // ROW 1: 3-Col (Narrow) | 5-Col (Wide) | 4-Col (Medium)
  {
    id: '1',
    refCode: 'REF: ARC-AA-01',
    status: 'For Sale',
    statusColor: 'bg-[#0D4446]/90',
    title: 'Ayala Alabang Sanctuary',
    propertySubType: 'Private Estate',
    typeColor: 'bg-[#E76F51]',
    architect: 'Leandro V. Locsin Partners',
    yearBuilt: '2025',
    location: 'Ayala Alabang, Muntinlupa',
    price: '185,000,000',
    priceSuffix: '',
    specs: '5 Beds • 6 Baths • 850 sqm',
    area: '850 sqm',
    rooms: '5 Bed • 6 Bath',
    parking: '4 Cars',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop',
    tagline: 'Meticulously designed estate balancing raw modernist concrete with private Japanese Zen courtyards.',
    publicRemarks: 'Floor-to-ceiling thermal apertures frame tranquil reflecting pools. Features a bespoke subterranean wine cellar, cinema pavilion, and landscaped grounds.',
    features: ['Private Cinema', 'Wine Cellar', 'Reflecting Basin', 'Smart Home System']
  },
  {
    id: '2',
    refCode: 'REF: ARC-RC-02',
    status: 'For Rent',
    statusColor: 'bg-[#141717]/90',
    title: 'The Proscenium Sky Penthouse',
    propertySubType: 'Sky Residence',
    typeColor: 'bg-[#E76F51]',
    architect: 'Carlos Ott Architects',
    yearBuilt: '2024',
    location: 'Rockwell Center, Makati',
    price: '450,000',
    priceSuffix: '/ mo',
    specs: '3 Beds • 3.5 Baths • 280 sqm',
    area: '280 sqm',
    rooms: '3 Bed • 3.5 Bath',
    parking: '2 Cars',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop',
    tagline: 'Commanding top-tier sky residence featuring wraparound glass walls overlooking the metropolitan skyline.',
    publicRemarks: 'Private high-speed biometric elevator access opens into expansive double-height living galleries with imported Italian marble and a sunset viewing loggia.',
    features: ['Private Elevator', 'Skyline Loggia', 'Wine Vault', 'Concierge Service']
  },
  {
    id: '3',
    refCode: 'REF: ARC-BG-03',
    status: 'Pre-Selling',
    statusColor: 'bg-[#5C6768]/90',
    title: 'Aurelia Residences Horizon',
    propertySubType: 'Luxury High-Rise',
    typeColor: 'bg-[#E76F51]',
    architect: 'Skidmore, Owings & Merrill',
    yearBuilt: '2025',
    location: 'Bonifacio Global City, Taguig',
    price: '145,000,000',
    priceSuffix: '',
    specs: '3 Beds • 3.5 Baths • 240 sqm',
    area: '240 sqm',
    rooms: '3 Bed • 3.5 Bath',
    parking: '2 Cars',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600&auto=format&fit=crop',
    tagline: 'Uninterrupted panorama across the Manila Golf Course with floor-to-ceiling double-glazed envelopes.',
    publicRemarks: 'Crafted with bespoke Italian fixtures, motorized solar screens, and bespoke marble vanities in the heart of Bonifacio Global City.',
    features: ['Golf Course Vista', 'Motorized Louvers', 'Lap Pool', 'Private Valet']
  },

  // ROW 2: 5-Col (Wide) | 4-Col (Medium) | 3-Col (Narrow)
  {
    id: '4',
    refCode: 'REF: ARC-FP-04',
    status: 'For Sale',
    statusColor: 'bg-[#0D4446]/90',
    title: 'Forbes Park Brutalist Villa',
    propertySubType: 'Architectural Monolith',
    typeColor: 'bg-[#E76F51]',
    architect: 'Studio Veldt Architecture',
    yearBuilt: '2024',
    location: 'Forbes Park, Makati',
    price: '420,000,000',
    priceSuffix: '',
    specs: '6 Beds • 7 Baths • 1,200 sqm',
    area: '1,200 sqm',
    rooms: '6 Bed • 7 Bath',
    parking: '6 Cars',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
    tagline: 'Board-formed exposed concrete complemented by custom patinated bronze joinery and private bamboo groves.',
    publicRemarks: 'Museum-grade directional wall illumination, 14-foot ceiling heights, and a private 25-meter lap pool surrounded by old-growth tropical foliage.',
    features: ['25m Lap Pool', 'Subterranean Vault', 'Guard Outpost', 'Bespoke Joinery']
  },
  {
    id: '5',
    refCode: 'REF: ARC-DV-05',
    status: 'Pre-Selling',
    statusColor: 'bg-[#5C6768]/90',
    title: 'Dasmariñas Modern Pavilion',
    propertySubType: 'Contemporary Pavilion',
    typeColor: 'bg-[#E76F51]',
    architect: 'Marmol Radziner',
    yearBuilt: '2025',
    location: 'Dasmariñas Village, Makati',
    price: '280,000,000',
    priceSuffix: '',
    specs: '4 Beds • 4.5 Baths • 680 sqm',
    area: '680 sqm',
    rooms: '4 Bed • 4.5 Bath',
    parking: '4 Cars',
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1600&auto=format&fit=crop',
    tagline: 'Cantilevered steel roof planes and expansive pocket glass walls merging living zones with reflection ponds.',
    publicRemarks: 'Engineered with geothermal climate controls, smart shading pergolas, and an artisanal chef demonstration kitchen.',
    features: ['Reflection Ponds', 'Demonstration Kitchen', 'Smart Pergolas', 'Wine Room']
  },
  {
    id: '6',
    refCode: 'REF: ARC-HS-06',
    status: 'For Rent',
    statusColor: 'bg-[#141717]/90',
    title: 'The Suites at BGC Sky Villa',
    propertySubType: 'Duplex Penthouse',
    typeColor: 'bg-[#E76F51]',
    architect: 'Arquitectonica',
    yearBuilt: '2024',
    location: 'High Street South, Taguig',
    price: '260,000',
    priceSuffix: '/ mo',
    specs: '2 Beds • 2.5 Baths • 190 sqm',
    area: '190 sqm',
    rooms: '2 Bed • 2.5 Bath',
    parking: '2 Cars',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1600&auto=format&fit=crop',
    tagline: 'Seamless duplex layouts framing direct vistas of the pedestrian High Street promenade and skyline.',
    publicRemarks: 'Complete with integrated designer appliances, automated Lutron blinds, and direct biometric private lobby access.',
    features: ['Biometric Access', 'Lutron Automation', 'Fitness Suite', 'Private Parking']
  },
  {
    id: '7',
    refCode: 'REF: ARC-TH-07',
    status: 'Pre-Selling',
    statusColor: 'bg-[#5C6768]/90',
    title: 'Horizon Terraces Sanctuary',
    propertySubType: 'Mountain Villa',
    typeColor: 'bg-[#E76F51]',
    architect: 'Leandro V. Locsin Partners',
    yearBuilt: '2025',
    location: 'Tagaytay Highlands, Cavite',
    price: '95,000,000',
    priceSuffix: '',
    specs: '4 Beds • 5 Baths • 520 sqm',
    area: '520 sqm',
    rooms: '4 Bed • 5 Bath',
    parking: '4 Cars',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop',
    tagline: 'Perched along ridge-lines offering panoramic vistas of Taal Lake and natural pine groves.',
    publicRemarks: 'Custom glass cantilevers with geothermal floor warming, wrap-around sunset terraces, and private wellness spa pavilion.',
    features: ['Taal Lake Panorama', 'Spa Pavilion', 'Wrap-around Terrace', 'Smart Geothermal']
  },
  {
    id: '8',
    refCode: 'REF: ARC-UV-08',
    status: 'For Sale',
    statusColor: 'bg-[#0D4446]/90',
    title: 'Urdaneta Village Serenity',
    propertySubType: 'Contemporary Manor',
    typeColor: 'bg-[#E76F51]',
    architect: 'Marmol Radziner',
    yearBuilt: '2024',
    location: 'Urdaneta Village, Makati',
    price: '360,000,000',
    priceSuffix: '',
    specs: '5 Beds • 6 Baths • 780 sqm',
    area: '780 sqm',
    rooms: '5 Bed • 6 Bath',
    parking: '5 Cars',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1600&auto=format&fit=crop',
    tagline: 'Seamless modernist courtyard layout framed by ancient acacia canopy and volcanic stone walls.',
    publicRemarks: 'Equipped with bespoke Bulthaup kitchen, acoustic private library, 20m overflow infinity pool, and dedicated security outpost.',
    features: ['Bulthaup Kitchen', '20m Infinity Pool', 'Acoustic Library', 'Guard House']
  },
  {
    id: '9',
    refCode: 'REF: ARC-BV-09',
    status: 'For Sale',
    statusColor: 'bg-[#0D4446]/90',
    title: 'Bel-Air Modernist Glasshouse',
    propertySubType: 'Glass Pavilion',
    typeColor: 'bg-[#E76F51]',
    architect: 'Budji + Royal Architecture',
    yearBuilt: '2025',
    location: 'Bel-Air Village, Makati',
    price: '310,000,000',
    priceSuffix: '',
    specs: '4 Beds • 5.5 Baths • 720 sqm',
    area: '720 sqm',
    rooms: '4 Bed • 5.5 Bath',
    parking: '4 Cars',
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1600&auto=format&fit=crop',
    tagline: 'Double-volume architectural sanctuary with seamless indoor-outdoor water pavilions and cantilevered sun decks.',
    publicRemarks: 'Custom glass louvers, imported travertine flooring, heated saltwater plunge pool, and integrated solar energy grid.',
    features: ['Saltwater Plunge Pool', 'Solar Energy Grid', 'Travertine Terraces', 'Smart Automation']
  }
];

function getFinancingInfo(item) {
  if (item.status === 'For Rent' || item.priceSuffix) {
    return {
      monthly: `₱${item.price}/mo`,
      label: 'Monthly Lease',
      badge: 'Immediate Move-In',
      tcp: `₱${item.price} / month`
    };
  }
  const numericVal = parseInt(item.price.replace(/,/g, ''), 10) || 0;
  // Estimate monthly amortization on 20-year term (0.745% of 80% loan balance)
  const loanAmount = numericVal * 0.8;
  const monthlyAmort = Math.round(loanAmount * 0.00745);
  let formattedMonthly = '';
  if (monthlyAmort >= 1000000) {
    formattedMonthly = `₱${(monthlyAmort / 1000000).toFixed(1)}M/mo`;
  } else {
    formattedMonthly = `₱${monthlyAmort.toLocaleString()}/mo`;
  }
  
  const isPagIbigEligible = numericVal <= 6000000;
  return {
    monthly: formattedMonthly,
    label: 'Starts at',
    badge: isPagIbigEligible ? 'Pag-IBIG Ready' : 'Bank Financing',
    tcp: `₱${item.price} Total Price`
  };
}

export default function ArchitecturalGallerySection() {
  const [modalItem, setModalItem] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const [visibleRange, setVisibleRange] = useState({ first: 1, last: 3 });
  const [isPaused, setIsPaused] = useState(false);

  // True continuous sliding carousel track with loop and responsive 3x1 columns
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    duration: 38,
    breakpoints: {
      '(min-width: 1024px)': { slidesToScroll: 3 },
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(max-width: 767px)': { slidesToScroll: 1 },
    }
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    const inView = emblaApi.slidesInView();
    if (inView.length > 0) {
      setVisibleRange({ first: inView[0] + 1, last: inView[inView.length - 1] + 1 });
    }
  }, [emblaApi]);

  const onInit = useCallback(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    setSelectedIndex(emblaApi.selectedScrollSnap());
    const inView = emblaApi.slidesInView();
    if (inView.length > 0) {
      setVisibleRange({ first: inView[0] + 1, last: inView[inView.length - 1] + 1 });
    }
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onInit();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onInit);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onInit);
    };
  }, [emblaApi, onInit, onSelect]);

  // 20-second automatic timer triggering next images coming from the right
  useEffect(() => {
    if (!emblaApi || isPaused || modalItem) return;
    const timer = setInterval(() => {
      emblaApi.scrollNext();
    }, 20000);

    return () => clearInterval(timer);
  }, [emblaApi, isPaused, modalItem]);

  const totalSnapCount = scrollSnaps.length || 3;

  return (
    <section 
      id="gallery-exhibition" 
      className="w-full bg-[#FFFFFF] pt-8 md:pt-12 pb-16 md:pb-24 border-b border-[#D1D5DB] relative z-20 text-[#141717] transition-colors duration-500"
    >
      <div className="w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16 font-sans">
        
        {/* Section Masthead: Reference Style (— GALLERY) with Edition Telemetry */}
        <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-6 h-[2px] bg-[#0D4446]" />
              <span className="text-xs font-bold tracking-[0.25em] text-[#0D4446] uppercase font-sans">
                Gallery
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-extrabold text-[#141717] tracking-tight">
              Featured Properties
            </h2>
          </div>

          {/* Micro Telemetry Counter on Masthead */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#5C6768]">
              {visibleRange.first === visibleRange.last 
                ? String(visibleRange.first).padStart(2, '0')
                : `${String(visibleRange.first).padStart(2, '0')} - ${String(visibleRange.last).padStart(2, '0')}`} / {String(GALLERY_ITEMS.length).padStart(2, '0')} PROPERTIES
            </span>
          </div>
        </div>

        {/* 3x1 CAROUSEL STAGE (FLANKED BY LEFT & RIGHT BUTTONS) */}
        <div 
          className="relative px-0 sm:px-2"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left Navigation Arrow Button */}
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous properties"
            className="absolute -left-3 sm:-left-5 lg:-left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/95 backdrop-blur-md border border-[#D1D5DB] shadow-[0_8px_24px_rgba(0,0,0,0.08)] text-[#0D4446] hover:bg-[#0D4446] hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 group focus:outline-none"
          >
            <IconChevronLeft size={24} stroke={2.5} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>

          {/* Right Navigation Arrow Button */}
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next properties"
            className="absolute -right-3 sm:-right-5 lg:-right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/95 backdrop-blur-md border border-[#D1D5DB] shadow-[0_8px_24px_rgba(0,0,0,0.08)] text-[#0D4446] hover:bg-[#0D4446] hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 group focus:outline-none"
          >
            <IconChevronRight size={24} stroke={2.5} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>

          {/* True Sliding Carousel Viewport (Continuous Track, No Hidden Cards) */}
          <div className="overflow-hidden py-3 px-1 cursor-grab active:cursor-grabbing" ref={emblaRef}>
            <div className="flex -ml-6 sm:-ml-7 lg:-ml-8 touch-pan-y">
              {GALLERY_ITEMS.map((item, index) => {
                const finance = getFinancingInfo(item);

                return (
                  <div
                    key={item.id}
                    className="pl-6 sm:pl-7 lg:pl-8 min-w-0 flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333333%] shrink-0"
                  >
                    <div
                      onClick={() => setModalItem(item)}
                      className="relative bg-white rounded-[10px] border border-[#D1D5DB] shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgba(13,68,70,0.12)] hover:border-[#0D4446]/40 hover:-translate-y-1.5 transition-all duration-500 ease-out group cursor-pointer overflow-hidden flex flex-col justify-between h-full"
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for ${item.title}`}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setModalItem(item); }}
                    >
                      {/* Dynamic Top Accent Border */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-[3px] bg-transparent group-hover:bg-[#E76F51] transition-colors duration-500 z-10" 
                      />

                      {/* Upper Image Section with Badges, Reference Code, Title, and Location */}
                      <div>
                        <div className="relative h-64 sm:h-72 overflow-hidden bg-stone-900">
                          <img
                            src={item.image}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                          {/* Top Badges: Status + Property Type + Financing Badge */}
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5 z-10 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className={`backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/20 shadow-xs ${item.statusColor || 'bg-[#0D4446]/90'}`}>
                                {item.status || (item.priceSuffix ? 'For Rent' : 'For Sale')}
                              </span>
                              <span className={`${item.typeColor || 'bg-[#E76F51]'} text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs`}>
                                {item.propertySubType || 'Featured'}
                              </span>
                            </div>

                            <span className="bg-white/90 text-[#0D4446] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs backdrop-blur-md border border-white/30">
                              {finance.badge}
                            </span>
                          </div>

                          {/* Title and Location overlaid on image bottom */}
                          <div className="absolute bottom-3 left-3.5 right-3.5 z-10">
                            <h3 className="text-base sm:text-[17px] font-bold font-display text-white line-clamp-1 leading-snug drop-shadow-sm group-hover:text-white transition-colors">
                              {item.title}
                            </h3>
                            <p className="flex items-center gap-1 text-[11px] sm:text-xs text-stone-300 font-sans mt-0.5">
                              <IconMapPin size={12} stroke={2} className="shrink-0 text-stone-400" />
                              <span className="truncate">{item.location}</span>
                            </p>
                          </div>
                        </div>

                        {/* Body Content: 3 Metric Cards with Icons + Short Description */}
                        <div className="p-4 sm:p-5">
                          <div className="grid grid-cols-3 gap-1.5 pb-3.5 border-b border-stone-200/80 text-center">
                            <div className="p-1.5 px-1 bg-[#F4F5F4] rounded-[6px] flex flex-col items-center justify-center">
                              <span className="text-[9px] uppercase font-mono text-[#5C6768] flex items-center justify-center gap-1">
                                <IconDimensions size={13} stroke={2} className="text-[#0D4446]" />
                                Area
                              </span>
                              <p className="text-[10px] sm:text-[11px] font-bold text-[#0D4446] font-mono mt-0.5 text-center leading-tight">
                                {item.area}
                              </p>
                            </div>
                            <div className="p-1.5 px-1 bg-[#F4F5F4] rounded-[6px] flex flex-col items-center justify-center">
                              <span className="text-[9px] uppercase font-mono text-[#5C6768] flex items-center justify-center gap-1">
                                <IconBed size={13} stroke={2} className="text-[#0D4446]" />
                                Rooms
                              </span>
                              <p className="text-[10px] sm:text-[11px] font-bold text-[#0D4446] font-mono mt-0.5 text-center leading-tight">
                                {item.rooms}
                              </p>
                            </div>
                            <div className="p-1.5 px-1 bg-[#F4F5F4] rounded-[6px] flex flex-col items-center justify-center">
                              <span className="text-[9px] uppercase font-mono text-[#5C6768] flex items-center justify-center gap-1">
                                <IconCar size={13} stroke={2} className="text-[#0D4446]" />
                                Parking
                              </span>
                              <p className="text-[10px] sm:text-[11px] font-bold text-[#0D4446] font-mono mt-0.5 text-center leading-tight">
                                {item.parking}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-[#5C6768] mt-3 leading-relaxed line-clamp-2 font-normal">
                            {item.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Lower Stage: Monthly Amortization First + Total Price + Inspect Action */}
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2.5 flex items-center justify-between border-t border-stone-200/80">
                        <div>
                          <span className="text-[10px] uppercase text-[#E76F51] font-mono font-bold block leading-none">
                            {finance.label}
                          </span>
                          <div className="text-base sm:text-lg font-extrabold text-[#0D4446] font-sans tracking-tight leading-tight mt-1">
                            {finance.monthly}
                          </div>
                          <div className="text-[10px] font-mono text-[#5C6768] mt-0.5">
                            {finance.tcp}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalItem(item);
                          }}
                          className="btn-shine premium-btn px-3.5 py-2 bg-[#0D4446] hover:bg-[#082b2d] text-white rounded-[6px] text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <IconEye size={16} stroke={2} className="shrink-0" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PAGINATION DOTS & TELEMETRY INDICATOR (JUST BELOW CAROUSEL) */}
        <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            {(scrollSnaps.length ? scrollSnaps : [0, 1, 2]).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Go to property group ${i + 1}`}
                className={`relative h-2.5 rounded-full transition-all duration-500 cursor-pointer focus:outline-none ${
                  selectedIndex === i
                    ? 'w-10 bg-[#0D4446]'
                    : 'w-2.5 bg-stone-300 hover:bg-stone-400'
                }`}
              >
                {selectedIndex === i && (
                  <motion.div
                    layoutId="activeFeatureDot"
                    className="absolute inset-0 bg-[#0D4446] rounded-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* FULLSCREEN STUDY MODAL (Compliant with AGENTS.md Physics & Lenis Prevention) */}
      <AnimatePresence>
        {modalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 font-sans text-[#0f1722]">
            {/* Heavy Blur Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setModalItem(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body with Spring Entrance Physics */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 60 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              data-lenis-prevent="true"
              className="relative w-full max-w-5xl max-h-[90vh] bg-white border border-[#e5e5df] rounded-[5px] overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row overflow-y-auto no-scrollbar"
            >
              {/* Premium White Circle Close Button */}
              <button
                onClick={() => setModalItem(null)}
                aria-label="Close modal"
                className="absolute top-5 right-5 z-20 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors cursor-pointer text-black"
              >
                <IconX size={20} stroke={2.5} />
              </button>

              {/* Modal Left Image Stage */}
              <div className="w-full md:w-3/5 bg-black flex items-center justify-center min-h-[320px]">
                <img
                  src={modalItem.image}
                  alt={modalItem.title}
                  className="w-full h-full max-h-[70vh] object-cover"
                />
              </div>

              {/* Modal Right Dossier Panel */}
              <div className="w-full md:w-2/5 p-8 md:p-10 flex flex-col justify-between bg-[#FFFFFF]">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#0D4446] block mb-1">
                      {modalItem.propertySubType}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-sans font-extrabold text-[#141717] tracking-tight leading-tight">
                      {modalItem.title}
                    </h3>
                    <p className="text-xs font-medium font-sans text-[#5C6768] mt-1">
                      {modalItem.location} • {modalItem.architect} ({modalItem.yearBuilt})
                    </p>
                  </div>

                  {/* Philippine Peso Price Card */}
                  <div className="p-4 rounded-[8px] bg-[#FBFBF9] border border-[#D8DFDF]">
                    <div className="text-[10px] font-semibold text-[#5C6768] uppercase tracking-wider">
                      Acquisition Value
                    </div>
                    <div className="flex items-baseline gap-1 mt-1 text-[#141717] font-sans font-extrabold text-2xl sm:text-3xl">
                      <span className="text-lg font-extrabold text-emerald-600">₱</span>
                      <span>{modalItem.price}</span>
                      {modalItem.priceSuffix && (
                        <span className="text-xs font-medium text-[#5C6768] ml-1">
                          {modalItem.priceSuffix}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#5C6768] font-medium font-sans mt-1">
                      {modalItem.specs}
                    </div>
                  </div>

                  {/* Property Narrative */}
                  <p className="text-xs sm:text-sm text-[#5C6768] leading-relaxed font-sans font-normal">
                    {modalItem.publicRemarks}
                  </p>

                  {/* Amenities Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {modalItem.features.map((amenity, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-[4px] text-[10px] font-semibold uppercase bg-[#F4F5F4] text-[#141717] border border-[#D8DFDF]">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#D8DFDF]">
                  <button
                    onClick={() => setModalItem(null)}
                    className="w-full h-[54px] rounded-[6px] bg-[#0D4446] hover:bg-[#083335] text-white font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Inquire Portfolio Asset</span>
                    <IconArrowRight size={18} stroke={2} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
