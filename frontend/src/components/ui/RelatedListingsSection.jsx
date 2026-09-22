const RELATED_PROPERTIES = [
  {
    id: 1,
    title: "Villa Solarium",
    location: "Kyoto Foothills, Japan",
    price: "$18,200,000",
    specs: "4 Beds • 5 Baths • 6,200 Sq Ft",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "The Brutalist Penthouse",
    location: "Tribeca, New York",
    price: "$31,000,000",
    specs: "4 Beds • 5.5 Baths • 7,100 Sq Ft",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Minimalist Cliffside Sanctuary",
    location: "Carmel Highlands, CA",
    price: "$16,500,000",
    specs: "4 Beds • 4.5 Baths • 5,400 Sq Ft",
    image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=800&auto=format&fit=crop"
  }
];

export default function RelatedListingsSection({ onViewProperty }) {
  return (
    <section className="w-full bg-[#f9f9f7] py-20 border-b border-[#e5e5df]">
      <div className="w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1b4d4b] font-sans">
              CURATED ALTERNATIVES
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold text-[#0f1722] tracking-tight font-sans mt-1">
              Similar Architectural Residences
            </h2>
          </div>
          <button
            onClick={() => onViewProperty && onViewProperty(null)}
            className="mt-4 md:mt-0 text-xs font-bold uppercase tracking-wider text-[#1b4d4b] hover:text-[#123635] font-sans flex items-center gap-1 group"
          >
            Browse Full Portfolio
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>

        {/* 3 Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {RELATED_PROPERTIES.map((prop) => (
            <div
              key={prop.id}
              onClick={() => onViewProperty && onViewProperty(prop.id)}
              className="group bg-[#ffffff] rounded-[4px] border border-[#e5e5df] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[16/10] w-full overflow-hidden relative bg-[#0f1722]">
                  <img
                    src={prop.image}
                    alt={prop.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-4 right-4 bg-[#0f1722]/80 backdrop-blur-md px-3 py-1 text-white font-sans text-xs font-semibold rounded-[4px]">
                    {prop.price}
                  </div>
                </div>

                <div className="p-6 space-y-2">
                  <h3 className="text-xl font-semibold text-[#0f1722] font-sans group-hover:text-[#1b4d4b] transition-colors">
                    {prop.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-sans flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#e28468]">location_on</span>
                    {prop.location}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 border-t border-[#e5e5df]/60 flex items-center justify-between text-xs font-medium text-gray-600 font-sans">
                <span>{prop.specs}</span>
                <span className="text-[#1b4d4b] font-bold group-hover:translate-x-1 transition-transform">
                  View →
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
