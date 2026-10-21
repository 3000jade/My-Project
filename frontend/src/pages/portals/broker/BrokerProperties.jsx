import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, CheckCircle2, Plus, RotateCw, Edit3, ExternalLink,
  MapPin, Maximize2, Bed, Bath, Copy, MoreVertical, ChevronRight,
  Search, X, SlidersHorizontal, AlertCircle, Home
} from 'lucide-react';
import DataTable from '../../../components/dashboard/DataTable';
import PropertyQuickEditDrawer from '../../../components/cms/PropertyQuickEditDrawer';
import ProposalReviewDrawer from '../../../components/cms/ProposalReviewDrawer';
import propertyService, { normalizeProperty } from '../../../services/propertyService';
import { cn } from '../../../utils/cn';

function formatPhilippineRelativeTime(dateStr) {
  if (!dateStr) return 'Not provided';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unavailable';
    
    const manilaFmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const nowParts = manilaFmt.format(new Date());
    const itemParts = manilaFmt.format(date);
    
    const [nowY, nowM, nowD] = nowParts.split('-').map(Number);
    const [itemY, itemM, itemD] = itemParts.split('-').map(Number);
    
    const nowDate = Date.UTC(nowY, nowM - 1, nowD);
    const itemDate = Date.UTC(itemY, itemM - 1, itemD);
    
    const diffDays = Math.round((nowDate - itemDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 0) return 'Future date';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  } catch {
    return 'Unavailable';
  }
}

function formatPhilippineCalendarDate(dateStr) {
  if (!dateStr) return 'Not provided';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unavailable';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch {
    return 'Unavailable';
  }
}

