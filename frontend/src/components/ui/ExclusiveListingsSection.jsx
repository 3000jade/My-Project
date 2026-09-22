import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { mockProperties } from '../../mockData/mockProperties';

export default function ExclusiveListingsSection() {
  const navigate = useNavigate();
  const exclusiveListings = mockProperties.filter(p => p.exclusive);

  const handleInspect = (id) => {
    navigate(`/properties/${id}`);
  };

  return (
    <section className="w-full bg-[#071313] py-32 px-6 md:px-12 lg:px-24">
      <div className="max-w-[1440px] mx-auto">
        <div className="mb-16">
          <span className="inline-block px-3 py-1 bg-[#174849]/30 text-[#FB8E5D] rounded-full text-[10px] font-bold font-sans uppercase tracking-[0.2em] mb-4 border border-[#FB8E5D]/20">Agency Exclusives</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display text-white tracking-tight">The Private Collection</h2>
          <p className="text-lg text-white/60 leading-relaxed font-sans mt-4 max-w-2xl">
            Off-market acquisitions and signature architectural achievements. Available strictly through direct advisory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exclusiveListings.map((property, idx) => (
            <motion.div 
              key={property.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="bg-[#0B1A1A] rounded-[32px] overflow-hidden border border-white/10 group cursor-pointer hover:border-[#174849] transition-all"
              onClick={() => handleInspect(property.id)}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={property.mainImage} 
                  alt={property.name} 
                  className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-black/50 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FB8E5D]"></span>
                    Cinematic Walkthrough
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1A1A] via-transparent to-transparent opacity-90"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-2xl font-display font-extrabold text-white tracking-tight">{property.name}</h3>
                  <p className="text-[#FB8E5D] text-sm font-bold font-sans tracking-wide mt-1">{property.price}</p>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div>
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block mb-1">Gross Floor Area</span>
                    <span className="text-sm text-white/90 font-sans">{property.sqm}</span>
                  </div>
                  {property.lotArea && (
                    <div>
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block mb-1">Lot Area</span>
                      <span className="text-sm text-white/90 font-sans">{property.lotArea}</span>
                    </div>
                  )}
                  {property.architect && (
                    <div>
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block mb-1">Architect</span>
                      <span className="text-sm text-white/90 font-sans">{property.architect}</span>
                    </div>
                  )}
                  {property.solarAzimuth && (
                    <div>
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block mb-1">Solar Azimuth</span>
                      <span className="text-sm text-white/90 font-sans">{property.solarAzimuth}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <button className="w-full flex items-center justify-between text-white/80 group-hover:text-white transition-colors">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] font-sans">Quick Inspection</span>
                    <span className="material-symbols-outlined transform group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
