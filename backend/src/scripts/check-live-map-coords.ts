import * as dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function main() {
  const { PropertyService } = await import('../services/property.service');
  const res = await PropertyService.findProperties({ limit: 15 }, 'admin', 'admin-id');
  const summary = res.properties.map(p => ({
    id: p.id,
    title: p.title,
    city: p.city || (p.location as any)?.city,
    latitude: p.latitude || (p.location as any)?.coordinates?.lat,
    longitude: p.longitude || (p.location as any)?.coordinates?.lng,
    raw_location: p.location,
  }));
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
