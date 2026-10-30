import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Layers,
  MapPin,
  ExternalLink,
  ChevronDown,
  MoreVertical,
  CheckCircle2,
  Clock,
  Ban,
  Tag,
  DollarSign,
  Sparkles,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Eye,
  FileSpreadsheet,
  Check,
  X,
  Share2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '../../../components/ui/dropdown-menu';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '../../../components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Spinner } from '../../../components/ui';
import { Toaster, toast } from '../../../components/ui/toast';
import subdivisionService from '../../../services/subdivisionService';

// Default mock lots generator if project lots are empty
const GENERATE_MOCK_LOTS = (projectId) => [
  {
    id: `lot-demo-1`,
    project_id: projectId,
    block_number: '1',
    lot_number: '1',
    property_model: '4-Bedroom Dahlia Luxury Villa',
    boundary_type: 'SaleableLot',
    availability_status: 'Available',
    verified_area_sqm: 280,
    floor_area_sqm: 215,
    price_php: 18500000,
    listing_status: 'Published',
    is_verified: true,
  },
  {
    id: `lot-demo-2`,
    project_id: projectId,
    block_number: '1',
    lot_number: '2',
    property_model: 'Prime Vacant Corner Lot',
    boundary_type: 'SaleableLot',
    availability_status: 'Reserved',
    verified_area_sqm: 240,
    floor_area_sqm: 0,
    price_php: 9600000,
    listing_status: 'Draft',
    is_verified: true,
  },
  {
    id: `lot-demo-3`,
    project_id: projectId,
    block_number: '1',
    lot_number: '3',
    property_model: '3-Bedroom Iris Modern House',
    boundary_type: 'SaleableLot',
    availability_status: 'Available',
    verified_area_sqm: 220,
    floor_area_sqm: 165,
    price_php: 14200000,
    listing_status: 'Published',
    is_verified: true,
  },
  {
    id: `lot-demo-4`,
    project_id: projectId,
    block_number: '2',
    lot_number: '1',
    property_model: 'Standard Residential Lot',
    boundary_type: 'SaleableLot',
    availability_status: 'Sold',
    verified_area_sqm: 200,
    floor_area_sqm: 0,
    price_php: 7800000,
    listing_status: 'Published',
    is_verified: true,
  },
  {
    id: `lot-demo-5`,
    project_id: projectId,
    block_number: '2',
    lot_number: '2',
    property_model: '2-Storey Attached Townhouse',
    boundary_type: 'SaleableLot',
    availability_status: 'Available',
    verified_area_sqm: 190,
    floor_area_sqm: 140,
    price_php: 11500000,
    listing_status: 'Draft',
    is_verified: true,
  },
  {
    id: `lot-demo-6`,
    project_id: projectId,
    block_number: '3',
    lot_number: '1',
    property_model: 'Greenway Perimeter Lot',
    boundary_type: 'SaleableLot',
    availability_status: 'Available',
    verified_area_sqm: 310,
    floor_area_sqm: 0,
    price_php: 12400000,
    listing_status: 'Draft',
    is_verified: true,
  },
];

