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
  useToast,
  Toaster
} from '../../../components/ui';
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
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedSale(row); }}
          aria-label="Inspect Record"
          className="px-3 py-1.5 rounded-md bg-[#0F766E] hover:bg-[#115E59] active:bg-[#134E4A] text-white text-xs font-semibold font-sans uppercase tracking-wider inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px] text-white">visibility</span>
          <span>Inspect Record</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto font-sans" data-testid="broker-sales-portal">
      <Toaster />
      <PageHeader
        title="Firm-Wide Sales Audit & Monitoring"
        subtitle="Complete registry of property conveyance agreements, recorded valuations, and deed closing audits."
        actions={
          <button
            onClick={loadData}
            disabled={loading}
            aria-label="Refresh sales data"
            className="h-[46px] px-4 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-[#1E293B] dark:text-slate-100 border border-[#E2E8F0] dark:border-slate-800 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Refresh</span>
          </button>
        }
      />

      {error && (
        <div role="alert" className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center justify-between text-rose-700 dark:text-rose-300 font-sans text-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-600 dark:text-rose-400">error</span>
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-rose-600 text-white text-xs font-bold uppercase rounded-lg tracking-wider hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary Card with Single-Column Responsive Card Layout */}
      <Card data-testid="broker-card" className="border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-sans">
              Total Closed Valuation (Filtered)
            </span>
            <p className="text-3xl font-display font-bold text-[#1E293B] dark:text-slate-100 mt-0.5">
              {`₱${totalClosedValuation.toLocaleString()}`}
            </p>
          </div>
          <div className="text-xs font-sans text-[#64748B] dark:text-slate-400 max-w-sm">
            <strong>Compliance Notice:</strong> Sales records serve for supervisory real estate operational monitoring. No banking or payment gateway is processed.
          </div>
        </CardContent>
      </Card>

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
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(row) => setSelectedSale(row)}
          />
        </Card>
      )}

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
