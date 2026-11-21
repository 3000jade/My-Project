import React from 'react';
import { ShieldCheck } from 'lucide-react';
import PropertyCard from '@/components/ui/cards/PropertyCard';
import {
  getPropertyTypeConfig,
  isLandFamily,
  isCommercialFamily,
  isIndustrialFamily,
} from './propertyTypeConfig';

/**
 * Sticky lg:col-span-4 live-syncing listing preview card backed by the official PropertyCard.
 */
export default function ListingPreviewCard({
  formData,
  user,
  coverPhotoUrl,
  currentStep,
  totalSteps,
}) {
  const numericPrice = Number(String(formData.price || '').replace(/[^0-9.]/g, '')) || 0;
  const resolvedType =
    getPropertyTypeConfig(formData.property_type)?.name || formData.property_type || 'House & Lot';
  const hideRooms =
    isLandFamily(resolvedType) ||
    isCommercialFamily(resolvedType) ||
    isIndustrialFamily(resolvedType) ||
    ['Land', 'Commercial', 'Industrial'].includes(formData.propertyCategory);

  const previewProperty = {
    id: 'listing-preview',
    title: formData.title?.trim() || 'Untitled Listing',
    description: formData.description?.trim() || '',
    price: numericPrice,
    price_raw: numericPrice,
    transaction_type: formData.transaction_type || 'For Sale',
    property_type: resolvedType,
    property_condition: formData.propertyStatus || '',
    standard_status: formData.propertyStatus || 'Active',
    city: formData.city || formData.location || '',
    state_or_province: formData.province || formData.state_or_province || '',
    bedrooms_total: hideRooms ? null : formData.bedrooms_total ?? null,
    bathrooms_total_integer: hideRooms ? null : formData.bathrooms_total_integer ?? null,
    parking_total: hideRooms ? null : formData.parking_total ?? null,
    living_area: formData.living_area || formData.lot_size_area || null,
    lot_size_area: formData.lot_size_area || null,
    living_area_units: 'sqm',
    lot_size_units: 'sqm',
    mainImage: coverPhotoUrl || '',
    images: coverPhotoUrl ? [coverPhotoUrl] : [],
    agent_name: formData.credentials?.assignedAgent || '',
    broker_name:
      user?.full_name ||
      user?.name ||
      formData.credentials?.brokerName ||
      formData.credentials?.brokerage ||
      'Human Shelter Realty',
    credentials: formData.credentials || {},
    is_featured: Boolean(formData.is_featured),
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-[#64748B]">
          <ShieldCheck className="size-3.5 text-[#0F766E]" />
          Live Buyer Preview
        </span>
        <span className="font-semibold text-[#1E293B]">
          Step {currentStep} of {totalSteps}
        </span>
      </div>

      <div className="pointer-events-none">
        <PropertyCard property={previewProperty} variant="vertical" onSelect={() => {}} />
      </div>
    </div>
  );
}
