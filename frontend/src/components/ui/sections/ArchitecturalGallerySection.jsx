import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import PropertyCard from '../cards/PropertyCard';

const GALLERY_ITEMS = [
  // ROW 1: 3-Col (Narrow) | 5-Col (Wide) | 4-Col (Medium)
  {
    id: '1',
    refCode: 'REF: ARC-AA-01',
    status: 'For Sale',
    statusColor: 'bg-primary/90',
    title: 'Ayala Alabang Sanctuary',
    propertySubType: 'Private Estate',
    typeColor: 'bg-accent',
    architect: 'Leandro V. Locsin Partners',
    yearBuilt: '2025',
    location: 'Ayala Alabang, Muntinlupa',
    price: '185,000,000',
    priceSuffix: '',
    specs: '5 Beds • 6 Baths • 850 sqm',
    area: '850 sqm',
    rooms: '5 Bed • 6 Bath',
    parking: '4 Cars',
    image: null,
    tagline: 'Meticulously designed estate balancing raw modernist concrete with private Japanese Zen courtyards.',
    publicRemarks: 'Floor-to-ceiling thermal apertures frame tranquil reflecting pools. Features a bespoke subterranean wine cellar, cinema pavilion, and landscaped grounds.',
    features: ['Private Cinema', 'Wine Cellar', 'Reflecting Basin', 'Smart Home System']
  },
  {
    id: '2',
    refCode: 'REF: ARC-RC-02',
    status: 'For Rent',
    statusColor: 'bg-on-surface/90',
    title: 'The Proscenium Sky Penthouse',
    propertySubType: 'Sky Residence',
    typeColor: 'bg-accent',
    architect: 'Carlos Ott Architects',
    yearBuilt: '2024',
    location: 'Rockwell Center, Makati',
    price: '450,000',
    priceSuffix: '/ mo',
    specs: '3 Beds • 3.5 Baths • 280 sqm',
    area: '280 sqm',
    rooms: '3 Bed • 3.5 Bath',
    parking: '2 Cars',
    image: null,
    tagline: 'Commanding top-tier sky residence featuring wraparound glass walls overlooking the metropolitan skyline.',
    publicRemarks: 'Private high-speed biometric elevator access opens into expansive double-height living galleries with imported Italian marble and a sunset viewing loggia.',
    features: ['Private Elevator', 'Skyline Loggia', 'Wine Vault', 'Concierge Service']
  },
  {
    id: '3',
    refCode: 'REF: ARC-BG-03',
    status: 'Pre-Selling',
    statusColor: 'bg-on-surface-variant/90',
    title: 'Aurelia Residences Horizon',
    propertySubType: 'Luxury High-Rise',
    typeColor: 'bg-accent',
    architect: 'Skidmore, Owings & Merrill',
    yearBuilt: '2025',
    location: 'Bonifacio Global City, Taguig',
    price: '145,000,000',
    priceSuffix: '',
    specs: '3 Beds • 3.5 Baths • 240 sqm',
    area: '240 sqm',
    rooms: '3 Bed • 3.5 Bath',
    parking: '2 Cars',
    image: null,
    tagline: 'Uninterrupted panorama across the Manila Golf Course with floor-to-ceiling double-glazed envelopes.',
    publicRemarks: 'Crafted with bespoke Italian fixtures, motorized solar screens, and bespoke marble vanities in the heart of Bonifacio Global City.',
    features: ['Golf Course Vista', 'Motorized Louvers', 'Lap Pool', 'Private Valet']
  },

  // ROW 2: 5-Col (Wide) | 4-Col (Medium) | 3-Col (Narrow)
  {
    id: '4',
    refCode: 'REF: ARC-FP-04',
    status: 'For Sale',
    statusColor: 'bg-primary/90',
    title: 'Forbes Park Brutalist Villa',
    propertySubType: 'Architectural Monolith',
    typeColor: 'bg-accent',
    architect: 'Studio Veldt Architecture',
    yearBuilt: '2024',
    location: 'Forbes Park, Makati',
    price: '420,000,000',
    priceSuffix: '',
    specs: '6 Beds • 7 Baths • 1,200 sqm',
    area: '1,200 sqm',
    rooms: '6 Bed • 7 Bath',
    parking: '6 Cars',
    image: null,
    tagline: 'Board-formed exposed concrete complemented by custom patinated bronze joinery and private bamboo groves.',
    publicRemarks: 'Museum-grade directional wall illumination, 14-foot ceiling heights, and a private 25-meter lap pool surrounded by old-growth tropical foliage.',
    features: ['25m Lap Pool', 'Subterranean Vault', 'Guard Outpost', 'Bespoke Joinery']
  },
  {
    id: '5',
    refCode: 'REF: ARC-DV-05',
    status: 'Pre-Selling',
    statusColor: 'bg-on-surface-variant/90',
    title: 'Dasmariñas Modern Pavilion',
    propertySubType: 'Contemporary Pavilion',
    typeColor: 'bg-accent',
    architect: 'Marmol Radziner',
    yearBuilt: '2025',
    location: 'Dasmariñas Village, Makati',
    price: '280,000,000',
    priceSuffix: '',
    specs: '4 Beds • 4.5 Baths • 680 sqm',
    area: '680 sqm',
    rooms: '4 Bed • 4.5 Bath',
    parking: '4 Cars',
    image: null,
    tagline: 'Cantilevered steel roof planes and expansive pocket glass walls merging living zones with reflection ponds.',
    publicRemarks: 'Engineered with geothermal climate controls, smart shading pergolas, and an artisanal chef demonstration kitchen.',
    features: ['Reflection Ponds', 'Demonstration Kitchen', 'Smart Pergolas', 'Wine Room']
  },
  {
    id: '6',
    refCode: 'REF: ARC-HS-06',
    status: 'For Rent',
    statusColor: 'bg-on-surface/90',
    title: 'The Suites at BGC Sky Villa',
    propertySubType: 'Duplex Penthouse',
    typeColor: 'bg-accent',
    architect: 'Arquitectonica',
    yearBuilt: '2024',
    location: 'High Street South, Taguig',
    price: '260,000',
    priceSuffix: '/ mo',
    specs: '2 Beds • 2.5 Baths • 190 sqm',
    area: '190 sqm',
    rooms: '2 Bed • 2.5 Bath',
    parking: '2 Cars',
    image: null,
    tagline: 'Seamless duplex layouts framing direct vistas of the pedestrian High Street promenade and skyline.',
    publicRemarks: 'Complete with integrated designer appliances, automated Lutron blinds, and direct biometric private lobby access.',
    features: ['Biometric Access', 'Lutron Automation', 'Fitness Suite', 'Private Parking']
  },
  {
    id: '7',
    refCode: 'REF: ARC-TH-07',
    status: 'Pre-Selling',
    statusColor: 'bg-on-surface-variant/90',
    title: 'Horizon Terraces Sanctuary',
    propertySubType: 'Mountain Villa',
    typeColor: 'bg-accent',
    architect: 'Leandro V. Locsin Partners',
    yearBuilt: '2025',
    location: 'Tagaytay Highlands, Cavite',
    price: '95,000,000',
    priceSuffix: '',
    specs: '4 Beds • 5 Baths • 520 sqm',
    area: '520 sqm',
    rooms: '4 Bed • 5 Bath',
    parking: '4 Cars',
    image: null,
    tagline: 'Perched along ridge-lines offering panoramic vistas of Taal Lake and natural pine groves.',
    publicRemarks: 'Custom glass cantilevers with geothermal floor warming, wrap-around sunset terraces, and private wellness spa pavilion.',
    features: ['Taal Lake Panorama', 'Spa Pavilion', 'Wrap-around Terrace', 'Smart Geothermal']
  },
  {
    id: '8',
    refCode: 'REF: ARC-UV-08',
    status: 'For Sale',
    statusColor: 'bg-primary/90',
    title: 'Urdaneta Village Serenity',
    propertySubType: 'Contemporary Manor',
    typeColor: 'bg-accent',
    architect: 'Marmol Radziner',
    yearBuilt: '2024',
    location: 'Urdaneta Village, Makati',
    price: '360,000,000',
    priceSuffix: '',
    specs: '5 Beds • 6 Baths • 780 sqm',
    area: '780 sqm',
    rooms: '5 Bed • 6 Bath',
    parking: '5 Cars',
    image: null,
    tagline: 'Seamless modernist courtyard layout framed by ancient acacia canopy and volcanic stone walls.',
    publicRemarks: 'Equipped with bespoke Bulthaup kitchen, acoustic private library, 20m overflow infinity pool, and dedicated security outpost.',
    features: ['Bulthaup Kitchen', '20m Infinity Pool', 'Acoustic Library', 'Guard House']
  },
  {
    id: '9',
    refCode: 'REF: ARC-BV-09',
    status: 'For Sale',
    statusColor: 'bg-primary/90',
    title: 'Bel-Air Modernist Glasshouse',
    propertySubType: 'Glass Pavilion',
    typeColor: 'bg-accent',
    architect: 'Budji + Royal Architecture',
    yearBuilt: '2025',
    location: 'Bel-Air Village, Makati',
    price: '310,000,000',
    priceSuffix: '',
    specs: '4 Beds • 5.5 Baths • 720 sqm',
    area: '720 sqm',
    rooms: '4 Bed • 5.5 Bath',
    parking: '4 Cars',
    image: null,
    tagline: 'Double-volume architectural sanctuary with seamless indoor-outdoor water pavilions and cantilevered sun decks.',
    publicRemarks: 'Custom glass louvers, imported travertine flooring, heated saltwater plunge pool, and integrated solar energy grid.',
    features: ['Saltwater Plunge Pool', 'Solar Energy Grid', 'Travertine Terraces', 'Smart Automation']
  }
];

