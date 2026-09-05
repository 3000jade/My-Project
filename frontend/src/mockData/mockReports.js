export const mockReportsData = {
  salesByDate: [
    { period: "Apr 2026", count: 2, volume: 110000000 },
    { period: "May 2026", count: 3, volume: 175000000 },
    { period: "Jun 2026", count: 4, volume: 290000000 },
    { period: "Jul 2026", count: 5, volume: 345000000 },
    { period: "Aug 2026", count: 6, volume: 423000000 },
    { period: "Sep 2026 (MTD)", count: 2, volume: 270500000 }
  ],
  salesByAgent: [
    { agent_name: "Alexander Sterling", deals: 22, volume: 920000000, active_listings: 11 },
    { agent_name: "Elena Rossi", deals: 12, volume: 485000000, active_listings: 8 },
    { agent_name: "Camille Del Rosario", deals: 9, volume: 340000000, active_listings: 6 },
    { agent_name: "Marcus Aurelius Tan", deals: 5, volume: 125000000, active_listings: 4 },
    { agent_name: "Sophia Kimberly Lim", deals: 2, volume: 48000000, active_listings: 3 }
  ],
  salesByPropertyType: [
    { type: "House & Lot", percentage: 42, count: 18, volume: 1120000000 },
    { type: "Penthouse / Condo", percentage: 33, count: 14, volume: 710000000 },
    { type: "Estate", percentage: 15, count: 4, volume: 480000000 },
    { type: "Villa", percentage: 10, count: 3, volume: 215000000 }
  ],
  propertyStatusDistribution: {
    AVAILABLE: 5,
    RESERVED: 1,
    SOLD: 1,
    INACTIVE: 1
  },
  inquiryActivity: {
    total: 38,
    new: 7,
    assigned: 18,
    resolved: 11,
    reopened: 2
  },
  appointmentActivity: {
    total: 24,
    requested: 5,
    confirmed: 12,
    completed: 6,
    cancelled: 1
  }
};
