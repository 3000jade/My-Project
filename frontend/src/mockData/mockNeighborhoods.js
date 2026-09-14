export const mockNeighborhoods = [
  {
    id: "makati-cbd",
    name: "Makati CBD",
    category: "Urban Core",
    image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=1200&auto=format&fit=crop",
    description: "The premier financial district, offering unmatched cosmopolitan living, world-class dining, and exclusive high-rise vertical communities.",
    metrics: {
      schoolRating: "9.5/10",
      walkScore: "98",
      avgPricePerSqm: "₱450,000",
      appreciation: "+38%",
      michelinDining: 12
    },
    schools: ["International School Manila (Nearby)", "Assumption College", "Colegio San Agustin"],
    lifestyle: ["Ayala Triangle Gardens", "Greenbelt Luxury Mall", "Manila Peninsula"]
  },
  {
    id: "bgc",
    name: "Bonifacio Global City",
    category: "Urban Core",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
    description: "A meticulously master-planned city prioritizing pedestrian mobility, public art, and hyper-modern smart infrastructure.",
    metrics: {
      schoolRating: "9.8/10",
      walkScore: "95",
      avgPricePerSqm: "₱420,000",
      appreciation: "+42%",
      michelinDining: 8
    },
    schools: ["International School Manila", "British School Manila", "Manila Japanese School"],
    lifestyle: ["High Street", "Mind Museum", "Manila Golf and Country Club"]
  },
  {
    id: "forbes-park",
    name: "Forbes Park",
    category: "Gated Subdivisions",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop",
    description: "The most prestigious residential address in the country, featuring expansive estates, heritage trees, and unparalleled security.",
    metrics: {
      schoolRating: "9.5/10",
      walkScore: "45",
      avgPricePerSqm: "₱650,000",
      appreciation: "+55%",
      michelinDining: 0 // Strictly residential
    },
    schools: ["Colegio San Agustin"],
    lifestyle: ["Manila Polo Club", "San Antonio Plaza", "Manila Golf Club"]
  },
  {
    id: "alabang-hills",
    name: "Alabang Hills",
    category: "Gated Subdivisions",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop",
    description: "A serene, family-centric enclave in the south known for its lush canopies, rolling terrain, and vibrant community spirit.",
    metrics: {
      schoolRating: "9.2/10",
      walkScore: "35",
      avgPricePerSqm: "₱180,000",
      appreciation: "+28%",
      michelinDining: 2
    },
    schools: ["De La Salle Zobel", "San Beda College Alabang"],
    lifestyle: ["Alabang Country Club", "Molito Lifestyle Center", "Evia Lifestyle Center"]
  },
  {
    id: "new-manila",
    name: "New Manila",
    category: "Heritage Enclave",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop",
    description: "Rich in history and old-world charm, featuring massive ancestral compounds, tree-lined avenues, and close proximity to top-tier universities.",
    metrics: {
      schoolRating: "9.0/10",
      walkScore: "60",
      avgPricePerSqm: "₱250,000",
      appreciation: "+25%",
      michelinDining: 1
    },
    schools: ["St. Paul University", "Jubilee Christian Academy", "Ateneo de Manila (Accessible)"],
    lifestyle: ["Mt. Carmel Shrine", "Robinsons Magnolia", "Tomas Morato Dining District"]
  }
];