function toPropertyCardProps(item) {
  return {
    ...item,
    ref_code: item.refCode,
    transactionType: item.status,
    propertyType: item.propertySubType,
    beds: item.specs?.match(/(\d+(?:\.\d+)?)\s*Bed/i)?.[1] ?? null,
    baths: item.specs?.match(/(\d+(?:\.\d+)?)\s*Bath/i)?.[1] ?? null,
    parking: item.parking?.replace(/\s*Cars?/i, '') ?? null,
    agentName: 'Elena Silva',
    isFeatured: true,
  };
}

export default function ArchitecturalGallerySection() {
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
      '(min-width: 1024px)': { slidesToScroll: 1 },
      '(min-width: 768px)': { slidesToScroll: 1 },
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
    if (!emblaApi || isPaused) return;
    const timer = setInterval(() => {
      emblaApi.scrollNext();
    }, 20000);

    return () => clearInterval(timer);
  }, [emblaApi, isPaused]);

  const totalSnapCount = scrollSnaps.length || 3;

  return (
    <section 
      id="gallery-exhibition" 
      className="w-full bg-white pt-8 md:pt-12 pb-16 md:pb-24 border-b border-outline relative z-20 text-on-surface transition-colors duration-500"
    >
      <div className="w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16 font-sans">
        
        {/* Section Masthead */}
        <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-6 h-[2px] bg-primary" />
              <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase font-sans">
                Gallery
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-extrabold text-on-surface tracking-tight">
              Featured Properties
            </h2>
          </div>

          {/* Micro Telemetry Counter on Masthead */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-on-surface-variant">
              {visibleRange.first === visibleRange.last 
                ? String(visibleRange.first).padStart(2, '0')
                : `${String(visibleRange.first).padStart(2, '0')} - ${String(visibleRange.last).padStart(2, '0')}`} / {String(GALLERY_ITEMS.length).padStart(2, '0')} PROPERTIES
            </span>
          </div>
        </div>

        {/* 3x1 CAROUSEL STAGE (FLANKED BY LEFT & RIGHT BUTTONS) */}
        <div 
          className="relative w-full"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left Navigation Arrow Button */}
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous properties"
            className="absolute -left-4 sm:-left-8 lg:-left-12 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-surface/95 backdrop-blur-md border border-outline shadow-xs text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <IconChevronLeft size={22} stroke={2.5} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>

          {/* Right Navigation Arrow Button */}
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next properties"
            className="absolute -right-4 sm:-right-8 lg:-right-12 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-surface/95 backdrop-blur-md border border-outline shadow-xs text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <IconChevronRight size={22} stroke={2.5} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>

          {/* True Sliding Carousel Viewport */}
          <div className="overflow-hidden py-3 px-1 cursor-grab active:cursor-grabbing" ref={emblaRef}>
            <div className="flex -ml-6 sm:-ml-7 lg:-ml-8 touch-pan-y">
              {GALLERY_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="pl-4 sm:pl-6 lg:pl-8 min-w-0 flex-[0_0_90%] md:flex-[0_0_50%] lg:flex-[0_0_33.333333%] shrink-0"
                >
                  <PropertyCard property={toPropertyCardProps(item)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PAGINATION DOTS */}
        <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            {(scrollSnaps.length ? scrollSnaps : [0, 1, 2]).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Go to property group ${i + 1}`}
                className={`relative h-2 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none ${
                  selectedIndex === i
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-outline hover:bg-outline-variant'
                }`}
              >
                {selectedIndex === i && (
                  <motion.div
                    layoutId="activeFeatureDot"
                    className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
              </button>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
