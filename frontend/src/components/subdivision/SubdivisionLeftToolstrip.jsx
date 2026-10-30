import React from 'react';
import {
  MousePointer,
  Hand,
  Pentagon,
  Square,
  Scissors,
  Sparkles,
  ScanText,
  Undo2,
  Redo2,
} from 'lucide-react';

/**
 * SubdivisionLeftToolstrip
 * Clean, Figma / AutoCAD-inspired vertical CAD tool dock pinned to the left canvas edge.
 */
export default function SubdivisionLeftToolstrip({
  activeTool = 'select',
  onSelectTool,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  className = '',
}) {
  const tools = [
    { id: 'select', label: 'Select (V)', icon: MousePointer },
    { id: 'pan', label: 'Pan Hand (H / Space)', icon: Hand },
    { type: 'divider' },
    { id: 'polygon', label: 'Draw Polygon (P)', icon: Pentagon },
    { id: 'rectangle', label: 'Draw Rectangle (R)', icon: Square },
    { id: 'slice', label: 'Slice Boundary (K)', icon: Scissors },
    { type: 'divider' },
    { id: 'ai_boundary', label: 'AI Magic Wand (W)', icon: Sparkles, accent: true },
    { id: 'ai_ocr', label: 'AI OCR Text Box (O)', icon: ScanText, accent: true },
  ];

  return (
    <aside
      data-testid="subdivision-left-toolstrip"
      className={`flex flex-col items-center gap-1.5 p-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-lg select-none z-20 ${className}`}
    >
      {tools.map((item, idx) => {
        if (item.type === 'divider') {
          return <span key={`div-${idx}`} className="w-6 h-px bg-slate-200 my-1" />;
        }

        const Icon = item.icon;
        const isActive = activeTool === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTool(item.id)}
            title={item.label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
              isActive
                ? 'bg-[#0F766E] text-white shadow-md shadow-teal-900/15'
                : item.accent
                ? 'text-teal-700 hover:text-teal-900 hover:bg-teal-50/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Icon className="w-4 h-4 stroke-[2.2]" />

            {/* Custom Tooltip */}
            <span className="absolute left-full ml-2.5 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-30">
              {item.label}
            </span>
          </button>
        );
      })}

      <span className="w-6 h-px bg-slate-200 my-1" />

      {/* Undo */}
      <button
        type="button"
        disabled={!canUndo}
        onClick={onUndo}
        title="Undo (Ctrl+Z)"
        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer relative group"
      >
        <Undo2 className="w-4 h-4 stroke-[2.2]" />
        <span className="absolute left-full ml-2.5 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-30">
          Undo (Ctrl+Z)
        </span>
      </button>

      {/* Redo */}
      <button
        type="button"
        disabled={!canRedo}
        onClick={onRedo}
        title="Redo (Ctrl+Y)"
        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer relative group"
      >
        <Redo2 className="w-4 h-4 stroke-[2.2]" />
        <span className="absolute left-full ml-2.5 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-30">
          Redo (Ctrl+Y)
        </span>
      </button>
    </aside>
  );
}
