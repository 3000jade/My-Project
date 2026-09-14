import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    id: 1,
    quote: "The market intelligence provided allowed us to identify an emerging pocket in Mayfair six months before the market spiked. Truly transformative service.",
    name: "Sir Jonathan H.",
    role: "Venture Capitalist",
    verified: "Off-Market Acquisition, 2026"
  },
  {
    id: 2,
    quote: "Discretion is my highest priority. The Private Office handled our estate disposition with absolute secrecy and surgical precision. Exceptional execution.",
    name: "Anonymous Client",
    role: "Technology Founder",
    verified: "Estate Disposition, 2025"
  },
  {
    id: 3,
    quote: "Their algorithmic approach to pricing is unmatched. We yielded 14% above market baseline because they understood exactly how to position the architecture.",
    name: "Eleanor V.",
    role: "Private Equity Managing Director",
    verified: "Portfolio Advisory, 2026"
  }
];

export default function TestimonialCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="w-full bg-[#F9F9F8] py-32 overflow-hidden border-y border-gray-100">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 mb-16 text-center">
        <span className="inline-block px-3 py-1 bg-[#174849]/10 text-[#174849] rounded-full text-[10px] font-bold font-sans uppercase tracking-[0.2em] mb-4 border border-[#174849]/20">Client Success</span>
        <h2 className="text-4xl md:text-5xl font-display font-extrabold text-[#174849] tracking-tight">The Executive Standard</h2>
      </div>

      <div className="w-full max-w-6xl mx-auto relative px-12 md:px-24">
        <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {TESTIMONIALS.map((testimonial, idx) => (
              <div 
                key={testimonial.id} 
                className="flex-[0_0_100%] min-w-0 transition-opacity duration-500"
                style={{ opacity: selectedIndex === idx ? 1 : 0.3 }}
              >
                <div className="max-w-3xl mx-auto text-center px-4">
                  <span className="material-symbols-outlined text-6xl text-[#FB8E5D]/30 block mb-6">format_quote</span>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-display text-[#174849] leading-snug mb-10 tracking-tight">
                    "{testimonial.quote}"
                  </p>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-[#174849] px-3 py-1 rounded-full mb-4 flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined text-[12px] text-[#FB8E5D]">verified</span>
                      {testimonial.verified}
                    </span>
                    <h4 className="text-lg font-bold font-sans text-[#174849]">{testimonial.name}</h4>
                    <span className="text-sm text-gray-500 font-sans">{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Controls */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none px-4 md:px-8">
          <button 
            onClick={scrollPrev}
            className="w-12 h-12 rounded-full bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-center text-[#174849] hover:bg-[#174849] hover:text-white transition-all pointer-events-auto"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button 
            onClick={scrollNext}
            className="w-12 h-12 rounded-full bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-center text-[#174849] hover:bg-[#174849] hover:text-white transition-all pointer-events-auto"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  );
}
