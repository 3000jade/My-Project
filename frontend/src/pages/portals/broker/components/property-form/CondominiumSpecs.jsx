import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function CondominiumSpecs({ formData = {}, setFormData, setIsDirty }) {
  return (
    <div className="flex flex-col gap-4" data-testid="condominium-specs">
      {/* 1. Usable Floor Area & Tower Details */}
      <div className="flex flex-col gap-4">
        <h4 className="text-sm leading-5 font-semibold text-[#0F766E] flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <span className="material-symbols-outlined text-[16px]">apartment</span>
          <span>Strata Usable Floor Area & Tower Details</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          {/* Floor Area */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="condo-floor-area-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Usable Floor Area <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="flex border border-[#CBD5E1] hover:border-slate-400 rounded-md overflow-hidden bg-white focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-none transition-colors">
              <input
                id="condo-floor-area-input"
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 118"
                value={formData.living_area ?? ''}
                onChange={e => {
                  const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                  setIsDirty?.(true);
                  setFormData?.({ ...formData, living_area: val, floor_area: val });
                }}
                className="flex-1 min-w-0 h-11 md:h-10 [@media(pointer:coarse)]:h-11 px-3.5 bg-transparent outline-none text-sm font-semibold text-[#1E293B]"
              />
              <select
                aria-label="Floor Area Unit"
                value={formData.living_area_units || 'Square Meters'}
                onChange={e => {
                  setIsDirty?.(true);
                  setFormData?.({
                    ...formData,
                    living_area_units: e.target.value,
                    floor_area_unit: e.target.value === 'Square Meters' ? 'sqm' : 'sqft',
                  });
                }}
                className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 px-3 bg-slate-50 border-l border-[#CBD5E1] text-sm font-semibold text-[#1E293B] outline-none cursor-pointer hover:bg-slate-100 transition-colors shrink-0"
              >
                <option value="Square Meters">sqm</option>
                <option value="Square Feet">sqft</option>
              </select>
            </div>
            {formData.living_area && (
              <p className="text-xs leading-4 text-[#64748B]">
                Equivalent: {formData.living_area_units === 'Square Meters'
                  ? `${Math.round(Number(formData.living_area) * 10.7639).toLocaleString()} sqft`
                  : `${(Number(formData.living_area) / 10.7639).toFixed(2)} sqm`}
              </p>
            )}
          </div>

          {/* Floor Level */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="condo-floor-level-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Floor Level
            </Label>
            <Input
              id="condo-floor-level-input"
              type="text"
              placeholder="e.g. 28th Floor, Unit 2804"
              value={formData.floor_level || ''}
              onChange={e => {
                setIsDirty?.(true);
                setFormData?.({ ...formData, floor_level: e.target.value });
              }}
              className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none"
            />
          </div>

          {/* Tower Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="condo-tower-name-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Tower / Building Name
            </Label>
            <Input
              id="condo-tower-name-input"
              type="text"
              placeholder="e.g. Horizon Tower B"
              value={formData.tower_name || ''}
              onChange={e => {
                setIsDirty?.(true);
                setFormData?.({ ...formData, tower_name: e.target.value });
              }}
              className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Balcony & Strata Unit Configuration */}
      <div className="flex flex-col gap-4">
        <h4 className="text-sm leading-5 font-semibold text-[#0F766E] flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <span className="material-symbols-outlined text-[16px]">balcony</span>
          <span>Balcony Details & Strata Unit Configuration</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="condo-unit-type-select" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Unit Layout
            </Label>
            <select
              id="condo-unit-type-select"
              value={formData.condo_unit_type || '2bedroom'}
              onChange={e => {
                setIsDirty?.(true);
                setFormData?.({ ...formData, condo_unit_type: e.target.value });
              }}
              className="w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-none transition-colors"
            >
              <option value="studio">Studio Unit</option>
              <option value="1bedroom">1-Bedroom Executive</option>
              <option value="2bedroom">2-Bedroom Suite</option>
              <option value="3bedroom">3-Bedroom Prime</option>
              <option value="penthouse">Penthouse Suite</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="condo-balcony-area-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Balcony Area (sqm)
            </Label>
            <Input
              id="condo-balcony-area-input"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 12"
              value={formData.balcony_area || ''}
              onChange={e => {
                const val = e.target.value;
                setIsDirty?.(true);
                setFormData?.({
                  ...formData,
                  balcony_area: val,
                  has_balcony: Boolean(parseFloat(val) > 0),
                });
              }}
              className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="condo-balcony-facing-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Balcony View Facing
            </Label>
            <Input
              id="condo-balcony-facing-input"
              type="text"
              placeholder="e.g. Makati CBD Skyline & Pasig River"
              value={formData.balcony_facing || ''}
              onChange={e => {
                setIsDirty?.(true);
                setFormData?.({ ...formData, balcony_facing: e.target.value });
              }}
              className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none"
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="condo-parking-slot-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Dedicated Parking Slot Number
            </Label>
            <Input
              id="condo-parking-slot-input"
              type="text"
              placeholder="e.g. Basement 2, Slot #142"
              value={formData.parking_slot_number || ''}
              onChange={e => {
                setIsDirty?.(true);
                setFormData?.({
                  ...formData,
                  parking_slot_number: e.target.value,
                  has_dedicated_parking_slot: Boolean(e.target.value.trim()),
                });
              }}
              className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* 3. Bedrooms & Bathrooms */}
      <div className="flex flex-col gap-4">
        <h4 className="text-sm leading-5 font-semibold text-[#0F766E] flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <span className="material-symbols-outlined text-[16px]">hotel</span>
          <span>Bedrooms & Bathrooms</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="condo-bedrooms-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Bedrooms
            </Label>
            <Input
              id="condo-bedrooms-input"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={formData.bedrooms_total ?? ''}
              onChange={e => {
                const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                setIsDirty?.(true);
                setFormData?.({ ...formData, bedrooms_total: val, bedrooms: String(val) });
              }}
              className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="condo-bathrooms-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Total Bathrooms
            </Label>
            <Input
              id="condo-bathrooms-input"
              type="number"
              min="0"
              step="1"
              placeholder="1"
              value={formData.bathrooms_total_integer ?? ''}
              onChange={e => {
                const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                setIsDirty?.(true);
                setFormData?.({ ...formData, bathrooms_total_integer: val, bathrooms: String(val) });
              }}
              className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none"
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-1">
            <Label htmlFor="condo-title-type-select" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Title Type
            </Label>
            <select
              id="condo-title-type-select"
              value={formData.title_status || 'cct'}
              onChange={e => {
                setIsDirty?.(true);
                setFormData?.({ ...formData, title_status: e.target.value });
              }}
              className="w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-none transition-colors"
            >
              <option value="cct">Condominium Certificate of Title (CCT)</option>
              <option value="clean">Clean TCT/CCT</option>
              <option value="mortgaged">Under Bank Financing / Mortgage</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
