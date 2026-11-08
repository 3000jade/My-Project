import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import BuildingCoordinateMatcher from './BuildingCoordinateMatcher';

export default function SubdivisionLocationFields({
  formData = {},
  setFormData,
  setIsDirty,
  subdivisionsList = [],
  isCustomSubdivisionMode,
  setIsCustomSubdivisionMode,
  setIsSubdivisionModalOpen,
  handleSubdivisionSelect,
}) {
  return (
    <div className="flex flex-col gap-4" data-testid="subdivision-location-fields">
      <div className="p-3 bg-slate-50/80 border border-[#CBD5E1] rounded-md flex flex-col gap-4">
        {/* Master Subdivision Project Header & Actions */}
        <div className="flex flex-col md:flex-row md:flex-wrap md:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
          <div>
            <span className="text-sm leading-5 font-semibold text-[#0F766E] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">domain</span>
              <span>Master Subdivision Project</span>
            </span>
            <p className="text-xs leading-4 text-[#64748B]">
              Select a registered master project to unlock Cadastral Studio mapped lots
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCustomSubdivisionMode?.(!isCustomSubdivisionMode)}
              className="h-auto min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 whitespace-normal py-2 text-sm font-semibold text-[#0F766E] hover:underline cursor-pointer"
            >
              {isCustomSubdivisionMode ? '← Pick from Master Projects' : 'Enter Custom / Unlisted Name'}
            </button>
            {setIsSubdivisionModalOpen && (
              <button
                type="button"
                onClick={() => setIsSubdivisionModalOpen(true)}
                className="inline-flex h-auto min-h-11 md:min-h-10 [@media(pointer:coarse)]:min-h-11 whitespace-normal items-center gap-2 px-3 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-semibold rounded-md shadow-none transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>New Project</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Subdivision Name or Select */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="subdivision-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
              Subdivision Name <span className="text-[#FF6B6B]">*</span>
            </Label>
            {isCustomSubdivisionMode ? (
              <>
                <Input
                  id="subdivision-input"
                  type="text"
                  placeholder="e.g. Havila Highlands Executive Subdivision, Ayala Alabang"
                  value={formData.subdivision_name || formData.subdivision || ''}
                  onChange={e => {
                    setIsDirty?.(true);
                    setFormData?.({
                      ...formData,
                      subdivision: e.target.value,
                      subdivision_name: e.target.value,
                      subdivision_project_id: null,
                      subdivision_lot_id: null,
                    });
                  }}
                  className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none"
                />
                <BuildingCoordinateMatcher
                  buildingName={formData.subdivision_name || formData.subdivision}
                  currentLatitude={formData.latitude}
                  currentLongitude={formData.longitude}
                  onApplyCoordinates={(coords) => {
                    setIsDirty?.(true);
                    setFormData?.(prev => ({
                      ...prev,
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                      city: coords.city || prev.city,
                      barangay: coords.barangay || prev.barangay,
                    }));
                  }}
                />
              </>
            ) : (
              <select
                id="subdivision-project-select"
                value={formData.subdivision_project_id || ''}
                onChange={e => handleSubdivisionSelect && handleSubdivisionSelect(e.target.value)}
                className="w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 px-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-md text-sm font-medium text-[#1E293B] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none shadow-none transition-colors cursor-pointer"
              >
                <option value="">-- Select Master Subdivision Project --</option>
                {subdivisionsList.map(proj => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name} {proj.city ? `(${proj.city})` : ''} {proj.developer_name ? `• ${proj.developer_name}` : ''}
                  </option>
                ))}
                <option value="__CUSTOM__">-- Other / Unlisted Subdivision --</option>
              </select>
            )}
          </div>

          {/* Phase, Block, Lot Inline Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phase-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
                Phase
              </Label>
              <Input
                id="phase-input"
                type="text"
                placeholder="Phase 2"
                value={formData.phase || ''}
                onChange={e => {
                  setIsDirty?.(true);
                  setFormData?.({ ...formData, phase: e.target.value });
                }}
                className="min-w-0 w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm text-center font-semibold shadow-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="block-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
                Block
              </Label>
              <Input
                id="block-input"
                type="text"
                placeholder="Block 12"
                value={formData.block || ''}
                onChange={e => {
                  setIsDirty?.(true);
                  setFormData?.({ ...formData, block: e.target.value });
                }}
                className="min-w-0 w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm text-center font-semibold shadow-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="lot-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
                Lot
              </Label>
              <Input
                id="lot-input"
                type="text"
                placeholder="Lot 4"
                value={formData.lot || ''}
                onChange={e => {
                  setIsDirty?.(true);
                  setFormData?.({ ...formData, lot: e.target.value });
                }}
                className="min-w-0 w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm text-center font-semibold shadow-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
