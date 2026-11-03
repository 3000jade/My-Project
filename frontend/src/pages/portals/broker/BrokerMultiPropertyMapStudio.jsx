import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  Building2,
  Trash2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  Plus
} from 'lucide-react';
import MultiPropertyCadastralCanvas from '../../../components/ui/map/MultiPropertyCadastralCanvas';
import MultiPropertyLedgerSidebar from '../../../components/ui/map/MultiPropertyLedgerSidebar';
import SubdivisionCreateModal from '../../../components/ui/map/SubdivisionCreateModal';
import LotResizeModal from '../../../components/ui/map/LotResizeModal';
import LotGridModal from '../../../components/ui/map/LotGridModal';
import { useHistoryState } from '../../../hooks/useHistoryState';
import propertyService, { toApiPayload } from '../../../services/propertyService';
import subdivisionService from '../../../services/subdivisionService';
import { useToast } from '../../../components/ui/toast';

export default function BrokerMultiPropertyMapStudio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Subdivisions State (Parent Hierarchy)
  const [subdivisions, setSubdivisions] = useState([]);
  const [selectedSubdivisionId, setSelectedSubdivisionId] = useState(
    searchParams.get('subdivision_id') || ''
  );
  const [selectedSubdivision, setSelectedSubdivision] = useState(null);
  const [isSubdivisionModalOpen, setIsSubdivisionModalOpen] = useState(false);

  // Resize Lot State
  const [isResizeModalOpen, setIsResizeModalOpen] = useState(false);
  const [resizingLot, setResizingLot] = useState(null);

  // Lot Grid Modal State
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);

  // Project defaults
  const [projectName, setProjectName] = useState(
    searchParams.get('project') || 'Horizon Ridge Subdivision'
  );
  const [city, setCity] = useState(searchParams.get('city') || 'Taguig City');
  const [barangay, setBarangay] = useState(searchParams.get('barangay') || 'Fort Bonifacio');
  const [defaultPropertyType, setDefaultPropertyType] = useState('residentialLot');

  // Lots & Studio State (With Undo / Redo History)
  const {
    state: lots,
    setState: setLots,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
  } = useHistoryState([]);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [continuousDraw, setContinuousDraw] = useState(true);
  const [basemap, setBasemap] = useState('roadmap'); // Default: 'roadmap' | 'hybrid' (Satellite)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Global Keyboard Shortcuts (Undo: Ctrl+Z / Cmd+Z, Redo: Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when user is typing inside text inputs, textareas or contentEditables
      const target = e.target;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isInput) return;

      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (!modifier) return;

      const key = e.key.toLowerCase();

      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Map Center
  const [mapCenter, setMapCenter] = useState(() => {
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return [lat, lng];
    }
    return [14.5547, 121.0350];
  });

  // Fetch Parent Subdivisions on mount
  useEffect(() => {
    let isMounted = true;
    const fetchSubdivisions = async () => {
      try {
        const res = await subdivisionService.getSubdivisions();
        const list = res?.data || res || [];
        if (isMounted && Array.isArray(list)) {
          setSubdivisions(list);
          const paramId = searchParams.get('subdivision_id');
          const initialMatch = list.find(
            (s) => s.id === paramId || (projectName && s.name.toLowerCase() === projectName.toLowerCase())
          );
          if (initialMatch) {
            setSelectedSubdivision(initialMatch);
            setSelectedSubdivisionId(initialMatch.id);
            setProjectName(initialMatch.name);
            if (initialMatch.city) setCity(initialMatch.city);
            if (initialMatch.province_state) setBarangay(initialMatch.province_state);
            if (initialMatch.latitude && initialMatch.longitude) {
              setMapCenter([initialMatch.latitude, initialMatch.longitude]);
            }
          }
        }
      } catch (err) {
        console.warn('[BrokerMultiPropertyMapStudio] Subdivisions load warning:', err);
      }
    };
    fetchSubdivisions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Parent Subdivision Selection
  const handleSubdivisionChange = (subId) => {
    setSelectedSubdivisionId(subId);
    const found = subdivisions.find((s) => s.id === subId);
    if (found) {
      setSelectedSubdivision(found);
      setProjectName(found.name);
      if (found.city) setCity(found.city);
      if (found.province_state) setBarangay(found.province_state);
      if (found.latitude && found.longitude) {
        setMapCenter([found.latitude, found.longitude]);
      }
    } else {
      setSelectedSubdivision(null);
    }
  };

  // Handle Parent Subdivision Created via Modal
  const handleSubdivisionCreated = (newProject) => {
    if (!newProject) return;
    setSubdivisions((prev) => [newProject, ...prev]);
    setSelectedSubdivision(newProject);
    setSelectedSubdivisionId(newProject.id);
    setProjectName(newProject.name);
    if (newProject.city) setCity(newProject.city);
    if (newProject.province_state) setBarangay(newProject.province_state);
    if (newProject.latitude && newProject.longitude) {
      setMapCenter([newProject.latitude, newProject.longitude]);
    }
    toast({
      title: 'Subdivision Created',
      description: `"${newProject.name}" selected as the parent project.`,
      variant: 'success',
    });
  };

  // Color palette for distinct lots on the map
  const LOT_COLORS = ['#0F766E', '#2563EB', '#7C3AED', '#D97706', '#059669', '#DC2626', '#0284C7'];

  // Handle Lot Created via Geoman
  const handleLotCreated = useCallback(
    ({ tempId, boundary, area_sqm, centroid }) => {
      setLots((prev) => {
        const lotIndex = prev.length + 1;
        const color = LOT_COLORS[(lotIndex - 1) % LOT_COLORS.length];
        const newLot = {
          tempId,
          lot_number: `Lot ${lotIndex}`,
          title: `${projectName} - Lot ${lotIndex}`,
          property_type: defaultPropertyType,
          price: Math.round(area_sqm * 22000), // Default ₱22,000/sqm baseline
          status: 'Active',
          area_sqm,
          boundary,
          centroid,
          color,
          isDirty: true,
        };
        return [...prev, newLot];
      });
      setSelectedLotId(tempId);
      setIsDirty(true);
    },
    [projectName, defaultPropertyType]
  );

  // Handle Lot Updated (Boundary vertex drag or metadata changes)
  const handleLotUpdated = useCallback((lotId, updates) => {
    setLots((prev) =>
      prev.map((lot) => {
        const key = lot.id || lot.tempId;
        if (key === lotId) {
          return { ...lot, ...updates, isDirty: true };
        }
        return lot;
      })
    );
    setIsDirty(true);
  }, []);

  // Handle Lot Deleted
  const handleLotDeleted = useCallback(
    (lotId) => {
      setLots((prev) => prev.filter((lot) => (lot.id || lot.tempId) !== lotId));
      if (selectedLotId === lotId) {
        setSelectedLotId(null);
      }
      setIsDirty(true);
    },
    [selectedLotId]
  );

  // Handle Open Lot Resize Dialog
  const handleOpenResizeLot = useCallback((lot) => {
    setResizingLot(lot);
    setIsResizeModalOpen(true);
  }, []);

  // Handle Apply Lot Resize (Accurate geodesic scaling or dimension reshaping)
  const handleApplyResize = useCallback(
    (lotId, resizeParams) => {
      if (typeof window.__resizeLot === 'function') {
        const result = window.__resizeLot(lotId, resizeParams);
        if (result) {
          const area =
            typeof result === 'object' && result?.area_sqm != null
              ? result.area_sqm
              : (resizeParams?.targetAreaSqm || 0);

          if (typeof result === 'object' && result.boundary) {
            handleLotUpdated(lotId, {
              boundary: result.boundary,
              area_sqm: result.area_sqm,
              centroid: result.centroid,
            });
          }

          toast({
            title: 'Lot Resized',
            description: `Boundary accurately adjusted to ${Math.round(area).toLocaleString()} m².`,
            variant: 'success',
          });
          setIsResizeModalOpen(false);
          setResizingLot(null);
          return;
        }
      }
      toast({
        title: 'Resize Failed',
        description: 'Unable to recalculate boundary coordinates.',
        variant: 'destructive',
      });
    },
    [handleLotUpdated, toast]
  );

  // Handle Batch Lot Grid Generation (Rows × Columns)
  const handleGenerateGrid = useCallback(
    ({ rows, cols, widthMeters, depthMeters }) => {
      let centerLat = mapCenter[0];
      let centerLng = mapCenter[1];
      if (window.__leafletStudioMap) {
        const c = window.__leafletStudioMap.getCenter();
        centerLat = c.lat;
        centerLng = c.lng;
      }

      const dLatPerMeter = 1 / 110574.0;
      const dLngPerMeter = 1 / (111320.0 * Math.cos((centerLat * Math.PI) / 180));

      const cellDLat = depthMeters * dLatPerMeter;
      const cellDLng = widthMeters * dLngPerMeter;

      const totalHeightLat = rows * cellDLat;
      const totalWidthLng = cols * cellDLng;

      const topLat = centerLat + totalHeightLat / 2;
      const leftLng = centerLng - totalWidthLng / 2;

      const newLots = [];
      const currentCount = lots.length;

      for (let r = 0; r < rows; r++) {
        const cellTop = topLat - r * cellDLat;
        const cellBottom = cellTop - cellDLat;

        for (let c = 0; c < cols; c++) {
          const cellLeft = leftLng + c * cellDLng;
          const cellRight = cellLeft + cellDLng;

          const lotIndex = currentCount + newLots.length + 1;
          const tempId = `lot_${Date.now()}_r${r}_c${c}_${Math.random().toString(36).substr(2, 4)}`;
          const color = LOT_COLORS[(lotIndex - 1) % LOT_COLORS.length];
          const area_sqm = Math.round(widthMeters * depthMeters);

          const coordinates = [[
            [Number(cellLeft.toFixed(7)), Number(cellBottom.toFixed(7))],
            [Number(cellLeft.toFixed(7)), Number(cellTop.toFixed(7))],
            [Number(cellRight.toFixed(7)), Number(cellTop.toFixed(7))],
            [Number(cellRight.toFixed(7)), Number(cellBottom.toFixed(7))],
            [Number(cellLeft.toFixed(7)), Number(cellBottom.toFixed(7))],
          ]];

          const boundary = {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates,
            },
            properties: {
              lot_number: `Lot ${lotIndex}`,
              area_sqm,
            },
          };

          const centroid = [
            Number(((cellTop + cellBottom) / 2).toFixed(7)),
            Number(((cellLeft + cellRight) / 2).toFixed(7)),
          ];

          newLots.push({
            tempId,
            lot_number: `Lot ${lotIndex}`,
            title: `${projectName} - Lot ${lotIndex}`,
            property_type: defaultPropertyType,
            price: Math.round(area_sqm * 22000),
            status: 'Active',
            area_sqm,
            boundary,
            centroid,
            color,
            isDirty: true,
          });
        }
      }

      setLots((prev) => [...prev, ...newLots]);
      setSelectedLotId(newLots[0]?.tempId || null);
      setIsDirty(true);

      toast({
        title: 'Lot Grid Generated',
        description: `Successfully created ${newLots.length} lot parcels (${rows} rows × ${cols} cols).`,
        variant: 'success',
      });
    },
    [mapCenter, lots.length, projectName, defaultPropertyType, toast]
  );

  // Handle Cut / Slice (`pm:cut`)
  const handleLotsSliced = useCallback(
    (cutLotId, newLotsData) => {
      setLots((prev) => {
        const target = prev.find((l) => (l.id || l.tempId) === cutLotId);
        const baseNum = target?.lot_number || 'Lot';
        const withoutOld = prev.filter((l) => (l.id || l.tempId) !== cutLotId);

        const replacementLots = newLotsData.map((data, idx) => {
          const suffix = String.fromCharCode(65 + idx); // 'A', 'B', 'C'...
          const color = LOT_COLORS[(withoutOld.length + idx) % LOT_COLORS.length];
          return {
            tempId: data.tempId,
            lot_number: `${baseNum}-${suffix}`,
            title: `${projectName} - ${baseNum}-${suffix}`,
            property_type: target?.property_type || defaultPropertyType,
            price: Math.round(data.area_sqm * 22000),
            status: target?.status || 'Active',
            area_sqm: data.area_sqm,
            boundary: data.boundary,
            centroid: data.centroid,
            color,
            isDirty: true,
          };
        });

        return [...withoutOld, ...replacementLots];
      });
      setIsDirty(true);
      toast({
        title: 'Parcel Sliced',
        description: `Split into ${newLotsData.length} sub-lots successfully.`,
      });
    },
    [projectName, defaultPropertyType, toast]
  );

  // Handle Duplicate / Clone Lot
  const handleDuplicateLot = useCallback(
    (lotId) => {
      const target = lots.find((l) => (l.id || l.tempId) === lotId);
      if (!target || !target.boundary) return;

      // Slight coordinate offset (approx 30m east)
      const offset = 0.0003;
      const newCoords = target.boundary.geometry.coordinates.map((ring) =>
        ring.map(([lng, lat]) => [lng + offset, lat])
      );

      const newTempId = `lot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const lotIndex = lots.length + 1;

      const clonedLot = {
        ...target,
        id: undefined,
        tempId: newTempId,
        lot_number: `Lot ${lotIndex}`,
        title: `${projectName} - Lot ${lotIndex}`,
        boundary: {
          ...target.boundary,
          geometry: {
            ...target.boundary.geometry,
            coordinates: newCoords,
          },
        },
        centroid: target.centroid ? [target.centroid[0], target.centroid[1] + offset] : null,
        isDirty: true,
      };

      setLots((prev) => [...prev, clonedLot]);
      setSelectedLotId(newTempId);
      setIsDirty(true);
      toast({
        title: 'Lot Cloned',
        description: `Duplicated geometry for Lot ${lotIndex}.`,
      });
    },
    [lots, projectName, toast]
  );

  // Handle Slice / Split Lot
  const handleSliceLot = useCallback((lotId) => {
    setSelectedLotId(lotId);
    setTimeout(() => {
      if (typeof window.__sliceActiveLot === 'function') {
        window.__sliceActiveLot();
      }
    }, 100);
  }, []);

  // Clear All Lots
  const handleClearAllLots = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all mapped lots from this session?')) {
      setLots([]);
      setSelectedLotId(null);
      setIsDirty(true);
    }
  }, []);

  // Batch Save all mapped lots
  const handleBatchSave = async () => {
    if (lots.length === 0) {
      toast({
        title: 'No lots to save',
        description: 'Draw at least one property boundary on the map first.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      let savedCount = 0;
      for (const lot of lots) {
        const payload = toApiPayload({
          title: lot.title || `${projectName} - ${lot.lot_number}`,
          property_type: lot.property_type || 'residentialLot',
          price: lot.price || 0,
          status: lot.status || 'Active',
          standardStatus: lot.status || 'Active',
          subdivision_project_id: selectedSubdivision?.id || undefined,
          subdivision_name: selectedSubdivision?.name || projectName,
          location: {
            address: `${lot.lot_number}, ${projectName}`,
            city: city,
            state: barangay,
          },
          lot_boundary: lot.boundary,
          lot_size: lot.area_sqm || undefined,
          coordinates: lot.centroid
            ? { lat: lot.centroid[0], lng: lot.centroid[1] }
            : undefined,
          is_published: true,
        });

        await propertyService.createProperty(payload);
        savedCount++;
      }

      setIsDirty(false);
      toast({
        title: 'Properties Published',
        description: `Successfully created ${savedCount} property listings with cadastral boundaries!`,
        variant: 'success',
      });

      // Navigate back to properties management after brief delay
      setTimeout(() => {
        navigate('/broker/properties');
      }, 1200);
    } catch (err) {
      console.error('[BrokerMultiPropertyMapStudio] Save error:', err);
      toast({
        title: 'Save Failed',
        description: err.message || 'Unable to save all properties. Please check fields.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 overflow-hidden select-none">
      {/* Studio Top Navigation Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Back & Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link
            to="/broker/properties"
            onClick={(e) => {
              if (isDirty && !window.confirm('You have unsaved mapped properties. Leave studio?')) {
                e.preventDefault();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Properties</span>
          </Link>

          <span className="text-slate-300">/</span>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0F766E]"></span>
            <h1 className="text-sm font-bold text-slate-900">Cadastral Map Studio</h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              Multi-Lot
            </span>
          </div>
        </div>

        {/* Center: Parent Subdivision Selector & Location */}
        <div className="hidden md:flex items-center gap-2.5">
          {selectedSubdivision ? (
            <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200/80 rounded-lg px-2.5 py-1">
              <Building2 className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
              <span className="text-xs font-bold text-teal-950 max-w-[160px] truncate">
                {selectedSubdivision.name}
              </span>
              <button
                type="button"
                onClick={() => handleSubdivisionChange('')}
                title="Change parent subdivision"
                className="text-[#0F766E] hover:text-teal-800 text-[10px] font-semibold underline cursor-pointer ml-1"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedSubdivisionId}
                onChange={(e) => handleSubdivisionChange(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden max-w-[170px] cursor-pointer truncate"
                title="Select parent subdivision"
              >
                <option value="">-- Standalone Project --</option>
                {subdivisions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} {sub.city ? `(${sub.city})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsSubdivisionModalOpen(true)}
                title="Create new parent subdivision"
                className="ml-1 px-1.5 py-0.5 rounded bg-[#0F766E]/10 hover:bg-[#0F766E]/20 text-[#0F766E] font-bold text-[10px] inline-flex items-center gap-0.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>
          )}

          {!selectedSubdivision && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project Name"
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden w-36"
              />
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City / Municipality"
              className="text-xs font-medium text-slate-700 bg-transparent focus:outline-hidden w-28"
            />
          </div>
        </div>

        {/* Right: Basemap Switcher & Publish Actions */}
        <div className="flex items-center gap-2.5">
          {/* Header Basemap Switcher (Roadmap & Satellite) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setBasemap('roadmap')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                basemap === 'roadmap'
                  ? 'bg-white text-[#0F766E] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Roadmap
            </button>
            <button
              type="button"
              onClick={() => setBasemap('hybrid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                basemap === 'hybrid'
                  ? 'bg-white text-[#0F766E] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
          </div>

          <button
            type="button"
            disabled={isSaving || lots.length === 0}
            onClick={handleBatchSave}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
              lots.length > 0
                ? 'bg-[#0F766E] hover:bg-[#0D625C] text-white active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Publishing {lots.length} Lots...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Publish {lots.length} {lots.length === 1 ? 'Lot' : 'Lots'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Studio Main Workspace: Left Ledger Sidebar + Right Map Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        <MultiPropertyLedgerSidebar
          lots={lots}
          selectedLotId={selectedLotId}
          parentSubdivision={selectedSubdivision}
          onSelectLot={setSelectedLotId}
          onUpdateLot={handleLotUpdated}
          onDeleteLot={handleLotDeleted}
          onDuplicateLot={handleDuplicateLot}
          onSliceLot={handleSliceLot}
          onOpenResizeLot={handleOpenResizeLot}
          onClearAllLots={handleClearAllLots}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <div className="flex-1 h-full relative">
          <MultiPropertyCadastralCanvas
            lots={lots}
            selectedLotId={selectedLotId}
            onSelectLot={setSelectedLotId}
            onLotCreated={handleLotCreated}
            onLotUpdated={handleLotUpdated}
            onLotDeleted={handleLotDeleted}
            onLotsSliced={handleLotsSliced}
            centerCoordinates={mapCenter}
            activeBasemap={basemap}
            onBasemapChange={setBasemap}
            onOpenGridModal={() => setIsGridModalOpen(true)}
            continuousDraw={continuousDraw}
            onToggleContinuousDraw={() => setContinuousDraw(!continuousDraw)}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        </div>
      </div>

      {/* Parent Subdivision Quick-Creation Modal */}
      <SubdivisionCreateModal
        isOpen={isSubdivisionModalOpen}
        onClose={() => setIsSubdivisionModalOpen(false)}
        onCreated={handleSubdivisionCreated}
      />

      {/* Geodesic Lot Resize Modal (Target Area m² or Dimensions) */}
      <LotResizeModal
        isOpen={isResizeModalOpen}
        onClose={() => {
          setIsResizeModalOpen(false);
          setResizingLot(null);
        }}
        lot={resizingLot}
        onApplyResize={handleApplyResize}
      />

      {/* Batch Lot Grid Generator Modal (Rows × Columns) */}
      <LotGridModal
        isOpen={isGridModalOpen}
        onClose={() => setIsGridModalOpen(false)}
        onGenerateGrid={handleGenerateGrid}
      />
    </div>
  );
}
