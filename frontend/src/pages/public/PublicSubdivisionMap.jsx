import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Search,
  Filter,
  Layers,
  Share2,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Clock,
  Ban,
  ArrowLeft,
  X,
  PhoneCall,
  Info,
  ChevronRight,
  Maximize2,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import SubdivisionVectorCanvas from '../../components/subdivision/SubdivisionVectorCanvas';
import subdivisionService from '../../services/subdivisionService';

export default function PublicSubdivisionMap() {
  const { id: projectId } = useParams();

  const [project, setProject] = useState(null);
  const [plan, setPlan] = useState(null);
  const [lots, setLots] = useState([]);
  const [versionNumber, setVersionNumber] = useState(null);
  const [publishedAt, setPublishedAt] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState('white'); // 'white' (default when opening subdivision) | 'satellite'
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const fetchPublishedMap = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await subdivisionService.getPublicMap(projectId);
      const data = res?.data || res;
      if (!data || !data.project) {
        throw new Error('Failed to load public subdivision map.');
      }
      setProject(data.project);
      setPlan(data.plan);
      setLots(data.lots || []);
      setVersionNumber(data.versionNumber);
      setPublishedAt(data.publishedAt);
    } catch (err) {
      console.error('Failed to fetch published map:', err);
      setError(err?.response?.data?.error || err.message || 'The interactive map for this subdivision is currently unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPublishedMap();
  }, [fetchPublishedMap]);

  // Statistics calculation
  const stats = useMemo(() => {
    const saleable = lots.filter(l => l.lot_type === 'SALEABLE_LOT' || !l.lot_type);
    const available = saleable.filter(l => l.availability_status === 'AVAILABLE').length;
    const reserved = saleable.filter(l => l.availability_status === 'RESERVED').length;
    const sold = saleable.filter(l => l.availability_status === 'SOLD').length;
    const totalArea = saleable.reduce((acc, curr) => acc + (Number(curr.verified_area_sqm) || 0), 0);
    return {
      total: saleable.length,
      available,
      reserved,
      sold,
      totalArea: Math.round(totalArea),
    };
  }, [lots]);

  // Filter lots for list view
  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      const isSaleable = lot.lot_type === 'SALEABLE_LOT' || !lot.lot_type;
      if (!isSaleable) return false;

      const matchesStatus = statusFilter === 'ALL' || lot.availability_status === statusFilter;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = !term ||
        String(lot.block_number).toLowerCase().includes(term) ||
        String(lot.lot_number).toLowerCase().includes(term) ||
        `block ${lot.block_number} lot ${lot.lot_number}`.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [lots, statusFilter, searchTerm]);

  const selectedLot = useMemo(() => {
    return lots.find((l) => l.id === selectedLotId);
  }, [lots, selectedLotId]);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    }
  };

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    setInquirySubmitted(true);
  };

  const formatPrice = (price) => {
    if (!price || isNaN(Number(price))) return null;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <div className="w-12 h-12 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Loading Subdivision Master Plan...</h2>
        <p className="text-xs text-slate-400 mt-1">Retrieving official published cadastral boundaries and lot availability.</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Info className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Map Currently Unavailable</h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {error || 'This subdivision does not have an active published interactive plan at this time.'}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={fetchPublishedMap}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Retry
            </button>
            <Link
              to="/properties"
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Browse Properties</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Master Navigation Header */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/properties"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Return to Properties"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white truncate tracking-tight">
                {project.name}
              </h1>
              {versionNumber && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <ShieldCheck className="w-3 h-3 text-teal-400" />
                  v{versionNumber}.0 Published
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <span>{project.city || 'Philippines'}, {project.province || 'National'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Status Pills (Desktop) */}
        <div className="hidden lg:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Available:</span>
            <span className="font-bold text-white">{stats.available}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-300">Reserved:</span>
            <span className="font-bold text-white">{stats.reserved}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-slate-300">Sold:</span>
            <span className="font-bold text-white">{stats.sold}</span>
          </div>
          <div className="text-slate-400 font-medium">
            Total Lots: <span className="text-white font-bold">{stats.total}</span>
          </div>
        </div>

        {/* Header Actions & Upper Right Subdivision Name (FR-SM-048, FR-SM-049) */}
        <div className="flex items-center gap-2">
          {project?.name && (
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs shadow-md">
              <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
              <div className="text-left">
                <span className="font-bold text-white block tracking-tight truncate max-w-[170px]">{project.name}</span>
                {project.latitude && project.longitude && (
                  <span className="text-[10px] font-mono text-teal-400 block">
                    GPS: {Number(project.latitude).toFixed(4)}, {Number(project.longitude).toFixed(4)}
                  </span>
                )}
              </div>
              {project.latitude && project.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open pinned location in Google Maps"
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors ml-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Background Map Layer Switcher: White Canvas vs Satellite */}
          <div className="flex items-center gap-0.5 bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setBackgroundMode('white')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                backgroundMode === 'white'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              White
            </button>
            <button
              type="button"
              onClick={() => setBackgroundMode('satellite')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                backgroundMode === 'satellite'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Share Interactive Map"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{copyFeedback ? 'Link Copied!' : 'Share'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isSidebarOpen ? 'bg-teal-600/20 border-teal-500 text-teal-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Lots Sidebar"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Workspace Body: Vector Canvas + Collapsible Lots Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Canvas Viewport: White background by default */}
        <main className={`flex-1 h-full ${backgroundMode === 'white' ? 'bg-white' : 'bg-slate-950'} relative overflow-hidden`}>
          <SubdivisionVectorCanvas
            plan={plan}
            lots={lots}
            activeTool="select"
            selectedLotId={selectedLotId}
            onSelectLot={(lotOrId) =>
              setSelectedLotId(typeof lotOrId === 'object' ? lotOrId?.id || null : lotOrId)
            }
            isReadOnly={true}
            backgroundMode={backgroundMode}
            projectName={project?.name}
            developerName={project?.developer_name}
            gpsCoordinates={
              project?.latitude && project?.longitude
                ? { lat: Number(project.latitude), lng: Number(project.longitude) }
                : null
            }
          />

          {/* Canvas Floating Legend (Bottom Left) */}
          <div className="absolute bottom-5 left-5 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl pointer-events-auto">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Availability Legend</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
                <span className="text-slate-200">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs" />
                <span className="text-slate-200">Reserved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-500 shadow-xs" />
                <span className="text-slate-200">Sold</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs" />
                <span className="text-slate-200">Unavailable</span>
              </div>
            </div>
          </div>
        </main>

        {/* Selected Lot Detail Slide-Over Card */}
        {selectedLot && (
          <div className="absolute top-4 right-4 sm:right-auto sm:left-4 z-20 max-w-sm w-[90vw] bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-5 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">Subdivision Lot Details</span>
                <h3 className="text-base font-bold text-slate-900">
                  Block {selectedLot.block_number}, Lot {selectedLot.lot_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLotId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Availability:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    selectedLot.availability_status === 'AVAILABLE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : selectedLot.availability_status === 'RESERVED'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {selectedLot.availability_status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Verified Land Area:</span>
                <span className="font-bold text-slate-900">
                  {selectedLot.verified_area_sqm || '—'} m²
                </span>
              </div>

              {selectedLot.price && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Indicative Price:</span>
                  <span className="font-extrabold text-[#0F766E] text-sm">
                    {formatPrice(selectedLot.price)}
                  </span>
                </div>
              )}

              {selectedLot.remarks && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block mb-1">Lot Notes:</span>
                  <p className="text-slate-700 bg-slate-50 p-2 rounded-lg text-[11px] leading-relaxed">
                    {selectedLot.remarks}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsInquiryModalOpen(true)}
                className="flex-1 py-2 px-3 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Inquire About Lot</span>
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Sidebar: Search & Filterable Lots List */}
        {isSidebarOpen && (
          <aside className="w-80 sm:w-88 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-20 shrink-0 animate-in slide-in-from-right duration-200">
            {/* Search & Filter Header */}
            <div className="p-4 border-b border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-teal-400" />
                  <span>Cadastral Parcels</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {filteredLots.length} / {stats.total} lots
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Block or Lot..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 outline-none focus:border-teal-500"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-semibold">
                {['ALL', 'AVAILABLE', 'RESERVED', 'SOLD'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`py-1 rounded-md transition-colors cursor-pointer text-center ${
                      statusFilter === status
                        ? 'bg-teal-600 text-white shadow-xs font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Lots Scrollable Cards List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800 p-2 space-y-1">
              {filteredLots.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  No lots match your current search or filter.
                </div>
              ) : (
                filteredLots.map((lot) => {
                  const isSelected = lot.id === selectedLotId;
                  return (
                    <div
                      key={lot.id}
                      onClick={() => setSelectedLotId(lot.id)}
                      className={`p-3 rounded-xl transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-teal-900/30 border-teal-500 text-white'
                          : 'bg-slate-800/40 hover:bg-slate-800 border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">
                          Block {lot.block_number}, Lot {lot.lot_number}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            lot.availability_status === 'AVAILABLE'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : lot.availability_status === 'RESERVED'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {lot.availability_status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Area: {lot.verified_area_sqm || '—'} m²</span>
                        {lot.price && (
                          <span className="font-semibold text-teal-300">
                            {formatPrice(lot.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>

      {/* 3. Inquiry Modal */}
      {isInquiryModalOpen && selectedLot && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Inquire About Lot</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Block {selectedLot.block_number}, Lot {selectedLot.lot_number} • {project.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsInquiryModalOpen(false);
                  setInquirySubmitted(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inquirySubmitted ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Inquiry Received</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Thank you! Our property advisory team will contact you shortly regarding Block {selectedLot.block_number}, Lot {selectedLot.lot_number}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsInquiryModalOpen(false);
                    setInquirySubmitted(false);
                  }}
                  className="mt-2 px-4 py-2 bg-[#0F766E] text-white text-xs font-semibold rounded-lg"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="maria@example.com"
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile / Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="0917 123 4567"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Message / Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="I am interested in lot availability, financing terms, and site visit schedule..."
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0F766E]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsInquiryModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                  >
                    Submit Inquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
