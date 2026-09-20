-- ==============================================================================
-- CP_kerby Luxury Architectural Real Estate Platform - Master Seed Data
-- ==============================================================================

-- 1. SEED PROPERTIES
INSERT INTO public.properties (
  id,
  title,
  tagline,
  price,
  formatted_price,
  address,
  city,
  state,
  latitude,
  longitude,
  beds,
  baths,
  sqft,
  property_type,
  year_built,
  architectural_style,
  features,
  images,
  status
)
VALUES
(
  'a1111111-1111-1111-1111-111111111111',
  'Ayala Alabang Estate',
  'Refined Brutalist Modernism and Tropical Sanctuary',
  185000000,
  '₱185,000,000',
  '123 Narra Street, Ayala Alabang',
  'Muntinlupa',
  'Metro Manila',
  14.4261,
  121.0315,
  5,
  6,
  850,
  'Estate',
  2024,
  'Modern Tropical Brutalism',
  ARRAY['Private Cinema', 'Wine Cellar', 'Infinity Pool', 'Smart Home Automation', 'Sub-Zero & Wolf Kitchen', 'Solar Panel Array'],
  ARRAY[
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop'
  ],
  'available'
),
(
  'b2222222-2222-2222-2222-222222222222',
  'Forbes Park Pavilion',
  'Timeless Architectural Heritage & Sculptural Grounds',
  340000000,
  '₱340,000,000',
  '88 Cambridge Circle, Forbes Park',
  'Makati',
  'Metro Manila',
  14.5492,
  121.0381,
  6,
  7,
  1200,
  'Villa',
  2025,
  'Minimalist Monolith',
  ARRAY['Olympic Lap Pool', 'Sculpture Garden', 'Helipad Access', 'Staff Quarters', 'Commercial Grade Catering Kitchen', '8-Car Gallery Garage'],
  ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop'
  ],
  'available'
),
(
  'c3333333-3333-3333-3333-333333333333',
  'Dasmarinas Village Sanctuary',
  'Organic Modernism with Internal Zen Courtyard',
  295000000,
  '₱295,000,000',
  '42 Palm Avenue, Dasmarinas Village',
  'Makati',
  'Metro Manila',
  14.5420,
  121.0294,
  4,
  5,
  750,
  'Single Family',
  2023,
  'Japanese Contemporary',
  ARRAY['Internal Zen Courtyard', 'Koi Pond Filtration', 'Bespoke Walnut Cabinetry', 'Private Elevator', 'Wine Tasting Lounge'],
  ARRAY[
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop'
  ],
  'available'
),
(
  'd4444444-4444-4444-4444-444444444444',
  'BGC Sky Penthouse',
  'Panoramic Skyline Views & 360-Degree Glass Horizon',
  145000000,
  '₱145,000,000',
  '5th Avenue cor 26th Street, BGC',
  'Taguig',
  'Metro Manila',
  14.5507,
  121.0478,
  3,
  4,
  420,
  'Penthouse',
  2024,
  'Modern Glass Pavilion',
  ARRAY['Wraparound Sky Terrace', 'Private Jacuzzi', 'Direct Penthouse Lift', 'Smart Climate Zoning', 'Concierge Butler Service'],
  ARRAY[
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop'
  ],
  'available'
),
(
  'e5555555-5555-5555-5555-555555555555',
  'Tagaytay Highlands Ridge Villa',
  'Perched Above Lake Taal with Cool Microclimate',
  95000000,
  '₱95,000,000',
  'Belle View Drive, Tagaytay Highlands',
  'Tagaytay',
  'Cavite',
  14.1350,
  121.0180,
  4,
  4,
  550,
  'Villa',
  2023,
  'Contemporary Mountain Alpine',
  ARRAY['Taal Volcano Views', 'Heated Outdoor Jacuzzi', 'Cantilevered Sun Deck', 'Fireplace Lounge', 'Golf Club Share Included'],
  ARRAY[
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop'
  ],
  'available'
),
(
  'f6666666-6666-6666-6666-666666666666',
  'San Lorenzo Modernist Residence',
  'Architectural Concrete Mastery & Gallery Ceilings',
  210000000,
  '₱210,000,000',
  '18 Ponce Street, San Lorenzo Village',
  'Makati',
  'Metro Manila',
  14.5460,
  121.0210,
  5,
  5,
  680,
  'Single Family',
  2024,
  'Exposed Board-Form Concrete',
  ARRAY['Double-Height Art Gallery', 'Saltwater Pool', 'German Miele Appliance Suite', 'Electric Vehicle Fast Charger'],
  ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop'
  ],
  'available'
)
ON CONFLICT (id) DO NOTHING;


-- 2. SEED INQUIRIES
INSERT INTO public.inquiries (
  property_id,
  name,
  email,
  phone,
  message,
  preferred_date,
  type,
  status
)
VALUES
(
  'a1111111-1111-1111-1111-111111111111',
  'Dr. Victor Sterling',
  'v.sterling@investments.ph',
  '+63 917 555 0192',
  'Requesting private viewing of Ayala Alabang Estate for family acquisition. Flexible this weekend.',
  CURRENT_DATE + INTERVAL '3 days',
  'tour',
  'new'
),
(
  'b2222222-2222-2222-2222-222222222222',
  'Maria Christina Araneta',
  'mc.araneta@holdingcorp.com',
  '+63 918 555 3341',
  'Interested in architectural floor plans and lot perimeter verification for Forbes Park Pavilion.',
  CURRENT_DATE + INTERVAL '5 days',
  'general',
  'contacted'
);
