import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from 'cn';
import {
  MapPin,
  Search,
  CheckCircle2,
  Globe,
  Map,
  Building,
  Navigation,
  Compass,
  Sparkles,
  Loader2,
  Route,
  TrainFront,
  GraduationCap,
  Cross,
  ShoppingBag,
  Info,
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
import CondoLocationFields from './CondoLocationFields';
import FormSelect from './FormSelect';
import LocationPinMap from './LocationPinMap';
import { isStrataFamily } from './propertyTypeConfig';

const ADDRESS_MAX = 160;
const SHOW_ON_MAP_OPTIONS = [
  {
    value: 'Exact Location',
    label: 'Exact Pin & Street',
    effect: 'Buyers see the exact map pin and full street address on the public listing.',
  },
  {
    value: 'General Area Only',
    label: 'Neighborhood Only (Hide Street)',
    effect: 'Hides the street address on the public listing and shows only the barangay, city, and approximate area.',
  },
];

const Req = () => <span className="text-[#FF8559]" aria-hidden="true">*</span>;

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
  onSuggestNearbyPlaces,
  renderMap,
}) {
  const [showNearbyMap, setShowNearbyMap] = useState(false);
  const [isSuggestingNearby, setIsSuggestingNearby] = useState(false);
  const isCondoType = isStrataFamily(formData.property_type);
  const updateField = (patch) => {
    setIsDirty?.(true);
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const updateNearby = (patch) => {
    setIsDirty?.(true);
    setFormData((prev) => ({
      ...prev,
      nearbyPlaces: {
        ...(prev.nearbyPlaces || {}),
        ...patch,
      },
    }));
  };

  const handleAiFillNearby = async () => {
    if (!onSuggestNearbyPlaces) return;
    setIsSuggestingNearby(true);
    try {
      await onSuggestNearbyPlaces();
    } finally {
      setIsSuggestingNearby(false);
    }
  };

  const nearbyMapCenter = [
    Number(formData.latitude) || 14.5547,
    Number(formData.longitude) || 121.0244,
  ];

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
                      addressNearLimit ? 'text-[#FF8559] font-semibold' : 'text-[#64748B]'
                    )}
                  >
                    {addressValue.length} / {ADDRESS_MAX}
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>

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

            {/* Building Name (Condo / Strata) */}
            {isCondoType && (
              <CondoLocationFields
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
              <div
                aria-live="polite"
                className="pointer-events-none absolute top-3 left-3 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#1E293B] border border-[#E2E8F0] shadow-xs"
              >
                <span
                  className={cn(
                    'size-2.5 rounded-full shrink-0',
                    showOnMapMode === 'General Area Only'
                      ? 'border-2 border-[#0F766E] bg-[#CCFBF1]'
                      : 'bg-[#0F766E]'
                  )}
                />
                <span>
                  {showOnMapMode === 'General Area Only'
                    ? 'Approximate Area (250m)'
                    : 'Exact Pin'}
                </span>
              </div>
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
                Public Map Visibility
              </FieldLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                {SHOW_ON_MAP_OPTIONS.map((option) => {
                  const active = showOnMapMode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField({ mapPinPrivacy: option.value })}
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
                      <span className="relative z-10">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-[#64748B] flex items-start gap-1.5">
                <Info className="size-3.5 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {SHOW_ON_MAP_OPTIONS.find((o) => o.value === showOnMapMode)?.effect}
                </span>
              </p>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 3: Nearby Places with AI Auto-Fill + Optional Map View */}
      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center">
                <Compass className="size-4" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-[#1E293B]">
                  Nearby Places
                </CardTitle>
                <CardDescription className="text-sm text-[#64748B]">
                  Help buyers picture daily travel times around the area.
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSuggestingNearby}
                onClick={handleAiFillNearby}
                className="min-h-11 px-3 border-[#E2E8F0] hover:border-[#0F766E] text-[#0F766E] font-semibold rounded-lg cursor-pointer"
              >
                {isSuggestingNearby ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <Sparkles data-icon="inline-start" />
                )}
                {isSuggestingNearby ? 'Finding Places...' : 'AI Auto-Fill'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNearbyMap((prev) => !prev)}
                className="min-h-11 px-3 border-[#E2E8F0] text-[#1E293B] font-semibold rounded-lg cursor-pointer"
              >
                <MapPin data-icon="inline-start" />
                {showNearbyMap ? 'Hide Map' : 'Show Map'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator className="bg-[#E2E8F0]" />

        <CardContent className="pt-5 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="nearest-highway" className="text-sm font-semibold text-[#1E293B]">
                Nearest Highway
              </FieldLabel>
              <InputGroup className="h-11 bg-white border-[#E2E8F0] rounded-lg">
                <InputGroupAddon align="inline-start">
                  <Route className="text-[#64748B]" />
                </InputGroupAddon>
                <InputGroupInput
                  id="nearest-highway"
                  type="text"
                  maxLength={80}
                  placeholder="e.g. SLEX Alabang Exit (5 mins)"
                  value={formData.nearbyPlaces?.highway || ''}
                  onChange={(e) => updateNearby({ highway: e.target.value })}
                  className="text-sm"
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="nearest-transit" className="text-sm font-semibold text-[#1E293B]">
                Nearest Transit
              </FieldLabel>
              <InputGroup className="h-11 bg-white border-[#E2E8F0] rounded-lg">
                <InputGroupAddon align="inline-start">
                  <TrainFront className="text-[#64748B]" />
                </InputGroupAddon>
                <InputGroupInput
                  id="nearest-transit"
                  type="text"
                  maxLength={80}
                  placeholder="e.g. MRT Ayala Station (10 mins)"
                  value={formData.nearbyPlaces?.transit || ''}
                  onChange={(e) => updateNearby({ transit: e.target.value })}
                  className="text-sm"
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="nearest-school" className="text-sm font-semibold text-[#1E293B]">
                Nearest School
              </FieldLabel>
              <InputGroup className="h-11 bg-white border-[#E2E8F0] rounded-lg">
                <InputGroupAddon align="inline-start">
                  <GraduationCap className="text-[#64748B]" />
                </InputGroupAddon>
                <InputGroupInput
                  id="nearest-school"
                  type="text"
                  maxLength={80}
                  placeholder="e.g. De La Salle Zobel (4 mins)"
                  value={formData.nearbyPlaces?.school || ''}
                  onChange={(e) => updateNearby({ school: e.target.value })}
                  className="text-sm"
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="nearest-hospital" className="text-sm font-semibold text-[#1E293B]">
                Nearest Hospital
              </FieldLabel>
              <InputGroup className="h-11 bg-white border-[#E2E8F0] rounded-lg">
                <InputGroupAddon align="inline-start">
                  <Cross className="text-[#64748B]" />
                </InputGroupAddon>
                <InputGroupInput
                  id="nearest-hospital"
                  type="text"
                  maxLength={80}
                  placeholder="e.g. Asian Hospital (6 mins)"
                  value={formData.nearbyPlaces?.hospital || ''}
                  onChange={(e) => updateNearby({ hospital: e.target.value })}
                  className="text-sm"
                />
              </InputGroup>
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="nearest-mall" className="text-sm font-semibold text-[#1E293B]">
                Nearest Mall
              </FieldLabel>
              <InputGroup className="h-11 bg-white border-[#E2E8F0] rounded-lg">
                <InputGroupAddon align="inline-start">
                  <ShoppingBag className="text-[#64748B]" />
                </InputGroupAddon>
                <InputGroupInput
                  id="nearest-mall"
                  type="text"
                  maxLength={80}
                  placeholder="e.g. Alabang Town Center (5 mins)"
                  value={formData.nearbyPlaces?.mall || ''}
                  onChange={(e) => updateNearby({ mall: e.target.value })}
                  className="text-sm"
                />
              </InputGroup>
            </Field>
          </div>

          <AnimatePresence initial={false}>
            {showNearbyMap && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden flex flex-col gap-2"
              >
                <div className="rounded-xl overflow-hidden border border-[#E2E8F0] isolate z-0 relative">
                  <LocationPinMap
                    position={nearbyMapCenter}
                    zoom={14}
                    interactive={false}
                    extraPins={formData.nearbyPlacesPins || []}
                    className="h-64 w-full"
                  />
                </div>
                <p className="text-xs text-[#64748B]">
                  {formData.nearbyPlacesPins?.length > 0
                    ? `Showing ${formData.nearbyPlacesPins.length} suggested nearby landmarks around the property pin.`
                    : 'Click "AI Auto-Fill" above to plot nearby landmarks around your property location.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
