import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Sparkles,
  History,
  Eye,
  Send,
  Layers,
  ChevronDown,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  Check,
  Building2,
  MapPin,
  Map,
  Trash2,
  Sliders,
  PenTool,
  TableProperties,
  FileImage,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../components/ui/dropdown-menu';
import SubdivisionVectorCanvas from '../../../components/subdivision/SubdivisionVectorCanvas';
import SubdivisionLeftToolstrip from '../../../components/subdivision/SubdivisionLeftToolstrip';
import SubdivisionBottomViewportDock from '../../../components/subdivision/SubdivisionBottomViewportDock';
import SubdivisionRightDock from '../../../components/subdivision/SubdivisionRightDock';
import SubdivisionAiDock from '../../../components/subdivision/SubdivisionAiDock';
import SubdivisionPlanReplacementModal from '../../../components/subdivision/SubdivisionPlanReplacementModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Toaster, toast as rawToast } from '../../../components/ui/toast';
import subdivisionService from '../../../services/subdivisionService';

const toast = {
  success: (title) => rawToast({ title, variant: 'success' }),
  error: (title) => rawToast({ title, variant: 'destructive' }),
  info: (title) => rawToast({ title, variant: 'default' }),
};

export default function SubdivisionMapEditor() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  // Project & Plan state
  const [project, setProject] = useState(null);
  const [plan, setPlan] = useState(null);
  const [lots, setLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [selectedLotIds, setSelectedLotIds] = useState([]);
  const [activeTool, setActiveTool] = useState('select');

  // Canvas viewport state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [planOpacity, setPlanOpacity] = useState(0.85);
  const [showPlanImage, setShowPlanImage] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  // Undo/Redo history stack (FR-009)
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Push new state onto history stack
  const pushHistory = useCallback(
    (newLots) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(newLots);
        if (next.length > 50) next.shift(); // Max 50 items
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    },
    [historyIndex]
  );

  // AI Dock state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCandidate, setAiCandidate] = useState(null);
  const [aiOcrResult, setAiOcrResult] = useState(null);

  // Status & saving
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Modals & Drawers
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishNotes, setPublishNotes] = useState('');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [versions, setVersions] = useState([]);
  const [showVisitorPreview, setShowVisitorPreview] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [editorMode, setEditorMode] = useState('drafting'); // 'drafting' | 'ledger'
  const [showGrid, setShowGrid] = useState(true);

  // Canvas Background Mode: Pure white by default when opening subdivision
  const [backgroundMode, setBackgroundMode] = useState('white'); // 'white' | 'satellite'

  // AI Whole-Blueprint Auto-Layout state (FR-SM-049)
  const [searchParams] = useSearchParams();
  const [isAutoLayoutRunning, setIsAutoLayoutRunning] = useState(false);
  const [showAutoLayoutBanner, setShowAutoLayoutBanner] = useState(false);
  const [showAiPicturePromptModal, setShowAiPicturePromptModal] = useState(false);
  const fileInputRef = useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // AI Whole-Blueprint Auto-Layout Handler (FR-SM-049)
  const handleAiAutoLayout = useCallback(
    async (overridePlan) => {
      setIsAutoLayoutRunning(true);
      try {
        const targetPlan = overridePlan || plan;
        const options = {};
        if (targetPlan?.image_url) {
          if (targetPlan.image_url.startsWith('data:')) {
            options.imageBase64 = targetPlan.image_url;
          } else {
            options.imageUrl = targetPlan.image_url;
          }
        }
        if (targetPlan?.image_width) {
          options.imageWidth = targetPlan.image_width;
        }
        if (targetPlan?.image_height) {
          options.imageHeight = targetPlan.image_height;
        }

        const res = await subdivisionService.autoLayoutPlan(projectId, options);
        console.log('[DEBUG autoLayoutPlan raw result]:', res);
        const data = res?.data || res;
        const detectedLots = res?.data?.lots || data?.lots || res?.lots || [];
        console.log('[DEBUG autoLayoutPlan detectedLots]:', detectedLots.length);

        if (detectedLots.length > 0) {
          const formattedLots = detectedLots.map((l, i) => ({
            ...l,
            id: `lot-ai-${Date.now()}-${i}`,
            is_verified: false, // Mandatory FR-016
          }));

          console.log('[DEBUG setLots called with]:', formattedLots.length);
          setLots(formattedLots);
          pushHistory(formattedLots);
          setShowAutoLayoutBanner(true);
          toast.success(`AI analyzed picture & generated ${formattedLots.length} vector lots!`);
        } else {
          toast.error('AI was unable to detect parcels on this picture.');
        }
      } catch (err) {
        console.error('[DEBUG AI CATCH]:', err);
        window.__LAST_AI_ERROR__ = err.message || String(err);
        const errMsg = err?.response?.data?.message || err?.message || 'AI auto-layout failed.';
        toast.error(`AI auto-layout: ${errMsg}`);
      } finally {
        setIsAutoLayoutRunning(false);
      }
    },
    [projectId, plan]
  );

  // AI Detect header button click router
  const handleAiHeaderDetectClick = () => {
    if (!plan?.image_url) {
      setShowAiPicturePromptModal(true);
    } else {
      handleAiAutoLayout();
    }
  };

  // 1-Click Load Sample Cadastral Plan & Run AI
  const handleLoadSamplePlan = async () => {
    setIsUploadingPhoto(true);
    try {
      const response = await fetch('/images/sample_subdivision_plan.png');
      const blob = await response.blob();
      const file = new File([blob], 'sample_subdivision_plan.png', { type: 'image/png' });

      const formData = new FormData();
      formData.append('plan_title', 'Master Cadastral Site Plan');
      formData.append('image_width', '1600');
      formData.append('image_height', '1000');
      formData.append('plan_file', file);

      const res = await subdivisionService.uploadPlan(projectId, formData);
      const newPlan = res?.data || res;
      setPlan(newPlan);
      toast.success('Sample cadastral plan loaded! Analyzing layout with AI...');
      await handleAiAutoLayout(newPlan);
    } catch (err) {
      toast.error('Failed to load sample cadastral plan: ' + err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Upload subdivision blueprint / photo & trigger AI layout immediately
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      // 1. Measure image dimensions via HTML Image object
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });

      const width = img.naturalWidth || 1600;
      const height = img.naturalHeight || 1000;

      // 2. Upload to backend
      const formData = new FormData();
      formData.append('plan_title', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('image_width', String(width));
      formData.append('image_height', String(height));
      formData.append('plan_file', file);

      const res = await subdivisionService.uploadPlan(projectId, formData);
      const newPlan = res?.data || res;
      setPlan(newPlan);
      toast.success('Subdivision photo uploaded! Analyzing layout with AI...');

      // 3. Immediately trigger AI layout on newly uploaded photo
      await handleAiAutoLayout(newPlan);
    } catch (err) {
      toast.error('Failed to upload and analyze subdivision photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Replace Master Blueprint Plan Graphic (FR-005)
  const handleConfirmPlanReplacement = async ({ file, runAiDetection = true }) => {
    try {
      const formData = new FormData();
      formData.append('plan_title', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('plan_file', file);
      const res = await subdivisionService.uploadPlan(projectId, formData);
      const newPlan = res?.data || res;
      setPlan(newPlan);
      toast.success('Blueprint graphic updated!');
      if (runAiDetection) {
        toast.info('Analyzing picture with AI & generating vector layout...');
        await handleAiAutoLayout(newPlan);
      }
    } catch (err) {
      toast.error('Failed to replace blueprint graphic: ' + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  // Clear / Remove Blueprint Image (Revert to pure white drafting canvas)
  const handleClearBlueprint = () => {
    setPlan((prev) => (prev ? { ...prev, image_url: '' } : null));
    toast.success('Blueprint graphic removed. Reverted to blank white drafting canvas.');
  };

  // Fetch initial project data
  useEffect(() => {
    async function loadProjectData() {
      try {
        const res = await subdivisionService.getSubdivisionById(projectId);
        const projectData = res?.data || res;
        if (projectData) {
          setProject(projectData);
          if (projectData.activePlan) {
            setPlan(projectData.activePlan);
          }
        }

        // Fetch draft lots
        const lotsRes = await subdivisionService.getLots(projectId);
        const lotsData = lotsRes?.data || (Array.isArray(lotsRes) ? lotsRes : []);
        if (Array.isArray(lotsData)) {
          setLots(lotsData);
          setHistory([lotsData]);
          setHistoryIndex(0);

          // Auto-trigger AI layout if requested via URL param (FR-SM-049)
          if (searchParams.get('autoLayout') === 'true' && lotsData.length === 0) {
            setTimeout(() => {
              handleAiAutoLayout();
            }, 500);
          }
        }

        // Fetch versions
        const versRes = await subdivisionService.listVersions(projectId);
        const versData = versRes?.data || (Array.isArray(versRes) ? versRes : []);
        if (Array.isArray(versData)) {
          setVersions(versData);
        }
      } catch (err) {
        toast.error('Failed to load subdivision map project.');
      }
    }

    loadProjectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevLots = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setLots(prevLots);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextLots = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setLots(nextLots);
    }
  };

  // Batch Save Draft Lots to Backend (FR-011)
  const saveDraftLots = async (lotsToSave = lots) => {
    setIsSaving(true);
    try {
      const res = await subdivisionService.saveDraftLots(projectId, lotsToSave);
      if (res?.success) {
        setLastSavedTime(new Date());
      }
    } catch (err) {
      console.warn('Autosave skipped or offline');
    } finally {
      setIsSaving(false);
    }
  };

  // Add a newly drawn lot (FR-006)
  const handleLotCreated = (newLotData) => {
    const newLot = {
      ...newLotData,
      id: `lot-${Date.now()}`,
      project_id: projectId,
      plan_id: plan?.id || 'default',
    };
    const nextLots = [...lots, newLot];
    setLots(nextLots);
    setSelectedLotId(newLot.id);
    pushHistory(nextLots);
    saveDraftLots(nextLots);
    toast.success(`Created Block ${newLot.block_number}, Lot ${newLot.lot_number}`);
  };

  // Update a lot's metadata or coordinates (FR-026)
  const handleLotUpdated = (updatedLot) => {
    const nextLots = lots.map((l) => (l.id === updatedLot.id ? updatedLot : l));
    setLots(nextLots);
    pushHistory(nextLots);
    saveDraftLots(nextLots);
  };

  // Duplicate a lot (FR-007)
  const handleDuplicateLot = (lotToClone) => {
    if (!lotToClone) return;
    const offset = 30;
    const duplicatedLot = {
      ...lotToClone,
      id: `lot-${Date.now()}`,
      lot_number: String(Number(lotToClone.lot_number || 0) + 1),
      coordinates: lotToClone.coordinates.map((pt) => ({
        x: pt.x + offset,
        y: pt.y + offset,
      })),
      is_verified: true,
    };
    const nextLots = [...lots, duplicatedLot];
    setLots(nextLots);
    setSelectedLotId(duplicatedLot.id);
    pushHistory(nextLots);
    saveDraftLots(nextLots);
    toast.success(`Duplicated to Lot ${duplicatedLot.lot_number}`);
  };

  // Delete a lot (FR-007)
  const handleDeleteLot = (lotIdToDelete) => {
    const nextLots = lots.filter((l) => l.id !== lotIdToDelete);
    setLots(nextLots);
    setSelectedLotId(null);
    pushHistory(nextLots);
    saveDraftLots(nextLots);
    toast.info('Lot removed from map');
  };

  // Selection handler (single and multi-select with Shift)
  const handleSelectLot = (id, options = {}) => {
    if (options.isMulti) {
      setSelectedLotIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        setSelectedLotId(next[next.length - 1] || null);
        return next;
      });
    } else {
      setSelectedLotId(id);
      setSelectedLotIds(id ? [id] : []);
    }
  };

  // Handle lot splitting / slicing
  const handleLotSplit = (originalLotId, [daughter1, daughter2]) => {
    const nextLots = lots.flatMap((l) => (l.id === originalLotId ? [daughter1, daughter2] : [l]));
    setLots(nextLots);
    setSelectedLotId(daughter1.id);
    setSelectedLotIds([daughter1.id]);
    pushHistory(nextLots);
    saveDraftLots(nextLots);
    toast.success(`Sliced lot into ${daughter1.lot_number} and ${daughter2.lot_number}!`);
  };

  // Batch status update for multiple selected lots
  const handleBatchUpdateStatus = (newStatus) => {
    if (selectedLotIds.length === 0) return;
    const nextLots = lots.map((l) =>
      selectedLotIds.includes(l.id) ? { ...l, availability_status: newStatus } : l
    );
    setLots(nextLots);
    pushHistory(nextLots);
    saveDraftLots(nextLots);
    toast.success(`Updated ${selectedLotIds.length} lots to "${newStatus}"`);
  };

  // Batch delete for multiple selected lots
  const handleBatchDelete = () => {
    if (selectedLotIds.length === 0) return;
    const count = selectedLotIds.length;
    const nextLots = lots.filter((l) => !selectedLotIds.includes(l.id));
    setLots(nextLots);
    setSelectedLotId(null);
    setSelectedLotIds([]);
    pushHistory(nextLots);
    saveDraftLots(nextLots);
    toast.info(`Removed ${count} selected lots`);
  };

  // Recalculate geometric area using Shoelace formula
  const handleRecalculateArea = (lot) => {
    if (!lot.coordinates || lot.coordinates.length < 3) return;
    let area = 0;
    const n = lot.coordinates.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += lot.coordinates[i].x * lot.coordinates[j].y;
      area -= lot.coordinates[j].x * lot.coordinates[i].y;
    }
    const computedSqm = Number((Math.abs(area) / 20).toFixed(2));
    handleLotUpdated({
      ...lot,
      verified_area_sqm: computedSqm,
    });
    toast.success(`Area calculated: ${computedSqm} m²`);
  };

  // AI Boundary detection trigger on click (FR-012)
  const handleAiDetectClick = async (clickPoint) => {
    setAiLoading(true);
    setAiCandidate(null);
    try {
      const res = await subdivisionService.aiDetectBoundary({
        imageUrl: plan?.image_url,
        clickPoint,
        imageWidth: plan?.image_width || 1600,
        imageHeight: plan?.image_height || 1000,
      });
      const data = res?.data || res;
      if (data) {
        setAiCandidate(data);
      }
    } catch (err) {
      toast.error('AI boundary detection failed.');
    } finally {
      setAiLoading(false);
    }
  };

  // AI Boundary detection trigger on bounding box
  const handleAiDetectBox = async (cropBox) => {
    setAiLoading(true);
    setAiCandidate(null);
    try {
      const res = await subdivisionService.aiDetectBoundary({
        imageUrl: plan?.image_url,
        cropBox,
        imageWidth: plan?.image_width || 1600,
        imageHeight: plan?.image_height || 1000,
      });
      const data = res?.data || res;
      if (data) {
        setAiCandidate(data);
      }
    } catch (err) {
      toast.error('AI boundary detection failed.');
    } finally {
      setAiLoading(false);
    }
  };

  // AI OCR trigger on box crop (FR-019)
  const handleAiOcrBox = async (cropBox) => {
    setAiLoading(true);
    setAiOcrResult(null);
    try {
      const res = await subdivisionService.aiRecognizeOcr({
        imageUrl: plan?.image_url,
        cropBox,
      });
      const data = res?.data || res;
      if (data) {
        setAiOcrResult(data);
        toast.success(`Detected Block ${data.blockNumber}, Lot ${data.lotNumber}`);
      }
    } catch (err) {
      toast.error('OCR label scan failed.');
    } finally {
      setAiLoading(false);
    }
  };

  // Accept AI Proposal (FR-014, FR-015)
  const handleAcceptAiCandidate = () => {
    if (!aiCandidate) return;
    handleLotCreated({
      block_number: aiOcrResult?.blockNumber || '1',
      lot_number: aiOcrResult?.lotNumber || String(lots.length + 1),
      boundary_type: 'SaleableLot',
      availability_status: 'Available',
      verified_area_sqm: aiCandidate.estimatedAreaSqm || 250,
      coordinates: aiCandidate.coordinates,
      is_verified: true, // Human accepted and verified!
    });
    setAiCandidate(null);
    setAiOcrResult(null);
  };

  // Pre-Flight Validation Check (FR-031, FR-032)
  const handleRunValidation = async () => {
    try {
      const res = await subdivisionService.validateMap(projectId);
      const data = res?.data || res;
      if (data) {
        setValidationResult(data);
        setShowValidationModal(true);
      }
    } catch (err) {
      toast.error('Validation request failed.');
    }
  };

  // Publish Version Snapshot (FR-033, FR-036)
  const handlePublishVersion = async () => {
    try {
      const res = await subdivisionService.publishMap(
        projectId,
        publishNotes || `Release Version ${versions.length + 1}`
      );
      const data = res?.data || res;

      if (!res?.success && !data?.version_number) {
        setShowPublishModal(false);
        setValidationResult(data);
        setShowValidationModal(true);
        toast.error('Publication blocked by pre-flight validation errors.');
        return;
      }

      setShowPublishModal(false);
      setPublishNotes('');
      toast.success(`Published Version ${data.version_number} successfully!`);

      // Refresh version list
      const versRes = await subdivisionService.listVersions(projectId);
      const versData = versRes?.data || (Array.isArray(versRes) ? versRes : []);
      if (Array.isArray(versData)) {
        setVersions(versData);
      }
    } catch (err) {
      toast.error('Failed to publish map version.');
    }
  };

  // 1-Click Rollback to Historical Version (FR-036)
  const handleRestoreVersion = async (versionNumber) => {
    if (
      !window.confirm(
        `Rollback map to Version #${versionNumber}? This will restore historical lots into the draft workspace.`
      )
    ) {
      return;
    }

    try {
      const res = await subdivisionService.rollbackVersion(projectId, versionNumber);
      const data = res?.data || res;

      if (data?.draftLots) {
        setLots(data.draftLots);
        pushHistory(data.draftLots);
        toast.success(`Restored to Version ${versionNumber}!`);

        // Refresh version history list
        const versRes = await subdivisionService.listVersions(projectId);
        const versData = versRes?.data || (Array.isArray(versRes) ? versRes : []);
        if (Array.isArray(versData)) {
          setVersions(versData);
        }
      }
    } catch (err) {
      toast.error('Version rollback failed.');
    }
  };

  const selectedLot = lots.find((l) => l.id === selectedLotId);

  return (
    <div
      data-testid="subdivision-map-editor-workspace"
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 text-white select-none"
    >
      <Toaster position="top-right" richColors />

      {/* Top Workspace Bar - Modern SaaS Executive Header with Common Labels */}
      <header className="h-14 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] flex items-center justify-between px-4 z-20 shrink-0 select-none">
        {/* Left Zone: Brand Navigation & Project Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/broker/properties"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors"
            title="Back to Properties"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Properties</span>
          </Link>

          <span className="w-px h-4 bg-[#E2E8F0]" />

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-[#1E293B] tracking-tight truncate max-w-[180px] sm:max-w-[260px]">
              {project?.name || 'Aura Residences - Master Plan'}
            </h1>

            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Project</span>
            </span>

            {project?.latitude && project?.longitude && (
              <a
                href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open pinned location in Google Maps"
                className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-[#0F766E] border border-slate-200 rounded-full text-[10px] font-mono transition-colors shrink-0"
              >
                <MapPin className="w-3 h-3 text-[#0F766E]" />
                <span>{Number(project.latitude).toFixed(4)}°, {Number(project.longitude).toFixed(4)}°</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            )}
          </div>
        </div>

        {/* Center Zone: Segmented View Mode Switcher (Common Labels) */}
        <div className="hidden lg:flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setEditorMode('drafting')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              editorMode === 'drafting'
                ? 'bg-white text-[#0F766E] shadow-2xs font-bold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Map View</span>
          </button>
          <button
            type="button"
            onClick={() => setEditorMode('ledger')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              editorMode === 'ledger'
                ? 'bg-white text-[#0F766E] shadow-2xs font-bold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Lot Inventory ({lots.length})</span>
          </button>
        </div>

        {/* Right Zone: Executive Actions (Standardized Common Labels) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Hidden File Input for Direct Photo Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handlePhotoUpload}
            className="hidden"
            id="subdivision-editor-photo-upload"
          />

          {/* Blueprint Action Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#1E293B] text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-[#E2E8F0] shadow-2xs transition-colors cursor-pointer"
                title="Manage Blueprint Picture & AI Layout (FR-005)"
              >
                <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
                <span className="hidden sm:inline">Blueprint</span>
                <ChevronDown className="w-3 h-3 text-[#64748B]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer flex items-center gap-2 text-xs py-2"
              >
                <Upload className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Upload Picture & AI Layout</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLoadSamplePlan}
                className="cursor-pointer flex items-center gap-2 text-xs py-2"
              >
                <FileImage className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Use Sample Cadastral Plan</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleAiAutoLayout()}
                disabled={isAutoLayoutRunning}
                className="cursor-pointer flex items-center gap-2 text-xs py-2 text-teal-800 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Analyze Picture with AI</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowReplaceModal(true)}
                className="cursor-pointer flex items-center gap-2 text-xs py-2"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Adjust Alignment & Opacity</span>
              </DropdownMenuItem>
              {plan?.image_url && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleClearBlueprint}
                    className="cursor-pointer flex items-center gap-2 text-xs py-2 text-rose-600 focus:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Clear Blueprint (Blank Canvas)</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AI Detect Button */}
          <button
            type="button"
            onClick={handleAiHeaderDetectClick}
            disabled={isAutoLayoutRunning || isUploadingPhoto}
            className="px-2.5 py-1.5 bg-teal-50/80 hover:bg-teal-100/80 text-[#0F766E] border border-teal-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="AI Automatic Boundary Detection (FR-SM-049)"
          >
            <Sparkles className={`w-3.5 h-3.5 text-[#0F766E] ${isAutoLayoutRunning ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isAutoLayoutRunning ? 'Analyzing...' : 'AI Detect'}</span>
          </button>

          {/* Validate Button */}
          <button
            type="button"
            onClick={handleRunValidation}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#1E293B] text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-[#E2E8F0] shadow-2xs transition-colors cursor-pointer"
            title="Validate Boundary Topology & Overlaps"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
            <span className="hidden lg:inline">Validate</span>
          </button>

          {/* History Version Drawer */}
          <button
            type="button"
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className="px-2 py-1.5 bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#1E293B] text-xs font-semibold rounded-lg flex items-center gap-1 border border-[#E2E8F0] shadow-2xs transition-colors cursor-pointer"
            title="Version History Snapshots"
          >
            <History className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="hidden xl:inline">History</span>
            <span className="font-mono text-[11px] text-[#0F766E]">v{versions.length > 0 ? versions[0].version_number : 1}</span>
            <ChevronDown className="w-3 h-3 text-[#64748B]" />
          </button>

          {/* Inspector Toggle */}
          <button
            type="button"
            onClick={() => setShowInspector(!showInspector)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
              showInspector
                ? 'bg-teal-50 text-[#0F766E] border-teal-200'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:text-[#1E293B]'
            }`}
            title="Toggle Lot Inspector & Roster Dock"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Inspector</span>
          </button>

          {/* Preview Button */}
          <button
            type="button"
            onClick={() => setShowVisitorPreview(true)}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#1E293B] text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-[#E2E8F0] shadow-2xs transition-colors cursor-pointer"
            title="Preview as Client/Visitor"
          >
            <Eye className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Publish Map Primary CTA */}
          <button
            type="button"
            onClick={() => setShowPublishModal(true)}
            className="px-3.5 py-1.5 bg-[#0F766E] hover:bg-[#115E59] active:bg-[#134E4A] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Map</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      {editorMode === 'ledger' ? (
        /* Parcels Ledger Table View */
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">Subdivision Parcels Ledger</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete inventory of all mapped lots and non-saleable community assets.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold">
                  {lots.length} Total Parcels
                </span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                  {lots.filter((l) => l.availability_status === 'Available').length} Available
                </span>
                <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold">
                  {lots.filter((l) => l.availability_status === 'Reserved').length} Reserved
                </span>
                <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-bold">
                  {lots.filter((l) => l.availability_status === 'Sold').length} Sold
                </span>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate(`/broker/subdivisions/${projectId}/inventory`)}
                  className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs h-7.5 px-3 ml-2 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Open Full Inventory Console</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Lot ID</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Land Area</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Vertices</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lots.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No parcels mapped yet. Switch to Vector Drafting to draw lots.
                      </td>
                    </tr>
                  ) : (
                    lots.map((lot) => (
                      <tr key={lot.id} className="hover:bg-teal-50/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          Block {lot.block_number}, Lot {lot.lot_number}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {lot.boundary_type || 'SaleableLot'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              lot.availability_status === 'Available'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : lot.availability_status === 'Reserved'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : lot.availability_status === 'Sold'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {lot.availability_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-mono">
                          {lot.verified_area_sqm ? `${lot.verified_area_sqm} m²` : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-mono font-medium">
                          {lot.price ? `₱${Number(lot.price).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {lot.coordinates?.length || 0} pts
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLotId(lot.id);
                              setEditorMode('drafting');
                              setShowInspector(true);
                            }}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Drafting View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLot(lot.id)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Vector Drafting Canvas Mode */
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Vertical CAD Toolstrip */}
          <div className="absolute top-4 left-4 z-20 pointer-events-auto">
            <SubdivisionLeftToolstrip
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
          </div>

          {/* Center SVG Vector Canvas Engine */}
          <main className="flex-1 h-full w-full relative">
            {/* AI Auto-Layout Floating Batch Review Bar (FR-SM-049) */}
            {showAutoLayoutBanner && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur-md border border-teal-500/50 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span className="text-white font-medium">
                    AI Auto-Layout: <strong className="text-teal-400">{lots.length} candidate lots</strong> detected.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const verifiedLots = lots.map((l) => ({ ...l, is_verified: true }));
                      setLots(verifiedLots);
                      pushHistory(verifiedLots);
                      setShowAutoLayoutBanner(false);
                      toast.success('Accepted all AI-generated lots! You can now edit any parcel.');
                    }}
                    className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#0D655E] text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept All Lots</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLots([]);
                      pushHistory([]);
                      setShowAutoLayoutBanner(false);
                      toast.info('Discarded AI candidate lots.');
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg cursor-pointer transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            <SubdivisionVectorCanvas
              planImageUrl={plan?.image_url}
              planWidth={plan?.image_width || 1600}
              planHeight={plan?.image_height || 1000}
              planOpacity={planOpacity}
              showPlanImage={showPlanImage}
              showBoundaries={showBoundaries}
              showLabels={showLabels}
              showGrid={showGrid}
              lots={lots}
              selectedLotId={selectedLotId}
              selectedLotIds={selectedLotIds}
              activeTool={activeTool}
              zoom={zoom}
              pan={pan}
              onZoomChange={setZoom}
              onPanChange={setPan}
              onSelectLot={handleSelectLot}
              onLotCreated={handleLotCreated}
              onLotUpdated={handleLotUpdated}
              onLotSplit={handleLotSplit}
              onAiDetectClick={handleAiDetectClick}
              onAiDetectBox={handleAiDetectBox}
              onAiOcrBox={handleAiOcrBox}
              projectName={project?.name}
              developerName={project?.developer_name}
              backgroundMode={backgroundMode}
              gpsCoordinates={
                project?.latitude && project?.longitude
                  ? { lat: Number(project.latitude), lng: Number(project.longitude) }
                  : null
              }
            />

            {/* Floating Bottom Center Viewport Dock */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
              <SubdivisionBottomViewportDock
                zoom={zoom}
                onZoomIn={() => setZoom((z) => Math.min(Number((z + 0.15).toFixed(2)), 5.0))}
                onZoomOut={() => setZoom((z) => Math.max(Number((z - 0.15).toFixed(2)), 0.1))}
                onFitToScreen={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                planOpacity={planOpacity}
                onChangeOpacity={setPlanOpacity}
                showPlanImage={showPlanImage}
                onTogglePlanImage={() => setShowPlanImage(!showPlanImage)}
                showBoundaries={showBoundaries}
                onToggleBoundaries={() => setShowBoundaries(!showBoundaries)}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid(!showGrid)}
                backgroundMode={backgroundMode}
                onToggleBackgroundMode={setBackgroundMode}
              />
            </div>

            {/* Floating Bottom Center Batch Actions Dock */}
            {selectedLotIds.length > 1 && (
              <div
                data-testid="subdivision-batch-actions-dock"
                className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 text-white border border-slate-700/80 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3 backdrop-blur-md"
              >
                <span className="text-xs font-bold text-teal-400">
                  {selectedLotIds.length} Lots Selected
                </span>
                <div className="h-4 w-px bg-slate-700" />
                <span className="text-[11px] text-slate-300">Set Status:</span>
                <button
                  type="button"
                  onClick={() => handleBatchUpdateStatus('Available')}
                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchUpdateStatus('Reserved')}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Reserved
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchUpdateStatus('Sold')}
                  className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Sold
                </button>
                <div className="h-4 w-px bg-slate-700" />
                <button
                  type="button"
                  onClick={handleBatchDelete}
                  className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected</span>
                </button>
              </div>
            )}

            {/* Floating Bottom Left AI Dock (FR-013, FR-014, FR-019) */}
            <div className="absolute bottom-4 left-20 z-10">
              <SubdivisionAiDock
                isLoading={aiLoading}
                candidate={aiCandidate}
                ocrResult={aiOcrResult}
                onAcceptCandidate={handleAcceptAiCandidate}
                onRejectCandidate={() => {
                  setAiCandidate(null);
                  setAiOcrResult(null);
                }}
                onTweakCandidate={() => {
                  if (aiCandidate) {
                    handleAcceptAiCandidate();
                    setActiveTool('select');
                  }
                }}
                onApplyOcr={(ocr) => {
                  if (selectedLot) {
                    handleLotUpdated({
                      ...selectedLot,
                      block_number: ocr.blockNumber || selectedLot.block_number,
                      lot_number: ocr.lotNumber || selectedLot.lot_number,
                    });
                    setAiOcrResult(null);
                  }
                }}
                onClose={() => {
                  setAiCandidate(null);
                  setAiOcrResult(null);
                }}
              />
            </div>
          </main>

          {/* Right Side Multi-Tab Studio Dock */}
          {showInspector && (
            <SubdivisionRightDock
              selectedLot={selectedLot}
              lots={lots}
              selectedLotId={selectedLotId}
              onSelectLot={handleSelectLot}
              onUpdateLot={handleLotUpdated}
              onDuplicateLot={handleDuplicateLot}
              onDeleteLot={handleDeleteLot}
              onRecalculateArea={handleRecalculateArea}
              onClose={() => setSelectedLotId(null)}
              plan={plan}
              onOpenReplaceModal={() => setShowReplaceModal(true)}
              onClearBlueprint={handleClearBlueprint}
              onTriggerAiAutoLayout={() => handleAiAutoLayout()}
              isAutoLayoutRunning={isAutoLayoutRunning}
            />
          )}
        </div>
      )}

      {/* Pre-Flight Validation Modal (FR-031, FR-032, FR-033) - shadcn Dialog */}
      <Dialog open={Boolean(showValidationModal && validationResult)} onOpenChange={setShowValidationModal}>
        <DialogContent className="max-w-lg bg-white p-6 rounded-2xl text-[#1E293B] shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  validationResult?.isValid ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {validationResult?.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-[#0F766E]" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                )}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#1E293B]">
                  Pre-Flight Map Validation
                </DialogTitle>
                <DialogDescription className="text-xs text-[#64748B]">
                  {validationResult?.isValid
                    ? 'All structural, topological, and assignment tests passed.'
                    : 'Errors detected. Resolve before publishing.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Issues List */}
          <div className="max-h-60 overflow-y-auto space-y-2 text-xs py-2">
            {validationResult?.errors?.map((err, idx) => (
              <div
                key={`err-${idx}`}
                onClick={() => {
                  if (err.lotId) setSelectedLotId(err.lotId);
                  setShowValidationModal(false);
                }}
                className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 cursor-pointer hover:bg-rose-100 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <span className="font-bold block">{err.code}</span>
                  <span>{err.message}</span>
                </div>
                <span className="text-[10px] text-rose-600 underline font-semibold">Jump</span>
              </div>
            ))}

            {validationResult?.warnings?.map((warn, idx) => (
              <div
                key={`warn-${idx}`}
                onClick={() => {
                  if (warn.lotId) setSelectedLotId(warn.lotId);
                  setShowValidationModal(false);
                }}
                className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2 cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div className="flex-1">
                  <span className="font-bold block">{warn.code}</span>
                  <span>{warn.message}</span>
                </div>
                <span className="text-[10px] text-amber-600 underline font-semibold">Jump</span>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowValidationModal(false)}
              className="cursor-pointer"
            >
              Close
            </Button>
            {validationResult?.isValid && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  setShowValidationModal(false);
                  setShowPublishModal(true);
                }}
                className="bg-[#0F766E] hover:bg-[#0D655E] text-white cursor-pointer"
              >
                Proceed to Publish
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Version Modal (FR-036) - shadcn Dialog */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent className="max-w-md bg-white p-6 text-[#1E293B] shadow-2xl space-y-3 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1E293B]">Publish Map Version</DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Publishing creates an immutable snapshot of all {lots.length} lot boundaries. Public
              visitors will immediately see this approved map version.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="text-xs font-semibold text-[#1E293B] block mb-1">
              Release / Revision Notes
            </label>
            <textarea
              rows={3}
              value={publishNotes}
              onChange={(e) => setPublishNotes(e.target.value)}
              placeholder="e.g. Phase 1 residential lot allocation with verified survey areas."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#1E293B] outline-none focus:border-[#0F766E] resize-none"
            />
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPublishModal(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handlePublishVersion}
              className="bg-[#0F766E] hover:bg-[#0D655E] text-white cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 mr-1" />
              <span>Confirm & Publish</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Historical Versions Drawer (FR-036, FR-037) */}
      {showHistoryDrawer && (
        <div className="fixed inset-y-0 right-0 z-40 w-80 bg-slate-950 border-l border-slate-800 p-4 shadow-2xl flex flex-col space-y-4 animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <History className="w-4 h-4 text-teal-400" />
              <span>Version History</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowHistoryDrawer(false)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 text-xs">
            {versions.map((ver) => (
              <div
                key={ver.id}
                className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Version #{ver.version_number}</span>
                  <span className="text-[10px] font-mono text-teal-400">
                    {ver.snapshot_data?.lots?.length || 0} Lots
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{ver.notes || 'Published release'}</p>
                <div className="text-[10px] text-slate-500 font-mono">
                  {new Date(ver.published_at).toLocaleString()}
                </div>

                <button
                  type="button"
                  onClick={() => handleRestoreVersion(ver.version_number)}
                  className="w-full mt-2 py-1 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 font-semibold rounded text-[11px] cursor-pointer transition-colors"
                >
                  Rollback to this Version
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visitor Preview Fullscreen Modal (FR-034) */}
      {showVisitorPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-bold text-white">Visitor Interactive Preview Mode</span>
            </div>
            <button
              type="button"
              onClick={() => setShowVisitorPreview(false)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Exit Preview</span>
            </button>
          </div>
          <div className="flex-1 relative">
            <SubdivisionVectorCanvas
              planImageUrl={plan?.image_url}
              planWidth={plan?.image_width || 1600}
              planHeight={plan?.image_height || 1000}
              lots={lots}
              selectedLotId={selectedLotId}
              activeTool="select"
              onSelectLot={setSelectedLotId}
            />
          </div>
        </div>
      )}

      {/* Plan Graphic Replacement Alignment Preview Modal (FR-005) */}
      <SubdivisionPlanReplacementModal
        isOpen={showReplaceModal}
        onClose={() => setShowReplaceModal(false)}
        onConfirmReplacement={handleConfirmPlanReplacement}
        onClearBlueprint={handleClearBlueprint}
        currentImageUrl={plan?.image_url}
        existingLotsCount={lots.length}
      />

      {/* AI Picture Selection / Upload Modal */}
      <Dialog open={showAiPicturePromptModal} onOpenChange={setShowAiPicturePromptModal}>
        <DialogContent className="sm:max-w-md bg-white text-[#1E293B]">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-[#1E293B]">
              AI Subdivision Vector Layout Generator
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              AI analyzes picture parcels and generates precision closed polygon vectors automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <button
              type="button"
              onClick={() => {
                setShowAiPicturePromptModal(false);
                fileInputRef.current?.click();
              }}
              className="w-full p-3 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-50 flex items-center gap-3 text-left transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-[#0F766E] block">Upload Subdivision Picture</span>
                <span className="text-[11px] text-[#64748B] block mt-0.5">Select a cadastral blueprint or subdivision photo (JPG, PNG, WebP)</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAiPicturePromptModal(false);
                handleLoadSamplePlan();
              }}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center gap-3 text-left transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
                <FileImage className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-[#1E293B] block">Use Master Cadastral Plan Sample</span>
                <span className="text-[11px] text-[#64748B] block mt-0.5">Instant 1-click test with real architectural blocks, roads, and park</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAiPicturePromptModal(false);
                handleAiAutoLayout();
              }}
              className="w-full p-2.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 text-center text-xs text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              Continue on blank drafting board without background picture
            </button>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAiPicturePromptModal(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