export default function BrokerSubdivisionInventory() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [lots, setLots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filters & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Available' | 'Reserved' | 'Sold'
  const [selectedBlock, setSelectedBlock] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [selectedLotIds, setSelectedLotIds] = useState([]);

  // Modal State for Add / Edit Property Lot
  const [showLotModal, setShowLotModal] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [lotForm, setLotForm] = useState({
    block_number: '1',
    lot_number: '1',
    property_model: 'Standard Residential Lot',
    boundary_type: 'SaleableLot',
    availability_status: 'Available',
    verified_area_sqm: 200,
    floor_area_sqm: 0,
    price_php: 8000000,
    listing_status: 'Draft',
  });

  // Load project & lots
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const projRes = await subdivisionService.getSubdivisionById(projectId);
        const projData = projRes?.data || projRes;
        setProject(projData);

        const lotsRes = await subdivisionService.getLots(projectId);
        const lotsData = lotsRes?.data || (Array.isArray(lotsRes) ? lotsRes : []);
        if (Array.isArray(lotsData) && lotsData.length > 0) {
          setLots(lotsData);
        } else {
          // Initialize with demo inventory
          setLots(GENERATE_MOCK_LOTS(projectId));
        }
      } catch (err) {
        toast({ title: 'Using sample subdivision inventory data.', variant: 'default' });
        setLots(GENERATE_MOCK_LOTS(projectId));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  // Derived telemetry metrics
  const telemetry = useMemo(() => {
    const totalLots = lots.length;
    const availableLots = lots.filter((l) => l.availability_status === 'Available');
    const reservedLots = lots.filter((l) => l.availability_status === 'Reserved');
    const soldLots = lots.filter((l) => l.availability_status === 'Sold');

    const totalValuation = lots.reduce((sum, l) => sum + (Number(l.price_php) || 0), 0);
    const availableValuation = availableLots.reduce((sum, l) => sum + (Number(l.price_php) || 0), 0);

    const availablePercent = totalLots > 0 ? Math.round((availableLots.length / totalLots) * 100) : 0;
    const reservedPercent = totalLots > 0 ? Math.round((reservedLots.length / totalLots) * 100) : 0;
    const soldPercent = totalLots > 0 ? Math.round((soldLots.length / totalLots) * 100) : 0;

    return {
      totalLots,
      availableLots: availableLots.length,
      availablePercent,
      reservedLots: reservedLots.length,
      reservedPercent,
      soldLots: soldLots.length,
      soldPercent,
      totalValuation,
      availableValuation,
    };
  }, [lots]);

  // Distinct block numbers for filter
  const uniqueBlocks = useMemo(() => {
    const blocks = Array.from(new Set(lots.map((l) => l.block_number || '1'))).sort((a, b) =>
      Number(a) - Number(b)
    );
    return blocks;
  }, [lots]);

  // Filtered lots
  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      // Search
      const search = searchQuery.toLowerCase().trim();
      const matchSearch =
        !search ||
        `blk ${lot.block_number}`.toLowerCase().includes(search) ||
        `lot ${lot.lot_number}`.toLowerCase().includes(search) ||
        lot.property_model?.toLowerCase().includes(search) ||
        String(lot.price_php || '').includes(search);

      // Status
      const matchStatus = statusFilter === 'All' || lot.availability_status === statusFilter;

      // Block
      const matchBlock = selectedBlock === 'All' || String(lot.block_number) === selectedBlock;

      // Price Range
      let matchPrice = true;
      const price = Number(lot.price_php) || 0;
      if (selectedPriceRange === '< 5M') matchPrice = price < 5000000;
      else if (selectedPriceRange === '5M - 10M') matchPrice = price >= 5000000 && price <= 10000000;
      else if (selectedPriceRange === '10M - 20M') matchPrice = price >= 10000000 && price <= 20000000;
      else if (selectedPriceRange === '> 20M') matchPrice = price > 20000000;

      return matchSearch && matchStatus && matchBlock && matchPrice;
    });
  }, [lots, searchQuery, statusFilter, selectedBlock, selectedPriceRange]);

  // Save lots helper
  const persistLots = async (updatedLots) => {
    setLots(updatedLots);
    setIsSaving(true);
    try {
      await subdivisionService.saveDraftLots(projectId, updatedLots);
    } catch (err) {
      console.warn('Autosave skipped or offline');
    } finally {
      setIsSaving(false);
    }
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLotIds(filteredLots.map((l) => l.id));
    } else {
      setSelectedLotIds([]);
    }
  };

  const handleToggleSelectLot = (id) => {
    setSelectedLotIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Batch Status Update
  const handleBatchUpdateStatus = (newStatus) => {
    if (selectedLotIds.length === 0) return;
    const updated = lots.map((l) =>
      selectedLotIds.includes(l.id) ? { ...l, availability_status: newStatus } : l
    );
    persistLots(updated);
    toast({
      title: `Updated ${selectedLotIds.length} lots to status "${newStatus}"`,
      variant: 'success',
    });
    setSelectedLotIds([]);
  };

  // Batch Delete
  const handleBatchDelete = () => {
    if (selectedLotIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedLotIds.length} lots from inventory?`)) return;
    const updated = lots.filter((l) => !selectedLotIds.includes(l.id));
    persistLots(updated);
    toast({
      title: `Removed ${selectedLotIds.length} lots from inventory.`,
      variant: 'default',
    });
    setSelectedLotIds([]);
  };

  // 1-Click Convert to Marketplace Listings
  const handleBulkGenerateListings = () => {
    const targets = selectedLotIds.length > 0
      ? lots.filter((l) => selectedLotIds.includes(l.id))
      : lots.filter((l) => l.listing_status !== 'Published');

    if (targets.length === 0) {
      toast({ title: 'No draft lots selected to generate listings.', variant: 'default' });
      return;
    }

    const updated = lots.map((l) =>
      targets.some((t) => t.id === l.id) ? { ...l, listing_status: 'Published' } : l
    );
    persistLots(updated);
    toast({
      title: `Generated ${targets.length} official marketplace property listings!`,
      variant: 'success',
    });
    setSelectedLotIds([]);
  };

  // Open Lot Add/Edit Modal
  const handleOpenAddLot = () => {
    setEditingLot(null);
    setLotForm({
      block_number: String(uniqueBlocks[0] || '1'),
      lot_number: String(lots.length + 1),
      property_model: 'Standard Residential Lot',
      boundary_type: 'SaleableLot',
      availability_status: 'Available',
      verified_area_sqm: 200,
      floor_area_sqm: 0,
      price_php: 8000000,
      listing_status: 'Draft',
    });
    setShowLotModal(true);
  };

  const handleOpenEditLot = (lot) => {
    setEditingLot(lot);
    setLotForm({
      block_number: lot.block_number || '1',
      lot_number: lot.lot_number || '1',
      property_model: lot.property_model || 'Standard Residential Lot',
      boundary_type: lot.boundary_type || 'SaleableLot',
      availability_status: lot.availability_status || 'Available',
      verified_area_sqm: lot.verified_area_sqm || 200,
      floor_area_sqm: lot.floor_area_sqm || 0,
      price_php: lot.price_php || 8000000,
      listing_status: lot.listing_status || 'Draft',
    });
    setShowLotModal(true);
  };

  const handleSaveLotForm = (e) => {
    e.preventDefault();
    if (editingLot) {
      const updated = lots.map((l) =>
        l.id === editingLot.id ? { ...l, ...lotForm } : l
      );
      persistLots(updated);
      toast({ title: `Lot BLK ${lotForm.block_number} LOT ${lotForm.lot_number} updated.`, variant: 'success' });
    } else {
      const newLot = {
        ...lotForm,
        id: `lot-custom-${Date.now()}`,
        project_id: projectId,
        is_verified: true,
      };
      const updated = [...lots, newLot];
      persistLots(updated);
      toast({ title: `Created BLK ${lotForm.block_number} LOT ${lotForm.lot_number} in inventory.`, variant: 'success' });
    }
    setShowLotModal(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      <Toaster position="top-right" richColors />

      {/* Zone 1: Executive Subproject Header & Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/broker/properties"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Properties</span>
            </Link>
            <span className="text-[#CBD5E1]">/</span>
            <span className="text-xs font-semibold text-[#0F766E] truncate max-w-[200px]">
              {project?.name || 'Aura Residences'}
            </span>
            <span className="text-[#CBD5E1]">/</span>
            <span className="text-xs font-semibold text-[#1E293B]">Property Inventory</span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight">
              {project?.name || 'Aura Residences'} — Lot & Property Inventory
            </h1>
            <Badge variant="success" className="shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Community</span>
            </Badge>
          </div>

          <p className="text-xs text-[#64748B] flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {project?.location_address || 'Bonifacio Global City'}, {project?.city || 'Taguig'}
            </span>
            {project?.latitude && (
              <span className="font-mono text-[10px] text-slate-400">
                ({Number(project.latitude).toFixed(4)}°, {Number(project.longitude).toFixed(4)}°)
              </span>
            )}
          </p>
        </div>

        {/* Header Action Suite */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/broker/subdivisions/${projectId}/editor`)}
            className="border-[#E2E8F0] text-[#1E293B] hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
            title="Open Interactive Vector CAD Map Studio"
          >
            <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Open CAD Map Editor</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBulkGenerateListings}
            className="border-teal-200 bg-teal-50/60 text-[#0F766E] hover:bg-teal-100/70 cursor-pointer flex items-center gap-1.5"
            title="Generate Marketplace Property Listings from Mapped Lots"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Bulk Generate Listings</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleOpenAddLot}
            className="bg-[#0F766E] hover:bg-[#115E59] text-white cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property / Lot</span>
          </Button>
        </div>
      </div>

      {/* Zone 2: Telemetry Metrics Row (shadcn Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Total Inventory */}
        <Card className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
          <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs text-[#64748B] font-medium">Total Inventory</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold text-[#1E293B]">{telemetry.totalLots} Lots</div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Master plan parcels</p>
          </CardContent>
        </Card>

        {/* Available Lots */}
        <Card className="p-4 bg-white border border-emerald-100 rounded-xl shadow-2xs">
          <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs text-emerald-800 font-medium">Available for Sale</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold text-emerald-700">{telemetry.availableLots}</div>
            <p className="text-[11px] text-emerald-600/90 mt-0.5">
              {telemetry.availablePercent}% of total units
            </p>
          </CardContent>
        </Card>

        {/* Reserved Lots */}
        <Card className="p-4 bg-white border border-amber-100 rounded-xl shadow-2xs">
          <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs text-amber-800 font-medium">Reserved / Contract</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold text-amber-700">{telemetry.reservedLots}</div>
            <p className="text-[11px] text-amber-600/90 mt-0.5">
              {telemetry.reservedPercent}% under negotiation
            </p>
          </CardContent>
        </Card>

        {/* Sold Lots */}
        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs text-[#64748B] font-medium">Sold & Turned Over</span>
            <Ban className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold text-[#1E293B]">{telemetry.soldLots}</div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {telemetry.soldPercent}% completed deals
            </p>
          </CardContent>
        </Card>

        {/* Total Subdivision Valuation */}
        <Card className="p-4 bg-gradient-to-br from-teal-50/60 to-white border border-teal-200 rounded-xl shadow-2xs col-span-2 md:col-span-4 lg:col-span-1">
          <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs text-[#0F766E] font-medium">Total Valuation</span>
            <DollarSign className="w-4 h-4 text-[#0F766E]" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg sm:text-xl font-bold text-[#0F766E]">
              ₱{(telemetry.totalValuation / 1000000).toFixed(1)}M
            </div>
            <p className="text-[11px] text-teal-700/80 mt-0.5">
              ₱{(telemetry.availableValuation / 1000000).toFixed(1)}M available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Zone 3: Filter & Search Command Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search block, lot, model, or price..."
            className="pl-9 pr-8 h-9 text-xs bg-slate-50 border-[#E2E8F0] focus:border-[#0F766E]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Segmented Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
          <TabsList className="bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <TabsTrigger value="All" className="text-xs px-2.5 py-1">
              All ({lots.length})
            </TabsTrigger>
            <TabsTrigger value="Available" className="text-xs px-2.5 py-1 text-emerald-700">
              Available ({telemetry.availableLots})
            </TabsTrigger>
            <TabsTrigger value="Reserved" className="text-xs px-2.5 py-1 text-amber-700">
              Reserved ({telemetry.reservedLots})
            </TabsTrigger>
            <TabsTrigger value="Sold" className="text-xs px-2.5 py-1 text-slate-700">
              Sold ({telemetry.soldLots})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Block & Price Filters & View Mode */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Block Selector */}
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="h-9 px-2.5 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] outline-none focus:border-[#0F766E] cursor-pointer"
          >
            <option value="All">All Blocks ({uniqueBlocks.length})</option>
            {uniqueBlocks.map((blk) => (
              <option key={blk} value={blk}>
                Block {blk}
              </option>
            ))}
          </select>

          {/* Price Range Selector */}
          <select
            value={selectedPriceRange}
            onChange={(e) => setSelectedPriceRange(e.target.value)}
            className="h-9 px-2.5 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] outline-none focus:border-[#0F766E] cursor-pointer"
          >
            <option value="All">All Prices</option>
            <option value="< 5M">&lt; ₱5,000,000</option>
            <option value="5M - 10M">₱5M - ₱10M</option>
            <option value="10M - 20M">₱10M - ₱20M</option>
            <option value="> 20M">&gt; ₱20,000,000</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-2xs text-[#0F766E]' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-2xs text-[#0F766E]' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Batch Actions Bar (when lots selected) */}
      {selectedLotIds.length > 0 && (
        <div className="sticky top-4 z-30 bg-[#1E293B] text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            <span className="text-xs font-bold text-white">
              {selectedLotIds.length} lots selected
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleBatchUpdateStatus('Available')}
              className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
            >
              Mark Available
            </button>
            <button
              type="button"
              onClick={() => handleBatchUpdateStatus('Reserved')}
              className="px-2.5 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors cursor-pointer"
            >
              Mark Reserved
            </button>
            <button
              type="button"
              onClick={() => handleBatchUpdateStatus('Sold')}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors cursor-pointer"
            >
              Mark Sold
            </button>
            <button
              type="button"
              onClick={handleBulkGenerateListings}
              className="px-2.5 py-1 text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-teal-200" />
              <span>Publish Selected</span>
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedLotIds([])}
              className="p-1 text-slate-400 hover:text-white rounded ml-2"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Zone 4: Inventory Presentation Surface */}
      {isLoading ? (
        <Spinner centered size="lg" text="Loading subdivision property inventory..." />
      ) : filteredLots.length === 0 ? (
        <Card className="p-12 text-center bg-white border border-[#E2E8F0] rounded-2xl space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-[#1E293B]">No Property Lots Match Filters</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Try adjusting your search query, block number, or price filter, or add a new lot into the master inventory.
          </p>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleOpenAddLot}
            className="bg-[#0F766E] hover:bg-[#115E59] text-white mx-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Property / Lot</span>
          </Button>
        </Card>
      ) : viewMode === 'table' ? (
        /* High Density shadcn Table */
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-[#E2E8F0]">
                <TableHead className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={
                      filteredLots.length > 0 && selectedLotIds.length === filteredLots.length
                    }
                    onChange={handleSelectAll}
                    className="rounded text-[#0F766E] focus:ring-[#0F766E] cursor-pointer"
                  />
                </TableHead>
                <TableHead className="text-xs font-bold text-[#1E293B]">Unit Identifier</TableHead>
                <TableHead className="text-xs font-bold text-[#1E293B]">Model / Class</TableHead>
                <TableHead className="text-xs font-bold text-[#1E293B]">Lot Area</TableHead>
                <TableHead className="text-xs font-bold text-[#1E293B]">Floor Area</TableHead>
                <TableHead className="text-xs font-bold text-[#1E293B]">Price (PHP)</TableHead>
                <TableHead className="text-xs font-bold text-[#1E293B]">Inventory Status</TableHead>
                <TableHead className="text-xs font-bold text-[#1E293B]">Marketplace Listing</TableHead>
                <TableHead className="text-xs font-bold text-[#1E293B] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLots.map((lot) => {
                const isSelected = selectedLotIds.includes(lot.id);
                return (
                  <TableRow
                    key={lot.id}
                    className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${
                      isSelected ? 'bg-teal-50/40' : ''
                    }`}
                  >
                    <TableCell className="w-10 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectLot(lot.id)}
                        className="rounded text-[#0F766E] focus:ring-[#0F766E] cursor-pointer"
                      />
                    </TableCell>

                    {/* Unit ID */}
                    <TableCell className="font-semibold text-xs text-[#1E293B]">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] font-bold text-[#0F766E]">
                          BLK {lot.block_number} • LOT {lot.lot_number}
                        </span>
                        {lot.is_verified && (
                          <span title="Boundary Verified on Vector Canvas" className="text-emerald-500">
                            ✓
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Model */}
                    <TableCell className="text-xs text-[#64748B]">
                      {lot.property_model || 'Standard Residential Lot'}
                    </TableCell>

                    {/* Lot Area */}
                    <TableCell className="text-xs font-mono text-[#1E293B]">
                      {lot.verified_area_sqm || 200} sqm
                    </TableCell>

                    {/* Floor Area */}
                    <TableCell className="text-xs font-mono text-[#64748B]">
                      {lot.floor_area_sqm ? `${lot.floor_area_sqm} sqm` : '—'}
                    </TableCell>

                    {/* Price */}
                    <TableCell className="text-xs font-bold text-[#1E293B]">
                      ₱{Number(lot.price_php || 0).toLocaleString()}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      {lot.availability_status === 'Available' && (
                        <Badge variant="success">Available</Badge>
                      )}
                      {lot.availability_status === 'Reserved' && (
                        <Badge variant="warning">Reserved</Badge>
                      )}
                      {lot.availability_status === 'Sold' && (
                        <Badge variant="secondary">Sold</Badge>
                      )}
                    </TableCell>

                    {/* Marketplace Listing Status */}
                    <TableCell>
                      {lot.listing_status === 'Published' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                          <Check className="w-3 h-3 text-[#0F766E]" />
                          <span>Published</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          <span>Unlisted Draft</span>
                        </span>
                      )}
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer">
                            <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white border border-[#E2E8F0] shadow-lg rounded-xl">
                          <DropdownMenuItem
                            onClick={() => handleOpenEditLot(lot)}
                            className="text-xs cursor-pointer flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit Lot Details</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              navigate(
                                `/broker/subdivisions/${projectId}/editor?selectedLot=${lot.id}`
                              )
                            }
                            className="text-xs cursor-pointer flex items-center gap-2"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#0F766E]" />
                            <span>View on CAD Map</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              const updated = lots.map((l) =>
                                l.id === lot.id ? { ...l, listing_status: 'Published' } : l
                              );
                              persistLots(updated);
                              toast({ title: `Published Lot to Marketplace!`, variant: 'success' });
                            }}
                            className="text-xs cursor-pointer flex items-center gap-2"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Publish to Marketplace</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => {
                              const nextStatus =
                                lot.availability_status === 'Available' ? 'Reserved' : 'Available';
                              const updated = lots.map((l) =>
                                l.id === lot.id ? { ...l, availability_status: nextStatus } : l
                              );
                              persistLots(updated);
                              toast({ title: `Status set to ${nextStatus}`, variant: 'default' });
                            }}
                            className="text-xs cursor-pointer"
                          >
                            Toggle Available / Reserved
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              const updated = lots.filter((l) => l.id !== lot.id);
                              persistLots(updated);
                              toast({ title: 'Lot deleted from inventory', variant: 'default' });
                            }}
                            className="text-xs text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete Lot</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLots.map((lot) => (
            <Card
              key={lot.id}
              className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs hover:shadow-md transition-shadow p-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#0F766E] px-2 py-0.5 rounded bg-teal-50 border border-teal-200">
                    BLK {lot.block_number} • LOT {lot.lot_number}
                  </span>
                  {lot.availability_status === 'Available' && <Badge variant="success">Available</Badge>}
                  {lot.availability_status === 'Reserved' && <Badge variant="warning">Reserved</Badge>}
                  {lot.availability_status === 'Sold' && <Badge variant="secondary">Sold</Badge>}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-[#1E293B]">
                    {lot.property_model || 'Standard Residential Lot'}
                  </h4>
                  <p className="text-xs font-mono font-bold text-[#0F766E] mt-1">
                    ₱{Number(lot.price_php || 0).toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B] pt-2 border-t border-slate-100 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Lot Area</span>
                    <span>{lot.verified_area_sqm || 200} sqm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Floor Area</span>
                    <span>{lot.floor_area_sqm ? `${lot.floor_area_sqm} sqm` : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditLot(lot)}
                  className="text-xs h-7 px-2.5"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  <span>Edit</span>
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() =>
                    navigate(`/broker/subdivisions/${projectId}/editor?selectedLot=${lot.id}`)
                  }
                  className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs h-7 px-2.5"
                >
                  <span>View on Map</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Zone 5: Add / Edit Property Lot Modal (shadcn Dialog) */}
      <Dialog open={showLotModal} onOpenChange={setShowLotModal}>
        <DialogContent className="max-w-lg bg-white p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1E293B]">
              {editingLot ? 'Edit Subdivision Lot' : 'Add New Property Lot'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Configure block number, parcel dimensions, property model, and commercial pricing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveLotForm} className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#1E293B] block mb-1">Block Number *</label>
                <Input
                  type="text"
                  required
                  value={lotForm.block_number}
                  onChange={(e) => setLotForm({ ...lotForm, block_number: e.target.value })}
                  placeholder="e.g. 1"
                  className="h-8.5 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1E293B] block mb-1">Lot Number *</label>
                <Input
                  type="text"
                  required
                  value={lotForm.lot_number}
                  onChange={(e) => setLotForm({ ...lotForm, lot_number: e.target.value })}
                  placeholder="e.g. 12"
                  className="h-8.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#1E293B] block mb-1">Property Model / Asset Class</label>
              <Input
                type="text"
                value={lotForm.property_model}
                onChange={(e) => setLotForm({ ...lotForm, property_model: e.target.value })}
                placeholder="e.g. 4-Bedroom Dahlia Luxury Villa or Prime Corner Lot"
                className="h-8.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#1E293B] block mb-1">Lot Area (sqm) *</label>
                <Input
                  type="number"
                  required
                  value={lotForm.verified_area_sqm}
                  onChange={(e) =>
                    setLotForm({ ...lotForm, verified_area_sqm: Number(e.target.value) })
                  }
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1E293B] block mb-1">Floor Area (sqm)</label>
                <Input
                  type="number"
                  value={lotForm.floor_area_sqm}
                  onChange={(e) =>
                    setLotForm({ ...lotForm, floor_area_sqm: Number(e.target.value) })
                  }
                  placeholder="Optional (0 for vacant lot)"
                  className="h-8.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#1E293B] block mb-1">Price (PHP) *</label>
                <Input
                  type="number"
                  required
                  value={lotForm.price_php}
                  onChange={(e) => setLotForm({ ...lotForm, price_php: Number(e.target.value) })}
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1E293B] block mb-1">Availability Status</label>
                <select
                  value={lotForm.availability_status}
                  onChange={(e) => setLotForm({ ...lotForm, availability_status: e.target.value })}
                  className="w-full h-8.5 px-2 bg-white border border-[#CBD5E1] rounded-lg text-xs outline-none focus:border-[#0F766E]"
                >
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLotModal(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                className="bg-[#0F766E] hover:bg-[#115E59] text-white cursor-pointer"
              >
                {editingLot ? 'Save Changes' : 'Create Property Lot'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
