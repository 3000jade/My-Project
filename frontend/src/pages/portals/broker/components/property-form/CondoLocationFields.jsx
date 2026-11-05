import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function CondoLocationFields({ formData = {}, setFormData, setIsDirty }) {
  const updateField = (key, val) => {
    setIsDirty?.(true);
    setFormData?.(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3" data-testid="condo-location-fields">
      <div className="flex flex-col gap-2">
        <Label htmlFor="building-name-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
          Building / Condo Name <span className="text-[#FF6B6B]">*</span>
        </Label>
        <Input
          id="building-name-input"
          type="text"
          placeholder="e.g. The Proscenium at Rockwell, Two Serendra"
          value={formData.building_name || ''}
          onChange={e => updateField('building_name', e.target.value)}
          className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tower-name-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
          Tower / Wing
        </Label>
        <Input
          id="tower-name-input"
          type="text"
          placeholder="e.g. The Lincoln Tower, West Wing"
          value={formData.tower_name || ''}
          onChange={e => updateField('tower_name', e.target.value)}
          className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="floor-level-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
          Floor Level
        </Label>
        <Input
          id="floor-level-input"
          type="text"
          placeholder="e.g. 28"
          value={formData.floor_level || ''}
          onChange={e => updateField('floor_level', e.target.value)}
          className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="unit-number-input" className="text-sm leading-5 font-semibold text-[#1E293B]">
          Unit Number
        </Label>
        <Input
          id="unit-number-input"
          type="text"
          placeholder="e.g. Unit 28-B"
          value={formData.unit_number || ''}
          onChange={e => updateField('unit_number', e.target.value)}
          className="h-11 md:h-10 [@media(pointer:coarse)]:h-11 rounded-md text-sm shadow-none"
        />
      </div>
    </div>
  );
}
