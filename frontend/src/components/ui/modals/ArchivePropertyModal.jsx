import React from 'react';
import { Archive, ShieldCheck, CheckCircle2, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export default function ArchivePropertyModal({
  isOpen = false,
  onClose,
  onConfirm,
  property = null,
  selectedCount = 0,
  isArchiving = false,
  error = null,
}) {
  if (!isOpen) return null;

  const isBatch = Boolean(selectedCount > 1 || (!property && selectedCount > 0));
  const title = property?.title || property?.name || 'Untitled Listing';
  const priceDisplay = property
    ? typeof property.price === 'number'
      ? `₱${property.price.toLocaleString()}`
      : property.price || 'Price upon request'
    : '';

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isArchiving && onClose && onClose()}>
      <AlertDialogContent className="sm:max-w-md p-6 font-sans">
        <AlertDialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center">
            <Archive className="w-6 h-6 stroke-[2]" />
          </div>

          <div>
            <AlertDialogTitle className="text-lg font-bold text-[#1E293B]">
              {isBatch
                ? `Archive ${selectedCount} Property Listings?`
                : 'Archive Property Listing?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Archiving safely removes property listings from public view while preserving all historical records, inquiries, and audit data.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {/* Single Property Preview Card */}
        {!isBatch && property && (
          <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50 flex items-center gap-3">
            <div className="w-14 h-14 rounded-md overflow-hidden bg-slate-200 shrink-0 border border-slate-300/70">
              {property.mainImage || property.images?.[0] ? (
                <img
                  src={property.mainImage || property.images[0]}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Archive className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-semibold text-[#0F766E] block truncate">
                {property.listingKey || property.id || 'HSR-LISTING'}
              </span>
              <h4 className="text-xs font-bold text-[#1E293B] truncate">{title}</h4>
              <p className="text-xs font-mono font-bold text-[#0F766E] mt-0.5">{priceDisplay}</p>
            </div>
          </div>
        )}

        {/* Archiving Benefits Callout */}
        <div className="p-3.5 rounded-lg bg-teal-50/70 border border-teal-200/80 text-xs space-y-2 text-[#0F766E]">
          <div className="flex items-center gap-1.5 font-semibold text-[#0F766E]">
            <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
            <span>Preserved with 1-Click Reactivation</span>
          </div>
          <ul className="space-y-1 text-[11px] text-[#134E4A] pl-5 list-disc">
            <li>Unpublished from public buyer discovery immediately</li>
            <li>All client inquiries, tour bookings, and agent history remain intact</li>
            <li>Can be restored to <strong>Active</strong> status anytime with one click</li>
          </ul>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="truncate">{error}</span>
          </div>
        )}

        <AlertDialogFooter className="pt-3">
          <AlertDialogCancel
            onClick={onClose}
            disabled={isArchiving}
            className="text-xs font-semibold h-10 px-4"
          >
            Cancel
          </AlertDialogCancel>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isArchiving}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold h-10 px-4 gap-2 cursor-pointer shadow-xs"
          >
            {isArchiving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Archiving...</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5" />
                <span>{isBatch ? `Archive ${selectedCount} Listings` : 'Archive Listing'}</span>
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
