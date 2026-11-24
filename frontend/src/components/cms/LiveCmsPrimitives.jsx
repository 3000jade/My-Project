import React, { useRef, useState } from 'react';
import {
  Camera,
  Upload,
  Link2,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  X,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import cmsService from '@/services/cmsService';
import { useLiveEdit } from '@/components/cms/LiveCmsEditor';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function LiveEditableImage({
  src,
  alt = 'Image',
  onSave,
  className = 'w-full h-48 object-cover rounded-lg',
  emptyLabel = 'Add photo',
  contain = false,
}) {
  const { isEditing } = useLiveEdit();
  const fileInputRef = useRef(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(src || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError('Please choose a JPG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image is too large. Maximum size is 10 MB.');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const uploaded = await cmsService.uploadMedia(file);
      if (uploaded?.url) {
        await onSave(uploaded.url);
        setUrlInput(uploaded.url);
        setPanelOpen(false);
      } else {
        setError('Upload finished, but no image link was returned.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyUrl = async () => {
    setError('');
    try {
      await onSave(urlInput.trim() || null);
      setPanelOpen(false);
    } catch (err) {
      setError(err?.message || 'Failed to save image link.');
    }
  };

  const handleRemove = async () => {
    setError('');
    try {
      await onSave(null);
      setUrlInput('');
      setPanelOpen(false);
    } catch (err) {
      setError(err?.message || 'Failed to remove image.');
    }
  };

  return (
    <div className="relative w-full">
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${className} ${contain ? 'object-contain' : 'object-cover'}`}
        />
      ) : (
        <div
          className={`${className} flex flex-col items-center justify-center gap-2 bg-[#F1F5F9] border border-dashed border-[#CBD5E1] text-[#64748B]`}
        >
          <ImageIcon className="size-6" />
          <span className="text-xs font-medium">{emptyLabel}</span>
        </div>
      )}

      {isEditing && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`Change image for ${alt}`}
            onClick={() => {
              setUrlInput(src || '');
              setError('');
              setPanelOpen((prev) => !prev);
            }}
            className="absolute bottom-2 right-2 h-8 px-3 bg-white/95 hover:bg-white border border-[#E2E8F0] text-[#1E293B] shadow-sm gap-1.5"
          >
            <Camera className="size-3.5 text-[#0F766E]" />
            <span className="text-xs font-medium">{src ? 'Swap Photo' : 'Add Photo'}</span>
          </Button>

          {panelOpen && (
            <div className="mt-2 p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-md space-y-3 text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Update Image
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Close image editor"
                  onClick={() => setPanelOpen(false)}
                  className="size-7 text-[#64748B]"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  aria-label={`Upload image for ${alt}`}
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 px-3 gap-2 text-xs"
                >
                  {uploading ? (
                    <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
                  ) : (
                    <Upload className="size-3.5 text-[#0F766E]" />
                  )}
                  <span>{uploading ? 'Uploading...' : 'Upload from Computer'}</span>
                </Button>
                {src && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRemove}
                    className="h-9 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Remove</span>
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="size-3.5 text-[#64748B] absolute left-3 top-3" />
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Or paste image link (https://...)"
                    className="h-9 pl-8 text-xs"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleApplyUrl}
                  className="h-9 px-3 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs gap-1"
                >
                  <Check className="size-3.5" />
                  <span>Apply</span>
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function LiveCardControls({ item, onTogglePublish, onRequestDelete }) {
  const { isEditing } = useLiveEdit();
  if (!isEditing || !item) return null;

  const isLive = item.status === 'PUBLISHED';

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onTogglePublish(item)}
        aria-label={isLive ? `Hide ${item.title}` : `Publish ${item.title}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
          isLive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
        }`}
      >
        {isLive ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        <span>{isLive ? 'Live' : 'Hidden'}</span>
      </button>
      <button
        type="button"
        onClick={() => onRequestDelete(item)}
        aria-label={`Delete ${item.title}`}
        className="inline-flex items-center justify-center size-7 rounded-full border border-[#E2E8F0] bg-white text-[#64748B] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

export function LiveSectionAddButton({ label, onClick, disabled = false }) {
  const { isEditing } = useLiveEdit();
  if (!isEditing) return null;

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className="h-9 px-3 border-dashed border-[#0F766E] text-[#0F766E] hover:bg-[#CCFBF1]/40 text-xs font-semibold gap-1.5"
    >
      <Plus className="size-3.5" />
      <span>{label}</span>
    </Button>
  );
}
