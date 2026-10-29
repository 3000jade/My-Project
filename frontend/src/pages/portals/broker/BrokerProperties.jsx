import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, CheckCircle2, Plus, RotateCw, Edit3, ExternalLink,
  MapPin, Maximize2, Bed, Bath, Copy, MoreVertical, ChevronRight,
  Search, X, SlidersHorizontal, AlertCircle, Home,
  List, LayoutGrid, Map as MapIcon, Archive, Trash2, RotateCcw
} from 'lucide-react';
import { GooglePropertyMap } from '../../../components/ui/map';
import DataTable from '../../../components/dashboard/DataTable';
import PropertyQuickEditDrawer from '../../../components/cms/PropertyQuickEditDrawer';
import ProposalReviewDrawer from '../../../components/cms/ProposalReviewDrawer';
import ReassignAgentModal from '../../../components/dashboard/ReassignAgentModal';
import PropertyFilterToolbar from '../../../components/properties/PropertyFilterToolbar';
import ArchivePropertyModal from '../../../components/ui/modals/ArchivePropertyModal';
import DeletePropertyModal from '../../../components/ui/modals/DeletePropertyModal';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from '../../../components/ui/dropdown-menu';
import propertyService, { normalizeProperty } from '../../../services/propertyService';
import { cn } from '../../../utils/cn';
import { Badge } from '../../../components/ui/badge';
import { Button, buttonVariants } from '../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, useToast, Toaster } from '../../../components/ui';
import { Spinner } from '../../../components/ui';
import { TableSkeleton, CardGridSkeleton } from '../../../components/dashboard/skeletons';
import useResponsiveColumns from '../../../hooks/useResponsiveColumns';

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

const AVAILABLE_COLUMNS = [
  { id: 'property', label: 'Property', isLocked: true, tiers: ['mobile', 'tablet', 'desktop'] },
  { id: 'location', label: 'Location', tiers: ['tablet', 'desktop'] },
  { id: 'property_type', label: 'Property Type', tiers: ['tablet', 'desktop'] },
  { id: 'specs', label: 'Specs', tiers: ['desktop'] },
  { id: 'price', label: 'Price', tiers: ['mobile', 'tablet', 'desktop'] },
  { id: 'status', label: 'Status', tiers: ['mobile', 'tablet', 'desktop'] },
  { id: 'date_added', label: 'Date Added', tiers: ['desktop'] },
  { id: 'actions', label: 'Actions', isLocked: true, tiers: ['mobile', 'tablet', 'desktop'] },
];

const DEFAULT_VISIBLE_COLUMNS = AVAILABLE_COLUMNS.map((c) => c.id);
const STORAGE_KEY_COLUMNS = 'hsr_broker_properties_columns';

