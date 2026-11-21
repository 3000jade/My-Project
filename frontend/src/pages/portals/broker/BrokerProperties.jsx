import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2, CheckCircle2, Plus, RotateCw, Edit3, ExternalLink,
  MapPin, Maximize2, Bed, Bath, Copy, MoreVertical, ChevronRight,
  Search, X, SlidersHorizontal, AlertCircle, Home,
  List, LayoutGrid, Map as MapIcon, Archive, Trash2, RotateCcw, UserCheck, History
} from 'lucide-react';
import { GooglePropertyMap } from '../../../components/ui/map';
import DataTable from '../../../components/dashboard/DataTable';
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
import agentService from '../../../services/agentService';
import auditService from '../../../services/auditService';
import { useAuth } from '../../../context/AuthContext';
import { cn } from '../../../utils/cn';
import { Badge } from '../../../components/ui/badge';
import { Button, buttonVariants } from '../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Alert, AlertTitle, AlertDescription, useToast, Toaster } from '../../../components/ui';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../../../components/ui/empty';
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

const SEEN_ACTIVITY_STORAGE_KEY = 'hsr_seen_property_activity';
const ACTIVITY_TTL_MS = 3 * 24 * 60 * 60 * 1000;

const BROKER_STATUS_STYLES = {
  DRAFT: { label: 'Draft', pill: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  PENDING_APPROVAL: { label: 'Pending Approval', pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse' },
  AWAITING_AGENT: { label: 'Awaiting Agent', pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  NEEDS_AGENT: { label: 'Needs Agent', pill: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-400' },
  AGENT_DECLINED: { label: 'Agent Declined', pill: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  PUBLISHED: { label: 'Published', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  RESERVED: { label: 'Reserved', pill: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  UNPUBLISHED: { label: 'Off Market', pill: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  CLOSED: { label: 'Closed', pill: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-500' },
};

function hasAssignedAgent(p) {
  const key = p.list_agent_key || p.listAgentKey || p.agent_id || p.agentId;
  if (key && String(key).trim() !== '') return true;
  if (p.isCorporateDesk || p.is_corporate_desk) return false;
  const candidate =
    p.custom_reso_attributes?.credentials?.assignedAgent ||
    p.customResoAttributes?.credentials?.assignedAgent ||
    p.agentName ||
    p.agent_name ||
    p.agent?.name ||
    '';
  return Boolean(candidate && candidate !== 'Human Shelter Realty Desk');
}

function getBrokerDisplayStatus(p) {
  const std = String(p.standard_status || p.standardStatus || '').toUpperCase();
  const s = String(p.status || '').toUpperCase();
  if (std === 'DRAFT') return 'DRAFT';
  if (std === 'PENDING APPROVAL' || std === 'PENDING_APPROVAL') return 'PENDING_APPROVAL';
  if (std === 'PENDING CONFIRMATION' || std === 'PENDING_CONFIRMATION') {
    return hasAssignedAgent(p) ? 'AWAITING_AGENT' : 'NEEDS_AGENT';
  }
  if (std === 'ACTION REQUIRED' || std === 'ACTION_REQUIRED') return 'AGENT_DECLINED';
  if (std === 'CLOSED' || s === 'SOLD') return 'CLOSED';
  if (s === 'INACTIVE' || std === 'INACTIVE' || std === 'HOLD' || std === 'CANCELED' || std === 'CANCELLED' || std === 'EXPIRED' || p.is_published === false || p.isPublished === false) {
    return 'UNPUBLISHED';
  }
  if (std === 'ACTIVE UNDER CONTRACT' || std === 'RESERVED' || std === 'PENDING' || s === 'RESERVED') {
    return 'RESERVED';
  }
  return 'PUBLISHED';
}

function formatPhilippineDateTime(dateStr) {
  if (!dateStr) return 'Unavailable';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unavailable';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date) + ' PST';
  } catch {
    return 'Unavailable';
  }
}

function getDateActivityBadge(row, seenMap = {}, currentUserId = null) {
  const propId = row.id || row.listingKey;
  const createdRaw = row.created_at || row.createdAt;
  const updatedRaw = row.updated_at || row.updatedAt;
  const lastEdit = row.lastEdit || row.custom_reso_attributes?.lastEdit || row.customResoAttributes?.lastEdit;
  const latestIso = lastEdit?.editedAt || updatedRaw || createdRaw;
  if (!latestIso) return null;

  const latestMs = new Date(latestIso).getTime();
  if (isNaN(latestMs) || Date.now() - latestMs > ACTIVITY_TTL_MS) return null;

  const seenIso = propId ? seenMap[propId] : null;
  if (seenIso) {
    const seenMs = new Date(seenIso).getTime();
    if (!isNaN(seenMs) && latestMs <= seenMs) {
      return null;
    }
  }

  const createdMs = createdRaw ? new Date(createdRaw).getTime() : NaN;
  const updatedMs = updatedRaw ? new Date(updatedRaw).getTime() : NaN;
  if (lastEdit || (!isNaN(createdMs) && !isNaN(updatedMs) && updatedMs - createdMs > 60_000)) {
    if (currentUserId && String(lastEdit?.editedById || '') === String(currentUserId)) {
      return null;
    }
    return 'EDITED';
  }
  if (!isNaN(createdMs) && Date.now() - createdMs <= ACTIVITY_TTL_MS) {
    const creatorId = row.created_by || row.createdBy || row.custom_reso_attributes?.created_by;
    if (currentUserId && creatorId && String(creatorId) === String(currentUserId)) {
      return null;
    }
    return 'NEW';
  }
  return null;
}

const AVAILABLE_COLUMNS = [
  { id: 'property', label: 'Property', isLocked: true, tiers: ['mobile', 'tablet', 'desktop'] },
  { id: 'location', label: 'Location', tiers: ['tablet', 'desktop'] },
  { id: 'property_type', label: 'Property Type', tiers: ['tablet', 'desktop'] },
  { id: 'specs', label: 'Specs', tiers: ['desktop'] },
  { id: 'price', label: 'Price', tiers: ['mobile', 'tablet', 'desktop'] },
  { id: 'assigned_agent', label: 'Assigned Agent', tiers: ['tablet', 'desktop'] },
  { id: 'status', label: 'Status', tiers: ['mobile', 'tablet', 'desktop'] },
  { id: 'date_added', label: 'Date Added', tiers: ['desktop'] },
  { id: 'actions', label: 'Actions', isLocked: true, tiers: ['mobile', 'tablet', 'desktop'] },
];

export default function BrokerProperties() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [properties, setProperties] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessingProposal, setIsProcessingProposal] = useState(false);
  const [agentsById, setAgentsById] = useState({});
  const [editDetailsTarget, setEditDetailsTarget] = useState(null);
  const [auditTarget, setAuditTarget] = useState(null);
  const [auditActivityState, setAuditActivityState] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const latestAuditReqRef = useRef(0);
  const [seenActivity, setSeenActivity] = useState(() => {
    try {
      const raw = localStorage.getItem(SEEN_ACTIVITY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Filters & State (hydrated from URL so edits/refreshes preserve broker view)
  const [activeTab, setActiveTab] = useState(() => searchParams.get('status') || 'ALL');
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get('type') || 'ALL');
  const [locationFilter, setLocationFilter] = useState(() => searchParams.get('location') || 'ALL');
  const [priceRange, setPriceRange] = useState(() => ({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  }));
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'newest');

  // Device Viewport-Adaptive Column Visibility State
  const {
    visibleColumns: visibleColumnKeys,
  } = useResponsiveColumns({
    availableColumns: AVAILABLE_COLUMNS,
  });

  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [viewMode, setViewMode] = useState(() => searchParams.get('view') || 'table'); // 'table' | 'grid' | 'map'

  // Sync active filters, sort, and view mode to URL query params
  useEffect(() => {
    const next = new URLSearchParams();
    if (search.trim()) next.set('q', search.trim());
    if (activeTab && activeTab !== 'ALL') next.set('status', activeTab);
    if (typeFilter && typeFilter !== 'ALL') next.set('type', typeFilter);
    if (locationFilter && locationFilter !== 'ALL') next.set('location', locationFilter);
    if (priceRange.min) next.set('minPrice', String(priceRange.min));
    if (priceRange.max) next.set('maxPrice', String(priceRange.max));
    if (sortBy && sortBy !== 'newest') next.set('sort', sortBy);
    if (viewMode && viewMode !== 'table') next.set('view', viewMode);

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [search, activeTab, typeFilter, locationFilter, priceRange.min, priceRange.max, sortBy, viewMode, searchParams, setSearchParams]);
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState(null);
  const [hoveredMapPropertyId, setHoveredMapPropertyId] = useState(null);
  const [reassignProp, setReassignProp] = useState(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);

  const showToast = (msg, variant) => {
    const resolvedVariant = variant || (/^(failed|partial failure)/i.test(String(msg)) ? 'destructive' : 'success');
    if (typeof toast === 'function') {
      toast({
        title: resolvedVariant === 'destructive' ? 'Listing Error' : 'Listing Update',
        description: msg,
        variant: resolvedVariant,
      });
    }
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

  const syncUpdatedPropertyRow = (row, res, fallbackStd) => {
    const targetId = row.id || row.listingKey;
    const updatedProp = res?.property || res?.data || res;
    const nextStd = updatedProp?.standard_status ?? updatedProp?.standardStatus ?? fallbackStd ?? row.standard_status;
    const nextPub = updatedProp?.is_published ?? updatedProp?.isPublished;
    if (updatedProp && (updatedProp.standardStatus !== undefined || updatedProp.standard_status !== undefined || nextPub !== undefined || fallbackStd)) {
      const normalized = normalizeProperty({
        ...row,
        ...(typeof updatedProp === 'object' ? updatedProp : {}),
        ...(fallbackStd && nextPub === undefined ? { status: 'available' } : {}),
        ...(nextPub === false ? { status: 'pending' } : {}),
        standard_status: nextStd,
        standardStatus: nextStd,
        ...(nextPub !== undefined ? { is_published: Boolean(nextPub), isPublished: Boolean(nextPub) } : {}),
      });
      setProperties(prev => prev.map(p => ((p.id || p.listingKey) === targetId ? normalized : p)));
    }
    return nextPub === false;
  };

  const handleReactivateClick = async (row) => {
    const targetId = row.id || row.listingKey;
    try {
      const res = await propertyService.updateProperty(targetId, {
        status: 'available',
        standard_status: 'Active',
        standardStatus: 'Active',
      });
      const heldForConfirmation = syncUpdatedPropertyRow(row, res, 'Active');
      showToast(
        heldForConfirmation
          ? `Listing "${row.title}" updated — waiting for agent confirmation.`
          : `Listing "${row.title}" reactivated and restored to Active status.`
      );
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
      const response = await propertyService.getProperties({ limit: 100 });
      const rawList = response?.data && Array.isArray(response.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      setProperties(rawList);
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
    agentService.getAgents?.()
      .then((list) => {
        if (!Array.isArray(list)) return;
        const map = {};
        list.forEach((a) => {
          if (a?.id) map[String(a.id)] = a;
        });
        setAgentsById(map);
      })
      .catch(() => { });
  }, [fetchProperties, fetchProposals]);

  const dismissActivityBadge = useCallback((row) => {
    const propId = row.id || row.listingKey;
    if (!propId) return;
    const lastEdit = row.lastEdit || row.custom_reso_attributes?.lastEdit || row.customResoAttributes?.lastEdit;
    const latestIso = lastEdit?.editedAt || row.updated_at || row.updatedAt || row.created_at || row.createdAt || new Date().toISOString();
    setSeenActivity((prev) => {
      const next = { ...prev, [propId]: latestIso };
      try {
        localStorage.setItem(SEEN_ACTIVITY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const handleOpenAuditModal = useCallback(async (row, activityState = null) => {
    const resolvedState = activityState ?? getDateActivityBadge(row, seenActivity, user?.id);
    if (resolvedState) dismissActivityBadge(row);
    const reqId = ++latestAuditReqRef.current;
    setAuditTarget(row);
    setAuditActivityState(resolvedState);
    setAuditEvents([]);
    setAuditLoading(true);
    try {
      const events = await auditService.listAuditEvents({
        targetType: 'property',
        targetId: row.id || row.listingKey,
      });
      if (reqId === latestAuditReqRef.current) {
        setAuditEvents(Array.isArray(events) ? events : []);
      }
    } catch {
      if (reqId === latestAuditReqRef.current) {
        setAuditEvents([]);
      }
    } finally {
      if (reqId === latestAuditReqRef.current) {
        setAuditLoading(false);
      }
    }
  }, [dismissActivityBadge, seenActivity, user?.id]);

  const resolveAssignedAgentName = useCallback((row) => {
    const key = row.list_agent_key || row.listAgentKey || row.agent_id || row.agentId;
    if (key && agentsById[String(key)]) {
      return agentsById[String(key)].full_name || agentsById[String(key)].name || '';
    }
    const candidate =
      row.custom_reso_attributes?.credentials?.assignedAgent ||
      row.customResoAttributes?.credentials?.assignedAgent ||
      row.agentName ||
      row.agent_name ||
      row.agent?.name ||
      '';
    if (!key && (row.isCorporateDesk || row.is_corporate_desk || candidate === 'Human Shelter Realty Desk')) {
      return '';
    }
    return candidate;
  }, [agentsById]);

  // Tab counts calculated exclusively from actual dataset
  const tabCounts = useMemo(() => {
    let draft = 0;
    let pendingApproval = 0;
    let awaitingAgent = 0;
    let agentDeclined = 0;
    let published = 0;
    let reserved = 0;
    let unpublished = 0;
    let closed = 0;

    properties.forEach((p) => {
      const bucket = getBrokerDisplayStatus(p);
      if (bucket === 'DRAFT') draft++;
      else if (bucket === 'PENDING_APPROVAL') pendingApproval++;
      else if (bucket === 'AWAITING_AGENT') awaitingAgent++;
      else if (bucket === 'AGENT_DECLINED') agentDeclined++;
      else if (bucket === 'PUBLISHED') published++;
      else if (bucket === 'RESERVED') reserved++;
      else if (bucket === 'UNPUBLISHED') unpublished++;
      else if (bucket === 'CLOSED') closed++;
    });

    return {
      all: properties.length,
      draft,
      pendingApproval,
      awaitingAgent,
      agentDeclined,
      published,
      reserved,
      unpublished,
      closed,
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
      const pSubdiv = (p.subdivisionName || p.subdivision_name || '').toLowerCase();
      const pAgent = resolveAssignedAgentName(p).toLowerCase();
      const pKey = (p.listingKey || p.listing_key || '').toLowerCase();
      const pId = String(p.listingId || p.listing_id || p.id || '').toLowerCase();

      const matchesSearch =
        !q ||
        pTitle.includes(q) ||
        pLoc.includes(q) ||
        pAddr.includes(q) ||
        pCity.includes(q) ||
        pSubdiv.includes(q) ||
        pAgent.includes(q) ||
        pKey.includes(q) ||
        pId.includes(q);

      const displayStatus = getBrokerDisplayStatus(p);

      // Horizontal Sub-Tab filter (5 simplified statuses)
      let matchesTab = true;
      if (activeTab && activeTab !== 'ALL') {
        matchesTab = displayStatus === activeTab.toUpperCase();
      }

      // Dropdown Status Filter
      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        matchesStatus = displayStatus === statusFilter.toUpperCase();
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

      // Price Range Filter (skip inverted bounds while inline warning is shown)
      let matchesPrice = true;
      const minNum = priceRange.min !== '' ? Number(priceRange.min) : null;
      const maxNum = priceRange.max !== '' ? Number(priceRange.max) : null;
      const priceValid = !(minNum !== null && maxNum !== null && minNum > maxNum);
      if (priceValid) {
        if (minNum !== null && !isNaN(minNum)) {
          matchesPrice = matchesPrice && (p.price_raw || p.price || 0) >= minNum;
        }
        if (maxNum !== null && !isNaN(maxNum)) {
          matchesPrice = matchesPrice && (p.price_raw || p.price || 0) <= maxNum;
        }
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
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at || a.createdAt || 0) - new Date(b.created_at || b.createdAt || 0));
    } else if (sortBy === 'title_desc') {
      result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
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
    dismissActivityBadge(row);
    const targetId = row.id || row.listingKey;
    const previousProperties = properties;
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
    try {
      const res = await propertyService.updateProperty(targetId, {
        standardStatus: 'Active',
        status: 'AVAILABLE'
      });
      const heldForConfirmation = syncUpdatedPropertyRow(row, res);
      showToast(
        heldForConfirmation
          ? `Approved "${row.title}" — waiting for agent confirmation.`
          : `Approved & published "${row.title}"`
      );
    } catch (err) {
      console.error('API update failed, reverting:', err);
      setProperties(previousProperties);
      showToast(`Failed to approve "${row.title}". Reverted changes.`);
    }
  };

  // Duplicate listing
  const handleDuplicate = async (e, row) => {
    e.stopPropagation();
    try {
      const clonePayload = {
        title: `${row.title || 'Untitled Property'} (Copy)`,
        price: Number(row.price_raw || row.price) || 0,
        property_type: row.property_type || row.propertyType || 'Residential',
        standard_status: 'Draft',
        status: 'PENDING',
        city: row.city || row.location || 'Metro Manila',
        address: row.address || '',
        beds: Number(row.bedrooms ?? row.beds) || 0,
        baths: Number(row.bathrooms ?? row.baths) || 0,
        living_area: Number(row.living_area || row.livingArea || row.sqm) || 0,
        description: row.description || '',
        features: Array.isArray(row.features) ? row.features : [],
        images: Array.isArray(row.images) && row.images.length > 0 ? row.images : (row.mainImage ? [row.mainImage] : []),
      };
      const created = await propertyService.createProperty(clonePayload);
      if (created) {
        setProperties(prev => [created, ...prev]);
        showToast(`Duplicated listing as "${created.title}"`);
      }
    } catch (err) {
      console.error('Failed to duplicate listing:', err);
      showToast('Failed to duplicate listing. Please try again.');
    }
  };

  // Batch Status Update
  const handleBatchStatusUpdate = async (newStatus, newStandardStatus) => {
    const keysToUpdate = Array.from(selectedKeys);
    if (keysToUpdate.length === 0) return;
    const previousProperties = properties;
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
    setSelectedKeys(new Set());

    try {
      const results = await Promise.allSettled(
        keysToUpdate.map(id => propertyService.updateProperty(id, {
          status: newStatus,
          standardStatus: newStandardStatus || newStatus
        }))
      );
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        showToast(`Partial failure: ${failures.length} listings failed to update. Re-syncing...`);
        fetchProperties(true);
      } else {
        showToast(`Updated ${keysToUpdate.length} listings to "${newStatus}"`);
      }
    } catch (err) {
      console.error('Batch update API dispatch failure:', err);
      setProperties(previousProperties);
      showToast('Batch update failed. Reverted changes.');
    }
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
      sortKey: 'title',
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
      sortKey: 'price',
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
      id: 'assigned_agent',
      header: "Assigned Agent",
      className: "min-w-[155px]",
      render: (row) => {
        const agentName = resolveAssignedAgentName(row);
        const asg = String(row.assignment_status || row.assignmentStatus || '').toUpperCase();
        const initials = agentName
          ? agentName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0].toUpperCase())
            .join('')
          : '';
        const goToAgentAssignment = (e) => {
          e.stopPropagation();
          navigate(`/broker/properties/${row.id || row.listingKey}/edit?step=5`);
        };
        return (
          <button
            type="button"
            onClick={goToAgentAssignment}
            className="flex items-center gap-2 min-w-0 text-left rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-[#F0FDFA] transition-colors cursor-pointer"
            title="Open agent assignment in Step 5"
          >
            {agentName ? (
              <>
                <span className="size-6 rounded-full bg-[#F0FDFA] border border-[#0F766E]/20 text-[#0F766E] text-[10px] font-bold flex items-center justify-center shrink-0">
                  {initials || 'AG'}
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-[#1E293B] truncate block max-w-[110px]" title={agentName}>
                    {agentName}
                  </span>
                  {asg === 'PENDING_CONFIRMATION' && (
                    <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 leading-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Awaiting
                    </span>
                  )}
                  {asg === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200 leading-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Declined
                    </span>
                  )}
                </div>
              </>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                No agent assigned
              </span>
            )}
          </button>
        );
      }
    },
    {
      id: 'status',
      header: "Status",
      className: "min-w-[130px]",
      render: (row) => {
        const displayStatus = getBrokerDisplayStatus(row);
        const cfg = BROKER_STATUS_STYLES[displayStatus] || BROKER_STATUS_STYLES.PUBLISHED;

        return (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${cfg.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {displayStatus === 'PENDING_APPROVAL' && (
              <button
                type="button"
                onClick={(e) => handleInlineApprove(e, row)}
                className="text-[10px] font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                title="Approve and publish"
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
      sortKey: 'date',
      className: "min-w-[140px]",
      render: (row) => {
        const rawDate = row.created_at || row.createdAt;
        const calDate = formatPhilippineCalendarDate(rawDate);
        const relDate = formatPhilippineRelativeTime(rawDate);
        const activityBadge = getDateActivityBadge(row, seenActivity, user?.id);

        const isHighlighted = activityBadge === 'NEW' || activityBadge === 'EDITED';
        return (
          <button
            type="button"
            data-testid={`date-added-btn-${row.id || row.listingKey}`}
            data-highlighted={isHighlighted ? activityBadge.toLowerCase() : 'false'}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAuditModal(row, activityBadge);
            }}
            className={cn(
              'text-left rounded-lg px-2 py-1 -mx-2 transition-colors cursor-pointer flex flex-col gap-0.5 border',
              activityBadge === 'NEW'
                ? 'bg-[#F0FDFA] border-[#0F766E]/30 hover:bg-[#CCFBF1]/60'
                : activityBadge === 'EDITED'
                  ? 'bg-amber-50 border-amber-200 hover:bg-amber-100/70'
                  : 'border-transparent hover:bg-slate-50'
            )}
            title="Click to view audit trail and listing preview"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-xs font-medium leading-snug',
                  activityBadge === 'NEW'
                    ? 'text-[#0F766E] font-semibold'
                    : activityBadge === 'EDITED'
                      ? 'text-amber-900 font-semibold'
                      : 'text-[#1E293B]'
                )}
              >
                {calDate}
              </span>
              {activityBadge === 'NEW' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#0F766E] border border-[#0F766E]/25">
                  New
                </span>
              )}
              {activityBadge === 'EDITED' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-amber-800 border border-amber-300">
                  Edited
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#64748B] leading-tight">
              {relDate}
            </span>
          </button>
        );
      }
    },
    {
      id: 'actions',
      header: "Actions",
      className: "w-14 text-center",
      render: (row) => {
        const displayStatus = getBrokerDisplayStatus(row);
        const isArchived = displayStatus !== 'DRAFT' && (
          String(row.status || '').toUpperCase() === 'INACTIVE' ||
          displayStatus === 'CLOSED' ||
          String(row.standard_status || row.standardStatus || '').toUpperCase() === 'HOLD' ||
          String(row.standard_status || row.standardStatus || '').toUpperCase() === 'INACTIVE'
        );
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
                  onClick={() => {
                    dismissActivityBadge(row);
                    navigate(`/broker/properties/${row.id || row.listingKey}/edit`);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1E293B] hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Edit Property</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setReassignProp(row);
                    setIsReassignModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1E293B] hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Assign / Reassign Agent</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => handleDuplicate(e, row)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1E293B] hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Duplicate Property</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenAuditModal(row)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1E293B] hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <History className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Audit Trail</span>
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
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

          <h1 className="text-3xl sm:text-[36px] font-bold font-display text-[#1E293B] tracking-tight leading-tight">
            Property Listings
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage and organize your property listings.
          </p>
        </div>

        {/* Action Button Cluster */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
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
            className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] transition-colors cursor-pointer shadow-2xs flex items-center gap-2"
          >
            <RotateCw className={cn("w-3.5 h-3.5 text-slate-500", isRefreshing && "animate-spin")} />
            <span>Refresh</span>
          </button>

          <Link
            to="/broker/properties/create"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-9 sm:h-10 px-3 sm:px-4 flex-1 sm:flex-none justify-center flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap normal-case"
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
          draft: tabCounts.draft,
          pendingApproval: tabCounts.pendingApproval,
          awaitingAgent: tabCounts.awaitingAgent,
          agentDeclined: tabCounts.agentDeclined,
          published: tabCounts.published,
          reserved: tabCounts.reserved,
          unpublished: tabCounts.unpublished,
          closed: tabCounts.closed,
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
        <Alert variant="destructive" className="rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <AlertCircle className="size-5" />
          <div className="flex-1">
            <AlertTitle className="text-sm font-semibold">Failed to load property listings</AlertTitle>
            <AlertDescription className="text-xs mt-1">{error}</AlertDescription>
          </div>
          <Button
            type="button"
            onClick={() => fetchProperties()}
            className="h-10 px-4 rounded-lg normal-case tracking-normal text-xs font-semibold shrink-0"
          >
            <RotateCw data-icon="inline-start" />
            <span>Retry Connection</span>
          </Button>
        </Alert>
      ) : properties.length === 0 ? (
        <Empty className="bg-white border border-dashed border-[#CBD5E1] rounded-xl p-10 shadow-xs">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 />
            </EmptyMedia>
            <EmptyTitle>No property listings yet</EmptyTitle>
            <EmptyDescription>Add your first property listing to begin managing your firm&apos;s inventory.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="coral" className="h-10 px-4 rounded-lg normal-case tracking-normal text-xs font-semibold">
              <Link to="/broker/properties/create">
                <Plus data-icon="inline-start" />
                <span>Add New Listing</span>
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : filteredProperties.length === 0 ? (
        <Empty className="bg-white border border-dashed border-[#CBD5E1] rounded-xl p-10 shadow-xs">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>No properties match your filter criteria</EmptyTitle>
            <EmptyDescription>
              Try removing a strict filter below or reset all filters to see available listings.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {search.trim() !== '' && (
                <Button type="button" variant="outline" size="sm" onClick={() => setSearch('')} className="normal-case tracking-normal">
                  Clear search &quot;{search.trim()}&quot;
                  <X data-icon="inline-end" />
                </Button>
              )}
              {activeTab !== 'ALL' && (
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('ALL')} className="normal-case tracking-normal">
                  Clear status filter
                  <X data-icon="inline-end" />
                </Button>
              )}
              {typeFilter !== 'ALL' && (
                <Button type="button" variant="outline" size="sm" onClick={() => setTypeFilter('ALL')} className="normal-case tracking-normal">
                  Clear type: {typeFilter}
                  <X data-icon="inline-end" />
                </Button>
              )}
              {locationFilter !== 'ALL' && (
                <Button type="button" variant="outline" size="sm" onClick={() => setLocationFilter('ALL')} className="normal-case tracking-normal">
                  Clear location: {locationFilter}
                  <X data-icon="inline-end" />
                </Button>
              )}
              {(priceRange.min || priceRange.max) && (
                <Button type="button" variant="outline" size="sm" onClick={() => setPriceRange({ min: '', max: '' })} className="normal-case tracking-normal">
                  Clear price range
                  <X data-icon="inline-end" />
                </Button>
              )}
              <Button
                type="button"
                onClick={handleClearFilters}
                className="h-10 px-4 rounded-lg normal-case tracking-normal text-xs font-semibold"
              >
                <SlidersHorizontal data-icon="inline-start" />
                <span>Reset All Filters</span>
              </Button>
            </div>
          </EmptyContent>
        </Empty>
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
                        <Link
                          to={`/broker/properties/${prop.id || prop.listingKey || prop.listingId}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
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
                <Card
                  key={prop.id}
                  onClick={() => navigate(`/broker/properties/${prop.id || prop.listingKey || prop.listingId}/edit`)}
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
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/broker/properties/${prop.id || prop.listingKey || prop.listingId}/edit`);
                      }}
                      className="rounded-full bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5 normal-case"
                      title="Edit listing in studio"
                    >
                      <Edit3 className="size-3" />
                      <span>Edit</span>
                    </Button>
                  </div>
                </Card>
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
            sortBy={sortBy}
            onSortChange={setSortBy}
            onRowClick={(row) => {
              dismissActivityBadge(row);
              navigate(`/broker/properties/${row.id || row.listingKey || row.listingId}/edit`);
            }}
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
      {/* Edit Details Dialog */}
      <Dialog open={Boolean(editDetailsTarget)} onOpenChange={(open) => !open && setEditDetailsTarget(null)}>
        <DialogContent className="max-w-lg bg-white border-[#E2E8F0] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1E293B]">
              Listing Edit Details
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              {editDetailsTarget?.title || 'Property listing'}
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const le =
              editDetailsTarget?.lastEdit ||
              editDetailsTarget?.custom_reso_attributes?.lastEdit ||
              editDetailsTarget?.customResoAttributes?.lastEdit ||
              {};
            const editedAt = le.editedAt || editDetailsTarget?.updated_at || editDetailsTarget?.updatedAt;
            const editorLabel = le.editedByName
              ? `${le.editedByName}${le.editedByRole ? ` (${le.editedByRole})` : ''}`
              : 'Broker / System';
            const changes = Array.isArray(le.changes) ? le.changes : [];
            return (
              <div className="flex flex-col gap-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                      Changed By
                    </span>
                    <span className="text-xs font-semibold text-[#1E293B]">{editorLabel}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                      Date &amp; Time
                    </span>
                    <span className="text-xs font-semibold text-[#1E293B]">
                      {formatPhilippineDateTime(editedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#1E293B]">Changes Made</span>
                  {changes.length > 0 ? (
                    <div className="divide-y divide-[#E2E8F0] rounded-lg border border-[#E2E8F0] overflow-hidden">
                      {changes.map((c, idx) => (
                        <div key={`${c.field}-${idx}`} className="px-3 py-2 text-xs flex flex-col gap-0.5 bg-white">
                          <span className="font-semibold text-[#1E293B]">{c.field}</span>
                          <span className="text-[#64748B]">
                            {String(c.from ?? '—')} → <span className="text-[#0F766E] font-medium">{String(c.to ?? '—')}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#64748B] p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      Updated listing details
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDetailsTarget(null)}
              className="min-h-10 rounded-lg border-[#E2E8F0]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Property Audit Trail Modal */}
      <Dialog
        open={Boolean(auditTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setAuditTarget(null);
            setAuditActivityState(null);
            setAuditEvents([]);
          }
        }}
      >
        <DialogContent className="max-w-xl bg-white border-[#E2E8F0] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
              <History className="w-4 h-4 text-[#0F766E]" />
              Property Audit Trail
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              ID: {auditTarget?.listingKey || auditTarget?.listing_key || auditTarget?.id}
            </DialogDescription>
          </DialogHeader>

          {auditTarget && (() => {
            const previewStatus = getBrokerDisplayStatus(auditTarget);
            const statusMeta = BROKER_STATUS_STYLES[previewStatus] || BROKER_STATUS_STYLES.PUBLISHED;
            const rawPrice = auditTarget.price_raw ?? auditTarget.price;
            const previewPrice = rawPrice != null && !isNaN(Number(rawPrice)) && Number(rawPrice) > 0
              ? `₱${Number(rawPrice).toLocaleString()}`
              : 'Price not provided';
            const previewLoc = [auditTarget.address, auditTarget.city].filter(Boolean).join(', ') || 'Location not set';
            return (
              <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-3">
                <PropertyThumbnail
                  image={auditTarget.mainImage || auditTarget.image || (Array.isArray(auditTarget.images) ? auditTarget.images[0] : '') || (Array.isArray(auditTarget.property_images) && auditTarget.property_images[0] ? (auditTarget.property_images[0].imageUrl || auditTarget.property_images[0].image_url) : '')}
                  title={auditTarget.title || 'Property'}
                />
                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold text-[#1E293B] truncate">
                      {auditTarget.title || 'Untitled Property'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusMeta.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                      {statusMeta.label}
                    </span>
                    {auditActivityState === 'NEW' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FDFA] text-[#0F766E] border border-[#0F766E]/25">
                        New
                      </span>
                    )}
                    {auditActivityState === 'EDITED' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Edited
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#64748B] truncate">{previewLoc}</span>
                  <span className="text-xs font-bold font-mono text-[#0F766E]">{previewPrice}</span>
                </div>
              </div>
            );
          })()}

          <div className="max-h-[55vh] overflow-y-auto flex flex-col gap-3 pr-1">
            {auditLoading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-[#64748B]">
                <Spinner className="w-4 h-4" />
                <span>Loading audit history...</span>
              </div>
            ) : (() => {
              const lastEdit =
                auditTarget?.lastEdit ||
                auditTarget?.custom_reso_attributes?.lastEdit ||
                auditTarget?.customResoAttributes?.lastEdit;
              const createdRaw = auditTarget?.created_at || auditTarget?.createdAt;

              if (auditEvents.length === 0 && !lastEdit && !createdRaw) {
                return (
                  <p className="text-xs text-[#64748B] p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                    No audit activity recorded for this listing yet.
                  </p>
                );
              }

              const renderAuditChanges = (changes) =>
                Array.isArray(changes) && changes.length > 0 ? (
                  <div className="mt-1 divide-y divide-[#E2E8F0] rounded-md border border-[#E2E8F0] bg-white overflow-hidden">
                    {changes.map((c, idx) => (
                      <div key={`${c.field}-${idx}`} className="px-2.5 py-1.5 flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#1E293B]">{c.field}</span>
                        <span className="text-[#64748B]">
                          {String(c.from ?? '—')} → <span className="text-[#0F766E] font-medium">{String(c.to ?? '—')}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null;

              return (
                <>
                  {auditEvents.map((ev) => (
                    <div key={ev.id} className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#1E293B] capitalize">
                          {String(ev.eventType || 'event').replace(/[._]/g, ' ')}
                        </span>
                        <span className="text-[11px] text-[#64748B]">
                          {formatPhilippineDateTime(ev.createdAt)}
                        </span>
                      </div>
                      <p className="text-[#475569]">
                        By <span className="font-semibold text-[#1E293B]">{ev.actorName || 'Broker / System'}</span>
                        {ev.actorRole ? ` (${ev.actorRole})` : ''}
                        {ev.outcome ? ` • ${ev.outcome}` : ''}
                      </p>
                      {ev.reason && <p className="text-[#64748B]">{ev.reason}</p>}
                      {renderAuditChanges(ev.newValues?.changes)}
                    </div>
                  ))}

                  {auditEvents.length === 0 && lastEdit && (
                    <div className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#1E293B]">Latest Listing Edit</span>
                        <span className="text-[11px] text-[#64748B]">
                          {formatPhilippineDateTime(lastEdit.editedAt || auditTarget?.updated_at || auditTarget?.updatedAt)}
                        </span>
                      </div>
                      <p className="text-[#475569]">
                        By <span className="font-semibold text-[#1E293B]">{lastEdit.editedByName || 'Broker / System'}</span>
                        {lastEdit.editedByRole ? ` (${lastEdit.editedByRole})` : ''}
                      </p>
                      {renderAuditChanges(lastEdit.changes)}
                    </div>
                  )}

                  {createdRaw && (
                    <div className="p-3 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#1E293B]">Listing Created</span>
                      <span className="text-[#64748B]">{formatPhilippineDateTime(createdRaw)}</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAuditTarget(null);
                setAuditEvents([]);
              }}
              className="min-h-10 rounded-lg border-[#E2E8F0]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" />
    </div>
  );
}
