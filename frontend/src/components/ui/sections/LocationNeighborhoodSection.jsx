import { motion } from 'framer-motion';

export default function LocationNeighborhoodSection() {
  return (
    <section 
      id="our-location" 
      className="w-full bg-[#FFFFFF] py-16 md:py-24 border-b border-[#D8DFDF] relative z-20 font-sans text-[#141717]"
    >
      <div className="w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16">
        
        {/* Header (Clearly labeled Our Location) */}
        <div className="mb-10 md:mb-14">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-6 h-[2px] bg-[#0D4446]" />
            <span className="text-xs font-bold tracking-[0.25em] text-[#0D4446] uppercase">
              Locality &amp; Connectivity · Our Location
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#141717] tracking-tight leading-tight">
            Location &amp; Neighborhood Intelligence
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#5C6768] font-normal leading-relaxed max-w-2xl">
            Strategic geographic connectivity situated within Metro Manila's premier commercial and diplomatic corridors, ensuring rapid access to financial centers, international schools, and lifestyle precincts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Map Frame (Rounded 5px container matching benchmark cards) */}
          <div className="lg:col-span-7 bg-[#0f1722] rounded-[8px] border border-[#D8DFDF] overflow-hidden min-h-[400px] relative flex items-center justify-center shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1400&auto=format&fit=crop" 
              alt="Metro Manila geographic location satellite grid"
              className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
              loading="lazy"
            />
            {/* Map Pin Anchor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="px-4 py-2.5 bg-[#0D4446] text-white font-sans text-xs font-semibold rounded-[6px] shadow-2xl border border-white/20 flex items-center gap-2.5 backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E76F51] animate-ping" />
                <span>5th Ave &amp; 26th St, Bonifacio Global City, Metro Manila</span>
              </div>
              <div className="w-0.5 h-6 bg-[#0D4446]" />
            </div>
          </div>

          {/* Metrics & POI Sidebar */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            
            {/* Neighborhood Index Cards (Rounded 5px) */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="bg-[#FBFBF9] rounded-[8px] border border-[#D8DFDF] p-4 text-center">
                <span className="text-xl sm:text-2xl font-extrabold text-[#0D4446] font-sans">94 / 100</span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5C6768] font-sans mt-1">Walk Score</p>
              </div>
              <div className="bg-[#FBFBF9] rounded-[8px] border border-[#D8DFDF] p-4 text-center">
                <span className="text-xl sm:text-2xl font-extrabold text-[#0D4446] font-sans">92 / 100</span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5C6768] font-sans mt-1">Transit Index</p>
              </div>
              <div className="bg-[#FBFBF9] rounded-[8px] border border-[#D8DFDF] p-4 text-center">
                <span className="text-xl sm:text-2xl font-extrabold text-[#0D4446] font-sans">9.9 / 10</span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5C6768] font-sans mt-1">Security Score</p>
              </div>
            </div>

            {/* Nearby Highlights (Rounded 5px) */}
            <div className="bg-[#FBFBF9] rounded-[8px] border border-[#D8DFDF] p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#141717] font-sans border-b border-[#D8DFDF] pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#0D4446]">
                  near_me
                </span>
                <span>Points of Interest Nearby</span>
              </h3>

              <ul className="space-y-3.5 font-sans text-xs text-[#5C6768]">
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#E76F51] text-[18px]">shopping_bag</span>
                    <span>Bonifacio High Street &amp; Central Square</span>
                  </span>
                  <span className="font-semibold text-[#5C6768]">0.4 km • 3 mins</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#E76F51] text-[18px]">sports_golf</span>
                    <span>Manila Polo Club &amp; Manila Golf</span>
                  </span>
                  <span className="font-semibold text-[#5C6768]">1.2 km • 5 mins</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#E76F51] text-[18px]">school</span>
                    <span>British School Manila &amp; ISM Campus</span>
                  </span>
                  <span className="font-semibold text-[#5C6768]">1.8 km • 6 mins</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#E76F51] text-[18px]">flight</span>
                    <span>Ninoy Aquino Intl. Airport (NAIA T3)</span>
                  </span>
                  <span className="font-semibold text-[#5C6768]">7.5 km • 18 mins</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
