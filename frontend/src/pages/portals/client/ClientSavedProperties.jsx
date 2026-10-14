import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bookmark, 
  Trash2, 
  ExternalLink, 
  MapPin, 
  Compass, 
  Search, 
  Check, 
  RotateCcw,
  Bed,
  Bath,
  Car,
  Maximize2
} from 'lucide-react';
import PageHeader from '../../../components/dashboard/PageHeader';
import { clientUserService } from '../../../services/clientUserService';

export default function ClientSavedProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRemoved, setLastRemoved] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    async function fetchSaved() {
      try {
        const list = await clientUserService.getSavedProperties();
        if (mounted) setProperties(list);
      } catch (err) {
        console.warn('Failed to fetch saved properties:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchSaved();
    return () => { mounted = false; };
  }, []);

  const handleRemove = async (property) => {
    try {
      const updated = await clientUserService.removeSavedProperty(property.id);
      setProperties(updated);
      setLastRemoved(property);
      setToastMessage(`"${property.title || property.name}" removed from saved list.`);
    } catch (err) {
      console.warn('Error removing property:', err);
    }
  };

  const handleUndo = async () => {
    if (!lastRemoved) return;
    try {
      const restored = await clientUserService.saveProperty(lastRemoved.id);
      setProperties(restored);
      setLastRemoved(null);
      setToastMessage(`Restored "${lastRemoved.title || lastRemoved.name}" to your saved list.`);
    } catch (err) {
      console.warn('Error restoring property:', err);
    }
  };

  const filteredProperties = properties.filter((prop) => {
    const title = prop.title || prop.name || '';
    const loc = prop.location || prop.address || '';
    const type = prop.propertyType || prop.property_type || '';
    const q = searchQuery.toLowerCase();
    return title.toLowerCase().includes(q) || loc.toLowerCase().includes(q) || type.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 font-sans antialiased text-[#141717]">
      <PageHeader
        title="Saved Properties"
        subtitle="Manage your shortlisted luxury residential portfolio assets and track private inquiries."
        actions={
          <Link
            to="/properties"
            className="h-[46px] px-5 bg-[#0D4446] hover:bg-[#083335] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Discover More Properties</span>
          </Link>
        }
      />

      {/* Undo Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-white rounded-xl border border-[#D8DFDF] shadow-md flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 text-[#0D4446] font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
            <div className="flex items-center gap-3">
              {lastRemoved && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0D4446]/10 text-[#0D4446] hover:bg-[#0D4446]/20 font-bold uppercase tracking-wider text-[11px] cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => { setToastMessage(''); setLastRemoved(null); }}
                className="text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#D8DFDF] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved properties by title, district, or property type..."
            className="w-full h-[46px] pl-10 pr-4 rounded-lg bg-[#FBFBF9] border border-[#D8DFDF] focus:bg-white focus:border-[#0D4446] text-xs outline-none transition-colors"
          />
        </div>
        <div className="text-xs font-mono text-[#5C6768] self-end sm:self-center">
          Showing <strong>{filteredProperties.length}</strong> of {properties.length} saved
        </div>
      </div>

      {/* Property Cards Grid */}
      {filteredProperties.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#D8DFDF] space-y-4">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-display font-bold text-[#141717]">
              No saved properties found
            </h3>
            <p className="text-xs sm:text-sm text-[#5C6768] max-w-md mx-auto">
              {searchQuery
                ? 'No properties match your active search filter. Try clearing your query.'
                : 'You have not shortlisted any properties yet. Explore our portfolio to save residences.'}
            </p>
          </div>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold uppercase tracking-wider rounded-lg text-gray-700 cursor-pointer"
            >
              Clear Filter
            </button>
          ) : (
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 h-[46px] px-6 bg-[#0D4446] hover:bg-[#083335] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>Browse Catalog</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredProperties.map((prop) => (
              <motion.div
                key={prop.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-[#D8DFDF] hover:border-[#0D4446]/40 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Photo with Overlay Badges */}
                  <div className="relative h-56 overflow-hidden bg-slate-900">
                    <img
                      src={prop.image || prop.mainImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop'}
                      alt={prop.title || prop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    <div className="absolute top-3 left-3 z-10">
                      <span className="backdrop-blur-md bg-white/95 text-[#0D4446] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                        {prop.propertyType || prop.property_type || 'Estate'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(prop)}
                      className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                      title="Remove from saved properties"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-3 left-3.5 right-3.5 z-10 text-white">
                      <h4 className="text-base font-display font-bold leading-tight line-clamp-1">
                        {prop.title || prop.name}
                      </h4>
                      <p className="flex items-center gap-1 text-[11px] text-stone-200 mt-0.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                        <span>{prop.location || prop.address || 'Metro Manila'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-[#E76F51] block leading-none mb-1">
                        List Price
                      </span>
                      <div className="text-xl sm:text-2xl font-bold font-sans text-[#141717] tracking-tight">
                        {prop.price || prop.formattedPrice || 'Price on Request'}
                      </div>
                    </div>

                    {/* Architectural Specifications Pill Grid */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-[#FBFBF9] rounded-lg border border-[#E5EBEB]">
                        <span className="text-[9px] font-mono uppercase text-[#5C6768] block">Area</span>
                        <span className="text-xs font-bold text-[#0D4446] font-mono mt-0.5 block truncate">
                          {prop.area || `${prop.floor_area || 0} sqm`}
                        </span>
                      </div>
                      <div className="p-2 bg-[#FBFBF9] rounded-lg border border-[#E5EBEB]">
                        <span className="text-[9px] font-mono uppercase text-[#5C6768] block">Beds</span>
                        <span className="text-xs font-bold text-[#0D4446] font-mono mt-0.5 block">
                          {prop.bedrooms || prop.beds || '—'}
                        </span>
                      </div>
                      <div className="p-2 bg-[#FBFBF9] rounded-lg border border-[#E5EBEB]">
                        <span className="text-[9px] font-mono uppercase text-[#5C6768] block">Baths</span>
                        <span className="text-xs font-bold text-[#0D4446] font-mono mt-0.5 block">
                          {prop.bathrooms || prop.baths || '—'}
                        </span>
                      </div>
                      <div className="p-2 bg-[#FBFBF9] rounded-lg border border-[#E5EBEB]">
                        <span className="text-[9px] font-mono uppercase text-[#5C6768] block">Parking</span>
                        <span className="text-xs font-bold text-[#0D4446] font-mono mt-0.5 block">
                          {prop.parking || '2 Cars'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="px-4 sm:px-5 py-3.5 border-t border-[#E5EBEB] bg-[#FBFBF9] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleRemove(prop)}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/properties/${prop.id}`)}
                    className="h-[38px] px-4 rounded-lg bg-[#0D4446] hover:bg-[#083335] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>View Dossier</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
