import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import DataTable from '../../../components/dashboard/DataTable';
import EmptyState from '../../../components/dashboard/EmptyState';
import propertyService from '../../../services/propertyService';
import { useAuth } from '../../../context/AuthContext';
import { Building2, Clock, CheckCircle2, AlertTriangle, XCircle, Check } from 'lucide-react';
import { Button, buttonVariants, Badge } from '../../../components/ui';
import AgentAssignmentActionModal from '../../../components/dashboard/AgentAssignmentActionModal';

export default function AgentProperties() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [pendingPropertyIds, setPendingPropertyIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Assignment Modal State
  const [modalProp, setModalProp] = useState(null);
  const [modalMode, setModalMode] = useState('accept');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAgentProperties = async () => {
    setIsLoading(true);
    try {
      const queryParams = user?.id ? { agentId: user.id, listAgentKey: user.id } : {};
      const [propsRes, editsRes] = await Promise.allSettled([
        propertyService.getProperties(queryParams),
        propertyService.getEditRequests({ status: 'PENDING' }),
      ]);

      if (propsRes.status === 'fulfilled' && propsRes.value?.data) {
        setProperties(Array.isArray(propsRes.value.data) ? propsRes.value.data : []);
      } else {
        setProperties([]);
      }

      if (editsRes.status === 'fulfilled' && editsRes.value?.data) {
        const rawEdits = Array.isArray(editsRes.value.data) ? editsRes.value.data : editsRes.value.data.requests || [];
        const ids = new Set(rawEdits.map(e => e.property_id || e.propertyId));
        setPendingPropertyIds(ids);
      }
    } catch (err) {
      console.warn('Error loading agent properties:', err);
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgentProperties();
  }, [user?.id]);

  // Filtering
  const filtered = properties.filter(item => {
    const title = (item.title || item.name || '').toLowerCase();
    const loc = (typeof item.location === 'string' ? item.location : item.location?.address || '').toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = title.includes(q) || loc.includes(q);
    const isPendingConfirm = (item.assignment_status || item.assignmentStatus) === 'PENDING_CONFIRMATION' || item.standard_status === 'Pending Confirmation';
    const matchesStatus = statusFilter === 'ALL'
      ? true
      : statusFilter === 'PENDING_CONFIRMATION'
        ? isPendingConfirm
        : (item.status || '').toUpperCase() === statusFilter.toUpperCase();
    const itemType = item.property_type || item.propertyType || item.specs?.propertyType || '';
    const matchesType = typeFilter === 'ALL' || itemType.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesType;
  });

  const columns = [
    {
      header: "Property",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.mainImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=200'}
            alt={row.title}
            className="w-12 h-12 rounded-lg object-cover border border-[#E2E8F0]"
          />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-[#1E293B] text-sm">{row.title}</p>
              {pendingPropertyIds.has(row.id) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Edit Pending
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B]">{typeof row.location === 'string' ? row.location : row.location?.address || 'Metro Manila'}</p>
          </div>
        </div>
      )
    },
    {
      header: "Type",
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium">
          {row.property_type || row.propertyType || row.specs?.propertyType || 'Residential'}
        </span>
      )
    },
    {
      header: "Price",
      render: (row) => (
        <span className="font-mono font-bold text-sm text-[#0F766E]">
          {row.price || (row.price_raw ? `₱${row.price_raw.toLocaleString()}` : 'Price on Request')}
        </span>
      )
    },
    {
      header: "Specs",
      render: (row) => (
        <span className="text-xs font-mono text-slate-500">
          {row.bedrooms ?? row.specs?.beds ?? 0} Beds • {row.bathrooms ?? row.specs?.baths ?? 0} Baths • {row.sqm || (row.specs?.livingArea ? `${row.specs.livingArea} sqm` : '—')}
        </span>
      )
    },
    {
      header: "Status",
      render: (row) => {
        const isPendingConfirm = (row.assignment_status || row.assignmentStatus) === 'PENDING_CONFIRMATION' || row.standard_status === 'Pending Confirmation';
        return isPendingConfirm ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border bg-amber-500/15 text-amber-700 border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-600 animate-pulse" />
            Pending Confirmation
          </span>
        ) : (
          <StatusBadge status={row.status} />
        );
      }
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => {
        const isPendingConfirm = (row.assignment_status || row.assignmentStatus) === 'PENDING_CONFIRMATION' || row.standard_status === 'Pending Confirmation';
        return (
          <div className="flex items-center justify-end gap-2">
            {isPendingConfirm && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalProp(row);
                    setModalMode('accept');
                    setIsModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Accept assignment and publish"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalProp(row);
                    setModalMode('decline');
                    setIsModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Decline assignment"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Decline</span>
                </button>
              </>
            )}
            <Link
              to={`/agent/properties/${row.id}`}
              className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#0F766E] hover:text-white hover:border-[#0F766E] text-xs font-semibold text-[#1E293B] transition-colors shadow-2xs"
            >
              View Details
            </Link>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Properties"
        subtitle="Review your exclusive property inventory. To make changes, submit an edit proposal for broker review."
        actions={
          <Link
            to="/agent/properties/new"
            className={buttonVariants({ variant: 'default', size: 'default' })}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Propose New Listing</span>
          </Link>
        }
      />

      {/* Filter and View Mode Toolbar */}
      <SearchAndFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search property by title or location..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Statuses", value: "ALL" },
              { label: "Pending Confirmation", value: "PENDING_CONFIRMATION" },
              { label: "Available", value: "AVAILABLE" },
              { label: "Reserved", value: "RESERVED" },
              { label: "Sold", value: "SOLD" },
              { label: "Inactive", value: "INACTIVE" },
            ]
          },
          {
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: "All Types", value: "ALL" },
              { label: "Estate", value: "Estate" },
              { label: "Penthouse", value: "Penthouse" },
              { label: "House & Lot", value: "House & Lot" },
              { label: "Condominium", value: "Condominium" },
              { label: "Villa", value: "Villa" },
            ]
          }
        ]}
        extraActions={
          <div className="flex items-center h-[46px] bg-white border border-[#CBD5E1] rounded-lg p-1 gap-1 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`h-full px-3 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#0F766E] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`h-full px-3 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#0F766E] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[18px]">table_rows</span>
            </button>
          </div>
        }
      />

      {/* View Output */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="apartment"
          title="No properties match your filters"
          description="Try clearing search keywords or selecting different status criteria."
          action={
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); setTypeFilter('ALL'); }}
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
          }
        />
      ) : viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/agent/properties/${row.id}`)}
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs hover:shadow-md transition-all flex flex-col group overflow-hidden"
            >
              {/* Image & Status Badges */}
              <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
                <img
                  src={item.mainImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {(item.assignment_status === 'PENDING_CONFIRMATION' || item.assignmentStatus === 'PENDING_CONFIRMATION' || item.standard_status === 'Pending Confirmation') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                      <Clock className="w-3 h-3 text-white" />
                      Pending Confirmation
                    </span>
                  ) : (
                    <StatusBadge status={item.status} />
                  )}
                  {pendingPropertyIds.has(item.id) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                      <Clock className="w-3 h-3 text-white" />
                      Pending Broker Review
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3 bg-slate-900/75 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider">
                  {item.property_type || item.propertyType || item.specs?.propertyType || 'Residential'}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                      {item.is_published ? 'Published' : 'Draft / Unlisted'}
                    </span>
                    <span className="text-base font-bold font-mono text-[#0F766E]">
                      {item.price || (item.price_raw ? `₱${item.price_raw.toLocaleString()}` : 'Price on Request')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base text-[#1E293B] line-clamp-1 group-hover:text-[#0F766E] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#64748B] flex items-center gap-1 line-clamp-1">
                    <span className="material-symbols-outlined text-[15px] text-slate-400">location_on</span>
                    {typeof item.location === 'string' ? item.location : item.location?.address || 'Metro Manila'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-mono text-[#64748B]">
                  <span>{item.bedrooms ?? item.specs?.beds ?? 0} Beds</span>
                  <span>•</span>
                  <span>{item.bathrooms ?? item.specs?.baths ?? 0} Baths</span>
                  <span>•</span>
                  <span>{item.sqm || (item.specs?.livingArea ? `${item.specs.livingArea} sqm` : '—')}</span>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  {(item.assignment_status === 'PENDING_CONFIRMATION' || item.assignmentStatus === 'PENDING_CONFIRMATION' || item.standard_status === 'Pending Confirmation') ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setModalProp(item);
                          setModalMode('accept');
                          setIsModalOpen(true);
                        }}
                        className="flex-1 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white text-center rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept & Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModalProp(item);
                          setModalMode('decline');
                          setIsModalOpen(true);
                        }}
                        className="px-3 py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-center rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </>
                  ) : (
                    <Link
                      to={`/agent/properties/${item.id}`}
                      className="flex-1 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white text-center rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    >
                      View & Propose Edits
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Confirmation / Decline Modal */}
      <AgentAssignmentActionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalProp(null);
        }}
        property={modalProp}
        mode={modalMode}
        onSuccess={(propId, newStatus) => {
          setProperties(prev => prev.map(p => {
            if (p.id === propId) {
              if (newStatus === 'ACCEPTED') {
                return {
                  ...p,
                  assignment_status: 'ACCEPTED',
                  assignmentStatus: 'ACCEPTED',
                  standard_status: 'Active',
                  status: 'AVAILABLE',
                  is_published: true
                };
              } else {
                return {
                  ...p,
                  assignment_status: 'REJECTED',
                  assignmentStatus: 'REJECTED',
                  standard_status: 'Action Required',
                  status: 'INACTIVE',
                  is_published: false
                };
              }
            }
            return p;
          }));
        }}
      />
    </div>
  );
}
