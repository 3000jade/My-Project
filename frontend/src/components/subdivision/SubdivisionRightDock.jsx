import React, { useState } from 'react';
import {
  Sliders,
  ListFilter,
  FileImage,
  Search,
  Sparkles,
  Layers,
  Trash2,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  Building,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import SubdivisionLotInspector from './SubdivisionLotInspector';

/**
 * SubdivisionRightDock
 * Multi-tab studio inspector dock featuring:
 * 1. Lot Specs: Detailed inspection & 90° squaring for selected lot
 * 2. Parcel Roster: Searchable ledger of all subdivision lots
 * 3. Blueprint & AI: Graphic alignment, replacement, and auto-layout settings
 */
export default function SubdivisionRightDock({
  selectedLot = null,
  lots = [],
  selectedLotId = null,
  onSelectLot,
  onUpdateLot,
  onDuplicateLot,
  onDeleteLot,
  onRecalculateArea,
  onClose,
  plan,
  onOpenReplaceModal,
  onClearBlueprint,
  onTriggerAiAutoLayout,
  isAutoLayoutRunning = false,
  className = '',
}) {
  const [activeTab, setActiveTab] = useState(selectedLot ? 'specs' : 'roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Switch to 'specs' automatically when a lot is selected
  React.useEffect(() => {
    if (selectedLot) {
      setActiveTab('specs');
    }
  }, [selectedLot?.id]);

  // Filtered parcels for Roster Tab
  const filteredLots = lots.filter((lot) => {
    const matchesSearch =
      !searchQuery ||
      `B${lot.block_number} L${lot.lot_number}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lot.description && lot.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || lot.availability_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <aside
      data-testid="subdivision-right-dock"
      className={`w-84 h-full bg-white border-l border-slate-200 flex flex-col shadow-xl select-none z-20 ${className}`}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        {/* Dock Header Tabs */}
        <div className="p-2 border-b border-slate-200 bg-slate-50/80">
          <TabsList className="w-full grid grid-cols-3 h-9 bg-slate-200/70 p-0.5 rounded-lg">
            <TabsTrigger
              value="specs"
              className="text-[11px] font-bold flex items-center justify-center gap-1.5 py-1 px-2"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Specs</span>
            </TabsTrigger>
            <TabsTrigger
              value="roster"
              className="text-[11px] font-bold flex items-center justify-center gap-1.5 py-1 px-2"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Roster ({lots.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="blueprint"
              className="text-[11px] font-bold flex items-center justify-center gap-1.5 py-1 px-2"
            >
              <FileImage className="w-3.5 h-3.5" />
              <span>Blueprint</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Lot Specs Inspector */}
        <TabsContent value="specs" className="flex-1 overflow-y-auto m-0 p-0">
          <SubdivisionLotInspector
            lot={selectedLot}
            onUpdateLot={onUpdateLot}
            onDuplicateLot={onDuplicateLot}
            onDeleteLot={onDeleteLot}
            onRecalculateArea={onRecalculateArea}
            onClose={() => {
              if (onClose) onClose();
              setActiveTab('roster');
            }}
          />
        </TabsContent>

        {/* Tab 2: Searchable Parcel Roster */}
        <TabsContent value="roster" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
          {/* Search & Filter Bar */}
          <div className="p-3 border-b border-slate-100 bg-white space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Block or Lot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-teal-600 focus:bg-white transition-all"
              />
            </div>

            {/* Quick Status Pill Filters */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] font-semibold">
              {['ALL', 'Available', 'Reserved', 'Sold'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                    statusFilter === status
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Roster List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredLots.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No parcels match the search criteria.
              </div>
            ) : (
              filteredLots.map((lot) => {
                const isSelected = lot.id === selectedLotId;

                const statusStyles = {
                  Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  Reserved: 'bg-amber-50 text-amber-700 border-amber-200',
                  Sold: 'bg-rose-50 text-rose-700 border-rose-200',
                  Unavailable: 'bg-slate-100 text-slate-600 border-slate-200',
                };

                return (
                  <div
                    key={lot.id}
                    onClick={() => {
                      if (onSelectLot) onSelectLot(lot.id);
                      setActiveTab('specs');
                    }}
                    className={`p-3 flex items-center justify-between hover:bg-teal-50/50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-teal-50/90 border-l-4 border-l-[#0F766E]' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Block {lot.block_number}, Lot {lot.lot_number}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${
                            statusStyles[lot.availability_status] || statusStyles.Available
                          }`}
                        >
                          {lot.availability_status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {lot.verified_area_sqm ? `${lot.verified_area_sqm} m²` : 'Area not computed'}
                        {lot.price && (
                          <span className="ml-2 font-mono font-medium text-slate-700">
                            ₱{Number(lot.price).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Blueprint & AI Settings */}
        <TabsContent value="blueprint" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <FileImage className="w-4 h-4 text-teal-600" />
              <span>Current Blueprint Graphic</span>
            </div>

            {plan?.image_url ? (
              <div className="space-y-2">
                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="truncate max-w-[170px] font-mono">{plan.plan_title || 'Blueprint Plan'}</span>
                  <span className="text-[10px] text-teal-700 font-semibold uppercase">Active</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenReplaceModal}
                    className="flex-1 py-1.5 px-3 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Replace Graphic</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClearBlueprint}
                    title="Remove blueprint image and reset to blank white board"
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-500">No blueprint image active. Canvas is in blank white drafting mode.</p>
                <button
                  type="button"
                  onClick={onOpenReplaceModal}
                  className="w-full py-2 px-3 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Blueprint Graphic</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Auto-Layout Trigger Card */}
          <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>AI Whole-Plan Auto-Layout</span>
            </div>
            <p className="text-[11px] text-teal-800 leading-relaxed">
              Analyze the subdivision plan image with Vision AI to automatically generate candidate parcels based on property shape and lines.
            </p>
            <button
              type="button"
              disabled={isAutoLayoutRunning}
              onClick={onTriggerAiAutoLayout}
              className="w-full py-2 px-3 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>{isAutoLayoutRunning ? 'Analyzing Blueprint...' : 'Run AI Auto-Layout'}</span>
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