function PropertyThumbnail({ image, title }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [image]);

  const showPlaceholder = !image || hasError;

  return (
    <div
      className="w-14 h-10 rounded-md bg-slate-100 overflow-hidden border border-[#E2E8F0] shrink-0 shadow-2xs flex items-center justify-center"
      aria-label={showPlaceholder ? "No image available" : (title || "Property photo")}
    >
      {showPlaceholder ? (
        <Building2 className="w-5 h-5 text-slate-400" aria-hidden="true" />
      ) : (
        <img
          src={image}
          alt={title || "Property photo"}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}

export default function BrokerProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessingProposal, setIsProcessingProposal] = useState(false);

  // Filters & State
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [quickDrawerProperty, setQuickDrawerProperty] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Strictly Live API Fetch (No Fake / Mock Fallback Records)
  const fetchProperties = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const response = await propertyService.getProperties();
      const rawList = response?.data && Array.isArray(response.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];
      setProperties(rawList.map(normalizeProperty));
      setError(null);
    } catch (err) {
      console.warn('API fetch failed:', err);
      if (isManualRefresh) {
        showToast('Refresh failed. Preserving previously loaded property listings.');
      } else {
        setError('Unable to load property listings from the database.');
        setProperties([]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch pending agent proposals
  const fetchProposals = useCallback(async () => {
    try {
      const response = await propertyService.getEditRequests({ status: 'PENDING' });
      const rawList = Array.isArray(response?.data) 
        ? response.data 
        : response?.data?.requests || [];
      setProposals(rawList);
    } catch (err) {
      console.warn('Could not load edit proposals:', err);
    }
  }, []);

  const handleApproveProposal = async (requestId, reviewNotes) => {
    setIsProcessingProposal(true);
    try {
      await propertyService.approveEditRequest(requestId, reviewNotes);
      showToast('Listing edit request approved and published.');
      await Promise.all([fetchProperties(true), fetchProposals()]);
    } finally {
      setIsProcessingProposal(false);
    }
  };

  const handleRejectProposal = async (requestId, rejectionReason) => {
    setIsProcessingProposal(true);
    try {
      await propertyService.rejectEditRequest(requestId, rejectionReason);
      showToast('Listing edit request declined.');
      await fetchProposals();
    } finally {
      setIsProcessingProposal(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchProposals();
  }, [fetchProperties, fetchProposals]);

  // Tab counts calculated exclusively from actual dataset
  const tabCounts = useMemo(() => {
    let needsApproval = 0;
    let active = 0;
    let reserved = 0;
    let sold = 0;
    let draft = 0;

    properties.forEach(p => {
      const std = String(p.standard_status || p.standardStatus || '').toUpperCase();
      const s = String(p.status || '').toUpperCase();

      if (std === 'PENDING APPROVAL') {
        needsApproval++;
      }
      if (std === 'ACTIVE' || s === 'AVAILABLE') {
        active++;
      }
      if (std === 'ACTIVE UNDER CONTRACT' || s === 'RESERVED' || s === 'PENDING' || s === 'UNDER CONTRACT') {
        reserved++;
      }
      if (std === 'CLOSED' || s === 'SOLD') {
        sold++;
      }
      if (std === 'DRAFT' || s === 'INACTIVE') {
        draft++;
      }
    });

    return {
      all: properties.length,
      needsApproval,
      active,
      reserved,
      sold,
      draft,
    };
  }, [properties]);

  // Dynamic filter options derived from actual dataset
  const propertyTypeOptions = useMemo(() => {
    const set = new Set();
    properties.forEach(p => {
      const t = p.property_type || p.propertyType;
      if (t) set.add(t);
    });
    return Array.from(set).sort();
  }, [properties]);

  const locationOptions = useMemo(() => {
    const set = new Set();
    properties.forEach(p => {
      const loc = p.city || p.location;
      if (loc) {
        const shortLoc = loc.includes(',') ? loc.split(',')[0].trim() : loc.trim();
        if (shortLoc) set.add(shortLoc);
      }
    });
    return Array.from(set).sort();
  }, [properties]);

  // Filter & Sort Logic
  const filteredProperties = useMemo(() => {
    let result = properties.filter((p) => {
      const q = search.toLowerCase().trim();
      const pTitle = (p.title || '').toLowerCase();
      const pLoc = (p.location || '').toLowerCase();
      const pAddr = (p.address || '').toLowerCase();
      const pCity = (p.city || '').toLowerCase();
      const pKey = (p.listingKey || p.listing_key || '').toLowerCase();
      const pId = String(p.listingId || p.listing_id || p.id || '').toLowerCase();

      const matchesSearch = 
        !q ||
        pTitle.includes(q) ||
        pLoc.includes(q) ||
        pAddr.includes(q) ||
        pCity.includes(q) ||
        pKey.includes(q) ||
        pId.includes(q);

      const pStatus = String(p.status || '').toUpperCase();
      const pStdStatus = String(p.standard_status || p.standardStatus || '').toUpperCase();

      // Horizontal Sub-Tab filter
      let matchesTab = true;
      if (activeTab === 'NEEDS_APPROVAL') {
        matchesTab = pStdStatus === 'PENDING APPROVAL';
      } else if (activeTab === 'ACTIVE') {
        matchesTab = pStdStatus === 'ACTIVE' || pStatus === 'AVAILABLE';
      } else if (activeTab === 'RESERVED' || activeTab === 'CONTRACT') {
        matchesTab = pStdStatus === 'ACTIVE UNDER CONTRACT' || pStatus === 'RESERVED' || pStatus === 'PENDING' || pStatus === 'UNDER CONTRACT';
      } else if (activeTab === 'SOLD' || activeTab === 'CLOSED') {
        matchesTab = pStdStatus === 'CLOSED' || pStatus === 'SOLD';
      } else if (activeTab === 'DRAFT') {
        matchesTab = pStdStatus === 'DRAFT' || pStatus === 'INACTIVE';
      }

      // Dropdown Status Filter
      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        const sf = statusFilter.toUpperCase();
        if (sf === 'ACTIVE') {
          matchesStatus = pStdStatus === 'ACTIVE' || pStatus === 'AVAILABLE';
        } else if (sf === 'NEEDS_APPROVAL') {
          matchesStatus = pStdStatus === 'PENDING APPROVAL';
        } else if (sf === 'RESERVED') {
          matchesStatus = pStdStatus === 'ACTIVE UNDER CONTRACT' || pStatus === 'RESERVED' || pStatus === 'PENDING' || pStatus === 'UNDER CONTRACT';
        } else if (sf === 'SOLD') {
          matchesStatus = pStdStatus === 'CLOSED' || pStatus === 'SOLD';
        } else if (sf === 'DRAFT') {
          matchesStatus = pStdStatus === 'DRAFT' || pStatus === 'INACTIVE';
        } else {
          matchesStatus = pStatus === sf || pStdStatus === sf;
        }
      }

      // Dropdown Property Type Filter
      let matchesType = true;
      if (typeFilter !== 'ALL') {
        matchesType = (p.property_type || p.propertyType || '').toLowerCase() === typeFilter.toLowerCase();
      }

      // Dropdown Location Filter
      let matchesLocation = true;
      if (locationFilter !== 'ALL') {
        matchesLocation = (p.city || p.location || '').toLowerCase().includes(locationFilter.toLowerCase());
      }

      return matchesSearch && matchesTab && matchesStatus && matchesType && matchesLocation;
    });

    // Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => (b.price_raw || b.price || 0) - (a.price_raw || a.price || 0));
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => (a.price_raw || a.price || 0) - (b.price_raw || b.price || 0));
    } else if (sortBy === 'title_asc') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [properties, search, activeTab, statusFilter, typeFilter, locationFilter, sortBy]);

  // Checkbox selection logic
  const handleToggleSelect = (key) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleToggleSelectAll = (keys) => {
    setSelectedKeys(prev => {
      const allSelected = keys.every(k => prev.has(k));
      const next = new Set(prev);
      if (allSelected) {
        keys.forEach(k => next.delete(k));
      } else {
        keys.forEach(k => next.add(k));
      }
      return next;
    });
  };

  // Approve listing inline
  const handleInlineApprove = async (e, row) => {
    e.stopPropagation();
    const targetId = row.id || row.listingKey;
    setProperties(prev => prev.map(p => {
      if ((p.id || p.listingKey) === targetId) {
        return {
          ...p,
          standard_status: 'Active',
          standardStatus: 'Active',
          status: 'AVAILABLE'
        };
      }
      return p;
    }));
    showToast(`Approved & published "${row.title}"`);
    try {
      await propertyService.updateProperty(targetId, {
        standardStatus: 'Active',
        status: 'AVAILABLE'
      });
    } catch (err) {
      console.warn('API update failed, preserved locally:', err);
    }
  };

  // Duplicate listing
  const handleDuplicate = (e, row) => {
    e.stopPropagation();
    const clone = {
      ...row,
      id: `copy-${Date.now()}`,
      listingKey: `HSR-${Math.floor(10000000 + Math.random() * 90000000)}`,
      title: `${row.title} (Copy)`,
      standard_status: 'Draft',
      standardStatus: 'Draft',
      status: 'INACTIVE',
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    setProperties(prev => [clone, ...prev]);
    showToast(`Duplicated listing as "${clone.title}"`);
  };

  // Batch Status Update
  const handleBatchStatusUpdate = async (newStatus, newStandardStatus) => {
    const keysToUpdate = Array.from(selectedKeys);
    setProperties(prev => prev.map(p => {
      const key = p.listingKey || p.id;
      if (selectedKeys.has(key)) {
        return {
          ...p,
          status: newStatus,
          standard_status: newStandardStatus || newStatus,
          standardStatus: newStandardStatus || newStatus,
        };
      }
      return p;
    }));
    showToast(`Updated ${keysToUpdate.length} listings to "${newStatus}"`);
    setSelectedKeys(new Set());

    try {
      await Promise.allSettled(
        keysToUpdate.map(id => propertyService.updateProperty(id, {
          status: newStatus,
          standardStatus: newStandardStatus || newStatus
        }))
      );
    } catch (err) {
      console.warn('Batch update API dispatch partial failure:', err);
    }
  };

  const handleQuickDrawerSave = (updated) => {
    setProperties(prev => prev.map(p => {
      if ((p.listingKey || p.id) === (updated.listingKey || updated.id)) {
        return { ...p, ...updated };
      }
      return p;
    }));
    showToast(`Saved changes to "${updated.title}"`);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setLocationFilter('ALL');
    setSortBy('newest');
    setActiveTab('ALL');
    showToast('Filters reset to default');
  };

  // High-Density 8-Column Data Table Structure Matching User Mockup
  const columns = [
    {
      header: "Property",
      className: "min-w-[280px]",
      render: (row) => {
        const title = row.title || 'Untitled property';
        const listingCode = row.listing_id || row.listingId || (row.listing_key || row.listingKey ? `KEY: ${row.listing_key || row.listingKey}` : (row.id ? `ID: ${row.id}` : 'Not provided'));
        const thumbnailImg = row.mainImage || (Array.isArray(row.images) && row.images.length > 0 ? row.images[0] : null) || row.thumbnail || row.image || (Array.isArray(row.property_images) && row.property_images[0] ? (row.property_images[0].imageUrl || row.property_images[0].image_url) : null);
        return (
          <div className="flex items-center gap-3">
            <PropertyThumbnail image={thumbnailImg} title={title} />
            <div className="min-w-0 flex-1">
              <span
                className="font-semibold text-[#1E293B] block truncate text-xs hover:text-[#0F766E] transition-colors"
                title={title}
              >
                {title}
              </span>
              <span
                className="text-[11px] text-[#64748B] font-mono block mt-0.5 truncate"
                title={listingCode}
              >
                {listingCode}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: "Location",
      className: "min-w-[190px]",
      render: (row) => {
        const primaryLoc = row.city || row.subdivision_name || row.address || row.location || "Location not provided";
        const secondaryLoc = row.state_or_province || (row.city && row.address && row.address !== row.city ? row.address : null);
        return (
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <p
                className="text-xs text-[#1E293B] font-medium leading-snug truncate"
                title={primaryLoc}
              >
                {primaryLoc}
              </p>
              {secondaryLoc && (
                <p
                  className="text-[11px] text-[#64748B] leading-tight truncate"
                  title={secondaryLoc}
                >
                  {secondaryLoc}
                </p>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: "Property Type",
      className: "min-w-[150px]",
      render: (row) => {
        const type = row.property_type || row.propertyType || "Type not provided";
        const subtype = row.property_sub_type || row.propertySubType || null;
        return (
          <div className="flex items-start gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <p
                className="text-xs text-[#1E293B] font-medium leading-snug truncate"
                title={type}
              >
                {type}
              </p>
              {subtype && (
                <p
                  className="text-[11px] text-[#64748B] leading-tight truncate"
                  title={subtype}
                >
                  {subtype}
                </p>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: "Specs",
      className: "min-w-[130px] text-xs",
      render: (row) => {
        const rawArea = row.livingArea ?? row.living_area ?? row.sqft ?? row.specs?.livingArea;
        const hasArea = rawArea !== null && rawArea !== undefined && rawArea !== '';
        let unitLabel = 'm²';
        const units = (row.living_area_units || row.livingAreaUnits || '').toLowerCase();
        if (units.includes('foot') || units.includes('feet') || units === 'sqft') {
          unitLabel = 'sq ft';
        } else if (units.includes('meter') || units === 'sqm') {
          unitLabel = 'm²';
        }
        const areaDisplay = hasArea ? `${rawArea} ${unitLabel}` : 'Not provided';

        const beds = row.bedrooms_total ?? row.bedroomsTotal ?? row.beds ?? row.specs?.bedroomsTotal ?? row.specs?.beds;
        const baths = row.bathrooms_total_integer ?? row.bathroomsTotalInteger ?? row.baths ?? row.specs?.bathroomsTotalInteger ?? row.specs?.baths;
        const bedsDisplay = beds !== null && beds !== undefined && beds !== '' ? beds : '—';
        const bathsDisplay = baths !== null && baths !== undefined && baths !== '' ? baths : '—';

        return (
          <div>
            <div className="flex items-center gap-1 font-mono text-xs text-[#1E293B]" title={`Floor Area: ${areaDisplay}`}>
              <Maximize2 className="w-3 h-3 text-slate-400" aria-hidden="true" />
              <span>{areaDisplay}</span>
            </div>
            <div className="flex items-center gap-2.5 text-[11px] text-[#64748B] mt-0.5">
              <span className="flex items-center gap-1" title={`Bedrooms: ${bedsDisplay}`} aria-label={`Bedrooms: ${bedsDisplay}`}>
                <Bed className="w-3 h-3 text-slate-400" aria-hidden="true" />
                <span>{bedsDisplay}</span>
              </span>
              <span className="flex items-center gap-1" title={`Bathrooms: ${bathsDisplay}`} aria-label={`Bathrooms: ${bathsDisplay}`}>
                <Bath className="w-3 h-3 text-slate-400" aria-hidden="true" />
                <span>{bathsDisplay}</span>
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: "Price",
      className: "min-w-[130px] text-xs",
      render: (row) => {
        const rawPrice = row.price_raw ?? (typeof row.price === 'number' ? row.price : null);
        const hasValidPrice = rawPrice !== null && rawPrice !== undefined && Number(rawPrice) > 0;
        const formatted = hasValidPrice
          ? `₱${Number(rawPrice).toLocaleString()}`
          : (typeof row.price === 'string' && row.price.startsWith('₱') ? row.price : 'Price not provided');

        const assocFee = row.association_fee ?? row.associationFee;
        const hasAssocFee = assocFee !== null && assocFee !== undefined && Number(assocFee) > 0;

        return (
          <div>
            <span className="font-bold text-[#0F766E] block text-xs font-mono truncate" title={formatted}>
              {formatted}
            </span>
            {hasAssocFee ? (
              <span className="text-[10px] text-[#64748B] block truncate" title={`+₱${Number(assocFee).toLocaleString()}/mo HOA`}>
                +₱{Number(assocFee).toLocaleString()}/mo HOA
              </span>
            ) : null}
          </div>
        );
      }
    },
    {
      header: "Status",
      className: "min-w-[125px]",
      render: (row) => {
        const std = String(row.standard_status || row.standardStatus || row.status || '').toUpperCase();
        const isPendingApproval = std === 'PENDING APPROVAL';
        const isActive = std === 'ACTIVE' || std === 'AVAILABLE';
        const isUnderContract = std === 'ACTIVE UNDER CONTRACT' || std === 'UNDER CONTRACT';
        const isReserved = std === 'RESERVED';
        const isPending = std === 'PENDING';
        const isClosed = std === 'CLOSED' || std === 'SOLD';
        const isDraft = std === 'DRAFT' || std === 'INACTIVE';
        const isKnown = isActive || isPendingApproval || isUnderContract || isReserved || isPending || isClosed || isDraft;

        return (
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            )}
            {isPendingApproval && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Needs Approval
              </span>
            )}
            {isUnderContract && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Under Contract
              </span>
            )}
            {isReserved && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Reserved
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Pending
              </span>
            )}
            {isClosed && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Sold
              </span>
            )}
            {isDraft && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Draft
              </span>
            )}
            {!isKnown && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200" aria-label="Unknown status">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Unknown
              </span>
            )}

            {isPendingApproval && (
              <button
                type="button"
                onClick={(e) => handleInlineApprove(e, row)}
                className="text-[10px] font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                title="Approve and activate"
              >
                Approve
              </button>
            )}
          </div>
        );
      }
    },
    {
      header: "Date Added",
      className: "min-w-[130px]",
      render: (row) => {
        const rawDate = row.created_at || row.createdAt;
        const calDate = formatPhilippineCalendarDate(rawDate);
        const relDate = formatPhilippineRelativeTime(rawDate);
        return (
          <div>
            <p className="text-xs text-[#1E293B] font-medium leading-snug" title={`Philippine Standard Time: ${calDate}`}>
              {calDate}
            </p>
            <p className="text-[11px] text-[#64748B] leading-tight" title={relDate}>
              {relDate}
            </p>
          </div>
        );
      }
    },
    {
      header: "Actions",
      className: "w-24 text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link
            to={`/broker/properties/${row.id || row.listingKey}/edit`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0F766E] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Edit Property"
            aria-label="Edit Property"
          >
            <Edit3 className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => handleDuplicate(e, row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0F766E] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Duplicate Property"
            aria-label="Duplicate Property"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => setQuickDrawerProperty(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0F766E] hover:bg-slate-100 transition-colors cursor-pointer"
            title="More Options"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Proposal Columns for the Agent Proposals Review Queue Tab
  const proposalColumns = [
    {
      header: "Target Property",
      className: "min-w-[240px]",
      render: (row) => {
        const propTitle = row.property?.title || row.original_snapshot?.title || 'Listing Proposal';
        const propId = row.property_id || row.propertyId;
        return (
          <div>
            <span className="font-semibold text-[#1E293B] block truncate text-xs hover:text-[#0F766E] transition-colors">
              {propTitle}
            </span>
            <span className="text-[11px] text-[#64748B] font-mono block mt-0.5">
              ID: {propId ? String(propId).slice(0, 8) : '—'}
            </span>
          </div>
        );
      }
    },
    {
      header: "Proposing Agent",
      className: "min-w-[180px]",
      render: (row) => {
        const agent = row.agent || {};
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center font-bold text-xs shrink-0">
              {agent.full_name ? agent.full_name.slice(0, 2).toUpperCase() : 'AG'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1E293B] truncate">{agent.full_name || 'Assigned Agent'}</p>
              <p className="text-[10px] text-[#64748B] truncate">{agent.email || ''}</p>
            </div>
          </div>
        );
      }
    },
    {
      header: "Changed Fields",
      className: "min-w-[180px]",
      render: (row) => {
        const changes = row.proposed_changes || {};
        const keys = Object.keys(changes);
        return (
          <div className="flex flex-wrap gap-1">
            {keys.map((k) => (
              <span key={k} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20">
                {k}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      header: "Submitted",
      className: "min-w-[120px] text-xs font-mono text-[#64748B]",
      render: (row) => formatPhilippineRelativeTime(row.created_at)
    },
    {
      header: "Review Actions",
      className: "text-right min-w-[140px]",
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProposal(row);
          }}
          className="px-3 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          Review & Compare
        </button>
      )
    }
  ];

  return (
    <div className="space-y-5">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#1E293B] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium border border-slate-700 animate-in fade-in duration-150 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Truthful Connection Notice / Error State (No Mock Data Fallback) */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-amber-800 text-xs font-sans">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchProperties()}
            className="font-bold underline uppercase tracking-wider hover:text-amber-900 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Header Section Matching Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1 font-medium">
            <Link to="/broker/dashboard" className="hover:text-[#1E293B] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/broker/properties" className="hover:text-[#1E293B] transition-colors">
              Properties
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#1E293B] font-semibold">All Listings</span>
          </div>

          <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">
            Property Listings
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage and organize your property listings.
          </p>
        </div>

        {/* Action Button Cluster */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchProperties(true)}
            disabled={isRefreshing}
            className="h-10 px-4 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] transition-colors cursor-pointer shadow-2xs flex items-center gap-2"
          >
            <RotateCw className={cn("w-3.5 h-3.5 text-slate-500", isRefreshing && "animate-spin")} />
            <span>Refresh</span>
          </button>
          
          <Link
            to="/broker/properties/create"
            className="h-10 px-4 rounded-lg bg-[#EB0028] hover:bg-[#D00223] active:bg-[#B3021E] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            aria-label="New Listing / Add New Property"
          >
            <Plus className="w-4 h-4 stroke-[2.5] text-white" />
            <span className="text-white font-medium">Add New Property</span>
          </Link>
        </div>
      </div>

      {/* Status Pill Tabs Matching Mockup */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs select-none custom-scrollbar">
        {[
          { id: 'ALL', label: 'All Listings', count: tabCounts.all },
          { id: 'PROPOSALS', label: 'Agent Proposals', count: proposals.length, badge: proposals.length > 0 },
          { id: 'NEEDS_APPROVAL', label: 'Needs Approval', count: tabCounts.needsApproval, badge: true },
          { id: 'ACTIVE', label: 'Active', count: tabCounts.active },
          { id: 'RESERVED', label: 'Reserved', count: tabCounts.reserved, ariaLabel: 'Reserved / Under Contract' },
          { id: 'SOLD', label: 'Sold', count: tabCounts.sold, ariaLabel: 'Sold / Closed' },
          { id: 'DRAFT', label: 'Draft', count: tabCounts.draft },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.ariaLabel || `${tab.label} (${tab.count})`}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer shrink-0 font-medium",
                isSelected
                  ? "bg-[#0F766E] text-white shadow-xs font-semibold"
                  : "bg-slate-100 text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200/80"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                  isSelected
                    ? "bg-white/20 text-white font-bold"
                    : tab.badge && tab.count > 0
                    ? "bg-amber-100 text-amber-800 font-bold"
                    : "bg-white text-slate-600"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Multi-Criteria Search & Filter Toolbar Matching Mockup */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-3 shadow-2xs flex flex-wrap items-center gap-2.5">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties by title, location, or listing code..."
            className="w-full h-9 pl-9 pr-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="w-36 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-9 px-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] cursor-pointer"
          >
            <option value="ALL">Status: All</option>
            <option value="ACTIVE">Active</option>
            <option value="NEEDS_APPROVAL">Needs Approval</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>

        {/* Property Type Dropdown */}
        <div className="w-36 shrink-0">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full h-9 px-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] cursor-pointer"
          >
            <option value="ALL">Type: All</option>
            {propertyTypeOptions.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
            {propertyTypeOptions.length === 0 && (
              <>
                <option value="Condominium">Condominium</option>
                <option value="House & Lot">House & Lot</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Estate">Estate</option>
              </>
            )}
          </select>
        </div>

        {/* Location Dropdown */}
        <div className="w-36 shrink-0">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full h-9 px-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] cursor-pointer"
          >
            <option value="ALL">Location: All</option>
            {locationOptions.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
            {locationOptions.length === 0 && (
              <>
                <option value="Makati">Makati</option>
                <option value="Taguig">Taguig / BGC</option>
                <option value="Muntinlupa">Muntinlupa</option>
              </>
            )}
          </select>
        </div>

        {/* Sort By Dropdown */}
        <div className="w-36 shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full h-9 px-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] cursor-pointer"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="title_asc">Title: A to Z</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <button
          type="button"
          onClick={handleClearFilters}
          className="h-9 px-3 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#1E293B] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          title="Reset all filters"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Main Data Table or Neutral Empty / Loading States */}
      {activeTab === 'PROPOSALS' ? (
        proposals.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1E293B]">All caught up</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              There are no pending property edit proposals awaiting broker review.
            </p>
          </div>
        ) : (
          <DataTable
            columns={proposalColumns}
            data={proposals}
            keyField="id"
            pageSize={8}
            onRowClick={(row) => setSelectedProposal(row)}
            emptyMessage="No pending edit proposals."
          />
        )
      ) : loading ? (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center space-y-4 shadow-xs">
          <div className="w-9 h-9 border-3 border-[#0F766E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest font-sans font-bold text-[#64748B]">
            Querying Firm Architectural Database...
          </p>
        </div>
      ) : error && properties.length === 0 ? (
        <div className="bg-white rounded-lg border border-red-200 bg-red-50/20 p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1E293B]">Failed to load property listings</h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchProperties()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1E293B]">No property listings yet</h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              No property records currently exist in the database. Add your first listing to populate the directory.
            </p>
          </div>
          <Link
            to="/broker/properties/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B6B] hover:bg-[#EE5A5A] text-[#1E293B] text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Listing</span>
          </Link>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1E293B]">No properties match your filter criteria</h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              Try adjusting or clearing your search term and filters to see available listings.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#1E293B] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredProperties}
          keyField="id"
          pageSize={8}
          selectable={true}
          selectedKeys={selectedKeys}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onRowClick={(row) => navigate(`/broker/properties/${row.id || row.listingKey || row.listingId}`)}
          emptyMessage="No properties match your filter criteria."
        />
      )}

      {/* Floating Batch Action Bar */}
      {selectedKeys.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1E293B] text-white px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-4 text-xs border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-5 h-5 rounded-full bg-[#14B8A6] text-[#0F172A] font-bold flex items-center justify-center text-[10px]">
              {selectedKeys.size}
            </span>
            <span className="text-slate-300">selected</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => handleBatchStatusUpdate('AVAILABLE', 'Active')}
              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              Approve & Activate
            </button>
            <button
              onClick={() => handleBatchStatusUpdate('RESERVED', 'Active Under Contract')}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              Set Reserved
            </button>
            <button
              onClick={() => handleBatchStatusUpdate('SOLD', 'Closed')}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              Set Sold
            </button>
            <button
              onClick={() => setSelectedKeys(new Set())}
              className="text-slate-400 hover:text-white underline cursor-pointer ml-1"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Quick Edit Drawer */}
      <PropertyQuickEditDrawer
        isOpen={Boolean(quickDrawerProperty)}
        property={quickDrawerProperty}
        onClose={() => setQuickDrawerProperty(null)}
        onSave={handleQuickDrawerSave}
      />

      {/* Proposal Review Drawer */}
      <ProposalReviewDrawer
        isOpen={Boolean(selectedProposal)}
        onClose={() => setSelectedProposal(null)}
        proposal={selectedProposal}
        onApprove={handleApproveProposal}
        onReject={handleRejectProposal}
        isProcessing={isProcessingProposal}
      />
    </div>
  );
}
