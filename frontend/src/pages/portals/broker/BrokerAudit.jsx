import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ShieldCheck, Search, Filter, Download, FileText, CheckCircle2, 
  XCircle, Clock, AlertTriangle, RefreshCw, Eye, ArrowUpRight, 
  ShieldAlert, Layers, ChevronRight, X 
} from 'lucide-react';
import PageHeader from '../../../components/dashboard/PageHeader';
import MetricCard from '../../../components/dashboard/MetricCard';
import DataTable from '../../../components/dashboard/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from '@/components/ui/sheet';
import { auditService } from '../../../services/auditService';
import { cn } from '@/utils/cn';

export default function BrokerAudit() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedOutcome, setSelectedOutcome] = useState('all');
  const [activeEvent, setActiveEvent] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await auditService.listAuditEvents();
      if (Array.isArray(data)) {
        setEvents(data);
      }
    } catch (err) {
      console.warn('Failed to fetch audit events:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Client-side filtering across category, outcome, and text search
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (selectedOutcome !== 'all' && e.outcome !== selectedOutcome) {
        return false;
      }
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'property' && !e.eventType?.startsWith('property.')) return false;
        if (selectedCategory === 'inquiry' && !e.eventType?.startsWith('inquiry.')) return false;
        if (selectedCategory === 'agent' && !e.eventType?.startsWith('agent.')) return false;
        if (selectedCategory === 'security' && !e.eventType?.startsWith('auth.') && !e.eventType?.startsWith('audit.')) return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesActor = e.actorName?.toLowerCase().includes(query);
        const matchesTarget = e.targetTitle?.toLowerCase().includes(query) || e.targetId?.toLowerCase().includes(query);
        const matchesCorr = e.correlationId?.toLowerCase().includes(query);
        const matchesEvent = e.eventType?.toLowerCase().includes(query);
        const matchesReason = e.reason?.toLowerCase().includes(query);
        if (!matchesActor && !matchesTarget && !matchesCorr && !matchesEvent && !matchesReason) {
          return false;
        }
      }
      return true;
    });
  }, [events, selectedCategory, selectedOutcome, searchQuery]);

  // Derived KPI metrics
  const totalCount = events.length;
  const propertyMutationsCount = events.filter(e => e.eventType?.startsWith('property.')).length;
  const denialsCount = events.filter(e => e.outcome === 'denied').length;

  const handleExport = async () => {
    setExporting(true);
    try {
      const payload = await auditService.exportAuditEvents();
      // Generate client-side JSON download
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `human-shelter-audit-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotice({
        count: payload.count || events.length,
        timestamp: new Date().toLocaleTimeString()
      });
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err) {
      console.warn('Export failed:', err.message);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      header: "Timestamp (UTC)",
      accessor: "createdAt",
      render: (row) => (
        <span className="font-mono text-xs text-[#1E293B]">
          {row.createdAt ? new Date(row.createdAt).toISOString().replace('T', ' ').slice(0, 19) : '—'}
        </span>
      )
    },
    {
      header: "Event Type",
      accessor: "eventType",
      render: (row) => {
        let badgeColor = "bg-teal-50 text-[#0F766E] border-teal-200";
        if (row.eventType?.startsWith('property.')) badgeColor = "bg-sky-50 text-sky-700 border-sky-200";
        if (row.eventType?.startsWith('audit.') || row.eventType?.startsWith('auth.')) badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
        if (row.eventType?.startsWith('agent.')) badgeColor = "bg-purple-50 text-purple-700 border-purple-200";

        return (
          <span className={cn("px-2 py-0.5 rounded text-[11px] font-mono border", badgeColor)}>
            {row.eventType}
          </span>
        );
      }
    },
    {
      header: "Actor & Role",
      accessor: "actorName",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-[#1E293B]">{row.actorName || 'System'}</span>
          <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-mono">
            {row.actorRole || row.actorType}
          </span>
        </div>
      )
    },
    {
      header: "Target Entity",
      accessor: "targetTitle",
      render: (row) => (
        <div className="flex flex-col max-w-xs truncate">
          <span className="text-xs font-medium text-[#1E293B] truncate">
            {row.targetTitle || row.targetId}
          </span>
          <span className="text-[10px] font-mono text-[#64748B] truncate">
            {row.targetType} · {row.targetId}
          </span>
        </div>
      )
    },
    {
      header: "Outcome",
      accessor: "outcome",
      render: (row) => {
        const isSuccess = row.outcome === 'success';
        const isDenied = row.outcome === 'denied';

        return (
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
            isSuccess && "bg-emerald-50 text-[#10B981] border-emerald-200",
            isDenied && "bg-red-50 text-[#DC2626] border-red-200",
            !isSuccess && !isDenied && "bg-amber-50 text-[#F59E0B] border-amber-200"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              isSuccess && "bg-[#10B981]",
              isDenied && "bg-[#DC2626]",
              !isSuccess && !isDenied && "bg-[#F59E0B]"
            )} />
            <span className="capitalize">{row.outcome}</span>
          </span>
        );
      }
    },
    {
      header: "Actions",
      accessor: "id",
      className: "text-right",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveEvent(row)}
          className="gap-1.5 text-xs text-[#0F766E] hover:text-[#115E59] hover:bg-teal-50"
          aria-label={`Inspect event ${row.id}`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Page Header with Regulatory & Compliance Export Action */}
      <PageHeader
        title="Audit Trail"
        subtitle="Tamper-resistant chronological evidentiary record of administrative actions, listing mutations, and agent delegations."
        actions={
          <div className="flex items-center flex-wrap gap-2.5">
            <Button
              onClick={fetchEvents}
              disabled={loading}
              variant="outline"
              size="default"
              className="gap-2 h-10 border-[#E2E8F0] hover:bg-[#F8FAFC]"
              aria-label="Refresh audit log"
            >
              <RefreshCw className={cn("w-4 h-4 text-slate-600", loading && "animate-spin")} />
              <span>Refresh</span>
            </Button>

            <Button
              onClick={handleExport}
              disabled={exporting}
              className="gap-2 h-10 bg-[#FF6B6B] text-[#1E293B] hover:bg-[#ff5252] shadow-sm font-semibold border-none cursor-pointer"
              aria-label="Export compliance audit log"
            >
              <Download className="w-4 h-4 text-[#1E293B]" />
              <span>{exporting ? 'Generating Bundle...' : 'Export Compliance Log'}</span>
            </Button>
          </div>
        }
      />

      {/* Export Confirmation Alert Toast Banner */}
      {exportNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4 flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>
              <strong>Compliance Bundle Generated:</strong> Exported {exportNotice.count} immutable evidentiary records at {exportNotice.timestamp}.
            </span>
          </div>
          <button 
            onClick={() => setExportNotice(null)} 
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Top Analytical Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          title="Total Evidentiary Records"
          value={totalCount}
          icon="shield"
          subtitle="100% append-only verified by PostgreSQL RLS"
        />
        <MetricCard
          title="Listing Mutations Reviewed"
          value={propertyMutationsCount}
          icon="edit_note"
          subtitle="Field-level JSON change diffs stored in audit log"
        />
        <MetricCard
          title="Security & Tamper Denials"
          value={denialsCount}
          icon="security"
          subtitle="Zero authorized record modification attempts allowed"
        />
      </div>

      {/* 3. Multi-Facet High-Density Filter Toolbar */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by actor, property, inquiry, or correlation ID..."
              className="w-full h-10 pl-9 pr-8 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-colors"
              aria-label="Filter audit events by keyword"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Facet Filters */}
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Category:</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
              aria-label="Filter by event category"
            >
              <option value="all">All Event Categories</option>
              <option value="property">Listing Mutations (property.*)</option>
              <option value="inquiry">Inquiries & Comms (inquiry.*)</option>
              <option value="agent">Agent Governance (agent.*)</option>
              <option value="security">Security & Sessions (auth.* / audit.*)</option>
            </select>

            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
              aria-label="Filter by outcome"
            >
              <option value="all">All Outcomes</option>
              <option value="success">Success Only</option>
              <option value="denied">Denied Only</option>
            </select>

            {(searchQuery || selectedCategory !== 'all' || selectedOutcome !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedOutcome('all');
                }}
                className="text-xs text-slate-500 hover:text-[#1E293B] h-10 px-2.5"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Status Count Helper Bar */}
        <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2 border-t border-[#E2E8F0]">
          <span>Displaying {filteredEvents.length} of {totalCount} records</span>
          <span className="font-mono text-[10px]">Strict Immutability Guard: ACTIVE</span>
        </div>
      </div>

      {/* 4. Primary Audit Events Data Table */}
      <DataTable
        columns={columns}
        data={filteredEvents}
        keyField="id"
        pageSize={10}
        emptyMessage="No audit events matched your search or facet filters."
      />

      {/* 5. Mutation Diff Inspection Side Drawer */}
      <Sheet open={Boolean(activeEvent)} onOpenChange={(open) => !open && setActiveEvent(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto font-sans p-6">
          {activeEvent && (
            <div className="space-y-6">
              <SheetHeader className="text-left space-y-1 pb-4 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {activeEvent.eventType}
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
                    activeEvent.outcome === 'success' ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  )}>
                    {activeEvent.outcome}
                  </span>
                </div>
                <SheetTitle className="text-lg font-bold text-[#1E293B]">
                  {activeEvent.targetTitle || activeEvent.eventType}
                </SheetTitle>
                <SheetDescription className="text-xs text-[#64748B]">
                  Event ID: <span className="font-mono text-slate-700">{activeEvent.id}</span>
                </SheetDescription>
              </SheetHeader>

              {/* Event Metadata Ledger */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-mono">Actor</span>
                  <span className="font-semibold text-[#1E293B]">{activeEvent.actorName || 'System'}</span>
                  <span className="text-[10px] text-slate-500 block">Role: {activeEvent.actorRole || activeEvent.actorType}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-mono">Timestamp (UTC)</span>
                  <span className="font-mono text-slate-700 block">
                    {activeEvent.createdAt ? new Date(activeEvent.createdAt).toISOString() : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-mono">Target Type</span>
                  <span className="font-semibold text-[#1E293B] capitalize">{activeEvent.targetType}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-mono">Correlation ID</span>
                  <span className="font-mono text-[11px] text-slate-700 block truncate" title={activeEvent.correlationId}>
                    {activeEvent.correlationId}
                  </span>
                </div>
              </div>

              {/* Written Reason / Administrative Rationale */}
              {activeEvent.reason && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
                    Administrative Stated Rationale
                  </h4>
                  <div className="p-3 bg-white rounded-lg border border-[#E2E8F0] text-xs text-[#1E293B] leading-relaxed">
                    {activeEvent.reason}
                  </div>
                </div>
              )}

              {/* Side-by-Side / Stacked Old vs New Data Diffs */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Entity State Mutation Ledger</span>
                </h4>

                {(!activeEvent.previousValues && !activeEvent.newValues) ? (
                  <p className="text-xs text-[#64748B] italic p-4 bg-slate-50 rounded-lg text-center">
                    No field-level mutation diff recorded for this security event.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Previous State */}
                    {activeEvent.previousValues && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>Previous State (Before Mutation)</span>
                        </span>
                        <pre className="p-3 bg-red-50 text-red-900 rounded-lg border border-red-200 text-xs font-mono overflow-x-auto">
                          {JSON.stringify(activeEvent.previousValues, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* New State */}
                    {activeEvent.newValues && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Committed State (After Mutation)</span>
                        </span>
                        <pre className="p-3 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200 text-xs font-mono overflow-x-auto">
                          {JSON.stringify(activeEvent.newValues, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
