import { useState } from 'react';
import { motion } from 'framer-motion';
import '../components/styles/Listings.css';
import SearchBarSection from '../components/features/SearchBarSection';
import VideoTours from '../components/features/VideoTours';
import LatestProperties from '../components/features/LatestProperties';

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
    badge: "Just Listed"
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
    badge: "Off-Market"
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
    badge: "Elite Portfolio"
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
    badge: ""
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
    badge: "Price Drop"
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
    badge: "Exclusive"
  }
];

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
    <div className="bg-background min-h-screen">
      {/* 1. SearchBarSection at the head */}
      <SearchBarSection onSearch={handleSearch} />

      <section className="py-section-gap px-margin-mobile md:px-margin-tablet lg:px-margin-desktop max-w-container-max-width mx-auto">
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
      </section>

      {/* 2. VideoTours underneath search filters */}
      <VideoTours />

      {/* 3. Latest Properties Grid */}
      <div className="py-stack-xl">
        <LatestProperties properties={properties} />
      </div>
    </div>
  );
}
