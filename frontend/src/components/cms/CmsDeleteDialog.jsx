import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CmsDeleteDialog({
  item,
  isDeleting = false,
  error = '',
  onClose,
  onConfirm,
}) {
  const title = item?.title || 'this item';

  return (
    <AlertDialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open && !isDeleting) {
          onClose?.();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{title}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes &ldquo;{title}&rdquo; from the CMS and cannot be undone.
            If you only want to hide it from the public website without losing its data, cancel and use Archive instead.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            onClick={() => {
              if (!isDeleting) {
                onClose?.();
              }
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            onClick={(event) => {
              event.preventDefault();
              if (!isDeleting) {
                onConfirm?.();
              }
            }}
          >
            {isDeleting && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
            <span>Delete Permanently</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