export default function BrokerProperties() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');

  // Device Viewport-Adaptive Column Visibility State
  const {
    visibleColumns: visibleColumnKeys,
    setVisibleColumns: handleVisibleColumnsChange,
    resetToDeviceDefault: handleResetVisibleColumns,
    currentTier: currentDeviceTier
  } = useResponsiveColumns({
    availableColumns: AVAILABLE_COLUMNS,
    storageKey: STORAGE_KEY_COLUMNS,
  });

  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [quickDrawerProperty, setQuickDrawerProperty] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid' | 'map'
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState(null);
  const [hoveredMapPropertyId, setHoveredMapPropertyId] = useState(null);
  const [reassignProp, setReassignProp] = useState(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (typeof toast === 'function') {
      toast({
        title: 'Listing Update',
        description: msg,
        variant: 'default',
      });
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Archive & Delete Modal States
  const [targetArchiveProperty, setTargetArchiveProperty] = useState(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState(null);
  const [batchArchiveMode, setBatchArchiveMode] = useState(false);

  const [targetDeleteProperty, setTargetDeleteProperty] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [batchDeleteMode, setBatchDeleteMode] = useState(false);

  const handleArchiveClick = (row) => {
    setTargetArchiveProperty(row);
    setBatchArchiveMode(false);
    setArchiveError(null);
    setIsArchiveModalOpen(true);
  };

  const handleConfirmArchive = async () => {
    if (!targetArchiveProperty) return;
    setIsArchiving(true);
    setArchiveError(null);
    try {
      const targetId = targetArchiveProperty.id || targetArchiveProperty.listingKey;
      await propertyService.updateProperty(targetId, {
        status: 'inactive',
        standard_status: 'Closed',
        standardStatus: 'Closed',
      });
      setProperties(prev => prev.map(p => {
        if (p.id === targetId || p.listingKey === targetId) {
          return { ...p, status: 'inactive', standard_status: 'Closed', standardStatus: 'Closed' };
        }
        return p;
      }));
      showToast(`Listing "${targetArchiveProperty.title}" archived successfully.`);
      setIsArchiveModalOpen(false);
      setTargetArchiveProperty(null);
    } catch (err) {
      setArchiveError(err.message || 'Failed to archive property listing.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleReactivateClick = async (row) => {
    const targetId = row.id || row.listingKey;
    try {
      await propertyService.updateProperty(targetId, {
        status: 'available',
        standard_status: 'Active',
        standardStatus: 'Active',
      });
      setProperties(prev => prev.map(p => {
        if (p.id === targetId || p.listingKey === targetId) {
          return { ...p, status: 'available', standard_status: 'Active', standardStatus: 'Active' };
        }
        return p;
      }));
      showToast(`Listing "${row.title}" reactivated and restored to Active status.`);
    } catch (err) {
      showToast(err.message || 'Failed to reactivate listing.');
    }
  };

  const handleDeleteClick = (row) => {
    setTargetDeleteProperty(row);
    setBatchDeleteMode(false);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetDeleteProperty) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const targetId = targetDeleteProperty.id || targetDeleteProperty.listingKey;
      await propertyService.deleteProperty(targetId);
      setProperties(prev => prev.filter(p => p.id !== targetId && p.listingKey !== targetId));
      setSelectedKeys(prev => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      showToast(`Listing "${targetDeleteProperty.title}" permanently deleted.`);
      setIsDeleteModalOpen(false);
      setTargetDeleteProperty(null);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete listing.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBatchArchivePrompt = () => {
    setBatchArchiveMode(true);
    setArchiveError(null);
    setIsArchiveModalOpen(true);
  };

  const handleConfirmBatchArchive = async () => {
    setIsArchiving(true);
    setArchiveError(null);
    try {
      const keys = Array.from(selectedKeys);
      await Promise.allSettled(
        keys.map(id => propertyService.updateProperty(id, {
          status: 'inactive',
          standard_status: 'Closed',
          standardStatus: 'Closed',
        }))
      );
      setProperties(prev => prev.map(p => {
        if (selectedKeys.has(p.id) || selectedKeys.has(p.listingKey)) {
          return { ...p, status: 'inactive', standard_status: 'Closed', standardStatus: 'Closed' };
        }
        return p;
      }));
      showToast(`${keys.length} listings archived successfully.`);
      setSelectedKeys(new Set());
      setIsArchiveModalOpen(false);
      setBatchArchiveMode(false);
    } catch (err) {
      setArchiveError(err.message || 'Failed to archive selected listings.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleBatchDeletePrompt = () => {
    setBatchDeleteMode(true);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmBatchDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const keys = Array.from(selectedKeys);
      await Promise.allSettled(
        keys.map(id => propertyService.deleteProperty(id))
      );
      setProperties(prev => prev.filter(p => !selectedKeys.has(p.id) && !selectedKeys.has(p.listingKey)));
      showToast(`${keys.length} listings permanently deleted.`);
      setSelectedKeys(new Set());
      setIsDeleteModalOpen(false);
      setBatchDeleteMode(false);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete selected listings.');
    } finally {
      setIsDeleting(false);
    }
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
    let pendingConfirmation = 0;
    let actionRequired = 0;
    let active = 0;
    let reserved = 0;
    let sold = 0;
    let draft = 0;
    let inactive = 0;

    properties.forEach(p => {
      const std = String(p.standard_status || p.standardStatus || '').toUpperCase();
      const s = String(p.status || '').toUpperCase();
      const asg = String(p.assignment_status || p.assignmentStatus || '').toUpperCase();

      if (asg === 'PENDING_CONFIRMATION' || std === 'PENDING CONFIRMATION') {
        pendingConfirmation++;
      }
      if (asg === 'REJECTED' || std === 'ACTION REQUIRED') {
        actionRequired++;
      }
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
      if (std === 'DRAFT') {
        draft++;
      }
      if (s === 'INACTIVE' || std === 'HOLD' || std === 'INACTIVE') {
        inactive++;
      }
    });

    return {
      all: properties.length,
      pendingConfirmation,
      actionRequired,
      needsApproval,
      active,
      reserved,
      sold,
      draft,
      inactive,
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
      const isPendingConfirm = (p.assignment_status || p.assignmentStatus) === 'PENDING_CONFIRMATION' || pStdStatus === 'PENDING CONFIRMATION';
      const isActionReq = (p.assignment_status || p.assignmentStatus) === 'REJECTED' || pStdStatus === 'ACTION REQUIRED';

      if (activeTab === 'PENDING_CONFIRMATION') {
        matchesTab = isPendingConfirm;
      } else if (activeTab === 'ACTION_REQUIRED') {
        matchesTab = isActionReq;
      } else if (activeTab === 'NEEDS_APPROVAL') {
        matchesTab = pStdStatus === 'PENDING APPROVAL';
      } else if (activeTab === 'ACTIVE') {
        matchesTab = pStdStatus === 'ACTIVE' || pStatus === 'AVAILABLE';
      } else if (activeTab === 'RESERVED' || activeTab === 'CONTRACT') {
        matchesTab = pStdStatus === 'ACTIVE UNDER CONTRACT' || pStatus === 'RESERVED' || pStatus === 'PENDING' || pStatus === 'UNDER CONTRACT';
      } else if (activeTab === 'SOLD' || activeTab === 'CLOSED') {
        matchesTab = pStdStatus === 'CLOSED' || pStatus === 'SOLD';
      } else if (activeTab === 'DRAFT') {
        matchesTab = pStdStatus === 'DRAFT';
      } else if (activeTab === 'INACTIVE' || activeTab === 'ARCHIVED') {
        matchesTab = pStatus === 'INACTIVE' || pStdStatus === 'HOLD' || pStdStatus === 'INACTIVE';
      }

      // Dropdown Status Filter
      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        const sf = statusFilter.toUpperCase();
        if (sf === 'PENDING_CONFIRMATION') {
          matchesStatus = isPendingConfirm;
        } else if (sf === 'ACTION_REQUIRED') {
          matchesStatus = isActionReq;
        } else if (sf === 'ACTIVE') {
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

      // Price Range Filter
      let matchesPrice = true;
      if (priceRange.min !== '') {
        matchesPrice = matchesPrice && (p.price_raw || p.price || 0) >= Number(priceRange.min);
      }
      if (priceRange.max !== '') {
        matchesPrice = matchesPrice && (p.price_raw || p.price || 0) <= Number(priceRange.max);
      }

      return matchesSearch && matchesTab && matchesStatus && matchesType && matchesLocation && matchesPrice;
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
  }, [properties, search, activeTab, statusFilter, typeFilter, locationFilter, priceRange, sortBy]);

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
    setPriceRange({ min: '', max: '' });
    setSortBy('newest');
    setActiveTab('ALL');
    showToast('Filters reset to default');
  };

  // High-Density 8-Column Data Table Structure Matching User Mockup
  const columns = [
    {
      id: 'property',
      header: "Property",
      className: "min-w-[280px]",
      render: (row) => {
        const title = row.title || 'Untitled property';
        const rawKey = row.listing_key || row.listingKey;
        const listingCode = row.listing_id || row.listingId || (rawKey ? `ID: ${rawKey}` : (row.id ? `ID: ${row.id}` : 'Not provided'));
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
      id: 'location',
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
      id: 'property_type',
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
      id: 'specs',
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
      id: 'price',
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
      id: 'status',
      header: "Status",
      className: "min-w-[125px]",
      render: (row) => {
        const std = String(row.standard_status || row.standardStatus || row.status || '').toUpperCase();
        const isPendingConfirm = (row.assignment_status || row.assignmentStatus) === 'PENDING_CONFIRMATION' || std === 'PENDING CONFIRMATION';
        const isActionReq = (row.assignment_status || row.assignmentStatus) === 'REJECTED' || std === 'ACTION REQUIRED';
        const isPendingApproval = std === 'PENDING APPROVAL';
        const isActive = std === 'ACTIVE' || std === 'AVAILABLE';
        const isUnderContract = std === 'ACTIVE UNDER CONTRACT' || std === 'UNDER CONTRACT';
        const isReserved = std === 'RESERVED';
        const isPending = std === 'PENDING';
        const isClosed = std === 'CLOSED' || std === 'SOLD';
        const isDraft = std === 'DRAFT' || std === 'INACTIVE';
        const isKnown = isActive || isPendingApproval || isUnderContract || isReserved || isPending || isClosed || isDraft || isPendingConfirm || isActionReq;

        return (
          <div className="flex items-center gap-2">
            {isPendingConfirm && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Pending Confirmation
              </span>
            )}
            {isActionReq && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Action Required
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReassignProp(row);
                    setIsReassignModalOpen(true);
                  }}
                  className="text-[10px] font-semibold text-[#0F766E] hover:text-[#115E59] bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors shadow-2xs"
                  title="Reassign to another agent"
                >
                  Reassign
                </button>
              </div>
            )}
            {!isPendingConfirm && !isActionReq && isActive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Closed / Sold
              </span>
            )}
            {isDraft && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
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
      id: 'date_added',
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
      id: 'actions',
      header: "Actions",
      className: "w-14 text-center",
      render: (row) => {
        const isArchived = String(row.status || '').toUpperCase() === 'INACTIVE' || String(row.standard_status || row.standardStatus || '').toUpperCase() === 'CLOSED' || String(row.standard_status || row.standardStatus || '').toUpperCase() === 'HOLD' || String(row.standard_status || row.standardStatus || '').toUpperCase() === 'INACTIVE';
        return (
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#1E293B] hover:bg-slate-100 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                  title="More options"
                  aria-label={`More options for ${row.title || 'property'}`}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl border border-[#E2E8F0] bg-white shadow-lg text-xs z-30 font-sans">
                <DropdownMenuItem
                  onClick={() => navigate(`/broker/properties/${row.id || row.listingKey}/edit`)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1E293B] hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Edit Property</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setQuickDrawerProperty(row)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1E293B] hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Quick Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => handleDuplicate(e, row)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1E293B] hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Duplicate Property</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-[#E2E8F0]" />
                {isArchived ? (
                  <DropdownMenuItem
                    onClick={() => handleReactivateClick(row)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reactivate Listing</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => handleArchiveClick(row)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5 text-amber-600" />
                    <span>Archive Listing</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(row)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Delete Property</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ];

  const displayedColumns = useMemo(() => {
    return columns.filter((col) => !col.id || visibleColumnKeys.includes(col.id));
  }, [columns, visibleColumnKeys]);

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
      {error && properties.length > 0 && (
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
        {/* Segmented View Mode Controls */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-[#E2E8F0]" role="group" aria-label="View switcher">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            aria-label="Table View"
            className={cn(
              "h-8 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === 'table' ? "bg-white text-[#0F766E] shadow-2xs font-bold" : "text-[#64748B] hover:text-[#1E293B]"
            )}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid View"
            className={cn(
              "h-8 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === 'grid' ? "bg-white text-[#0F766E] shadow-2xs font-bold" : "text-[#64748B] hover:text-[#1E293B]"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            aria-label="Map View"
            className={cn(
              "h-8 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === 'map' ? "bg-white text-[#0F766E] shadow-2xs font-bold" : "text-[#64748B] hover:text-[#1E293B]"
            )}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Map</span>
          </button>
        </div>

          <button
            onClick={() => fetchProperties(true)}
            disabled={isRefreshing}
            className="h-10 px-4 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] transition-colors cursor-pointer shadow-2xs flex items-center gap-2"
          >
            <RotateCw className={cn("w-3.5 h-3.5 text-slate-500", isRefreshing && "animate-spin")} />
            <span>Refresh</span>
          </button>
          
          <Link
            to="/broker/properties/select-type"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-10 px-4 flex items-center gap-1.5 cursor-pointer shadow-xs"
            )}
            aria-label="New Listing / Add New Property"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="font-medium">Add New Property</span>
          </Link>
        </div>
      </div>

      {/* Property Filter & Search Toolbar */}
      <PropertyFilterToolbar
        search={search}
        onSearchChange={setSearch}
        statusTab={activeTab}
        onStatusTabChange={setActiveTab}
        statusCounts={{
          all: tabCounts.all,
          active: tabCounts.active,
          needsApproval: tabCounts.needsApproval,
          proposals: proposals.length,
          pendingConfirmation: tabCounts.pendingConfirmation,
          actionRequired: tabCounts.actionRequired,
          reserved: tabCounts.reserved,
          sold: tabCounts.sold,
          draft: tabCounts.draft,
          inactive: tabCounts.inactive
        }}
        selectedType={typeFilter}
        onTypeChange={setTypeFilter}
        propertyTypeOptions={propertyTypeOptions}
        selectedLocation={locationFilter}
        onLocationChange={setLocationFilter}
        locationOptions={locationOptions}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onResetFilters={handleClearFilters}
        totalCount={properties.length}
        filteredCount={filteredProperties.length}
        availableColumns={AVAILABLE_COLUMNS}
        visibleColumns={visibleColumnKeys}
        onVisibleColumnsChange={handleVisibleColumnsChange}
        onResetColumns={handleResetVisibleColumns}
        currentTier={currentDeviceTier}
      />

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
        viewMode === 'grid' ? (
          <CardGridSkeleton count={6} />
        ) : (
          <TableSkeleton rows={6} />
        )
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
            to="/broker/properties/select-type"
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
        viewMode === 'map' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" data-lenis-prevent="true" data-testid="cadastral-split-view">
            {/* Left Listing Column */}
            <div className="lg:col-span-5 space-y-3.5 max-h-[720px] overflow-y-auto pr-1 custom-scrollbar">
              <div className="flex items-center justify-between text-xs text-[#64748B] px-1 pb-1">
                <span className="font-semibold text-[#1E293B]">Showing {filteredProperties.length} Properties</span>
                <span className="text-[11px] font-mono">Click card or pin to highlight</span>
              </div>
              {filteredProperties.map((prop) => {
                const isSelected = selectedMapPropertyId === prop.id;
                const isHovered = hoveredMapPropertyId === prop.id;
                const priceDisplay = typeof prop.price === 'number' 
                  ? `₱${prop.price.toLocaleString()}` 
                  : (prop.price || 'Price upon request');

                return (
                  <div
                    key={prop.id}
                    onClick={() => setSelectedMapPropertyId(prop.id)}
                    onMouseEnter={() => setHoveredMapPropertyId(prop.id)}
                    onMouseLeave={() => setHoveredMapPropertyId(null)}
                    className={cn(
                      "p-4 rounded-xl border bg-white transition-all cursor-pointer shadow-xs hover:shadow-md",
                      isSelected ? "border-[#0F766E] ring-2 ring-[#0F766E]/20" : "border-[#E2E8F0] hover:border-slate-300",
                      isHovered && "bg-teal-50/20"
                    )}
                    data-testid={`map-property-card-${prop.id}`}
                    data-card="broker-card"
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        {prop.mainImage || (prop.images && prop.images[0]) ? (
                          <img
                            src={prop.mainImage || prop.images[0]}
                            alt={prop.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Building2 className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-[#0F766E] font-semibold">{prop.listingKey || prop.listing_key || 'HSR-LISTING'}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {prop.standard_status || prop.standardStatus || prop.status || 'Active'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#1E293B] truncate leading-snug">
                          {prop.title}
                        </h4>
                        <p className="text-[11px] text-[#64748B] truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#0F766E] shrink-0" />
                          <span>{prop.city || prop.location || 'Metro Manila'}</span>
                        </p>
                        <div className="text-sm font-extrabold text-[#0F766E] font-mono">
                          {priceDisplay}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                        {prop.bedrooms != null && (
                          <span className="flex items-center gap-1">
                            <Bed className="w-3.5 h-3.5 text-slate-400" />
                            <span>{prop.bedrooms} beds</span>
                          </span>
                        )}
                        {prop.bathrooms != null && (
                          <span className="flex items-center gap-1">
                            <Bath className="w-3.5 h-3.5 text-slate-400" />
                            <span>{prop.bathrooms} baths</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickDrawerProperty(prop);
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[#1E293B] text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Quick Edit
                        </button>
                        <Link
                          to={`/broker/properties/${prop.id || prop.listingKey || prop.listingId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 rounded bg-[#0F766E] hover:bg-[#115E59] text-white text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Dossier</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Sticky Cadastral Map Viewport */}
            <div className="lg:col-span-7 lg:sticky lg:top-20 h-[500px] lg:h-[720px] w-full rounded-xl overflow-hidden border border-[#E2E8F0] shadow-sm bg-slate-100" data-lenis-prevent="true">
              <GooglePropertyMap
                properties={filteredProperties}
                selectedPropertyId={selectedMapPropertyId}
                hoveredPropertyId={hoveredMapPropertyId}
                onSelectProperty={(p) => setSelectedMapPropertyId(p.id)}
                singlePropertyMode={false}
                showControls={true}
                className="w-full h-full"
              />
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-view">
            {filteredProperties.map((prop) => {
              const priceDisplay = typeof prop.price === 'number' 
                ? `₱${prop.price.toLocaleString()}` 
                : (prop.price || 'Price upon request');
              return (
                <div
                  key={prop.id}
                  onClick={() => navigate(`/broker/properties/${prop.id || prop.listingKey || prop.listingId}`)}
                  className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  data-testid={`grid-property-card-${prop.id}`}
                  data-card="broker-card"
                >
                  <div>
                    <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
                      {prop.mainImage || (prop.images && prop.images[0]) ? (
                        <img
                          src={prop.mainImage || prop.images[0]}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Building2 className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-[#0F766E] shadow-2xs border border-white/60">
                          {prop.standard_status || prop.standardStatus || prop.status || 'Active'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="text-[11px] font-mono text-[#0F766E] font-semibold">
                        {prop.listingKey || prop.listing_key || 'HSR-LISTING'}
                      </div>
                      <h4 className="text-sm font-bold text-[#1E293B] truncate group-hover:text-[#0F766E] transition-colors">
                        {prop.title}
                      </h4>
                      <p className="text-xs text-[#64748B] truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                        <span>{prop.city || prop.location || 'Metro Manila'}</span>
                      </p>
                      <div className="text-base font-extrabold text-[#0F766E] font-mono pt-1">
                        {priceDisplay}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
                    <div className="flex items-center gap-2.5 text-[11px]">
                      <span>{prop.bedrooms ?? 0} beds</span>
                      <span>•</span>
                      <span>{prop.bathrooms ?? 0} baths</span>
                    </div>
                    <span className="text-[#0F766E] font-semibold text-[11px] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
                  <DataTable
          columns={displayedColumns}
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
        )
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
              onClick={handleBatchArchivePrompt}
              className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive Selected</span>
            </button>
            <button
              onClick={handleBatchDeletePrompt}
              className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
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

      {/* Archive Property Confirmation Modal */}
      <ArchivePropertyModal
        isOpen={isArchiveModalOpen}
        onClose={() => {
          setIsArchiveModalOpen(false);
          setTargetArchiveProperty(null);
          setBatchArchiveMode(false);
        }}
        onConfirm={batchArchiveMode ? handleConfirmBatchArchive : handleConfirmArchive}
        property={batchArchiveMode ? null : targetArchiveProperty}
        selectedCount={batchArchiveMode ? selectedKeys.size : 0}
        isArchiving={isArchiving}
        error={archiveError}
      />

      {/* Delete Property Confirmation Modal */}
      <DeletePropertyModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTargetDeleteProperty(null);
          setBatchDeleteMode(false);
        }}
        onConfirm={batchDeleteMode ? handleConfirmBatchDelete : handleConfirmDelete}
        property={batchDeleteMode ? null : targetDeleteProperty}
        selectedCount={batchDeleteMode ? selectedKeys.size : 0}
        isDeleting={isDeleting}
        error={deleteError}
      />

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

      {/* Reassign Agent Modal */}
      <ReassignAgentModal
        isOpen={isReassignModalOpen}
        onClose={() => {
          setIsReassignModalOpen(false);
          setReassignProp(null);
        }}
        property={reassignProp}
        onSuccess={(propId, newAgentId) => {
          setProperties(prev => prev.map(p => {
            if ((p.id || p.listingKey) === propId) {
              return {
                ...p,
                agent_id: newAgentId,
                agentId: newAgentId,
                assignment_status: 'PENDING_CONFIRMATION',
                assignmentStatus: 'PENDING_CONFIRMATION',
                standard_status: 'Pending Confirmation',
                standardStatus: 'Pending Confirmation',
                assignment_declined_reason: null,
                assignmentDeclinedReason: null
              };
            }
            return p;
          }));
          showToast('Listing successfully reassigned. Waiting for new agent confirmation.');
        }}
      />
      <Toaster />
    </div>
  );
}
