export default function AgentBrokerSection() {
  return (
    <section className="w-full bg-[#f9f9f7] py-20 border-b border-[#e5e5df]">
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
        
        {/* Header */}
        <div className="mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1b4d4b] font-sans">
            EXCLUSIVE REPRESENTATION
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#0f1722] tracking-tight font-sans mt-1">
            Listing Advisory & Brokerage Profile
          </h2>
        </div>

        <div className="bg-[#ffffff] rounded-[4px] border border-[#e5e5df] p-8 md:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Agent Portrait */}
            <div className="lg:col-span-4 flex flex-col items-center text-center">
              <div className="w-44 h-44 rounded-full overflow-hidden border-2 border-[#1b4d4b] p-1 mb-4 shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80"
                  alt="Alexander Sterling"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <h3 className="text-2xl font-semibold text-[#0f1722] font-sans">Alexander Sterling</h3>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#e28468] font-sans mt-1">
                Founding Partner & Managing Broker
              </p>
              <p className="text-xs text-gray-500 font-sans mt-0.5">DRE License #01948201</p>
            </div>

            {/* Credentials & Details */}
            <div className="lg:col-span-8 space-y-6">
              <p className="text-gray-600 font-sans text-sm md:text-base leading-relaxed">
                With over 18 years specializing in luxury architectural estates and private off-market placements across Southern California, Alexander leads CP_kerby's private client advisory team with unmatched market discretion and architectural expertise.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-y border-[#e5e5df] py-4">
                <div>
                  <span className="text-2xl font-bold text-[#1b4d4b] font-sans block">$1.4B+</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans">Career Sales Volume</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[#1b4d4b] font-sans block">18+ Yrs</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans">Ultra-Prime Experience</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[#1b4d4b] font-sans block">99.4%</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans">List-to-Sale Ratio</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="tel:+13105550192"
                  className="h-[54px] px-6 bg-[#1b4d4b] hover:bg-[#123635] text-white font-sans font-semibold text-xs tracking-wider uppercase rounded-[4px] transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  Direct: +1 (310) 555-0192
                </a>
                <a
                  href="mailto:sterling@cpkerby.com"
                  className="h-[54px] px-6 bg-[#f9f9f7] hover:bg-[#eeeeec] text-[#0f1722] border border-[#e5e5df] font-sans font-semibold text-xs tracking-wider uppercase rounded-[4px] transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  sterling@cpkerby.com
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
