import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';

export const SEED_PROPERTIES = [
  {
    id: 'b1a2c3d4-0001-4000-8000-000000000001',
    title: 'Ayala Alabang Estate',
    tagline: 'Refined Brutalist Modernism & Open Living',
    price: 185000000,
    formatted_price: '₱185,000,000',
    address: '123 Narra Street, Ayala Alabang',
    city: 'Muntinlupa',
    state: 'Metro Manila',
    latitude: 14.426,
    longitude: 121.031,
    beds: 5,
    baths: 6,
    sqft: 850,
    property_type: 'Estate',
    year_built: 2024,
    architectural_style: 'Brutalist Modernism',
    features: ['Private Cinema', 'Wine Cellar', 'Infinity Pool', 'Smart Home System', 'Rooftop Terrace', 'Spa Retreat'],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop'
    ],
    status: 'available'
  },
  {
    id: 'b1a2c3d4-0002-4000-8000-000000000002',
    title: 'Forbes Park Contemporary Villa',
    tagline: 'Timeless Architectural Heritage & Sculptural Courtyards',
    price: 340000000,
    formatted_price: '₱340,000,000',
    address: '88 Cambridge Circle, Forbes Park',
    city: 'Makati',
    state: 'Metro Manila',
    latitude: 14.549,
    longitude: 121.038,
    beds: 6,
    baths: 7,
    sqft: 1200,
    property_type: 'Villa',
    year_built: 2025,
    architectural_style: 'Brutalist Minimalist',
    features: ['Lap Pool', 'Sculpture Garden', 'Helipad Access', 'Catering Kitchen', 'Subterranean Vault'],
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop'
    ],
    status: 'available'
  },
  {
    id: 'b1a2c3d4-0003-4000-8000-000000000003',
    title: 'Dasmarinas Village Sanctuary',
    tagline: 'Organic Luxury & Meditative Zen Courtyards',
    price: 295000000,
    formatted_price: '₱295,000,000',
    address: '42 Palm Avenue, Dasmarinas Village',
    city: 'Makati',
    state: 'Metro Manila',
    latitude: 14.542,
    longitude: 121.029,
    beds: 4,
    baths: 5,
    sqft: 750,
    property_type: 'Single Family',
    year_built: 2023,
    architectural_style: 'Japanese Contemporary',
    features: ['Internal Courtyard', 'Zen Koi Pond', 'Solar Microgrid', 'Sommelier Wine Vault'],
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop'
    ],
    status: 'available'
  },
  {
    id: 'b1a2c3d4-0004-4000-8000-000000000004',
    title: 'The Proscenium Penthouse',
    tagline: 'Panoramic Skyward Living with Double-Height Glazing',
    price: 85500000,
    formatted_price: '₱85,500,000',
    address: 'Penthouse Level, The Proscenium, Rockwell Center',
    city: 'Makati',
    state: 'Metro Manila',
    latitude: 14.565,
    longitude: 121.037,
    beds: 3,
    baths: 4,
    sqft: 280,
    property_type: 'Penthouse',
    year_built: 2024,
    architectural_style: 'Modern High-Rise',
    features: ['Floor-to-Ceiling Glazing', 'Imported Travertine', 'Private Elevator', 'Wrap-around Balcony'],
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop'
    ],
    status: 'available'
  },
  {
    id: 'b1a2c3d4-0005-4000-8000-000000000005',
    title: 'Horizon Terraces Ridge Villa',
    tagline: 'Volcanic Caldera Panoramas & Mountain Air',
    price: 45000000,
    formatted_price: '₱45,000,000',
    address: 'Calamba Road, Tagaytay Highlands',
    city: 'Tagaytay',
    state: 'Cavite',
    latitude: 14.135,
    longitude: 120.975,
    beds: 4,
    baths: 4,
    sqft: 350,
    property_type: 'Villa',
    year_built: 2023,
    architectural_style: 'Tropical Modernist',
    features: ['Caldera Views', 'Heated Plunge Pool', 'Fireplace Salon', 'Organic Herb Garden'],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop'
    ],
    status: 'available'
  },
  {
    id: 'b1a2c3d4-0006-4000-8000-000000000006',
    title: 'Bonifacio Ridge Sky Residence',
    tagline: 'Nordic Functionalism Overlooking Manila Golf Club',
    price: 68000000,
    formatted_price: '₱68,000,000',
    address: '1st Avenue corner 30th Street, Bonifacio Global City',
    city: 'Taguig',
    state: 'Metro Manila',
    latitude: 14.551,
    longitude: 121.045,
    beds: 3,
    baths: 3,
    sqft: 210,
    property_type: 'Condominium',
    year_built: 2025,
    architectural_style: 'Nordic Minimalist',
    features: ['Golf Course Views', 'Acoustic Wall Paneling', 'Smart Climate Automation', 'Dual Parking'],
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop'
    ],
    status: 'available'
  }
];

async function seedDatabase() {
  logger.info('Starting Supabase database seed process...');

  if (!isSupabaseConfigured) {
    logger.error('Supabase is not configured. Aborting seed.');
    process.exit(1);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .upsert(SEED_PROPERTIES, { onConflict: 'id' })
      .select();

    if (error) {
      logger.error('Failed to seed properties table:', error.message);
      logger.info('NOTE: If the table does not exist, run supabase_schema.sql in the Supabase SQL editor first.');
      process.exit(1);
    }

    logger.info(`Successfully seeded ${data?.length || SEED_PROPERTIES.length} properties into Supabase!`);
    console.log('Seeded properties:', data?.map((p: any) => p.title));
  } catch (err: any) {
    logger.error('Unexpected error seeding database:', err.message);
    process.exit(1);
  }
}

seedDatabase();
