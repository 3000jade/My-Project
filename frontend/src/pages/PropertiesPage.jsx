import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import '../components/styles/Listings.css';

const MOCK_PROPERTIES = [
  {
    id: 1,
    name: "The Alpine Sanctuary",
    price: "₱34,500,000",
    location: "Makati City, Philippines",
    beds: 4,
    baths: 3,
    parking: 2,
    area: "320 sqm",
    description: "A breathtaking modern sanctuary featuring panoramic city views, floor-to-ceiling windows, and premium bespoke finishes throughout.",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    badge: "Just Listed",
    badgeColor: "bg-accent"
  },
  {
    id: 2,
    name: "Villa de l'Azur",
    price: "₱52,000,000",
    location: "Taguig City, Philippines",
    beds: 5,
    baths: 5,
    parking: 4,
    area: "450 sqm",
    description: "Exquisite architectural masterpiece offering unparalleled privacy, an infinity pool, and state-of-the-art smart home integration.",
    image: "https://images.unsplash.com/photo-1613490908592-5d46815a51cf?auto=format&fit=crop&w=800&q=80",
    badge: "Off-Market",
    badgeColor: "bg-primary"
  },
  {
    id: 3,
    name: "The Glass Monolith",
    price: "₱28,900,000",
    location: "Mandaluyong City, Philippines",
    beds: 3,
    baths: 2,
    parking: 2,
    area: "210 sqm",
    description: "Contemporary glass-enclosed penthouse featuring double-height ceilings and a private wrap-around terrace.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    badge: "Elite Portfolio",
    badgeColor: "bg-tertiary"
  },
  {
    id: 4,
    name: "Serenity Heights",
    price: "₱18,500,000",
    location: "Quezon City, Philippines",
    beds: 3,
    baths: 3,
    parking: 1,
    area: "185 sqm",
    description: "Elegant townhouse in a quiet gated community, boasting a lush garden courtyard and minimalist aesthetic.",
    image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
    badge: "",
    badgeColor: ""
  },
  {
    id: 5,
    name: "Azure Skyline Loft",
    price: "₱41,200,000",
    location: "BGC, Taguig, Philippines",
    beds: 2,
    baths: 2,
    parking: 2,
    area: "195 sqm",
    description: "Ultra-luxury loft with custom Italian cabinetry, premium appliances, and sweeping views of the urban skyline.",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    badge: "Price Drop",
    badgeColor: "bg-primary"
  },
  {
    id: 6,
    name: "The Heritage Estate",
    price: "₱85,000,000",
    location: "Alabang, Muntinlupa",
    beds: 6,
    baths: 7,
    parking: 6,
    area: "850 sqm",
    description: "Sprawling legacy estate featuring classical architecture, manicured grounds, and a detached guest pavilion.",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
    badge: "Exclusive",
    badgeColor: "bg-tertiary"
  }
];

