import React from 'react';
import { motion } from 'framer-motion';
import { cn } from 'cn';
import {
  MapPin,
  Search,
  CheckCircle2,
  Globe,
  Map,
  Building,
  Navigation,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import SubdivisionLocationFields from './SubdivisionLocationFields';
import CondoLocationFields from './CondoLocationFields';
import FormSelect from './FormSelect';
import { isStrataFamily } from './propertyTypeConfig';

const ADDRESS_MAX = 160;
const SHOW_ON_MAP_OPTIONS = ['Exact Location', 'General Area Only'];

const Req = () => <span className="text-[#FF6B6B]" aria-hidden="true">*</span>;

/**
 * Step 2: Location (Cascading PSGC shadcn Selects, Street, Subdivision/Condo, Google Maps Pin & Show on Map)
 */
export default function ListingStepLocation({
  formData,
  setFormData,
  setIsDirty,
  geoRegions = [],
  geoProvinces = [],
  geoCities = [],
  geoBarangays = [],
  isGeoLoading = {},
  locationNotice = null,
  onRegionSelect,
  onProvinceSelect,
  onCitySelect,
  onBarangaySelect,
  mapSearchQuery,
  setMapSearchQuery,
  onGeocode,
  isGeocoding,
  addressSuggestions = [],
  onSelectAddressSuggestion,
  renderMap,
}) {
  const isCondoType = isStrataFamily(formData.property_type);
  const updateField = (patch) => {
    setIsDirty?.(true);
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  // Map legacy stored value cleanly to plain-English label
  const rawPrivacy = formData.mapPinPrivacy || 'Exact Location';
  const showOnMapMode =
    rawPrivacy === 'General Area Only' || rawPrivacy === 'Approximate Area (250m)'
      ? 'General Area Only'
      : 'Exact Location';

  const addressValue = formData.address || '';
  const addressNearLimit = addressValue.length >= Math.floor(ADDRESS_MAX * 0.9);

  return (
    <div className="flex flex-col gap-6">
      {/* Card 1: Philippine Address */}
      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center">
              <MapPin className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#1E293B]">
                Property Location
              </CardTitle>
              <CardDescription className="text-sm text-[#64748B]">
                Pick the region, province, city, and barangay so buyers can search accurately.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator className="bg-[#E2E8F0]" />

        <CardContent className="pt-5">
          <FieldGroup className="gap-5">
            {locationNotice?.message && (
              <Alert className="bg-[#F0FDFA] border-[#0F766E]/20 text-[#0F766E]">
                <AlertDescription>{locationNotice.message}</AlertDescription>
              </Alert>
            )}

            {/* Cascading Region / Province / City / Barangay */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="region-select" className="text-sm font-semibold text-[#1E293B]">
                  Region <Req />
                </FieldLabel>
                <FormSelect
                  id="region-select"
                  value={formData.region_psgc_code || ''}
                  icon={Globe}
                  placeholder={isGeoLoading.regions ? 'Loading regions...' : 'Select Region'}
                  options={geoRegions.map((reg) => ({
                    value: reg.regionCode,
                    label: reg.regionName,
                  }))}
                  onValueChange={onRegionSelect}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="province-select" className="text-sm font-semibold text-[#1E293B]">
                  Province
                </FieldLabel>
                <FormSelect
                  id="province-select"
                  value={formData.province_psgc_code || ''}
                  icon={Map}
                  disabled={!formData.region_psgc_code || geoProvinces.length === 0}
                  placeholder={
                    isGeoLoading.provinces
                      ? 'Loading provinces...'
                      : geoProvinces.length === 0 && formData.region_psgc_code
                        ? 'Metro Manila (No Province)'
                        : 'Select Province'
                  }
                  options={geoProvinces.map((prov) => ({
                    value: prov.provinceCode,
                    label: prov.provinceName,
                  }))}
                  onValueChange={onProvinceSelect}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="city-select" className="text-sm font-semibold text-[#1E293B]">
                  City <Req />
                </FieldLabel>
                <FormSelect
                  id="city-select"
                  value={formData.city_psgc_code || ''}
                  icon={Building}
                  disabled={!formData.region_psgc_code}
                  placeholder={isGeoLoading.cities ? 'Loading cities...' : 'Select City'}
                  options={geoCities.map((city) => ({
                    value: city.cityCode,
                    label: city.cityName,
                  }))}
                  onValueChange={onCitySelect}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="barangay-select" className="text-sm font-semibold text-[#1E293B]">
                  Barangay
                </FieldLabel>
                <FormSelect
                  id="barangay-select"
                  value={formData.barangay_psgc_code || ''}
                  icon={Navigation}
                  disabled={!formData.city_psgc_code}
                  placeholder={isGeoLoading.barangays ? 'Loading barangays...' : 'Select Barangay'}
                  options={geoBarangays.map((brgy) => ({
                    value: brgy.barangayCode,
                    label: brgy.barangayName,
                  }))}
                  onValueChange={onBarangaySelect}
                />
              </Field>
            </div>

            {/* Street Address with Text Limiter */}
            <Field>
              <FieldLabel htmlFor="street-address" className="text-sm font-semibold text-[#1E293B]">
                Street Address <Req />
              </FieldLabel>
              <InputGroup className="h-11 bg-white border-[#E2E8F0] rounded-lg">
                <InputGroupAddon align="inline-start">
                  <MapPin className="text-[#64748B]" />
                </InputGroupAddon>
                <InputGroupInput
                  id="street-address"
                  type="text"
                  maxLength={ADDRESS_MAX}
                  placeholder="e.g. 24 Acacia Avenue"
                  value={addressValue}
                  onChange={(e) => updateField({ address: e.target.value })}
                  className="text-sm text-[#1E293B]"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText
                    className={cn(
                      'text-xs tabular-nums',
                      addressNearLimit ? 'text-[#FF6B6B] font-semibold' : 'text-[#64748B]'
                    )}
                  >
                    {addressValue.length} / {ADDRESS_MAX}
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            {/* Type-Aware Subdivision or Building Name */}
            {isCondoType ? (
              <CondoLocationFields
                formData={formData}
                setFormData={setFormData}
                setIsDirty={setIsDirty}
              />
            ) : (
              <SubdivisionLocationFields
                formData={formData}
                setFormData={setFormData}
                setIsDirty={setIsDirty}
              />
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 2: Map Location */}
      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center">
                <MapPin className="size-4" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-[#1E293B]">
                  Map Location
                </CardTitle>
                <CardDescription className="text-sm text-[#64748B]">
                  Search Google Maps or click the map to drop the pin.
                </CardDescription>
              </div>
            </div>
            {formData.latitude && formData.longitude && (
              <Badge className="bg-[#F0FDFA] text-[#0F766E] border border-[#0F766E]/20 font-semibold">
                <CheckCircle2 data-icon="inline-start" />
                Pin Set
              </Badge>
            )}
          </div>
        </CardHeader>
        <Separator className="bg-[#E2E8F0]" />

        <CardContent className="pt-5">
          <FieldGroup className="gap-5">
            {/* Google Maps Address Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <InputGroup className="h-11 flex-1 bg-white border-[#E2E8F0] rounded-lg">
                <InputGroupAddon align="inline-start">
                  <Search className="text-[#64748B]" />
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  placeholder="Search Google Maps by street, subdivision, or landmark..."
                  value={mapSearchQuery || ''}
                  onChange={(e) => setMapSearchQuery?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onGeocode?.(e);
                    }
                  }}
                  className="text-sm"
                />
              </InputGroup>
              <Button
                type="button"
                variant="outline"
                onClick={onGeocode}
                disabled={isGeocoding}
                className="h-11 px-4 border-[#E2E8F0] text-[#1E293B] font-semibold rounded-lg cursor-pointer"
              >
                <Search data-icon="inline-start" />
                {isGeocoding ? 'Searching...' : 'Find on Map'}
              </Button>
            </div>

            {addressSuggestions.length > 0 && (
              <div className="border border-[#E2E8F0] rounded-lg bg-white divide-y divide-[#E2E8F0]">
                {addressSuggestions.slice(0, 5).map((item, idx) => (
                  <button
                    key={item.placeId || idx}
                    type="button"
                    onClick={() => onSelectAddressSuggestion?.(item)}
                    className="w-full min-h-11 px-3 py-2 text-left hover:bg-[#F8FAFC] flex items-center gap-2.5 cursor-pointer"
                  >
                    <MapPin className="size-4 text-[#0F766E] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1E293B] truncate">
                        {item.mainText || item.description || item.display_name || item.label}
                      </p>
                      {item.secondaryText && (
                        <p className="text-xs text-[#64748B] truncate">{item.secondaryText}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Isolated Map Container (z-index: 0 per DESIGN.md) */}
            <div className="rounded-xl overflow-hidden border border-[#E2E8F0] isolate z-0 relative">
              {renderMap?.()}
            </div>

            {/* Manual Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="latitude-input" className="text-sm font-semibold text-[#1E293B]">
                  Latitude
                </FieldLabel>
                <Input
                  id="latitude-input"
                  type="text"
                  placeholder="Auto-filled from map pin (e.g. 14.5547)"
                  value={formData.latitude || ''}
                  onChange={(e) => updateField({ latitude: e.target.value })}
                  className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="longitude-input" className="text-sm font-semibold text-[#1E293B]">
                  Longitude
                </FieldLabel>
                <Input
                  id="longitude-input"
                  type="text"
                  placeholder="Auto-filled from map pin (e.g. 121.0244)"
                  value={formData.longitude || ''}
                  onChange={(e) => updateField({ longitude: e.target.value })}
                  className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
                />
              </Field>
            </div>

            {/* Show on Map */}
            <Field>
              <FieldLabel className="text-sm font-semibold text-[#1E293B] flex items-center gap-1.5">
                <MapPin className="size-4 text-[#0F766E]" />
                Show on Map
              </FieldLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                {SHOW_ON_MAP_OPTIONS.map((option) => {
                  const active = showOnMapMode === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateField({ mapPinPrivacy: option })}
                      className={cn(
                        'relative min-h-11 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer',
                        active ? 'text-white' : 'text-[#475569] hover:text-[#1E293B]'
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="map-privacy-pill"
                          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                          className="absolute inset-0 rounded-lg bg-[#0F766E] shadow-xs"
                        />
                      )}
                      <span className="relative z-10">{option}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
