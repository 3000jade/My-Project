import React, { useState } from 'react';
import { Landmark, ChevronDown } from 'lucide-react';
import { cn } from 'cn';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export const PARTNERED_BANKS = [
  'BDO Unibank (Banco de Oro)',
  'Bank of the Philippine Islands (BPI)',
  'Metrobank',
  'Security Bank',
  'UnionBank',
  'RCBC (Rizal Commercial Banking Corporation)',
  'China Bank (China Banking Corporation)',
  'Philippine National Bank (PNB)',
  'EastWest Bank',
  'Asia United Bank (AUB)',
  'Land Bank of the Philippines (LANDBANK)',
  'Development Bank of the Philippines (DBP)',
  'Pag-IBIG Fund (HDMF)',
  'PSBank (Philippine Savings Bank)',
  'China Bank Savings',
  'RCBC Savings',
  'PNB Savings',
  'Maybank Philippines',
  'Robinsons Bank',
  'CTBC Bank',
  'Bank of Commerce',
  'Philippine Business Bank (PBB)',
  'Sterling Bank of Asia',
];

/**
 * Searchable multi-select combobox for choosing one or more partnered housing lenders.
 */
export default function PartneredBankMultiSelect({
  id = 'partnered-bank-picker',
  selectedBankNames = [],
  onToggleBank,
  onClearAll,
}) {
  const [open, setOpen] = useState(false);

  const count = selectedBankNames.length;
  const triggerText =
    count === 0
      ? 'Select partnered banks or Pag-IBIG Fund'
      : count <= 2
      ? selectedBankNames.join(', ')
      : `${selectedBankNames.slice(0, 2).join(', ')} +${count - 2} more`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        type="button"
        aria-expanded={open}
        className={cn(
          'w-full h-11 bg-white border border-[#E2E8F0] rounded-lg px-3 text-sm font-medium flex items-center justify-between gap-2 text-left transition-colors cursor-pointer',
          'hover:border-[#CBD5E1] focus-visible:outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20'
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Landmark className="size-4 text-[#64748B] shrink-0" />
          <span className={cn('truncate', count === 0 ? 'text-[#64748B] font-normal' : 'text-[#1E293B]')}>
            {triggerText}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {count > 0 && (
            <Badge className="bg-[#F0FDFA] text-[#0F766E] border border-[#0F766E]/25 text-xs font-semibold px-2 py-0.5">
              {count}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              'size-4 text-[#64748B] transition-transform duration-150',
              open && 'rotate-180'
            )}
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-(--anchor-width) min-w-[280px] p-0 rounded-xl bg-white border border-[#E2E8F0] shadow-lg overflow-hidden"
      >
        <Command className="rounded-xl bg-white p-0">
          <CommandInput placeholder="Search banks or Pag-IBIG Fund..." />
          <CommandList className="max-h-64 p-1.5">
            <CommandEmpty className="py-5 text-center text-xs text-[#64748B]">
              No matching bank found.
            </CommandEmpty>
            {PARTNERED_BANKS.map((bankName) => {
              const isChecked = selectedBankNames.includes(bankName);
              return (
                <CommandItem
                  key={bankName}
                  value={bankName}
                  onSelect={() => onToggleBank?.(bankName)}
                  className="rounded-lg px-2.5 py-2 text-sm text-[#1E293B] flex items-center gap-2.5 cursor-pointer data-selected:bg-[#F0FDFA] data-selected:text-[#1E293B] [&>svg:last-child]:hidden"
                >
                  <Checkbox
                    checked={isChecked}
                    aria-hidden="true"
                    tabIndex={-1}
                    className="pointer-events-none"
                  />
                  <span className="truncate flex-1">{bankName}</span>
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>

        {count > 0 && (
          <div className="px-3 py-2 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-[#475569] font-medium">{count} selected</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onClearAll?.()}
                className="text-[#64748B] hover:text-[#FF6B6B] font-semibold cursor-pointer"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[#0F766E] hover:underline font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
