import React from 'react';
import { Sparkles, Check, X, Edit3, RefreshCw, AlertCircle, ScanText, Cpu } from 'lucide-react';

export default function SubdivisionAiDock({
  isLoading = false,
  candidate = null,
  ocrResult = null,
  onAcceptCandidate,
  onRejectCandidate,
  onTweakCandidate,
  onApplyOcr,
  onClose,
  className = '',
}) {
  if (!isLoading && !candidate && !ocrResult) {
    return null;
  }

  return (
    <div
      data-testid="subdivision-ai-dock"
      className={`bg-white/95 backdrop-blur-md border border-teal-200 rounded-xl shadow-xl p-4 max-w-sm w-full space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-200 ${className}`}
    >
      {/* Header telemetry strip */}
      <div className="flex items-center justify-between border-b border-teal-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-teal-50 border border-teal-200 text-[#0F766E]">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
              <span>Groq Vision AI Detection</span>
              <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 bg-teal-50 text-[#0F766E] border border-teal-200 rounded">
                Llama 3.2 Vision
              </span>
            </h5>
            <p className="text-[10px] text-[#64748B]">
              {isLoading ? 'Scanning cadastral blueprint...' : 'AI Proposal Ready for Review'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Loading Spinner State (FR-018) */}
      {isLoading && (
        <div className="py-4 flex flex-col items-center justify-center space-y-2 text-center">
          <RefreshCw className="w-6 h-6 text-[#0F766E] animate-spin" />
          <p className="text-xs text-[#1E293B] font-medium">Extracting parcel boundary and OCR labels...</p>
          <p className="text-[11px] text-[#64748B]">Tracing closed polygon coordinates from blueprint</p>
        </div>
      )}

      {/* Candidate Boundary Review Card (FR-013, FR-014) */}
      {!isLoading && candidate && (
        <div className="space-y-2.5">
          <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-teal-900">Suggested Boundary</span>
              <span className="text-[10px] font-mono font-semibold text-teal-700 bg-white px-1.5 py-0.5 rounded border border-teal-200">
                {Math.round(candidate.confidence * 100)}% Confidence
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#64748B]">
              <div>
                <span className="text-slate-500">Vertices: </span>
                <span className="font-mono font-semibold text-[#1E293B]">
                  {candidate.coordinates ? candidate.coordinates.length : 0} pts
                </span>
              </div>
              <div>
                <span className="text-slate-500">Est. Area: </span>
                <span className="font-mono font-semibold text-[#1E293B]">
                  {candidate.estimatedAreaSqm || 250} m²
                </span>
              </div>
            </div>

            {/* Safety Alert (FR-016) */}
            <div className="flex items-start gap-1.5 pt-1 text-[10px] text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
              <span>Boundary is marked unverified until you accept and confirm vertex alignment.</span>
            </div>
          </div>

          {/* Action Buttons (FR-014) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onAcceptCandidate}
              className="flex-1 py-1.5 px-2 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept Boundary</span>
            </button>

            {onTweakCandidate && (
              <button
                type="button"
                onClick={onTweakCandidate}
                title="Tweak polygon vertices"
                className="py-1.5 px-2.5 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#1E293B] text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Tweak</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRejectCandidate}
              title="Reject suggestion"
              className="py-1.5 px-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* OCR Recognition Tray (FR-019, FR-020) */}
      {!isLoading && ocrResult && (ocrResult.blockNumber || ocrResult.lotNumber) && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <ScanText className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Recognized Identifiers</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {Math.round((ocrResult.confidence || 0.8) * 100)}% Match
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Block</span>
              <span className="font-bold text-[#1E293B]">{ocrResult.blockNumber || '—'}</span>
            </div>
            <div className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Lot</span>
              <span className="font-bold text-[#1E293B]">{ocrResult.lotNumber || '—'}</span>
            </div>
          </div>

          {onApplyOcr && (
            <button
              type="button"
              onClick={() => onApplyOcr(ocrResult)}
              className="w-full py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded transition-colors cursor-pointer"
            >
              Apply to Selected Lot Record
            </button>
          )}
        </div>
      )}
    </div>
  );
}
