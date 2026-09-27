import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockProperties } from '../../../mockProperties';

export default function PropertyListingView() {
  const { id } = useParams();
  const propertyId = id ? parseInt(id, 10) : 1;
  const property = mockProperties.find(p => p.id === propertyId) || mockProperties[0];
  
  const [activePhoto, setActivePhoto] = useState(null);

  // Hardcoded Data from Wireframe
  const propertyTitle = property.title || "Modern Duplex in Rolling Hills";
  const propertyLocation = "Rolling Hills Subdivision, New Manila, Quezon City";
  const propertyPrice = "PHP 28,500,000";
  const propertyPricePerSqm = "~PHP 83,820/sqm";

  return (
    <div className="min-h-screen bg-[#FBFBF9] font-sans text-[#141717] pb-24">
      {/* 1. HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#D8DFDF] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[80px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-display font-bold text-xl text-[#0D4446] flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">real_estate_agent</span>
              RealEstate Hub
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#5C6768]">
              <Link to="/properties" className="text-[#0D4446]">Buy</Link>
              <Link to="/rent" className="hover:text-[#0D4446]">Rent</Link>
              <Link to="/commercial" className="hover:text-[#0D4446]">Commercial</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <button className="flex items-center gap-2 text-[#5C6768] hover:text-[#E76F51]">
              <span className="material-symbols-outlined text-[20px]">favorite</span>
              Saved
            </button>
            <button className="flex items-center gap-2 text-[#5C6768] hover:text-[#0D4446]">
              <span className="material-symbols-outlined text-[20px]">person</span>
              Log In
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* BREADCRUMBS */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-[#5C6768]">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/properties">Properties for Sale</Link>
          <span>/</span>
          <Link to="/properties?city=Quezon+City">Quezon City</Link>
          <span>/</span>
          <span className="text-[#0D4446] truncate max-w-[200px]">{propertyTitle}</span>
        </nav>

        {/* 2. PHOTOS SECTION (Asymmetrical 1 + 3) */}
        <div className="relative rounded-3xl overflow-hidden bg-white shadow-sm border border-[#D8DFDF]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-[480px] lg:h-[560px]">
            {/* Main Hero Photo (8 Cols) */}
            <div className="lg:col-span-8 relative h-full group cursor-pointer" onClick={() => setActivePhoto(0)}>
              <img 
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200" 
                alt="Main View" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 bg-black/60 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg backdrop-blur-md">
                Main View
              </div>
            </div>

            {/* Right Stack (4 Cols) */}
            <div className="hidden lg:grid col-span-4 grid-rows-3 gap-2 h-full">
              <div className="relative h-full overflow-hidden group cursor-pointer">
                <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=600" alt="Living Room" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="relative h-full overflow-hidden group cursor-pointer">
                <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600" alt="Primary Bedroom" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              {/* Floor Plan Block */}
              <div className="relative h-full overflow-hidden group cursor-pointer bg-[#070D0E] flex items-center justify-center border border-[#D8DFDF]/20">
                <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600')] bg-cover bg-center grayscale group-hover:scale-105 transition-transform duration-700"></div>
                <div className="relative z-10 flex flex-col items-center justify-center text-[#F4F7F7]">
                  <span className="material-symbols-outlined text-3xl text-[#14B8A6] mb-1">view_in_ar</span>
                  <span className="text-sm font-bold tracking-wide">Floor Plans & 3D Tour</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Action Strip */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex gap-2">
              <button className="px-4 py-2.5 bg-white/95 backdrop-blur-md text-[#0D4446] font-bold text-xs rounded-xl shadow-lg border border-[#D8DFDF] flex items-center gap-2 hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[18px]">photo_library</span> 24 Photos
              </button>
              <button className="px-4 py-2.5 bg-white/95 backdrop-blur-md text-[#0D4446] font-bold text-xs rounded-xl shadow-lg border border-[#D8DFDF] flex items-center gap-2 hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[18px]">360</span> 360° Virtual Tour
              </button>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2.5 bg-white/95 backdrop-blur-md text-[#5C6768] font-bold text-xs rounded-xl shadow-lg border border-[#D8DFDF] flex items-center gap-2 hover:text-[#0D4446] transition-colors">
                <span className="material-symbols-outlined text-[18px]">share</span> Share
              </button>
              <button className="px-4 py-2.5 bg-white/95 backdrop-blur-md text-[#5C6768] font-bold text-xs rounded-xl shadow-lg border border-[#D8DFDF] flex items-center gap-2 hover:text-[#E76F51] transition-colors">
                <span className="material-symbols-outlined text-[18px]">favorite</span> Save
              </button>
            </div>
          </div>
        </div>

        {/* 3. OVERVIEW SECTION */}
        <section className="bg-white rounded-3xl p-8 shadow-[0_16px_36px_rgba(13,68,70,0.06)] border border-[#D8DFDF]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#E76F51] text-2xl">location_on</span>
              <h1 className="text-2xl font-display font-bold text-[#141717]">{propertyLocation}</h1>
            </div>
            
            <div className="flex gap-3">
              <span className="bg-[#14B8A6]/10 text-[#0D9488] px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-[#14B8A6]/20">
                <span className="material-symbols-outlined text-[16px]">verified</span> Verified Listing
              </span>
              <span className="bg-[#E76F51]/10 text-[#D65C3E] px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-[#E76F51]/20">
                <span className="material-symbols-outlined text-[16px]">key</span> Ready for Occupancy
              </span>
            </div>

            <div className="h-px w-full bg-[#D8DFDF] my-2"></div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-2">
              <div>
                <p className="font-display font-bold text-3xl text-[#0D4446]">{propertyPrice}</p>
                <p className="text-xs text-[#5C6768] font-semibold mt-1">{propertyPricePerSqm}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-[#0D4446]">bed</span>
                <div>
                  <p className="font-display font-bold text-xl text-[#141717]">4 Beds | 5 Baths</p>
                  <p className="text-xs text-[#5C6768] font-semibold mt-0.5">+ Maid's Room</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-[#0D4446]">square_foot</span>
                <div>
                  <p className="font-display font-bold text-xl text-[#141717]">340 sqm Floor</p>
                  <p className="text-xs text-[#5C6768] font-semibold mt-0.5">185 sqm Lot</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-[#0D4446]">directions_car</span>
                <div>
                  <p className="font-display font-bold text-xl text-[#141717]">2 Garage Slots</p>
                  <p className="text-xs text-[#5C6768] font-semibold mt-0.5">Covered Parking</p>
                </div>
              </div>
            </div>

            <p className="text-[#5C6768] text-base leading-relaxed mt-4">
              Brand-new modern duplex featuring high ceilings, open-concept living and dining spaces, and a private rooftop terrace. Includes a clean kitchen with built-in storage, dedicated utility quarters, and spacious en-suite bedrooms throughout.
            </p>
          </div>
        </section>

        {/* 4. MAIN BODY (2-COLUMN SPLIT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN (65%) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* PROPERTY DETAILS */}
            <div className="bg-white rounded-[20px] p-8 shadow-sm border border-[#D8DFDF]">
              <h2 className="font-display text-xl font-bold text-[#141717] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0D4446]">info</span>
                PROPERTY DETAILS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div className="flex justify-between border-b border-[#D8DFDF] pb-2">
                  <span className="text-[#5C6768] font-semibold">Property Type</span>
                  <span className="font-bold text-[#141717]">Duplex / Townhouse</span>
                </div>
                <div className="flex justify-between border-b border-[#D8DFDF] pb-2">
                  <span className="text-[#5C6768] font-semibold">Year Built</span>
                  <span className="font-bold text-[#141717]">2024</span>
                </div>
                <div className="flex justify-between border-b border-[#D8DFDF] pb-2">
                  <span className="text-[#5C6768] font-semibold">Furnishing</span>
                  <span className="font-bold text-[#141717]">Semi-Furnished</span>
                </div>
                <div className="flex justify-between border-b border-[#D8DFDF] pb-2">
                  <span className="text-[#5C6768] font-semibold">Orientation</span>
                  <span className="font-bold text-[#141717]">East Facing</span>
                </div>
                <div className="flex justify-between border-b border-[#D8DFDF] pb-2">
                  <span className="text-[#5C6768] font-semibold">HOA Dues</span>
                  <span className="font-bold text-[#141717]">PHP 2,500 / month</span>
                </div>
                <div className="flex justify-between border-b border-[#D8DFDF] pb-2">
                  <span className="text-[#5C6768] font-semibold">Status</span>
                  <span className="font-bold text-[#0D9488]">Active</span>
                </div>
              </div>
            </div>

            {/* FLOOR PLANS */}
            <div className="bg-white rounded-[20px] p-8 shadow-sm border border-[#D8DFDF]">
              <h2 className="font-display text-xl font-bold text-[#141717] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0D4446]">architecture</span>
                FLOOR PLANS
              </h2>
              <div className="flex gap-4 mb-6">
                <button className="px-5 py-2.5 bg-[#0D4446] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">Ground Floor</button>
                <button className="px-5 py-2.5 bg-[#F4F5F4] text-[#5C6768] hover:text-[#0D4446] text-xs font-bold uppercase tracking-wider rounded-lg border border-[#D8DFDF]">Second Floor</button>
                <button className="px-5 py-2.5 bg-[#F4F5F4] text-[#5C6768] hover:text-[#0D4446] text-xs font-bold uppercase tracking-wider rounded-lg border border-[#D8DFDF]">Third Floor</button>
              </div>
              <ul className="text-sm text-[#141717] font-semibold space-y-3 mb-6">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E76F51]"></span> 2-Car Garage with automated gate</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E76F51]"></span> Open-layout Living & Dining Area</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E76F51]"></span> Main Kitchen with Island Counter</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E76F51]"></span> Maid's Room with T&B</li>
              </ul>
              <div className="h-64 bg-[#F4F5F4] rounded-xl border border-[#D8DFDF] flex items-center justify-center overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800" alt="Floor plan preview" className="w-full h-full object-cover opacity-30 grayscale" />
                <button className="absolute px-6 py-3 bg-[#0D4446] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg flex items-center gap-2 hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span> View High-Res Blueprint
                </button>
              </div>
            </div>

            {/* LOCATION */}
            <div className="bg-white rounded-[20px] p-8 shadow-sm border border-[#D8DFDF]">
              <h2 className="font-display text-xl font-bold text-[#141717] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0D4446]">map</span>
                LOCATION
              </h2>
              <div className="h-48 bg-[#E5EBEB] rounded-xl mb-6 flex items-center justify-center">
                <span className="text-[#5C6768] font-bold text-sm uppercase tracking-widest">[ Map Preview Placeholder ]</span>
              </div>
              <h3 className="text-sm font-bold text-[#141717] mb-3 uppercase tracking-wider">Nearby Landmarks</h3>
              <ul className="text-sm text-[#5C6768] space-y-2">
                <li className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#E76F51]">school</span> Ateneo de Manila University</span> <span className="font-semibold text-[#141717]">3.5 km</span></li>
                <li className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#E76F51]">local_hospital</span> St. Luke's Medical Center</span> <span className="font-semibold text-[#141717]">2.1 km</span></li>
                <li className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#E76F51]">shopping_mall</span> Robinsons Magnolia</span> <span className="font-semibold text-[#141717]">1.8 km</span></li>
              </ul>
            </div>

            {/* PROPERTY RECORDS & DUE DILIGENCE */}
            <div className="bg-white rounded-[20px] p-8 shadow-sm border border-[#D8DFDF]">
              <h2 className="font-display text-xl font-bold text-[#141717] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0D4446]">verified_user</span>
                PROPERTY RECORDS & DUE DILIGENCE
              </h2>
              <ul className="text-sm space-y-4">
                <li className="flex justify-between border-b border-[#D8DFDF] pb-3">
                  <span className="font-semibold text-[#5C6768] flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">description</span> Title Status</span>
                  <span className="font-bold text-[#141717]">Clean Transfer Certificate (TCT)</span>
                </li>
                <li className="flex justify-between border-b border-[#D8DFDF] pb-3">
                  <span className="font-semibold text-[#5C6768] flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">gavel</span> Encumbrances</span>
                  <span className="font-bold text-[#0D9488]">None / Cleared</span>
                </li>
                <li className="flex justify-between border-b border-[#D8DFDF] pb-3">
                  <span className="font-semibold text-[#5C6768] flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">receipt_long</span> Property Taxes</span>
                  <span className="font-bold text-[#141717]">Updated for 2024</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span className="font-semibold text-[#5C6768] flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">water_drop</span> Flood Risk</span>
                  <span className="font-bold text-[#0D9488]">Low / Zero Recorded History</span>
                </li>
              </ul>
            </div>

          </div>

          {/* RIGHT COLUMN (35%) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-[100px]">
            
            {/* SCHEDULE A TOUR */}
            <div className="bg-white rounded-[20px] p-6 shadow-[0_16px_36px_rgba(13,68,70,0.06)] border border-[#D8DFDF]">
              <h3 className="font-display text-lg font-bold text-[#141717] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0D4446]">calendar_month</span> SCHEDULE A TOUR
              </h3>
              <div className="flex gap-2 mb-4 p-1 bg-[#F4F5F4] rounded-lg border border-[#D8DFDF]">
                <button className="flex-1 py-2 bg-white text-[#0D4446] font-bold text-xs rounded-md shadow-sm border border-[#D8DFDF]">In-Person</button>
                <button className="flex-1 py-2 text-[#5C6768] hover:text-[#0D4446] font-bold text-xs rounded-md transition-colors">Video Chat</button>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#5C6768] mb-2 uppercase tracking-wider">Select Date</p>
                <div className="flex justify-between">
                  {['Thu 14', 'Fri 15', 'Sat 16', 'Sun 17'].map((date, i) => (
                    <button key={i} className={`flex flex-col items-center justify-center w-[60px] h-[70px] rounded-xl border ${i===1 ? 'border-[#0D4446] bg-[#0D4446]/5 text-[#0D4446]' : 'border-[#D8DFDF] text-[#5C6768] hover:border-[#0D4446]'} transition-colors`}>
                      <span className="text-xs font-bold">{date.split(' ')[0]}</span>
                      <span className="text-lg font-display font-bold">{date.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button className="w-full py-3.5 bg-[#E76F51] hover:bg-[#D65C3E] text-white font-bold text-sm rounded-xl uppercase tracking-wider transition-colors shadow-md">
                Request This Time
              </button>
            </div>

            {/* CONTACT AGENT */}
            <div className="bg-white rounded-[20px] p-6 shadow-[0_16px_36px_rgba(13,68,70,0.06)] border border-[#D8DFDF]">
              <h3 className="font-display text-lg font-bold text-[#141717] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0D4446]">contact_page</span> CONTACT AGENT
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <img src="https://ui-avatars.com/api/?name=Sarah+Cruz&background=0D4446&color=fff" alt="Agent" className="w-16 h-16 rounded-full border-2 border-[#D8DFDF]" />
                <div>
                  <p className="font-bold text-[#141717] text-lg">Sarah Cruz</p>
                  <p className="text-xs font-semibold text-[#5C6768]">Licensed Broker • PRC #12345</p>
                  <p className="text-[10px] text-[#0D9488] font-bold uppercase tracking-widest mt-1">SuperAgent™</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">chat</span> WhatsApp
                </button>
                <button className="flex-1 py-2.5 bg-[#F4F5F4] text-[#0D4446] border border-[#D8DFDF] font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:border-[#0D4446] transition-colors">
                  <span className="material-symbols-outlined text-[16px]">call</span> Call
                </button>
              </div>
            </div>

            {/* MONTHLY PAYMENT */}
            <div className="bg-white rounded-[20px] p-6 shadow-[0_16px_36px_rgba(13,68,70,0.06)] border border-[#D8DFDF]">
              <h3 className="font-display text-lg font-bold text-[#141717] mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0D4446]">payments</span> MONTHLY PAYMENT
              </h3>
              <p className="font-display font-bold text-2xl text-[#0D4446] mb-1">Est. PHP 176,700 <span className="text-sm text-[#5C6768] font-sans">/ mo</span></p>
              <p className="text-xs text-[#5C6768] font-semibold mb-4">Based on 20% DP, 15 yrs @ 7.5%</p>
              <button className="w-full py-2.5 bg-[#F4F5F4] text-[#0D4446] font-bold text-xs uppercase tracking-wider rounded-xl border border-[#D8DFDF] hover:border-[#0D4446] transition-colors flex items-center justify-center gap-2">
                Payment Calculator <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

            {/* DOCUMENTS */}
            <div className="bg-white rounded-[20px] p-6 shadow-[0_16px_36px_rgba(13,68,70,0.06)] border border-[#D8DFDF]">
              <h3 className="font-display text-lg font-bold text-[#141717] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0D4446]">folder</span> DOCUMENTS
              </h3>
              <ul className="text-sm font-semibold space-y-3">
                <li><a href="#" className="flex items-center gap-2 text-[#5C6768] hover:text-[#E76F51] transition-colors"><span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> Property Brochure (PDF)</a></li>
                <li><a href="#" className="flex items-center gap-2 text-[#5C6768] hover:text-[#E76F51] transition-colors"><span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> Subdivision Guidelines</a></li>
              </ul>
            </div>

          </div>
        </div>

      </main>
      
      {/* 5. SIMILAR HOMES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-[#D8DFDF]">
        <h2 className="font-display text-2xl font-bold text-[#141717] mb-6">🏡 SIMILAR HOMES YOU MIGHT LIKE</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-[20px] overflow-hidden border border-[#D8DFDF] shadow-sm hover:shadow-lg transition-shadow group cursor-pointer">
              <div className="h-48 overflow-hidden relative">
                <img src={`https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&sig=${i}`} alt="Home" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[#0D4446] text-[10px] font-bold px-2 py-1 rounded-md uppercase">For Sale</span>
              </div>
              <div className="p-5">
                <p className="font-display font-bold text-xl text-[#0D4446] mb-1">PHP 27,000,000</p>
                <p className="text-sm font-bold text-[#141717] mb-2 truncate">Modern Townhouse in Scout Area</p>
                <p className="text-xs text-[#5C6768] font-semibold mb-3">4 Beds • 4 Baths • 280 sqm</p>
                <p className="text-xs text-[#5C6768] flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span> Scout Area, Quezon City</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
    </div>
  );
}
