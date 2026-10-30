import React, { useState } from 'react';
import {
  X,
  Upload,
  Check,
  AlertTriangle,
  Layers,
  Sliders,
  Move,
  ZoomIn,
  RefreshCw,
  Trash2,
  Sparkles,
} from 'lucide-react';

/**
 * SubdivisionPlanReplacementModal (FR-005)
 * Allows users to upload a replacement blueprint image and preview its
 * alignment against existing lot boundaries with an interactive opacity blend slider.
 */
export default function SubdivisionPlanReplacementModal({
  isOpen = false,
  onClose,
  onConfirmReplacement,
  onClearBlueprint,
  currentImageUrl = '',
  existingLotsCount = 0,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [blendOpacity, setBlendOpacity] = useState(50); // 0 = old plan, 100 = new plan
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [runAiDetection, setRunAiDetection] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type (JPG, PNG, WebP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid JPG, PNG, or WebP image.');
      return;
    }

    // Validate size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Image exceeds the 50MB maximum file size limit.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleConfirm = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    try {
      await onConfirmReplacement({
        file: selectedFile,
        previewUrl,
        offsetX,
        offsetY,
        scale,
        runAiDetection,
      });
      handleClose();
    } catch (err) {
      console.error('Failed to commit blueprint replacement:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBlendOpacity(50);
    setOffsetX(0);
    setOffsetY(0);
    setScale(1.0);
    onClose();
  };

  return (
    <div
      data-testid="subdivision-plan-replacement-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full flex flex-col max-h-[92vh] shadow-2xl text-white overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Replace Blueprint Plan Graphic (FR-005)
              </h2>
              <p className="text-xs text-slate-400">
                Preview boundary alignment before committing the new master plan graphic.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!previewUrl ? (
            /* Upload Drop Area */
            <label className="border-2 border-dashed border-slate-700 hover:border-teal-500/60 bg-slate-800/40 hover:bg-slate-800/80 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="plan-replacement-file-input"
              />
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">
                  Click to select or drag & drop replacement blueprint
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supported formats: PNG, JPG, WebP (up to 50MB)
                </p>
              </div>
            </label>
          ) : (
            /* Alignment Preview Surface & Controls */
            <div className="space-y-4">
              {/* Alignment Controls Bar */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
                {/* Opacity Blend Slider */}
                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                  <Sliders className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="text-slate-300 font-semibold whitespace-nowrap">
                    Blend: Old ({100 - blendOpacity}%) / New ({blendOpacity}%)
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={blendOpacity}
                    onChange={(e) => setBlendOpacity(Number(e.target.value))}
                    className="w-full accent-teal-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Reset Alignment */}
                <button
                  type="button"
                  onClick={() => {
                    setOffsetX(0);
                    setOffsetY(0);
                    setScale(1.0);
                    setBlendOpacity(50);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1 font-mono transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Alignment</span>
                </button>
              </div>

              {/* Visual Split Canvas Overlay */}
              <div className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center select-none">
                {/* Old Base Image */}
                {currentImageUrl && (
                  <img
                    src={currentImageUrl}
                    alt="Current Plan"
                    style={{ opacity: (100 - blendOpacity) / 100 }}
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity"
                  />
                )}

                {/* New Candidate Replacement Image */}
                <img
                  src={previewUrl}
                  alt="New Replacement Plan"
                  style={{
                    opacity: blendOpacity / 100,
                    transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                  }}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-all duration-75"
                />

                {/* Simulated Existing Vector Boundaries Overlay */}
                <div className="absolute inset-0 border border-teal-500/40 pointer-events-none flex items-center justify-center">
                  <div className="px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-lg border border-teal-500/30 text-[11px] text-teal-300 font-semibold shadow-lg">
                    {existingLotsCount} existing lot boundaries preserved
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Selected file: <strong className="text-white">{selectedFile.name}</strong></span>
                <label className="text-teal-400 hover:text-teal-300 cursor-pointer underline">
                  Choose another file
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* AI Auto-Layout on Picture Upload */}
              <label className="flex items-start gap-3 p-3 bg-teal-950/40 border border-teal-500/30 rounded-xl cursor-pointer hover:bg-teal-950/60 transition-colors">
                <input
                  type="checkbox"
                  checked={runAiDetection}
                  onChange={(e) => setRunAiDetection(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-800 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <span className="font-semibold text-teal-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    Analyze picture with AI & generate vector layout automatically
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    AI will analyze parcel boundaries in this picture and immediately generate interactive closed polygon vectors.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Safety Notice */}
          <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-start gap-2.5 text-xs text-teal-200">
            <AlertTriangle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <p>
              <strong>FR-005 Boundary Alignment Guarantee:</strong> Replacing the background image will not delete your existing {existingLotsCount} vector lots. Use the blend slider to confirm lot boundaries align with the new graphic.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {onClearBlueprint && currentImageUrl && (
              <button
                type="button"
                onClick={() => {
                  onClearBlueprint();
                  handleClose();
                }}
                className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Blueprint Image (Pure White Board)</span>
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={!selectedFile || isSubmitting}
            onClick={handleConfirm}
            className="px-5 py-2 bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <span>Updating Plan...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm & Replace Plan Graphic</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
