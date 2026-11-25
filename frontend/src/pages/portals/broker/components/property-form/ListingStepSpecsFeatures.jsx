import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from 'cn';
import {
  Maximize2,
  Ruler,
  BedDouble,
  Bath,
  Car,
  Sofa,
  Sparkles,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { isLandFamily, isStrataFamily } from './propertyTypeConfig';

const BEDROOM_CHIPS = [
  { label: 'None', value: 'none' },
  { label: 'Studio', value: '0' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5+', value: '5' },
];

const BATHROOM_CHIPS = [
  { label: 'None', value: '0' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4+', value: '4' },
];

const PARKING_CHIPS = [
  { label: 'None', value: '0' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3+', value: '3' },
];

const FURNISHING_OPTIONS = ['None', 'Semi-Furnished', 'Fully Furnished'];

const SECURITY_OPTIONS = [
  '24/7 Security',
  'Gated Community',
  'CCTV Cameras',
  'Keycard Access',
  'Roving Guard',
  'Intercom',
];

const AMENITY_OPTIONS = [
  'Swimming Pool',
  'Clubhouse',
  'Gym',
  'Playground',
  'Basketball Court',
  'Function Hall',
  'Jogging Path',
  'Landscaped Park',
  'Pet Friendly',
  'Elevator',
];

const UTILITY_OPTIONS = [
  'Fiber Internet Ready',
  'Backup Generator',
  'Deep Well Water',
  'Maynilad / Manila Water',
  'Meralco Power',
  'Solar Panels',
  'Water Heater',
];

// High-contrast ToggleGroupItem styling overriding toggle.jsx aria-pressed:bg-muted
const TOGGLE_CHIP_CLASS = cn(
  'min-h-11 rounded-lg border text-sm font-semibold cursor-pointer transition-colors',
  'bg-white border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC] hover:text-[#1E293B]',
  'aria-pressed:bg-[#0F766E] aria-pressed:border-[#0F766E] aria-pressed:text-white',
  'aria-pressed:hover:bg-[#115E59] aria-pressed:hover:text-white',
  'data-[state=on]:bg-[#0F766E] data-[state=on]:border-[#0F766E] data-[state=on]:text-white'
);

const Req = () => <span className="text-[#FF8559]" aria-hidden="true">*</span>;

/**
 * Step 3: Property Specs & Features
 */
export default function ListingStepSpecsFeatures({
  formData,
  setFormData,
  setIsDirty,
}) {
  const isVacantLot = isLandFamily(formData.property_type);
  const isCondo = isStrataFamily(formData.property_type);

  const updateField = (patch) => {
    setIsDirty?.(true);
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const toggleArrayItem = (field, item) => {
    const current = Array.isArray(formData[field]) ? formData[field] : [];
    const next = current.includes(item)
      ? current.filter((x) => x !== item)
      : [...current, item];
    updateField({ [field]: next });
  };

  const renderChipGroup = (items, selectedItems = [], onToggle) => (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = selectedItems.includes(item);
        return (
          <motion.button
            key={item}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onToggle(item)}
            className={cn(
              'min-h-11 px-3.5 py-2 rounded-lg border text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer',
              active
                ? 'bg-[#F0FDFA] border-[#0F766E] text-[#0F766E]'
                : 'bg-white border-[#E2E8F0] text-[#475569] hover:border-slate-300'
            )}
          >
            {active && <Check className="size-4 text-[#0F766E]" />}
            <span>{item}</span>
          </motion.button>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Card 1: Size & Rooms */}
      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center">
              <Maximize2 className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#1E293B]">
                Size & Rooms
              </CardTitle>
              <CardDescription className="text-sm text-[#64748B]">
                {isVacantLot
                  ? 'Enter the land dimensions for this lot.'
                  : 'Enter the floor size, lot size, and room counts.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator className="bg-[#E2E8F0]" />

        <CardContent className="pt-5">
          <FieldGroup className="gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="lot-area" className="text-sm font-semibold text-[#1E293B] flex items-center gap-1.5">
                  <Ruler className="size-3.5 text-[#0F766E]" />
                  Lot Area (sqm) {isVacantLot ? <Req /> : null}
                </FieldLabel>
                <Input
                  id="lot-area"
                  type="number"
                  min="0"
                  placeholder="e.g. 240"
                  value={formData.lot_size_area || ''}
                  onChange={(e) => updateField({ lot_size_area: e.target.value })}
                  className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
                />
              </Field>

              {!isVacantLot && (
                <Field>
                  <FieldLabel htmlFor="floor-area" className="text-sm font-semibold text-[#1E293B] flex items-center gap-1.5">
                    <Maximize2 className="size-3.5 text-[#0F766E]" />
                    Floor Area (sqm) <Req />
                  </FieldLabel>
                  <Input
                    id="floor-area"
                    type="number"
                    min="0"
                    placeholder="e.g. 180"
                    value={formData.living_area || ''}
                    onChange={(e) => updateField({ living_area: e.target.value })}
                    className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
                  />
                </Field>
              )}
            </div>

            <AnimatePresence initial={false}>
              {!isVacantLot && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-5 overflow-hidden"
                >
                  {/* Bedrooms */}
                  <Field>
                    <FieldLabel className="text-sm font-semibold text-[#1E293B] flex items-center gap-1.5">
                      <BedDouble className="size-3.5 text-[#0F766E]" />
                      Bedrooms
                    </FieldLabel>
                    <ToggleGroup
                      value={
                        formData.bedrooms_total === '' || formData.bedrooms_total == null
                          ? ['none']
                          : [String(formData.bedrooms_total)]
                      }
                      onValueChange={(vals) => {
                        if (vals.length > 0) {
                          const next = vals[vals.length - 1];
                          updateField({ bedrooms_total: next === 'none' ? '' : next });
                        }
                      }}
                      className="grid grid-cols-4 sm:grid-cols-7 gap-2 w-full"
                    >
                      {BEDROOM_CHIPS.map((opt) => (
                        <ToggleGroupItem
                          key={opt.value}
                          value={opt.value}
                          className={TOGGLE_CHIP_CLASS}
                        >
                          {opt.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>

                  {/* Bathrooms & Parking */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel className="text-sm font-semibold text-[#1E293B] flex items-center gap-1.5">
                        <Bath className="size-3.5 text-[#0F766E]" />
                        Bathrooms
                      </FieldLabel>
                      <ToggleGroup
                        value={
                          formData.bathrooms_total_integer !== undefined &&
                            formData.bathrooms_total_integer !== ''
                            ? [String(formData.bathrooms_total_integer)]
                            : ['0']
                        }
                        onValueChange={(vals) => {
                          if (vals.length > 0)
                            updateField({ bathrooms_total_integer: vals[vals.length - 1] });
                        }}
                        className="grid grid-cols-5 gap-2 w-full"
                      >
                        {BATHROOM_CHIPS.map((opt) => (
                          <ToggleGroupItem
                            key={opt.value}
                            value={opt.value}
                            className={TOGGLE_CHIP_CLASS}
                          >
                            {opt.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </Field>

                    <Field>
                      <FieldLabel className="text-sm font-semibold text-[#1E293B] flex items-center gap-1.5">
                        <Car className="size-3.5 text-[#0F766E]" />
                        Parking Slots
                      </FieldLabel>
                      <ToggleGroup
                        value={
                          formData.parking_total !== undefined
                            ? [String(formData.parking_total)]
                            : ['0']
                        }
                        onValueChange={(vals) => {
                          if (vals.length > 0) updateField({ parking_total: vals[vals.length - 1] });
                        }}
                        className="grid grid-cols-4 gap-2 w-full"
                      >
                        {PARKING_CHIPS.map((opt) => (
                          <ToggleGroupItem
                            key={opt.value}
                            value={opt.value}
                            className={TOGGLE_CHIP_CLASS}
                          >
                            {opt.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </Field>
                  </div>

                  {/* Furnishing */}
                  <Field>
                    <FieldLabel className="text-sm font-semibold text-[#1E293B] flex items-center gap-1.5">
                      <Sofa className="size-3.5 text-[#0F766E]" />
                      Furnishing
                    </FieldLabel>
                    <ToggleGroup
                      value={formData.furnishing ? [formData.furnishing] : []}
                      onValueChange={(vals) => {
                        if (vals.length > 0) updateField({ furnishing: vals[vals.length - 1] });
                      }}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full"
                    >
                      {FURNISHING_OPTIONS.map((opt) => (
                        <ToggleGroupItem
                          key={opt}
                          value={opt}
                          className={TOGGLE_CHIP_CLASS}
                        >
                          {opt}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 3: Security, Amenities & Utilities */}
      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#1E293B]">
                Features & Utilities
              </CardTitle>
              <CardDescription className="text-sm text-[#64748B]">
                Tap any features that come with this property or community.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator className="bg-[#E2E8F0]" />

        <CardContent className="pt-5">
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel className="text-sm font-semibold text-[#1E293B]">
                Security
              </FieldLabel>
              {renderChipGroup(SECURITY_OPTIONS, formData.securityFeatures || [], (item) =>
                toggleArrayItem('securityFeatures', item)
              )}
            </Field>

            <Field>
              <FieldLabel className="text-sm font-semibold text-[#1E293B]">
                Amenities
              </FieldLabel>
              {renderChipGroup(AMENITY_OPTIONS, formData.amenities || [], (item) =>
                toggleArrayItem('amenities', item)
              )}
            </Field>

            <Field>
              <FieldLabel className="text-sm font-semibold text-[#1E293B]">
                Utilities
              </FieldLabel>
              {renderChipGroup(UTILITY_OPTIONS, formData.utilities || [], (item) =>
                toggleArrayItem('utilities', item)
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
