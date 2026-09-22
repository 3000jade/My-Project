export default function BrandHeritageSection() {
  const highlights = [
    {
      title: "35+ Years of Heritage",
      description:
        "A proven track record of dependability, connecting buyers with trusted property developers across Mega Manila, Central Luzon, and Southern Tagalog.",
      icon: "verified",
      badge: "EST. 1989"
    },
    {
      title: "Tailored for Every Filipino Family",
      description:
        "From starter family homes to prime investment properties, we match you with spaces that fit your lifestyle and financial goals.",
      icon: "family_restroom",
      badge: "NATIONWIDE"
    },
    {
      title: "Guided Step-by-Step",
      description:
        "Transparent transactions, complete documentation assistance, and dedicated support from viewing to handover.",
      icon: "handshake",
      badge: "END-TO-END"
    }
  ];

  return (
    <section className="w-full bg-[#f9f9f7] py-20 border-b border-[#e5e5df]">
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1b4d4b]/10 text-[#1b4d4b] rounded-full text-[10px] font-bold uppercase tracking-[0.1em] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e28468]"></span>
            CORE COMMITMENTS
          </div>

          <h2 className="text-3xl md:text-4xl font-semibold text-[#0f1722] tracking-[-0.025em] font-sans">
            The Principles Behind Our 35-Year Legacy
          </h2>

          <p className="text-base text-gray-600 font-sans mt-2">
            Built on a heritage of trust, transparent documentation, and personal advisory for Filipino homebuyers and investors.
          </p>
        </div>

        {/* 3-Column Key Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#ffffff] rounded-[4px] border border-[#e5e5df] p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-[4px] bg-[#1b4d4b]/10 text-[#1b4d4b] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#e28468] bg-[#e28468]/10 px-2.5 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-[#0f1722] font-sans mb-3">
                  {item.title}
                </h3>

                <p className="text-sm text-gray-600 font-sans leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#e5e5df]/60 flex items-center text-xs font-semibold text-[#1b4d4b] uppercase tracking-wider">
                <span>Certified Standard</span>
                <span className="material-symbols-outlined text-[16px] ml-1">check</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
