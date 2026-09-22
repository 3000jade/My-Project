const AMENITY_CATEGORIES = [
  {
    category: "INTERIOR FINISHES",
    icon: "countertops",
    items: [
      "Custom Italian Black Walnut Millwork",
      "Hand-Honed Italian Travertine Flooring",
      "800-Bottle Climate-Controlled Wine Vault",
      "Motorized Pocketing Glass Walls (18ft)",
      "Floating Architectural Staircase",
      "Acoustic Theater Room with Dolby Atmos"
    ]
  },
  {
    category: "APPLIANCES & UTILITIES",
    icon: "smart_toy",
    items: [
      "Gaggenau 400-Series Culinary Appliance Suite",
      "Sub-Zero Integrated Dual Refrigeration",
      "Crestron Smart Home Automation & Lighting",
      "Multi-Zone Radiant Heated Flooring",
      "Solar Array with Dual Tesla Powerwalls",
      "Commercial Grade Water Filtration System"
    ]
  },
  {
    category: "EXTERIOR & GROUNDS",
    icon: "pool",
    items: [
      "60ft Heated Infinity Edge Lap Pool & Spa",
      "Outdoor Culinary Kitchen & Teak Decking",
      "Private Citrus Grove & Landscaped Gardens",
      "3-Car Heated Garage with EV Fast Chargers",
      "Perimeter Security Gates & HD Surveillance",
      "Fire Pit Lounge overlooking Ocean Vistas"
    ]
  },
  {
    category: "COMMUNITY & ENCLAVE PERKS",
    icon: "shield_person",
    items: [
      "24/7 Guard-Gated Private Access",
      "Exclusive Beach Club & Marina Membership",
      "Private Helicopter Landing Access Nearby",
      "Dedicated Enclave Security Patrol",
      "Private Walking Trails & Nature Preserve"
    ]
  }
];

export default function FeaturesAmenitiesSection() {
  return (
    <section className="w-full bg-[#f9f9f7] py-20 border-b border-[#e5e5df]">
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
        
        {/* Header */}
        <div className="mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1b4d4b] font-sans">
            SPECIFICATIONS & COMFORT
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#0f1722] tracking-tight font-sans mt-1">
            Features & World-Class Amenities
          </h2>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {AMENITY_CATEGORIES.map((cat, idx) => (
            <div 
              key={idx} 
              className="bg-[#ffffff] rounded-[4px] border border-[#e5e5df] p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 border-b border-[#e5e5df] pb-4 mb-4">
                  <div className="w-9 h-9 rounded-[4px] bg-[#1b4d4b]/10 text-[#1b4d4b] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f1722] font-sans">
                    {cat.category}
                  </h3>
                </div>

                <ul className="space-y-3">
                  {cat.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-2.5 text-xs text-gray-700 font-sans leading-relaxed">
                      <span className="material-symbols-outlined text-[16px] text-[#e28468] flex-shrink-0 mt-0.5">
                        check_circle
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
