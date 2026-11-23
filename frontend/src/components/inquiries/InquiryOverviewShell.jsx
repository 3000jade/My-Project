import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, AlertCircle, Inbox, Eye, ArrowRight, Columns3, Table2 } from 'lucide-react';
import PageHeader from '../dashboard/PageHeader';
import DataTable from '../dashboard/DataTable';
import StatusBadge from '../dashboard/StatusBadge';
import InquiryFilterToolbar from './InquiryFilterToolbar';
import InquiryInboxSplitView from './InquiryInboxSplitView';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  KpiCard,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  ShadcnButton as Button,
  Toaster,
} from '../ui';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '../ui/empty';
import { TableSkeleton } from '../dashboard/skeletons';

export default function InquiryOverviewShell({
  testId,
  title,
  subtitle,
  breadcrumbs,
  onRefresh,
  loading = false,
  error = null,
  kpis = [],
  kpiTestId,
  queueTabs = [],
  activeTab,
  onTabChange,
  tabsTestId,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search inquiries...',
  filters = [],
  sortBy = 'newest',
  onSortChange,
  onResetFilters,
  items = [],
  columns = [],
  basePath = '/inquiries',
  onOpenItem,
  renderQuickView,
  viewerRole = 'agent',
  onSendReply,
  sendingReply = false,
  defaultViewMode = 'table',
}) {
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [viewMode, setViewMode] = useState(defaultViewMode);

  const mergedFilters = [
    ...(queueTabs.length > 0 && onTabChange
      ? [
          {
            label: 'Queue',
            value: activeTab ?? queueTabs[0]?.value ?? 'ALL',
            onChange: onTabChange,
            placeholder: queueTabs[0]?.label || 'All',
            options: queueTabs.map((t) => ({ label: t.label, value: t.value })),
          },
        ]
      : []),
    ...filters,
  ];

  const filterToolbarEl = (
    <InquiryFilterToolbar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      filters={mergedFilters}
      sortBy={sortBy}
      onSortChange={onSortChange}
      onResetFilters={onResetFilters}
      layout={viewMode === 'table' ? 'inline' : 'stacked'}
    />
  );

  const tableColumns = [
    ...columns,
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div
          className="inline-flex items-center justify-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {renderQuickView && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuickViewItem(row)}
              aria-label={`Quick view inquiry ${row.client_name || row.property_title || row.id}`}
              className="min-h-11 sm:min-h-9 px-2.5 gap-1"
            >
              <Eye className="size-3.5" />
              <span className="hidden sm:inline">Quick View</span>
            </Button>
          )}
          <Button asChild size="sm" className="min-h-11 sm:min-h-9">
            <Link to={`${basePath}/${row.id}`}>
              <span>Open</span>
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full font-sans" data-testid={testId}>
      <Toaster />
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        className="mb-0"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-outline bg-surface p-1">
              <Button
                type="button"
                variant={viewMode === 'split' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('split')}
                className="min-h-9 px-3 gap-1.5"
              >
                <Columns3 className="size-4" />
                <span>Split Inbox</span>
              </Button>
              <Button
                type="button"
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="min-h-9 px-3 gap-1.5"
              >
                <Table2 className="size-4" />
                <span>Table</span>
              </Button>
            </div>
            {onRefresh && (
              <Button
                type="button"
                variant="outline"
                onClick={onRefresh}
                disabled={loading}
                aria-label="Refresh inquiries"
                className="h-11 px-4"
              >
                <RefreshCw data-icon="inline-start" className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </Button>
            )}
          </div>
        }
      />

      {viewMode === 'table' && kpis.length > 0 && (
        <div data-testid={kpiTestId} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map((kpi, idx) => (
            <KpiCard key={idx} size="md" {...kpi} />
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-4 shrink-0" />
            <div>
              <AlertTitle>Inquiry Sync Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </div>
          {onRefresh && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={onRefresh}
              className="min-h-11 sm:min-h-9"
            >
              Retry
            </Button>
          )}
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        {viewMode === 'table' && filterToolbarEl}

        {loading ? (
          <TableSkeleton rows={5} />
        ) : viewMode === 'split' ? (
          <InquiryInboxSplitView
            items={items}
            viewerRole={viewerRole}
            basePath={basePath}
            onSendReply={onSendReply}
            sendingReply={sendingReply}
            onResetFilters={onResetFilters}
            filterToolbar={filterToolbarEl}
          />
        ) : items.length === 0 ? (
          <Card className="bg-surface border border-outline shadow-xs">
            <CardContent className="p-0">
              <Empty className="p-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Inbox />
                  </EmptyMedia>
                  <EmptyTitle>No inquiries found</EmptyTitle>
                  <EmptyDescription>
                    Try switching queue tabs or clearing your search and filters.
                  </EmptyDescription>
                </EmptyHeader>
                {onResetFilters && (
                  <EmptyContent>
                    <Button type="button" onClick={onResetFilters} className="min-h-11">
                      Reset Filters
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-surface border border-outline overflow-hidden shadow-xs">
            <CardHeader className="px-4 py-3 border-b border-outline bg-background flex flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface">
                  Inquiry Overview
                </CardTitle>
                <Badge variant="outline" className="tabular-nums">
                  {items.length} {items.length === 1 ? 'thread' : 'threads'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={tableColumns}
                data={items}
                onRowClick={(row) => onOpenItem && onOpenItem(row)}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick-View Modal */}
      {quickViewItem && renderQuickView && (
        <Dialog open={Boolean(quickViewItem)} onOpenChange={(open) => !open && setQuickViewItem(null)}>
          <DialogContent
            data-testid="inquiry-quick-view-modal"
            className="max-w-3xl max-h-[85vh] overflow-y-auto bg-surface border border-outline text-on-surface"
          >
            <DialogHeader className="pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-lg font-bold text-on-surface">
                  {quickViewItem.client_name || quickViewItem.property_title || 'Inquiry Preview'}
                </DialogTitle>
                <StatusBadge status={quickViewItem.status} />
              </div>
              <DialogDescription>
                Ref: {quickViewItem.reference_code || quickViewItem.id} •{' '}
                {quickViewItem.property_title || 'Property Inquiry'}
              </DialogDescription>
            </DialogHeader>

            <div className="py-1">{renderQuickView(quickViewItem)}</div>

            <DialogFooter className="gap-2 pt-3 border-t border-outline">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickViewItem(null)}
                className="h-11"
              >
                Close
              </Button>
              <Button asChild className="h-11">
                <Link to={`${basePath}/${quickViewItem.id}`}>
                  <span>Open Full Inquiry</span>
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
