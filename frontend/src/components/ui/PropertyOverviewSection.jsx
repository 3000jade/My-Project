export default function PropertyOverviewSection() {
  return (
    <section className="w-full bg-[#ffffff] py-20 border-b border-[#e5e5df]">
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Narrative Description */}
          <div className="lg:col-span-8 space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1b4d4b] font-sans">
              ARCHITECTURAL DOSSIER
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold text-[#0f1722] tracking-tight font-sans">
              Property Overview & Design Philosophy
            </h2>

            <div className="prose prose-lg text-gray-700 font-sans leading-relaxed space-y-4 pt-2">
              <p className="text-lg md:text-xl font-medium text-[#0f1722] leading-snug">
                Conceived as a dialogue between raw organic stone and floor-to-ceiling glass, this landmark residence synthesizes modern structural precision with serene indoor-outdoor tranquility.
              </p>
              <p className="text-base text-gray-600">
                Framed by mature coastal flora, the estate centers around a double-height Great Room featuring 18-foot motorized glass curtain walls that slide seamlessly into hidden wall pockets. Hand-honed travertine floors extend continuously from the interior gallery onto an expansive teak terrace and cantilevered infinity pool overlooking sweeping panoramic ocean horizons.
              </p>
              <p className="text-base text-gray-600">
                Designed for epicurean entertaining and quiet contemplative retreat, the culinary wing features custom black walnut millwork, dual marble waterfall islands, integrated Gaggenau appliances, and a climate-controlled glass wine vault capable of housing 800 bottles.
              </p>
            </div>
          </div>

          {/* Right Column: Architectural Highlights Sidebar */}
          <div className="lg:col-span-4 bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] p-8 space-y-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#0f1722] font-sans border-b border-[#e5e5df] pb-4">
              Architectural Attributes
            </h3>

            <div className="space-y-4 text-sm font-sans">
              <div className="flex justify-between items-center py-1 border-b border-[#e5e5df]/60">
                <span className="text-gray-500 font-medium">Architect / Firm</span>
                <span className="font-semibold text-[#0f1722]">Studio Olson Kundig</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e5e5df]/60">
                <span className="text-gray-500 font-medium">Design Movement</span>
                <span className="font-semibold text-[#0f1722]">Organic Modernism</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e5e5df]/60">
                <span className="text-gray-500 font-medium">Primary Materials</span>
                <span className="font-semibold text-[#0f1722]">Travertine, Teak, Steel</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e5e5df]/60">
                <span className="text-gray-500 font-medium">Ceiling Height</span>
                <span className="font-semibold text-[#0f1722]">14ft – 18ft Vaulted</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e5e5df]/60">
                <span className="text-gray-500 font-medium">MLS / Listing ID</span>
                <span className="font-semibold text-[#0f1722]">#ML-8492041</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 font-medium">Zoning Designation</span>
                <span className="font-semibold text-[#0f1722]">R1 Luxury Residential</span>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => alert("Requesting Private Dossier...")}
                className="w-full h-[54px] bg-[#1b4d4b] hover:bg-[#123635] text-white font-sans font-semibold text-xs tracking-wider uppercase rounded-[4px] transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">article</span>
                Request Full Fact Sheet PDF
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