function FilterBar({ onSearch }) {
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState({
    keyword: '',
    type: 'All Types',
    minPrice: '',
    maxPrice: '',
    beds: 'Any',
    baths: 'Any',
    furnishing: 'Any Status',
    parking: false,
    sort: 'Newest First'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    startTransition(async () => {
      // Simulate network request duration
      await new Promise(resolve => setTimeout(resolve, 800));
      onSearch(filters);
    });
  };

  return (
    <section className="bg-background rounded-2xl shadow-sm border border-outline-variant/30 p-6 mb-12">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Search Field */}
        <div className="md:col-span-12 lg:col-span-4">
          <label className="block font-label-md text-label-md text-tertiary mb-2">Keyword/Location</label>
          <div className="relative">
            <input
              name="keyword"
              value={filters.keyword}
              onChange={handleChange}
              className="w-full h-11 px-4 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-body-md"
              placeholder="e.g. Makati City, Modern Villa" 
              type="text" 
            />
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-primary pointer-events-none">search</span>
          </div>
        </div>
        {/* Filters Group */}
        <div className="md:col-span-6 lg:col-span-2">
          <label className="block font-label-md text-label-md text-tertiary mb-2">Property Type</label>
          <select name="type" value={filters.type} onChange={handleChange} className="w-full h-11 px-2 border border-outline-variant rounded-lg bg-transparent text-body-md focus:ring-1 focus:ring-primary focus:border-primary">
            <option>All Types</option>
            <option>Condominium</option>
            <option>House &amp; Lot</option>
            <option>Townhouse</option>
          </select>
        </div>
        <div className="md:col-span-6 lg:col-span-2">
          <label className="block font-label-md text-label-md text-tertiary mb-2">Price Min</label>
          <input name="minPrice" value={filters.minPrice} onChange={handleChange} className="w-full h-11 px-2 border border-outline-variant rounded-lg text-body-md focus:ring-1 focus:ring-primary focus:border-primary" placeholder="Min ₱" type="text" />
        </div>
        <div className="md:col-span-6 lg:col-span-2">
          <label className="block font-label-md text-label-md text-tertiary mb-2">Price Max</label>
          <input name="maxPrice" value={filters.maxPrice} onChange={handleChange} className="w-full h-11 px-2 border border-outline-variant rounded-lg text-body-md focus:ring-1 focus:ring-primary focus:border-primary" placeholder="Max ₱" type="text" />
        </div>
        
        {/* Secondary Filter Group */}
        <div className="md:col-span-3 lg:col-span-1">
          <label className="block font-label-md text-label-md text-tertiary mb-2">Beds</label>
          <select name="beds" value={filters.beds} onChange={handleChange} className="w-full h-11 px-2 border border-outline-variant rounded-lg bg-transparent text-body-md focus:ring-1 focus:ring-primary focus:border-primary">
            <option>Any</option>
            <option>1+</option>
            <option>2+</option>
            <option>3+</option>
          </select>
        </div>
        <div className="md:col-span-3 lg:col-span-1">
          <label className="block font-label-md text-label-md text-tertiary mb-2">Baths</label>
          <select name="baths" value={filters.baths} onChange={handleChange} className="w-full h-11 px-2 border border-outline-variant rounded-lg bg-transparent text-body-md focus:ring-1 focus:ring-primary focus:border-primary">
            <option>Any</option>
            <option>1+</option>
            <option>2+</option>
          </select>
        </div>

        {/* Options Row */}
        <div className="md:col-span-12 flex flex-col lg:flex-row lg:items-end justify-between gap-gutter mt-2">
          <div className="flex flex-wrap gap-6 items-center">
            <div>
              <label className="block font-label-md text-label-md text-tertiary mb-2">Furnishing</label>
              <select name="furnishing" value={filters.furnishing} onChange={handleChange} className="h-11 px-4 border border-outline-variant rounded-lg bg-transparent text-body-md min-w-[150px] focus:ring-1 focus:ring-primary focus:border-primary">
                <option>Any Status</option>
                <option>Fully Furnished</option>
                <option>Semi-Furnished</option>
                <option>Unfurnished</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input name="parking" checked={filters.parking} onChange={handleChange} className="w-5 h-5 border-outline-variant rounded text-primary focus:ring-primary cursor-pointer" id="parking" type="checkbox" />
              <label className="font-body-md text-body-md text-tertiary cursor-pointer" htmlFor="parking">Parking Required</label>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end w-full lg:w-auto">
            <div className="flex flex-col flex-1 lg:flex-initial">
              <label className="font-label-md text-label-md text-tertiary mb-2">Sort By</label>
              <select name="sort" value={filters.sort} onChange={handleChange} className="h-11 px-4 border border-outline-variant rounded-lg bg-transparent text-body-md focus:ring-1 focus:ring-primary focus:border-primary">
                <option>Newest First</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={isPending}
              className={`h-11 px-8 bg-primary text-on-primary rounded-lg font-label-md text-label-md uppercase tracking-wider hover:opacity-90 shadow-sm transition-all flex items-center justify-center gap-2 flex-1 lg:flex-initial min-w-[200px] ${isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  SEARCHING...
                </>
              ) : 'SEARCH PROPERTIES'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function PropertyCard({ property }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
      }}
      className="bg-background rounded-2xl shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group overflow-hidden border border-outline-variant/30 flex flex-col"
    >
      <div className="relative overflow-hidden aspect-[16/10] bg-surface-container-low flex items-center justify-center border-b border-outline-variant/30">
        {property.image ? (
          <img src={property.image} alt={property.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
        ) : (
          <span className="material-symbols-outlined text-outline/40 text-5xl">image</span>
        )}
        <button className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-sm hover:bg-white hover:scale-110 transition-all z-10">
          <span className="material-symbols-outlined text-primary text-[22px]">favorite</span>
        </button>
        {property.badge && (
          <div className="absolute top-4 left-4 z-10">
            <span className={`${property.badgeColor} text-white text-label-sm font-label-sm px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm`}>
              {property.badge}
            </span>
          </div>
        )}
        {/* Subtle overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-4">
          <h3 className="font-headline-sm text-headline-sm text-tertiary uppercase line-clamp-1 group-hover:text-primary transition-colors">{property.name}</h3>
          <span className="font-headline-sm text-headline-sm text-primary font-bold whitespace-nowrap">{property.price}</span>
        </div>
        <div className="flex items-center gap-1 text-on-surface-variant mb-5">
          <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
          <span className="text-body-md line-clamp-1">{property.location}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-y-4 gap-x-4 border-y border-outline-variant/30 py-5 mb-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">bed</span>
            <span className="text-body-md text-tertiary/80">{property.beds} Beds</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">bathtub</span>
            <span className="text-body-md text-tertiary/80">{property.baths} Baths</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">directions_car</span>
            <span className="text-body-md text-tertiary/80">{property.parking} Parking</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">square_foot</span>
            <span className="text-body-md text-tertiary/80">{property.area}</span>
          </div>
        </div>
        
        <p className="text-body-md text-on-surface-variant mb-6 line-clamp-2 flex-1">{property.description}</p>
        
        <div className="flex gap-3 mt-auto">
          <button className="flex-1 h-12 border-2 border-primary text-primary rounded-lg font-label-md text-label-md hover:bg-primary hover:text-white transition-colors uppercase tracking-wider">
            View Details
          </button>
          <button className="flex-1 h-12 bg-accent text-white rounded-lg font-label-md text-label-md shadow-sm transition-all hover:shadow-md hover:opacity-90 premium-btn uppercase tracking-wider">
            Inquire Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Pagination() {
  return (
    <motion.nav 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="flex justify-center items-center gap-2 sm:gap-3 mt-16 py-8"
    >
      <button className="h-10 px-3 sm:px-4 rounded-lg border border-outline-variant flex items-center justify-center bg-surface-container-low text-tertiary/40 cursor-not-allowed" disabled>
        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        <span className="font-label-md ml-1 hidden sm:inline">Previous</span>
      </button>
      <button className="w-10 h-10 rounded-lg bg-primary text-on-primary font-label-md shadow-sm transition-transform hover:scale-105">1</button>
      <button className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center font-label-md text-tertiary hover:border-accent hover:text-accent transition-colors">2</button>
      <button className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center font-label-md text-tertiary hover:border-accent hover:text-accent transition-colors hidden sm:flex">3</button>
      <span className="px-2 text-tertiary/40">...</span>
      <button className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center font-label-md text-tertiary hover:border-accent hover:text-accent transition-colors">12</button>
      <button className="h-10 px-3 sm:px-4 rounded-lg border border-outline-variant flex items-center justify-center text-tertiary hover:border-primary hover:text-primary transition-colors group">
        <span className="font-label-md mr-1 hidden sm:inline">Next</span>
        <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">chevron_right</span>
      </button>
    </motion.nav>
  );
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState(MOCK_PROPERTIES);

  const handleSearch = (filters) => {
    const filtered = MOCK_PROPERTIES.filter(p => {
      if (filters.keyword) {
        const query = filters.keyword.toLowerCase();
        return p.location.toLowerCase().includes(query) || p.name.toLowerCase().includes(query);
      }
      return true;
    });
    setProperties(filtered);
  };

  return (
    <section className="py-section-gap px-margin-mobile md:px-margin-tablet lg:px-margin-desktop max-w-container-max-width mx-auto bg-surface-variant/30 min-h-[800px]">
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <span className="font-label-lg text-label-lg text-accent uppercase tracking-widest mb-4 block">
          Discover
        </span>
        <h2 className="font-headline-lg text-headline-lg text-tertiary">Premium Properties</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-4 max-w-2xl mx-auto">
          Explore our exclusive collection of hand-picked real estate, designed for modern luxury and unparalleled comfort.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <FilterBar onSearch={handleSearch} />
      </motion.div>

      {properties.length > 0 ? (
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { 
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
            }
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter"
        >
          {properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="py-24 text-center text-tertiary bg-background rounded-2xl border border-outline-variant/30 shadow-sm"
        >
          <span className="material-symbols-outlined text-6xl opacity-30 mb-4 block">search_off</span>
          <p className="font-headline-sm text-headline-sm mb-2">No properties found</p>
          <p className="text-body-md text-on-surface-variant">Try adjusting your filters or search keywords to find what you're looking for.</p>
        </motion.div>
      )}

      {properties.length > 0 && <Pagination />}

    </section>
  );
}
