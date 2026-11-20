import React from 'react';
import { cn } from 'cn';
import { Building2 } from 'lucide-react';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import BuildingCoordinateMatcher from './BuildingCoordinateMatcher';

const SUBDIVISION_MAX = 128;

export default function SubdivisionLocationFields({
  formData = {},
  setFormData,
  setIsDirty,
}) {
  const updateField = (patch) => {
    setIsDirty?.(true);
    setFormData?.((prev) => ({ ...prev, ...patch }));
  };

  const subdivisionValue = formData.subdivision_name || formData.subdivision || '';
  const isNearLimit = subdivisionValue.length >= Math.floor(SUBDIVISION_MAX * 0.9);

  return (
    <div className="flex flex-col gap-4" data-testid="subdivision-location-fields">
      <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col gap-4">
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="subdivision-input" className="text-sm font-semibold text-[#1E293B]">
              Subdivision
            </FieldLabel>
            <InputGroup className="h-11 bg-white border-[#E2E8F0] rounded-lg">
              <InputGroupAddon align="inline-start">
                <Building2 className="text-[#64748B]" />
              </InputGroupAddon>
              <InputGroupInput
                id="subdivision-input"
                type="text"
                maxLength={SUBDIVISION_MAX}
                placeholder="e.g. Havila Highlands, Ayala Alabang"
                value={subdivisionValue}
                onChange={(e) =>
                  updateField({
                    subdivision: e.target.value,
                    subdivision_name: e.target.value,
                  })
                }
                className="text-sm text-[#1E293B]"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText
                  className={cn(
                    'text-xs tabular-nums',
                    isNearLimit ? 'text-[#FF6B6B] font-semibold' : 'text-[#64748B]'
                  )}
                >
                  {subdivisionValue.length} / {SUBDIVISION_MAX}
                </InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <BuildingCoordinateMatcher
              buildingName={subdivisionValue}
              currentLatitude={formData.latitude}
              currentLongitude={formData.longitude}
              onApplyCoordinates={(coords) => {
                updateField({
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  city: coords.city || formData.city,
                  barangay: coords.barangay || formData.barangay,
                });
              }}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field>
              <FieldLabel htmlFor="phase-input" className="text-sm font-semibold text-[#1E293B]">
                Phase
              </FieldLabel>
              <Input
                id="phase-input"
                type="text"
                maxLength={32}
                placeholder="Phase 2"
                value={formData.phase || ''}
                onChange={(e) => updateField({ phase: e.target.value })}
                className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm text-[#1E293B]"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="block-input" className="text-sm font-semibold text-[#1E293B]">
                Block
              </FieldLabel>
              <Input
                id="block-input"
                type="text"
                maxLength={32}
                placeholder="Block 12"
                value={formData.block || ''}
                onChange={(e) => updateField({ block: e.target.value })}
                className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm text-[#1E293B]"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="lot-input" className="text-sm font-semibold text-[#1E293B]">
                Lot
              </FieldLabel>
              <Input
                id="lot-input"
                type="text"
                maxLength={32}
                placeholder="Lot 4"
                value={formData.lot || ''}
                onChange={(e) => updateField({ lot: e.target.value })}
                className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm text-[#1E293B]"
              />
            </Field>
          </div>
        </FieldGroup>
      </div>
    </div>
  );
}
