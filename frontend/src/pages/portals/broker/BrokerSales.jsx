import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import DataTable from '../../../components/dashboard/DataTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  KpiCard,
  useToast,
  Toaster
} from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../../../components/ui/alert';
import {
  Eye,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Spinner } from '../../../components/ui';
import { TableSkeleton } from '../../../components/dashboard/skeletons';
import { saleService } from '../../../services/saleService';
import { agentService } from '../../../services/agentService';

export default function BrokerSales() {
  const { toast } = useToast();
  const [sales, setSales] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [selectedSale, setSelectedSale] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesData, agentsData] = await Promise.all([
        saleService.getSales(),
        agentService.getAgents().catch(() => [])
      ]);
      setSales(Array.isArray(salesData) ? salesData : []);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
    } catch (err) {
      const msg = err.message ? `Failed to load firm sales registry: ${err.message}` : 'Failed to load firm sales registry.';
      setError(msg);
      toast({ title: 'Error Loading Sales', description: 'Could not synchronize sales transactions.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = sales.filter(s => {
    const propertyTitle = s.property_title || '';
    const clientName = s.client_name || '';
    const propertyLocation = s.property_location || '';
    const matchesSearch = propertyTitle.toLowerCase().includes(search.toLowerCase()) ||
                          clientName.toLowerCase().includes(search.toLowerCase()) ||
                          propertyLocation.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (s.status || '').toUpperCase() === statusFilter.toUpperCase();
    const matchesAgent = agentFilter === 'ALL' || s.agent_id === agentFilter;
    return matchesSearch && matchesStatus && matchesAgent;
  });

  const totalClosedValuation = filtered
    .filter(s => s.status === 'COMPLETED')
    .reduce((acc, s) => acc + (Number(s.property_value) || 0), 0);

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdating(true);
    try {
      await saleService.updateSale(id, { status: newStatus });
      setSales(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
      if (selectedSale && selectedSale.id === id) {
        setSelectedSale(prev => ({ ...prev, status: newStatus }));
      }
      toast({
        title: 'Status Updated',
        description: `Conveyance record marked as ${newStatus}.`,
        variant: 'success'
      });
    } catch (err) {
      console.warn('Failed to update sales status:', err.message);
      setSales(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
      toast({
        title: 'Status Updated Locally',
        description: `Conveyance status changed to ${newStatus}.`,
        variant: 'primary'
      });
    } finally {
      setUpdating(false);
    }
  };

  const completedCount = filtered.filter(s => s.status === 'COMPLETED').length;
  const pendingCount = filtered.filter(s => s.status === 'PENDING').length;
  const cancelledCount = filtered.filter(s => s.status === 'CANCELLED').length;

  const agentOptions = [
    { label: "All Consultants", value: "ALL" },
    ...agents.map(a => ({ label: a.name, value: a.id }))
  ];

  const columns = [
    {
      header: "Property",
      render: (row) => (
        <div>
          <p className="font-bold text-[#1E293B] dark:text-slate-100 font-sans">{row.property_title}</p>
          <p className="text-xs text-[#64748B] dark:text-slate-400 font-sans">{row.property_location}</p>
        </div>
      )
    },
    {
      header: "Buyer / Client",
      accessor: "client_name"
    },
    {
      header: "Handling Consultant",
      accessor: "agent_name"
    },
    {
      header: "Deed Date",
      accessor: "sale_date"
    },
    {
      header: "Recorded Valuation",
      render: (row) => (
        <span className="font-bold text-[#0F766E] dark:text-teal-400 font-sans">
          ₱{(Number(row.property_value) || 0).toLocaleString()}
        </span>
      )
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <Button
          type="button"
          size="sm"
          onClick={(e) => { e.stopPropagation(); setSelectedSale(row); }}
          aria-label="Inspect Record"
          className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5"
        >
          <Eye className="size-3.5" />
          <span>Inspect Record</span>
        </Button>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full font-sans" data-testid="broker-sales-portal">
      <Toaster />
      <PageHeader
        title="Firm-Wide Sales Audit & Monitoring"
        subtitle="Complete registry of property conveyance agreements, recorded valuations, and deed closing audits."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={loadData}
            disabled={loading}
            aria-label="Refresh sales data"
            className="h-11 px-4 gap-2 border-[#E2E8F0] dark:border-slate-800"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive" className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-4 shrink-0" />
            <div>
              <AlertTitle>Synchronization Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </div>
          <Button type="button" size="sm" variant="destructive" onClick={loadData}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Top Executive KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          data-testid="broker-card"
          variant="trend"
          title="Total Closed Valuation (Filtered)"
          value={`₱${totalClosedValuation.toLocaleString()}`}
          icon={TrendingUp}
          footerText="Verified completed conveyances in current view"
        />

        <KpiCard
          variant="progress"
          title="Filtered Conveyance Records"
          value={filtered.length}
          progress={sales.length ? Math.round((filtered.length / sales.length) * 100) : 0}
          targetLabel={`Out of ${sales.length} total firm records`}
        />

        <KpiCard
          variant="breakdown"
          title="Completed Deals"
          value={completedCount}
          segments={[
            { label: 'Completed', value: completedCount, color: 'emerald' },
            { label: 'Pending', value: pendingCount, color: 'amber' },
          ]}
        />
      </div>

      {/* Asymmetric 8/4 Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 min-w-0 flex flex-col gap-4">
          <SearchAndFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by property, client, or location..."
            filters={[
              {
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: "All Statuses", value: "ALL" },
                  { label: "Completed", value: "COMPLETED" },
                  { label: "Pending", value: "PENDING" },
                  { label: "Cancelled", value: "CANCELLED" },
                ]
              },
              {
                value: agentFilter,
                onChange: setAgentFilter,
                options: agentOptions
              }
            ]}
          />

          {loading ? (
            <TableSkeleton rows={5} />
          ) : (
            <Card data-testid="broker-card" className="border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <CardHeader className="pb-3 border-b border-[#E2E8F0] dark:border-slate-800 flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-[#1E293B] dark:text-slate-100">
                    Conveyance Registry
                  </CardTitle>
                  <CardDescription className="text-xs text-[#64748B] dark:text-slate-400">
                    Click any row or Inspect Record to audit deed details and update status.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {filtered.length} records
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable
                  columns={columns}
                  data={filtered}
                  onRowClick={(row) => setSelectedSale(row)}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
              <CardTitle className="text-base font-bold text-[#1E293B] dark:text-slate-100">
                Status Breakdown
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B] dark:text-slate-400">
                Quick filter by conveyance stage
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
                className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] dark:border-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-[#1E293B] dark:text-slate-200">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Completed
                </span>
                <Badge variant="outline" className="font-mono tabular-nums">
                  {completedCount}
                </Badge>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
                className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] dark:border-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-[#1E293B] dark:text-slate-200">
                  <Clock className="size-4 text-amber-600" />
                  Pending Execution
                </span>
                <Badge variant="outline" className="font-mono tabular-nums">
                  {pendingCount}
                </Badge>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'CANCELLED' ? 'ALL' : 'CANCELLED')}
                className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] dark:border-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-[#1E293B] dark:text-slate-200">
                  <AlertCircle className="size-4 text-rose-600" />
                  Cancelled
                </span>
                <Badge variant="outline" className="font-mono tabular-nums">
                  {cancelledCount}
                </Badge>
              </button>
            </CardContent>
            <CardFooter className="pt-3 border-t border-[#E2E8F0] dark:border-slate-800 flex items-start gap-2 text-xs text-[#64748B] dark:text-slate-400">
              <ShieldCheck className="size-4 text-[#0F766E] shrink-0 mt-0.5" />
              <span>
                <strong>Compliance Notice:</strong> Sales records serve for supervisory real estate operational monitoring. No banking or payment gateway is processed.
              </span>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Sale Detail shadcn Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={(open) => { if (!open) setSelectedSale(null); }}>
        <DialogContent
          data-testid="broker-dialog"
          className="max-w-2xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 text-[#1E293B] dark:text-slate-100"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-[#1E293B] dark:text-slate-100">
              Sales Conveyance Record Audit
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B] dark:text-slate-400">
              {selectedSale ? `Audit ID: ${selectedSale.id}` : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-6 font-sans py-2">
              <div className="p-4 bg-[#F8FAFC] dark:bg-slate-800/60 rounded-xl flex items-center justify-between border border-[#E2E8F0] dark:border-slate-700">
                <div>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">Transaction Valuation</p>
                  <p className="text-2xl font-display font-bold text-[#0F766E] dark:text-teal-400">
                    ₱{(Number(selectedSale.property_value) || 0).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={selectedSale.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 uppercase tracking-wider font-bold">Property</p>
                  <p className="font-semibold text-[#1E293B] dark:text-slate-100 mt-1">{selectedSale.property_title}</p>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">{selectedSale.property_location}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 uppercase tracking-wider font-bold">Purchasing Client</p>
                  <p className="font-semibold text-[#1E293B] dark:text-slate-100 mt-1">{selectedSale.client_name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 uppercase tracking-wider font-bold">Execution Date</p>
                  <p className="font-medium text-[#1E293B] dark:text-slate-200 mt-1">{selectedSale.sale_date}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 uppercase tracking-wider font-bold">Assigned Consultant</p>
                  <p className="font-medium text-[#1E293B] dark:text-slate-200 mt-1">{selectedSale.agent_name}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] dark:border-slate-800">
                <p className="text-xs text-[#64748B] dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Audit Notes</p>
                <p className="text-sm text-[#1E293B] dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700">
                  {selectedSale.notes || 'No audit notes attached.'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center gap-2 flex-wrap sm:justify-end pt-4 border-t border-[#E2E8F0] dark:border-slate-800">
            {selectedSale?.status === 'PENDING' && (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedSale.id, 'COMPLETED')}
                  disabled={updating}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors disabled:opacity-50"
                >
                  {updating ? 'Processing...' : 'Mark as Completed / Conveyed'}
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedSale.id, 'CANCELLED')}
                  disabled={updating}
                  className="px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancel Conveyance
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setSelectedSale(null)}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors"
            >
              Close Dossier
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
