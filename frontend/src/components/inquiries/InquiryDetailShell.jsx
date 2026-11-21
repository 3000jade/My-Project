import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import PageHeader from '../dashboard/PageHeader';
import {
  Alert,
  AlertTitle,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  ShadcnButton as Button,
  Toaster,
} from '../ui';
import { InquiryDetailSkeleton } from '../dashboard/skeletons';

export default function InquiryDetailShell({
  testId,
  loading = false,
  error = null,
  inquiry = null,
  backTo = '/inquiries',
  backLabel = 'Back to Inquiries',
  breadcrumbs = [],
  title,
  subtitle,
  badge,
  headerActions,
  allItems = [],
  children,
}) {
  const navigate = useNavigate();
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="w-full min-w-0 max-w-full py-2">
        <InquiryDetailSkeleton />
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="flex flex-col gap-6 w-full min-w-0 max-w-full font-sans">
        <PageHeader title="Inquiry Not Found" breadcrumbs={breadcrumbs} />
        <Alert variant="destructive" className="p-6 flex flex-col items-center text-center gap-3">
          <AlertCircle className="size-8" />
          <AlertTitle className="text-lg font-bold">Inquiry Record Unavailable</AlertTitle>
          <AlertDescription className="text-sm max-w-md">
            {error || 'The inquiry record could not be loaded.'}
          </AlertDescription>
          <Button asChild className="mt-2 h-11">
            <Link to={backTo}>
              <ArrowLeft data-icon="inline-start" />
              <span>{backLabel}</span>
            </Link>
          </Button>
        </Alert>
      </div>
    );
  }

  const currentIndex = allItems.findIndex((i) => String(i.id) === String(inquiry.id));
  const canPrev = currentIndex > 0;
  const canNext = currentIndex >= 0 && currentIndex < allItems.length - 1;

  const goToIndex = (idx) => {
    const target = allItems[idx];
    if (target?.id) {
      navigate(`${backTo}/${target.id}`);
    }
  };

  const renderNavStrip = (inModal = false) => (
    <div className="flex flex-wrap items-center gap-2">
      {allItems.length > 1 && currentIndex >= 0 && (
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToIndex(currentIndex - 1)}
            disabled={!canPrev}
            aria-label="Previous inquiry"
            className="min-h-11 sm:min-h-9 px-2.5"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Prev</span>
          </Button>
          <span className="text-xs font-medium text-on-surface-variant tabular-nums px-1">
            {currentIndex + 1} of {allItems.length}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToIndex(currentIndex + 1)}
            disabled={!canNext}
            aria-label="Next inquiry"
            className="min-h-11 sm:min-h-9 px-2.5"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {!inModal && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsFocusModalOpen(true)}
          aria-label="Expand inquiry modal"
          className="min-h-11 sm:min-h-9 px-3 gap-1.5"
        >
          <Maximize2 className="size-3.5" />
          <span>Expand</span>
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full font-sans pb-12" data-testid={testId}>
      <Toaster />
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        badge={badge}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="h-11 px-4">
              <Link to={backTo}>
                <ArrowLeft data-icon="inline-start" />
                <span>{backLabel}</span>
              </Link>
            </Button>
            {renderNavStrip(false)}
            {headerActions}
          </div>
        }
      />

      {children}

      {/* Expandable Full-View Focus Modal */}
      <Dialog open={isFocusModalOpen} onOpenChange={setIsFocusModalOpen}>
        <DialogContent
          data-testid="inquiry-focus-modal"
          className="max-w-5xl max-h-[90vh] overflow-y-auto bg-surface border border-outline text-on-surface"
        >
          <DialogHeader className="pr-8 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DialogTitle className="text-lg font-bold text-on-surface">
                {title}
              </DialogTitle>
              {renderNavStrip(true)}
            </div>
            <DialogDescription className="sr-only">
              Expanded inquiry focus view
            </DialogDescription>
          </DialogHeader>
          <div className="pt-1">{children}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
