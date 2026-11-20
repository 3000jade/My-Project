import React, { useMemo } from 'react';
import { cn } from 'cn';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Shared shadcn/ui Select wrapper for the Create Listing form.
 * Supports flat options or grouped options, leading/option icons, and always displays readable labels.
 */
export default function FormSelect({
  id,
  value,
  onValueChange,
  options = [],
  groups = null,
  placeholder = 'Select an option',
  icon: TriggerIcon = null,
  disabled = false,
  allowClear = false,
  clearLabel = 'None',
  className,
}) {
  const normalizeList = (list) =>
    (list || []).map((opt) =>
      typeof opt === 'string'
        ? { value: opt, label: opt }
        : { ...opt, value: String(opt.value) }
    );

  const selectedValue = value ? String(value) : null;

  const selectedLabel = useMemo(() => {
    if (!selectedValue) return '';
    if (Array.isArray(groups) && groups.length > 0) {
      for (const grp of groups) {
        const found = normalizeList(grp.options).find((o) => o.value === selectedValue);
        if (found) return found.label;
      }
    }
    const foundFlat = normalizeList(options).find((o) => o.value === selectedValue);
    return foundFlat ? foundFlat.label : selectedValue;
  }, [selectedValue, options, groups]);

  const renderItems = (list) =>
    normalizeList(list).map((opt) => {
      const OptionIcon = opt.icon || null;
      return (
        <SelectItem
          key={opt.value}
          value={opt.value}
          className="rounded-lg text-sm text-[#1E293B]"
        >
          {OptionIcon && <OptionIcon className="text-[#0F766E] shrink-0" />}
          <span className="truncate">{opt.label}</span>
        </SelectItem>
      );
    });

  return (
    <Select
      value={selectedValue}
      onValueChange={(next) => {
        if (next === '__CLEAR__') {
          onValueChange?.('');
          return;
        }
        onValueChange?.(next ?? '');
      }}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        className={cn(
          'w-full h-11 bg-white border-[#E2E8F0] rounded-lg px-3 text-sm font-medium text-[#1E293B] focus-visible:border-[#0F766E] focus-visible:ring-[#0F766E]/20 disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]',
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {TriggerIcon && <TriggerIcon className="size-4 text-[#64748B] shrink-0" />}
          <SelectValue placeholder={placeholder} className="truncate">
            {selectedValue ? (
              <span className="truncate">{selectedLabel}</span>
            ) : null}
          </SelectValue>
        </div>
      </SelectTrigger>

      <SelectContent
        alignItemWithTrigger={false}
        className="bg-white border border-[#E2E8F0] rounded-xl shadow-lg max-h-72 p-1"
      >
        {allowClear && (
          <SelectGroup>
            <SelectItem value="__CLEAR__" className="rounded-lg text-sm text-[#64748B]">
              {clearLabel}
            </SelectItem>
          </SelectGroup>
        )}

        {Array.isArray(groups) && groups.length > 0 ? (
          groups.map((grp) => (
            <SelectGroup key={grp.label}>
              <SelectLabel className="text-xs font-semibold text-[#64748B] px-3 py-1.5">
                {grp.label}
              </SelectLabel>
              {renderItems(grp.options)}
            </SelectGroup>
          ))
        ) : (
          <SelectGroup>{renderItems(options)}</SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
