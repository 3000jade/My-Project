import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function HouseAndLotSpecs({ formData = {}, setFormData, setIsDirty }) {
  return (
    <div className="flex flex-col gap-4" data-testid="house-and-lot-specs">
      {/* 1. Dual Area Metrics (Lot Area & Floor Area) */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm leading-5 font-semibold text-[#0F766E] flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <span className="material-symbols-outlined text-[16px]">aspect_ratio</span>
          <span>Lot & Floor Area Dimensions</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          {/* Lot Area & Unit */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="house-lot-size-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Lot Area <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative flex items-center">
              <Input
                id="house-lot-size-input"
                aria-label="Lot Area"
                required
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 350"
                value={formData.lot_size_area ?? ''}
                onChange={e => {
                  const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                  setIsDirty?.(true);
                  setFormData?.({ ...formData, lot_size_area: val, lot_area: val, lot_size_units: 'Square Meters', lot_area_unit: 'sqm' });
                }}
                className="min-w-0 w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 pr-12 text-sm font-semibold rounded-md shadow-none"
              />
              <span className="absolute right-3 text-sm font-semibold text-[#64748B] pointer-events-none">
                sqm
              </span>
            </div>
          </div>

          {/* Usable Floor Area & Unit */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="house-floor-area-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Floor Area <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative flex items-center">
              <Input
                id="house-floor-area-input"
                aria-label="Floor Area"
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 450"
                value={formData.living_area ?? ''}
                onChange={e => {
                  const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                  setIsDirty?.(true);
                  setFormData?.({ ...formData, living_area: val, floor_area: val, living_area_units: 'Square Meters', floor_area_unit: 'sqm' });
                }}
                className="min-w-0 w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 pr-12 text-sm font-semibold rounded-md shadow-none"
              />
              <span className="absolute right-3 text-sm font-semibold text-[#64748B] pointer-events-none">
                sqm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Architectural Structure & Room Details */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm leading-5 font-semibold text-[#0F766E] flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <span className="material-symbols-outlined text-[16px]">home</span>
          <span>Architectural Structure & Rooms</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-3">
          {/* Bedrooms */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="house-bedrooms-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Bedrooms
            </Label>
            <Input
              id="house-bedrooms-input"
              type="number"
              min="0"
              step="1"
              placeholder="4"
              value={formData.bedrooms_total ?? ''}
              onChange={e => {
                const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                setIsDirty?.(true);
                setFormData?.({ ...formData, bedrooms_total: val, bedrooms: String(val) });
              }}
              className="min-w-0 w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 text-center text-sm font-semibold rounded-md shadow-none"
            />
          </div>

          {/* Bathrooms */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="house-bathrooms-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Bathrooms
            </Label>
            <Input
              id="house-bathrooms-input"
              type="number"
              min="0"
              step="1"
              placeholder="3"
              value={formData.bathrooms_total_integer ?? ''}
              onChange={e => {
                const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                setIsDirty?.(true);
                setFormData?.({ ...formData, bathrooms_total_integer: val, bathrooms: String(val) });
              }}
              className="min-w-0 w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 text-center text-sm font-semibold rounded-md shadow-none"
            />
          </div>

          {/* Stories */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="house-stories-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Stories
            </Label>
            <Input
              id="house-stories-input"
              type="number"
              min="1"
              step="1"
              placeholder="2"
              value={formData.stories_total || ''}
              onChange={e => {
                const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1);
                setIsDirty?.(true);
                setFormData?.({ ...formData, stories_total: val, stories: val, levels: String(val) });
              }}
              className="min-w-0 w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 text-center text-sm font-semibold rounded-md shadow-none"
            />
          </div>

          {/* Carport / Garage */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="house-parking-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Carport / Garage
            </Label>
            <Input
              id="house-parking-input"
              type="number"
              min="0"
              step="1"
              placeholder="2"
              value={formData.parking_total ?? ''}
              onChange={e => {
                const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                setIsDirty?.(true);
                setFormData?.({ ...formData, parking_total: val, garage_spaces: String(val) });
              }}
              className="min-w-0 w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 text-center text-sm font-semibold rounded-md shadow-none"
            />
          </div>
        </div>

        {/* Cadastral Specs & Extras Inline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          {/* Title Type & Status */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="house-title-status-select" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Property Title Status
            </Label>
            <select
              id="house-title-status-select"
              data-testid="property-title-status-select"
              value={formData.title_status || 'clean'}
              onChange={e => {
                setIsDirty?.(true);
                setFormData?.({ ...formData, title_status: e.target.value });
              }}
              className="min-w-0 w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-none transition-colors cursor-pointer"
            >
              <option value="clean">Clean Title (Transfer Certificate of Title - TCT)</option>
              <option value="mortgaged">Under Bank Mortgage</option>
              <option value="tax_declaration">Tax Declaration Only</option>
            </select>
          </div>

          {/* Maid's Room Toggle */}
          <div className="flex items-center md:items-end">
            <label className="flex min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(formData.has_maids_room)}
                onChange={e => {
                  setIsDirty?.(true);
                  setFormData?.({ ...formData, has_maids_room: e.target.checked });
                }}
                className="size-4 text-[#0F766E] rounded border-[#CBD5E1] focus:ring-[#0F766E]"
              />
              <span className="text-sm leading-5 font-semibold text-[#1E293B]">
                Includes Maid's / Staff Quarters with En-suite Bath
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
