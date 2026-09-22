export default function LocationNeighborhoodSection() {
  return (
    <section className="w-full bg-[#ffffff] py-20 border-b border-[#e5e5df]">
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
        
        {/* Header */}
        <div className="mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1b4d4b] font-sans">
            LOCALITY & CONNECTIVITY
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#0f1722] tracking-tight font-sans mt-1">
            Location & Neighborhood Intelligence
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Map Frame Placeholder */}
          <div className="lg:col-span-7 bg-[#0f1722] rounded-[4px] border border-[#e5e5df] overflow-hidden min-h-[380px] relative flex items-center justify-center shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200&auto=format&fit=crop" 
              alt="Neighborhood location map view"
              className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
            />
            {/* Map Pin Anchor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="px-4 py-2 bg-[#1b4d4b] text-white font-sans text-xs font-semibold rounded-[4px] shadow-2xl border border-white/20 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e28468] animate-ping" />
                28400 Pacific Coast Hwy, Malibu
              </div>
              <div className="w-0.5 h-6 bg-[#1b4d4b]" />
            </div>
          </div>

          {/* Metrics & POI Sidebar */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            
            {/* Neighborhood Index Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] p-4 text-center">
                <span className="text-2xl font-bold text-[#1b4d4b] font-sans">88 / 100</span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans mt-1">Walk Score</p>
              </div>
              <div className="bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] p-4 text-center">
                <span className="text-2xl font-bold text-[#1b4d4b] font-sans">92 / 100</span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans mt-1">Transit Index</p>
              </div>
              <div className="bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] p-4 text-center">
                <span className="text-2xl font-bold text-[#1b4d4b] font-sans">9.8 / 10</span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans mt-1">School Rating</p>
              </div>
            </div>

            {/* Nearby Highlights */}
            <div className="bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f1722] font-sans border-b border-[#e5e5df] pb-3">
                Points of Interest Nearby
              </h3>

              <ul className="space-y-3 font-sans text-xs text-gray-700">
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#e28468] text-[18px]">restaurant</span>
                    Nobu Malibu & Dining Precinct
                  </span>
                  <span className="font-semibold text-gray-500">1.2 miles • 4 mins</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#e28468] text-[18px]">directions_boat</span>
                    Malibu Pier & Private Yacht Basin
                  </span>
                  <span className="font-semibold text-gray-500">2.5 miles • 6 mins</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#e28468] text-[18px]">school</span>
                    Pepperdine University & Academy
                  </span>
                  <span className="font-semibold text-gray-500">3.8 miles • 8 mins</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#e28468] text-[18px]">flight</span>
                    Los Angeles International (LAX)
                  </span>
                  <span className="font-semibold text-gray-500">24 miles • 35 mins</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
