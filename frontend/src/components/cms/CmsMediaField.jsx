import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import cmsService from '@/services/cmsService';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export default function CmsMediaField({
  id = 'cms-media-url',
  label = 'Image',
  value = '',
  onChange,
  hint,
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const hasValue = Boolean(String(value || '').trim());

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setError('Please choose a JPG, PNG, WebP, or GIF image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('Image is too large. Maximum file size is 10 MB.');
      return;
    }

    setError('');
    setIsUploading(true);
    try {
      const uploaded = await cmsService.uploadMedia(file);
      if (uploaded?.url) {
        onChange?.(uploaded.url);
      } else {
        setError('Image uploaded, but no URL was returned.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (event) => {
    if (error) setError('');
    onChange?.(event.target.value);
  };

  const handleRemove = () => {
    setError('');
    onChange?.('');
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          id={id}
          type="text"
          value={value || ''}
          onChange={handleUrlChange}
          placeholder="https://... or /api/drive/media/..."
          disabled={isUploading}
          className="flex-1"
        />

        <input
          ref={fileInputRef}
          type="file"
          aria-label="Upload image file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="sr-only"
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-10 shrink-0"
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
          ) : (
            <Upload className="size-4" data-icon="inline-start" />
          )}
          <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
        </Button>
      </div>

      {hint && <p className="text-xs text-[#64748B]">{hint}</p>}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hasValue ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={value}
              alt={`${label} preview`}
              className="size-16 rounded-lg border border-[#E2E8F0] bg-white object-cover shrink-0"
            />
            <p className="text-xs text-[#64748B] truncate">{value}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
          >
            <X className="size-4" data-icon="inline-start" />
            <span>Remove</span>
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-xs text-[#64748B]">
          <ImageIcon className="size-4 shrink-0 text-[#64748B]" />
          <span>No image selected. Paste an image URL or upload a JPG, PNG, WebP, or GIF (max 10 MB).</span>
        </div>
      )}
    </div>
  );
}
