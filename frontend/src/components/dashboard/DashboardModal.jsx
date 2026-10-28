import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../ui/dialog';
import { cn } from '../../utils/cn';

export default function DashboardModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-2xl",
  actions
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && onClose) onClose(); }}>
      <DialogContent
        data-testid="broker-dialog"
        className={cn(
          "w-full bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 text-[#1E293B] dark:text-slate-100 rounded-2xl shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]",
          maxWidth
        )}
      >
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/50 space-y-0">
          <div>
            {title && (
              <DialogTitle className="text-xl font-display font-bold text-[#1E293B] dark:text-slate-100">
                {title}
              </DialogTitle>
            )}
            {subtitle && (
              <DialogDescription className="text-xs font-sans text-[#64748B] dark:text-slate-400 mt-0.5">
                {subtitle}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        <div data-lenis-prevent="true" className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>

        {actions && (
          <DialogFooter className="px-6 py-4 border-t border-[#E2E8F0] dark:border-slate-800 bg-[#F1F0EC]/30 dark:bg-slate-800/30 flex items-center justify-end gap-3 sm:space-x-0">
            {actions}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
