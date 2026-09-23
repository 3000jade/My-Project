export default function KeySpecsBar({ specs }) {
  const defaultSpecs = [
    { label: "BEDROOMS", value: "5 Beds", icon: "bed" },
    { label: "BATHROOMS", value: "6.5 Baths", icon: "bathtub" },
    { label: "LIVING AREA", value: "8,400 Sq Ft", icon: "square_foot" },
    { label: "PROPERTY TYPE", value: "Architectural Villa", icon: "domain" },
    { label: "LOT SIZE", value: "1.85 Acres", icon: "landscape" },
    { label: "YEAR BUILT", value: "2024", icon: "event" }
  ];

  const items = specs || defaultSpecs;

  return (
    <section className="w-full bg-[#ffffff] border-b border-[#e5e5df] shadow-sm py-6">
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-0 divide-y md:divide-y-0 lg:divide-x divide-[#e5e5df]">
          {items.map((item, idx) => (
            <div 
              key={idx} 
              className={`flex items-center gap-4 ${idx !== 0 ? 'lg:pl-6' : ''} ${idx > 0 ? 'pt-4 md:pt-0' : ''}`}
            >
              <div className="w-10 h-10 rounded-[4px] bg-[#1b4d4b]/5 text-[#1b4d4b] flex items-center justify-center flex-shrink-0 border border-[#1b4d4b]/10">
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500 font-sans">
                  {item.label}
                </span>
                <span className="text-sm md:text-base font-semibold text-[#0f1722] font-sans">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
