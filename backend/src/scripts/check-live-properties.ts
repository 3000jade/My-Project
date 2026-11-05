import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { PropertyService } from '../services/property.service';

async function main() {
  const res = await PropertyService.findProperties({}, 'broker', 'b1111111-1111-1111-1111-111111111111');
  console.log('Total in DB:', res.total, 'Returned in page:', res.properties.length, 'Page:', res.page, 'Limit:', res.limit, 'TotalPages:', res.totalPages);
  if (res.properties.length > 0) {
    console.log('Sample item:', {
      id: res.properties[0].id,
      title: res.properties[0].title,
      price: res.properties[0].price,
      status: res.properties[0].status,
      standardStatus: res.properties[0].standardStatus,
      city: res.properties[0].city,
      livingArea: res.properties[0].livingArea,
      bedrooms: res.properties[0].bedrooms,
      bathrooms: res.properties[0].bathrooms
    });
  }
}
main().catch(console.error);
