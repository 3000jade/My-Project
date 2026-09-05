import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import EmptyState from '../../components/dashboard/EmptyState';
import { mockProperties } from '../../mockData/mockProperties';

export default function AgentProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState(mockProperties.filter(p => p.agent_id === 'agent-1'));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filtering
  const filtered = properties.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                          item.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || item.property_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const columns = [
    {
      header: "Property",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.mainImage}
            alt={row.title}
            className="w-12 h-12 rounded-xl object-cover border border-gray-200"
          />
          <div>
            <p className="font-bold text-[#174849] font-sans">{row.title}</p>
            <p className="text-xs text-gray-400 font-sans">{row.location}</p>
          </div>
        </div>
      )
    },
    {
      header: "Type",
      accessor: "property_type"
    },
    {
      header: "Price",
      render: (row) => (
        <span className="font-bold text-[#266F71]">{row.price}</span>
      )
    },
    {
      header: "Specs",
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.bedrooms} Beds • {row.bathrooms} Baths • {row.sqm}
        </span>
      )
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: "Published",
      render: (row) => (
        <span className={`text-xs font-bold ${row.is_published ? 'text-[#266F71]' : 'text-gray-400'}`}>
          {row.is_published ? '● Published' : '○ Draft'}
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/agent/properties/${row.id}`}
            className="px-3 py-1.5 rounded-lg bg-[#F1F0EC] hover:bg-[#266F71] hover:text-white text-xs font-bold font-sans uppercase tracking-wider transition-colors"
          >
            View
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Properties"
        subtitle="Manage and monitor your exclusive property inventory and sales statuses."
        actions={
          <Link
            to="/agent/properties/create"
            className="h-[46px] px-5 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_home</span>
            Create New Property
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
          <div className="flex items-center h-[54px] bg-white border border-gray-200/80 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`h-full px-3 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === 'grid' ? 'bg-[#266F71] text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`h-full px-3 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === 'table' ? 'bg-[#266F71] text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[20px]">table_rows</span>
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
              className="px-4 py-2 bg-[#266F71] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans"
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
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col group"
            >
              {/* Image & Status Badges */}
              <div className="relative h-48 sm:h-52 overflow-hidden bg-gray-100">
                <img
                  src={item.mainImage}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <StatusBadge status={item.status} />
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-sans">
                  {item.property_type}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">
                      {item.is_published ? 'Published' : 'Draft Only'}
                    </span>
                    <span className="text-lg font-bold font-display text-[#266F71]">
                      {item.price}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#174849] line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-sans flex items-center gap-1 line-clamp-1">
                    <span className="material-symbols-outlined text-[15px] text-gray-400">location_on</span>
                    {item.location}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-sans">
                  <span>{item.bedrooms} Beds</span>
                  <span>•</span>
                  <span>{item.bathrooms} Baths</span>
                  <span>•</span>
                  <span>{item.sqm}</span>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Link
                    to={`/agent/properties/${item.id}`}
                    className="flex-1 py-2.5 bg-[#266F71] hover:bg-[#174849] text-white text-center rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-colors shadow-xs"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
