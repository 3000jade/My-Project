import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function SubdivisionLotSpecs({ formData = {}, setFormData, setIsDirty }) {
  return (
    <div className="flex flex-col gap-4" data-testid="subdivision-lot-specs">
      {/* 1. Lot Area & Dimensions */}
      <div className="flex flex-col gap-4">
        <h4 className="text-sm leading-5 font-semibold text-[#0F766E] flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <span className="material-symbols-outlined text-[16px]">straighten</span>
          <span>Lot Dimensions & Survey Area</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-3">
          {/* Lot Area & Unit */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="lot-size-area-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Lot Area <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="flex border border-[#CBD5E1] hover:border-slate-400 rounded-md overflow-hidden bg-white focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E] shadow-none transition-colors">
              <input
                id="lot-size-area-input"
                aria-label="Lot Area"
                required
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 270"
                value={formData.lot_size_area ?? ''}
                onChange={e => {
                  const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                  setIsDirty?.(true);
                  setFormData?.({ ...formData, lot_size_area: val, lot_area: val });
                }}
                className="flex-1 min-w-0 h-11 md:h-10 [@media(pointer:coarse)]:h-11 px-3.5 bg-transparent outline-none text-sm font-semibold text-[#1E293B]"
              />
              <select
                aria-label="Lot Area Unit"
                value={formData.lot_size_units || 'Square Meters'}
                onChange={e => {
                  setIsDirty?.(true);
                  setFormData?.({
                    ...formData,
                    lot_size_units: e.target.value,
                    lot_area_unit: e.target.value === 'Square Meters' ? 'sqm' : 'sqft',
                  });
                }}
                className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 px-3 bg-slate-50 border-l border-[#CBD5E1] text-sm font-semibold text-[#1E293B] outline-none cursor-pointer hover:bg-slate-100 transition-colors shrink-0"
              >
                <option value="Square Meters">sqm</option>
                <option value="Square Feet">sqft</option>
              </select>
            </div>
            {formData.lot_size_area && (
              <p className="text-xs leading-4 text-[#64748B]">
                Equivalent: {formData.lot_size_units === 'Square Feet'
                  ? `${(Number(formData.lot_size_area) / 10.7639).toFixed(2)} sqm`
                  : `${Math.round(Number(formData.lot_size_area) * 10.7639).toLocaleString()} sqft`}
              </p>
            )}
          </div>

          {/* Road Frontage */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="frontage-meters-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Road Frontage (m) <span className="text-[#FF6B6B]">*</span>
            </Label>
            <Input
              id="frontage-meters-input"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 15"
              value={formData.frontage_meters || ''}
              onChange={e => {
                setIsDirty?.(true);
                setFormData?.({
                  ...formData,
                  frontage_meters: e.target.value,
                  lot_frontage: `${e.target.value}m frontage`,
                });
              }}
              className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none"
            />
          </div>

          {/* Lot Depth */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="depth-meters-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Lot Depth (m) <span className="text-[#FF6B6B]">*</span>
            </Label>
            <Input
              id="depth-meters-input"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 18"
              value={formData.depth_meters || ''}
              onChange={e => {
                setIsDirty?.(true);
                setFormData?.({ ...formData, depth_meters: e.target.value });
              }}
              className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none"
            />
          </div>

        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          {/* Lot Position */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="lot-position-select" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Lot Position / Cut
            </Label>
            <select
              id="lot-position-select"
              value={formData.lot_position || 'corner'}
              onChange={e => {
                setIsDirty?.(true);
                setFormData?.({ ...formData, lot_position: e.target.value });
              }}
              className="w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-none transition-colors"
            >
              <option value="corner">Corner Lot</option>
              <option value="inner">Regular / Inner Lot</option>
              <option value="through">Through Lot (Dual Road Access)</option>
              <option value="end">End / Cul-de-sac Lot</option>
            </select>
          </div>

          {/* Topography */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="lot-topography-select" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Topography / Terrain
            </Label>
            <select
              id="lot-topography-select"
              value={formData.terrain || 'level'}
              onChange={e => {
                setIsDirty?.(true);
                setFormData?.({ ...formData, terrain: e.target.value });
              }}
              className="w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-none transition-colors"
            >
              <option value="level">Flat / Level</option>
              <option value="rolling">Gently Rolling</option>
              <option value="sloping">Sloping / Hillside</option>
              <option value="elevated">Elevated (Overlooking / Ridge)</option>
            </select>
          </div>

          {/* Facing Direction */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="lot-facing-select" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Sun Orientation / Facing
            </Label>
            <select
              id="lot-facing-select"
              value={formData.facing_direction || 'east'}
              onChange={e => {
                setIsDirty?.(true);
                setFormData?.({ ...formData, facing_direction: e.target.value });
              }}
              className="w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-none transition-colors"
            >
              <option value="east">East (Morning Sun)</option>
              <option value="west">West (Afternoon Sun)</option>
              <option value="north">North</option>
              <option value="south">South</option>
            </select>
          </div>

          {/* Title Status */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="lot-title-status-select" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Property Title Status
            </Label>
            <select
              id="lot-title-status-select"
              value={formData.title_status || 'clean'}
              onChange={e => {
                setIsDirty?.(true);
                setFormData?.({ ...formData, title_status: e.target.value });
              }}
              className="w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-none transition-colors"
            >
              <option value="clean">Clean Title (TCT)</option>
              <option value="mortgaged">Under Bank Mortgage</option>
              <option value="tax_declaration">Tax Declaration Only</option>
            </select>
          </div>

          {/* Cadastral Reference */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="lot-cadastral-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Cadastral Survey Reference
            </Label>
            <Input
              id="lot-cadastral-input"
              type="text"
              placeholder="e.g. Lot 4, Block 12, Psd-04-098231"
              value={formData.cadastral_reference || formData.cadastralLotId || ''}
              onChange={e => {
                setIsDirty?.(true);
                setFormData?.({
                  ...formData,
                  cadastral_reference: e.target.value,
                  cadastralLotId: e.target.value,
                });
              }}
              className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
