import React, { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { getAssetFamily, CATEGORY_AMENITIES_MAP } from './propertyTypeConfig';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function CategoryAmenitiesPicker({
  formData = {},
  setFormData,
  setIsDirty,
}) {
  const [customTag, setCustomTag] = useState('');
  const family = getAssetFamily(formData.property_type);
  const availableAmenities = CATEGORY_AMENITIES_MAP[family] || CATEGORY_AMENITIES_MAP.dwelling;

  // Selected amenities array from either formData.amenities or formData.interior_features
  const selectedList = Array.isArray(formData.amenities)
    ? formData.amenities
    : (Array.isArray(formData.interior_features) ? formData.interior_features : []);
  const selectedSet = new Set(selectedList);

  const toggleAmenity = (name) => {
    setIsDirty?.(true);
    const updated = new Set(selectedSet);
    if (updated.has(name)) {
      updated.delete(name);
    } else {
      updated.add(name);
    }
    const nextList = Array.from(updated);
    setFormData?.(prev => ({
      ...prev,
      amenities: nextList,
      interior_features: nextList,
      features: nextList,
    }));
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    const trimmed = customTag.trim();
    if (!trimmed) return;
    toggleAmenity(trimmed);
    setCustomTag('');
  };

  return (
    <div className="flex flex-col gap-4" data-testid="category-amenities-picker">
      <div className="flex flex-col gap-1">
        <span className="text-sm leading-5 font-semibold text-[#1E293B]">
          Category-Tailored Features & Amenities
        </span>
        <span className="text-xs text-[#64748B]">
          Select all applicable features or add specific custom items.
        </span>
      </div>

      {/* Preset Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
        {availableAmenities.map((item) => {
          const isChecked = selectedSet.has(item);
          return (
            <button
              type="button"
              key={item}
              onClick={() => toggleAmenity(item)}
              aria-pressed={isChecked}
              className={`flex w-full min-h-11 md:min-h-8 [@media(pointer:coarse)]:min-h-11 items-center gap-2 px-2 py-1.5 rounded-md text-sm leading-5 text-left font-medium transition-colors border cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${
                isChecked
                  ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-none font-semibold'
                  : 'bg-white text-[#1E293B] border-[#E2E8F0] hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Check aria-hidden="true" className={`size-4 stroke-[3] shrink-0 ${isChecked ? 'visible' : 'invisible'}`} />
              <span className="min-w-0 break-words">{item}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Amenity Tag Entry */}
      <div className="flex w-full flex-col md:flex-row md:items-center gap-2 pt-3 border-t border-slate-100">
        <Input
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          placeholder="Add custom feature..."
          className="min-w-0 w-full h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustom(e);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAddCustom}
          className="w-full md:w-auto h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md px-3 text-sm font-semibold shadow-none border-[#E2E8F0] shrink-0"
        >
          <Plus className="size-3.5 mr-1 text-[#0F766E]" />
          <span>Add</span>
        </Button>
      </div>
    </div>
  );
}

