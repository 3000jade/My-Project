import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Accordion({ 
  title, 
  description, 
  defaultOpen = false, 
  children, 
  className 
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("bg-white border border-[#E5EBEB] rounded-xl overflow-hidden transition-colors", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FBFBF9] transition-colors cursor-pointer select-none"
      >
        <div className="space-y-0.5">
          <h4 className="text-xs font-semibold text-[#0F172A]">{title}</h4>
          {description && (
            <p className="text-[11px] text-slate-500 font-normal">{description}</p>
          )}
        </div>
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 group-hover:text-slate-600">
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 pt-0 border-t border-[#E5EBEB] bg-[#FBFBF9]/40 text-xs">
          {children}
        </div>
      )}
    </div>
  );
}

export default Accordion;
