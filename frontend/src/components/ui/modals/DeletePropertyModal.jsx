import React from 'react';
import { Trash2, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export default function DeletePropertyModal({
  isOpen = false,
  onClose,
  onConfirm,
  property = null,
  selectedCount = 0,
  isDeleting = false,
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
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose && onClose()}>
      <AlertDialogContent className="sm:max-w-md p-6 font-sans">
        <AlertDialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200/80 text-red-600 flex items-center justify-center">
            <Trash2 className="w-6 h-6 stroke-[2]" />
          </div>

          <div>
            <AlertDialogTitle className="text-lg font-bold text-[#1E293B]">
              {isBatch
                ? `Permanently Delete ${selectedCount} Listings?`
                : 'Permanently Delete Listing?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748B] mt-1 leading-relaxed">
              This action cannot be undone. This listing and its configuration records will be permanently removed from the firm's database.
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
                  <Trash2 className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-semibold text-[#0F766E] block truncate">
                {property.listingKey || property.id || 'HSR-LISTING'}
              </span>
              <h4 className="text-xs font-bold text-[#1E293B] truncate">{title}</h4>
              <p className="text-xs font-mono font-bold text-red-600 mt-0.5">{priceDisplay}</p>
            </div>
          </div>
        )}

        {/* Warning Callout */}
        <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs space-y-1.5 text-amber-900">
          <div className="flex items-center gap-1.5 font-semibold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Caution: Irreversible Deletion</span>
          </div>
          <p className="text-[11px] text-amber-700 leading-normal">
            If this listing has past client inquiries, active leads, or historical sales value you wish to preserve for compliance, choose <strong>Archive</strong> instead.
          </p>
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
            disabled={isDeleting}
            className="text-xs font-semibold h-10 px-4"
          >
            Cancel
          </AlertDialogCancel>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold h-10 px-4 gap-2 cursor-pointer shadow-xs"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBatch ? `Delete ${selectedCount} Listings` : 'Delete Permanently'}</span>
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
