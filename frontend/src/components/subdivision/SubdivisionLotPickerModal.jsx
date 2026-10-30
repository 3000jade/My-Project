import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Check,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  Building2,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import SubdivisionVectorCanvas from './SubdivisionVectorCanvas';
import subdivisionService from '../../services/subdivisionService';

export default function SubdivisionLotPickerModal({
  isOpen = false,
  onClose,
  onSelectLot,
  selectedLotId = null,
  initialProjectId = null,
}) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [project, setProject] = useState(null);
  const [plan, setPlan] = useState(null);
  const [lots, setLots] = useState([]);
  const [activeLotId, setActiveLotId] = useState(selectedLotId);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Load subdivisions projects list
  useEffect(() => {
    if (!isOpen) return;

    async function fetchProjects() {
      try {
        const res = await subdivisionService.getSubdivisions();
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          setProjects(list);
          if (!selectedProjectId) {
            setSelectedProjectId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load subdivisions', err);
      }
    }

    fetchProjects();
  }, [isOpen, selectedProjectId]);

  // Load project details, plan, and lots when project changes
  useEffect(() => {
    if (!selectedProjectId) return;

    async function loadProjectDetails() {
      setIsLoading(true);
      try {
        const res = await subdivisionService.getSubdivisionById(selectedProjectId);
        const projectData = res?.data || res;
        if (projectData) {
          setProject(projectData);
          setPlan(projectData.activePlan || null);
        }

        const lotsRes = await subdivisionService.getLots(selectedProjectId);
        const lotsData = lotsRes?.data || (Array.isArray(lotsRes) ? lotsRes : []);
        if (Array.isArray(lotsData)) {
          setLots(lotsData);
        }
      } catch (err) {
        console.error('Failed to load project details', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProjectDetails();
  }, [selectedProjectId]);

  if (!isOpen) return null;

  const activeLot = lots.find((l) => l.id === activeLotId);

  const filteredLots = lots.filter((l) => {
    const matchesSearch =
      l.block_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.lot_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || l.availability_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleConfirm = () => {
    if (!activeLot || !onSelectLot) return;
    onSelectLot({
      project,
      lot: activeLot,
    });
    if (onClose) onClose();
  };

  return (
    <div
      data-testid="subdivision-lot-picker-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#CBD5E1] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="h-16 px-6 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                <span>Select from Subdivision Master Plan</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 text-[#0F766E] font-semibold">
                  Interactive Cadastral Canvas
                </span>
              </h2>
              <p className="text-xs text-[#64748B]">
                Click on any parcel boundary polygon to auto-populate property block, lot, and verified area.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Project Selector Dropdown */}
            {projects.length > 1 && (
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-9 px-3 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#1E293B] outline-none focus:border-[#0F766E]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Workspace Body (Split Canvas + Side List) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left / Center Canvas Area */}
          <div className="flex-1 h-full bg-slate-900 relative">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                Loading master plan blueprint...
              </div>
            ) : (
              <SubdivisionVectorCanvas
                planImageUrl={plan?.image_url}
                planWidth={plan?.image_width || 1600}
                planHeight={plan?.image_height || 1000}
                lots={lots}
                selectedLotId={activeLotId}
                activeTool="select"
                onSelectLot={setActiveLotId}
                className="w-full h-full"
              />
            )}

            {/* Floating Blueprint Badge */}
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-white pointer-events-none">
              <span className="text-teal-400 font-bold">{project?.name}</span>
              <span className="text-slate-400 ml-2">({lots.length} Mapped Lots)</span>
            </div>
          </div>

          {/* Right Side Filterable Lot Roster */}
          <aside className="w-80 h-full border-l border-[#E2E8F0] bg-white flex flex-col shrink-0">
            {/* Search and Filters */}
            <div className="p-3 border-b border-[#E2E8F0] space-y-2 bg-slate-50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Block or Lot..."
                  className="w-full h-8 pl-8 pr-2.5 bg-white border border-[#CBD5E1] rounded-md text-xs text-[#1E293B] outline-none focus:border-[#0F766E]"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
                {['ALL', 'Available', 'Reserved', 'Sold'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                      statusFilter === status
                        ? 'bg-[#0F766E] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Lots List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredLots.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No lots match your filter criteria.
                </div>
              ) : (
                filteredLots.map((lot) => {
                  const isSelected = lot.id === activeLotId;
                  return (
                    <div
                      key={lot.id}
                      onClick={() => setActiveLotId(lot.id)}
                      className={`p-3 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-teal-50/80 border-l-4 border-[#0F766E]'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#1E293B]">
                            Block {lot.block_number}, Lot {lot.lot_number}
                          </span>
                          {lot.boundary_type !== 'SaleableLot' && (
                            <span className="text-[9px] px-1 bg-slate-100 text-slate-600 rounded">
                              {lot.boundary_type}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">
                          <span>{lot.verified_area_sqm} m²</span>
                          {lot.price && (
                            <span className="ml-2 font-mono text-teal-700 font-semibold">
                              ₱{Number(lot.price).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            lot.availability_status === 'Available'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : lot.availability_status === 'Reserved'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {lot.availability_status}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#0F766E]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>

        {/* Modal Footer (Selected Lot Confirmation Bar) */}
        <div className="h-16 px-6 border-t border-[#E2E8F0] bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            {activeLot ? (
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E] animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-[#1E293B] block">
                    Selected: Block {activeLot.block_number}, Lot {activeLot.lot_number}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    {project?.name} • {activeLot.verified_area_sqm} m² • Status:{' '}
                    <strong className="text-teal-700">{activeLot.availability_status}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">
                Select a lot on the canvas or from the right list to anchor this listing.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#CBD5E1] hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!activeLot}
              onClick={handleConfirm}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Populate Listing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
