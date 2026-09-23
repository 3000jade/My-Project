import { useState } from 'react';

const REVIEWS = [
  {
    id: 1,
    quote: "CP_kerby's access to off-market architectural sanctuaries is unmatched. Alexander secured our family's Malibu estate with total discretion and speed.",
    author: "David & Victoria L.",
    role: "Private Art Collectors & Tech Founders",
    location: "Malibu, CA"
  },
  {
    id: 2,
    quote: "The architectural fidelity and depth of information provided made our international acquisition effortless. Truly world-class advisory.",
    author: "Dr. Jonathan Hayes",
    role: "Architectural Patron & Surgeon",
    location: "London & Kyoto"
  },
  {
    id: 3,
    quote: "From floor plan precision to private walkthrough coordination, every detail reflected quiet luxury and computational rigor.",
    author: "Elena Rostova",
    role: "Private Equity Managing Director",
    location: "New York, NY"
  }
];

export default function SocialProofSection() {
  const [activeReview, setActiveReview] = useState(0);

  return (
    <section className="w-full bg-[#ffffff] py-20 border-b border-[#e5e5df]">
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1b4d4b] font-sans">
            TRUST & REPUTATION
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#0f1722] tracking-tight font-sans mt-1">
            Endorsed by Discerning Patrons
          </h2>
        </div>

        {/* Testimonial Quote Box */}
        <div className="max-w-4xl mx-auto bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] p-8 md:p-14 text-center shadow-sm relative">
          <span className="material-symbols-outlined text-5xl text-[#1b4d4b]/20 mb-4 block">format_quote</span>
          
          <p className="text-lg md:text-2xl text-[#0f1722] font-sans font-medium leading-relaxed italic mb-8">
            "{REVIEWS[activeReview].quote}"
          </p>

          <div className="space-y-1">
            <h4 className="text-base font-semibold text-[#0f1722] font-sans">{REVIEWS[activeReview].author}</h4>
            <p className="text-xs text-[#e28468] font-bold uppercase tracking-wider font-sans">
              {REVIEWS[activeReview].role} • {REVIEWS[activeReview].location}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {REVIEWS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveReview(idx)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  idx === activeReview ? 'bg-[#1b4d4b]' : 'bg-[#e5e5df]'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
