import React, { useState, useMemo, useEffect } from 'react';
import {
  Image as ImageIcon,
  Trash2,
  Star,
  Plus,
  Loader2,
  AlertCircle,
  LayoutGrid,
  Film,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MediaStudioModal, {
  MAX_PHOTOS_PER_CATEGORY,
  MAX_PHOTO_SIZE_BYTES,
} from './MediaStudioModal';

// Gallery room categories (Facade and FloorPlan removed; FloorPlan has its own Step 4 section)
export const PHOTO_HOLDER_CATEGORIES = [
  { key: 'Living', label: 'Living' },
  { key: 'Kitchen', label: 'Kitchen' },
  { key: 'Bedrooms', label: 'Bedrooms' },
  { key: 'Bathrooms', label: 'Bathrooms' },
];

export const MAX_COVER_PHOTOS = 1;
export const MAX_FLOORPLANS = 3;

function getDefaultAreaKeysForProperty(propertyCategory, propertyType) {
  const isLand =
    propertyCategory === 'Land' ||
    (/vacant lot|lot|land/i.test(propertyType || '') &&
      !/house|condo|townhouse|villa/i.test(propertyType || ''));
  if (isLand) return ['Living'];
  if (propertyCategory === 'Commercial' || propertyCategory === 'Industrial') {
    return ['Living', 'Bathrooms'];
  }
  return ['Living', 'Kitchen', 'Bedrooms', 'Bathrooms'];
}

const Req = () => <span className="text-[#FF8559]" aria-hidden="true">*</span>;

/**
 * Step 4: Cover Photo, Gallery Launcher & Dedicated Floor Plan Section
 */
export default function ListingStepMedia({
  formData,
  setFormData,
  setIsDirty,
  mediaPhotos = [],
  categoryVideos = {},
  onUploadCategoryFiles,
  onUpdatePhotoItem,
  onRemovePhotoItem,
  onRetryPhotoItem,
  onUploadCategoryVideo,
  onUploadCategoryVideoThumbnail,
  onUpdateCategoryVideo,
  onRemoveCategoryVideo,
}) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialCat, setGalleryInitialCat] = useState('ALL');
  const [coverSizeError, setCoverSizeError] = useState('');
  const [floorPlanSizeError, setFloorPlanSizeError] = useState('');

  const defaultKeys = useMemo(
    () => getDefaultAreaKeysForProperty(formData.propertyCategory, formData.property_type),
    [formData.propertyCategory, formData.property_type]
  );

  const customCategories = Array.isArray(formData.customGalleryCategories)
    ? formData.customGalleryCategories
    : [];

  const unifiedCategories = useMemo(() => {
    const defaults = PHOTO_HOLDER_CATEGORIES.filter((c) => defaultKeys.includes(c.key)).map(
      (c) => ({ ...c, isCustom: false })
    );
    const extras = customCategories.map((c) => ({
      key: c.key || c,
      label: c.label || c,
      isCustom: true,
    }));
    return [...defaults, ...extras];
  }, [defaultKeys, customCategories]);

  useEffect(() => {
    if (!Array.isArray(formData.selectedGalleryAreas) || formData.selectedGalleryAreas.length === 0) {
      setFormData?.((prev) => ({ ...prev, selectedGalleryAreas: defaultKeys }));
    }
  }, [defaultKeys, formData.selectedGalleryAreas, setFormData]);

  const updateField = (patch) => {
    setIsDirty?.(true);
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const handleAddCustomCategory = (name) => {
    const nextCustom = [...customCategories, { key: name, label: name }];
    const nextAreas = Array.from(new Set([...(formData.selectedGalleryAreas || defaultKeys), name]));
    updateField({
      customGalleryCategories: nextCustom,
      selectedGalleryAreas: nextAreas,
    });
  };

  const handleRemoveCustomCategory = (catKey) => {
    updateField({
      customGalleryCategories: customCategories.filter((c) => (c.key || c) !== catKey),
    });
  };

  const handleCoverPick = (fileList) => {
    const file = Array.from(fileList || []).find((f) => f.type.startsWith('image/'));
    if (!file) return;
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setCoverSizeError(`"${file.name}" exceeds the 10 MB photo size limit.`);
      return;
    }
    setCoverSizeError('');
    onUploadCategoryFiles?.('Cover', [file], MAX_COVER_PHOTOS);
  };

  const handleFloorPlanPick = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    const oversized = files.find((f) => f.size > MAX_PHOTO_SIZE_BYTES);
    const valid = files.filter((f) => f.size <= MAX_PHOTO_SIZE_BYTES);
    if (oversized) {
      setFloorPlanSizeError(`"${oversized.name}" exceeds the 10 MB image size limit.`);
    } else {
      setFloorPlanSizeError('');
    }
    if (valid.length > 0) {
      onUploadCategoryFiles?.('FloorPlan', valid, MAX_FLOORPLANS);
    }
  };

  const openGalleryAt = (catKey = 'ALL') => {
    setGalleryInitialCat(catKey);
    setGalleryOpen(true);
  };

  const coverPhoto = mediaPhotos.find((p) => p.galleryCategory === 'Cover');
  const floorPlanPhotos = mediaPhotos.filter((p) => p.galleryCategory === 'FloorPlan');
  const galleryPhotos = mediaPhotos.filter(
    (p) => p.galleryCategory !== 'Cover' && p.galleryCategory !== 'FloorPlan'
  );
  const totalVideosCount = Object.keys(categoryVideos || {}).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Card 1: Cover Photo (No Description Field) */}
      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center">
                <Star className="size-4" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-[#1E293B]">
                  Cover Photo <Req />
                </CardTitle>
                <CardDescription className="text-sm text-[#64748B]">
                  The main photo buyers see first in search results.
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-[#F0FDFA] text-[#0F766E] border border-[#0F766E]/20">
              {coverPhoto ? '1' : '0'} / {MAX_COVER_PHOTOS}
            </Badge>
          </div>
        </CardHeader>
        <Separator className="bg-[#E2E8F0]" />

        <CardContent className="pt-5 flex flex-col gap-4">
          {coverSizeError && (
            <Alert className="bg-white border-[#FF8559]">
              <AlertCircle className="size-4 text-[#FF8559]" />
              <AlertDescription className="text-xs text-[#FF8559]">
                {coverSizeError}
              </AlertDescription>
            </Alert>
          )}

          {!coverPhoto ? (
            <label className="min-h-48 rounded-xl border-2 border-dashed border-[#CBD5E1] hover:border-[#0F766E] bg-[#F8FAFC] hover:bg-[#F0FDFA]/40 transition-colors flex flex-col items-center justify-center gap-2 p-6 text-center cursor-pointer group">
              <div className="size-12 rounded-full bg-white border border-[#E2E8F0] group-hover:border-[#0F766E]/30 flex items-center justify-center text-[#0F766E]">
                <Plus className="size-6" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-[#1E293B]">
                  Add Cover Photo
                </span>
                <span className="text-xs text-[#64748B]">
                  Max 10 MB • Clear exterior or living photo
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleCoverPick(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          ) : (
            <div className="relative h-56 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] overflow-hidden flex items-center justify-center">
              <img
                src={coverPhoto.imageUrl || coverPhoto.mediaUrl}
                alt="Cover photo"
                className="w-full h-full object-cover"
              />
              {coverPhoto.isUploading && (
                <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center gap-1.5 text-white text-xs font-medium">
                  <Loader2 className="size-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
              {coverPhoto.error && (
                <div className="absolute inset-0 bg-red-950/75 p-3 flex flex-col items-center justify-center gap-2 text-center text-white">
                  <AlertCircle className="size-5 text-[#FF8559]" />
                  <span className="text-xs line-clamp-2">{coverPhoto.error}</span>
                  {coverPhoto.file && (
                    <button
                      type="button"
                      onClick={() => onRetryPhotoItem?.(coverPhoto.id)}
                      className="px-2.5 py-1 rounded bg-white text-[#1E293B] text-xs font-semibold cursor-pointer"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemovePhotoItem?.(coverPhoto.id)}
                aria-label="Remove cover photo"
                className="absolute top-3 right-3 size-11 md:size-9 [@media(pointer:coarse)]:size-11 rounded-lg bg-white/95 hover:bg-white text-[#1E293B] shadow-xs flex items-center justify-center cursor-pointer"
              >
                <Trash2 className="size-4 text-[#FF8559]" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 2: Gallery Summary + Launcher */}
      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center">
                <ImageIcon className="size-4" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-[#1E293B]">
                  Gallery
                </CardTitle>
                <CardDescription className="text-sm text-[#64748B]">
                  Organize room photos, descriptions, and room videos.
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => openGalleryAt('ALL')}
              className="min-h-11 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold rounded-lg cursor-pointer"
            >
              <LayoutGrid data-icon="inline-start" />
              Open Gallery
            </Button>
          </div>
        </CardHeader>
        <Separator className="bg-[#E2E8F0]" />

        <CardContent className="pt-5 flex flex-col gap-4">
          {/* Quick Category Pills */}
          <div className="flex flex-wrap gap-2">
            {unifiedCategories.map((cat) => {
              const count = galleryPhotos.filter((p) => p.galleryCategory === cat.key).length;
              const hasVideo = Boolean(categoryVideos?.[cat.key]);
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => openGalleryAt(cat.key)}
                  className="min-h-11 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#0F766E] text-xs font-semibold text-[#1E293B] inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{cat.label}</span>
                  <span className="text-[#0F766E] tabular-nums">
                    {count}/{MAX_PHOTOS_PER_CATEGORY}
                  </span>
                  {hasVideo && <Film className="size-3.5 text-[#0F766E]" />}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => openGalleryAt('ALL')}
              className="min-h-11 px-3 py-1.5 rounded-lg border border-dashed border-[#CBD5E1] hover:border-[#0F766E] bg-white text-xs font-semibold text-[#0F766E] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          {galleryPhotos.length > 0 || totalVideosCount > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {galleryPhotos.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openGalleryAt(item.galleryCategory)}
                  className="relative h-24 rounded-lg overflow-hidden border border-[#E2E8F0] group cursor-pointer"
                >
                  <img
                    src={item.imageUrl || item.mediaUrl}
                    alt={item.galleryCategory}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <Badge className="absolute bottom-1.5 left-1.5 bg-white/95 text-[#1E293B] border border-[#E2E8F0] text-[10px] px-1.5 py-0">
                    {item.galleryCategory}
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openGalleryAt(unifiedCategories[0]?.key || 'ALL')}
              className="min-h-28 rounded-xl border-2 border-dashed border-[#CBD5E1] hover:border-[#0F766E] bg-[#F8FAFC] hover:bg-[#F0FDFA]/40 transition-colors flex flex-col items-center justify-center gap-1.5 p-5 text-center cursor-pointer"
            >
              <div className="size-10 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0F766E]">
                <Plus className="size-5" />
              </div>
              <span className="text-sm font-semibold text-[#1E293B]">
                Add Room Photos & Videos
              </span>
              <span className="text-xs text-[#64748B]">
                Up to 5 photos and 1 video per category
              </span>
            </button>
          )}
        </CardContent>
      </Card>

      {/* Card 3: Dedicated Floor Plan Section */}
      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center">
                <Layers className="size-4" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-[#1E293B]">
                  Floor Plan
                </CardTitle>
                <CardDescription className="text-sm text-[#64748B]">
                  Upload unit layouts or lot cut plans.
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-[#F0FDFA] text-[#0F766E] border border-[#0F766E]/20">
              {floorPlanPhotos.length} / {MAX_FLOORPLANS}
            </Badge>
          </div>
        </CardHeader>
        <Separator className="bg-[#E2E8F0]" />

        <CardContent className="pt-5 flex flex-col gap-4">
          {floorPlanSizeError && (
            <Alert className="bg-white border-[#FF8559]">
              <AlertCircle className="size-4 text-[#FF8559]" />
              <AlertDescription className="text-xs text-[#FF8559]">
                {floorPlanSizeError}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {floorPlanPhotos.map((item) => (
              <div
                key={item.id}
                className="relative h-44 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] overflow-hidden flex items-center justify-center"
              >
                <img
                  src={item.imageUrl || item.mediaUrl}
                  alt="Floor plan"
                  className="w-full h-full object-contain bg-white"
                />
                {item.isUploading && (
                  <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center gap-1.5 text-white text-xs font-medium">
                    <Loader2 className="size-5 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                )}
                {item.error && (
                  <div className="absolute inset-0 bg-red-950/75 p-3 flex flex-col items-center justify-center gap-2 text-center text-white">
                    <AlertCircle className="size-5 text-[#FF8559]" />
                    <span className="text-xs line-clamp-2">{item.error}</span>
                    {item.file && (
                      <button
                        type="button"
                        onClick={() => onRetryPhotoItem?.(item.id)}
                        className="px-2.5 py-1 rounded bg-white text-[#1E293B] text-xs font-semibold cursor-pointer"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onRemovePhotoItem?.(item.id)}
                  aria-label="Remove floor plan"
                  className="absolute top-2.5 right-2.5 size-11 md:size-9 [@media(pointer:coarse)]:size-11 rounded-lg bg-white/95 hover:bg-white text-[#1E293B] shadow-xs flex items-center justify-center cursor-pointer"
                >
                  <Trash2 className="size-4 text-[#FF8559]" />
                </button>
              </div>
            ))}

            {floorPlanPhotos.length < MAX_FLOORPLANS && (
              <label className="min-h-44 rounded-xl border-2 border-dashed border-[#CBD5E1] hover:border-[#0F766E] bg-[#F8FAFC] hover:bg-[#F0FDFA]/40 transition-colors flex flex-col items-center justify-center gap-2 p-5 text-center cursor-pointer group">
                <div className="size-10 rounded-full bg-white border border-[#E2E8F0] group-hover:border-[#0F766E]/30 flex items-center justify-center text-[#0F766E]">
                  <Plus className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-[#1E293B]">
                    Add Floor Plan
                  </span>
                  <span className="text-xs text-[#64748B]">
                    Max 10 MB • Unit layout or lot cut
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFloorPlanPick(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gallery Modal */}
      <MediaStudioModal
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        initialCategory={galleryInitialCat}
        categories={unifiedCategories}
        mediaPhotos={galleryPhotos}
        categoryVideos={categoryVideos}
        categoryDescriptions={formData.categoryDescriptions || {}}
        onUpdateCategoryDescription={(catKey, html) =>
          updateField({
            categoryDescriptions: {
              ...(formData.categoryDescriptions || {}),
              [catKey]: html,
            },
          })
        }
        onAddCustomCategory={handleAddCustomCategory}
        onRemoveCustomCategory={handleRemoveCustomCategory}
        onUploadCategoryFiles={onUploadCategoryFiles}
        onUpdatePhotoItem={onUpdatePhotoItem}
        onRemovePhotoItem={onRemovePhotoItem}
        onRetryPhotoItem={onRetryPhotoItem}
        onUploadCategoryVideo={onUploadCategoryVideo}
        onUploadCategoryVideoThumbnail={onUploadCategoryVideoThumbnail}
        onUpdateCategoryVideo={onUpdateCategoryVideo}
        onRemoveCategoryVideo={onRemoveCategoryVideo}
      />
    </div>
  );
}
