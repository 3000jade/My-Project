import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from 'cn';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import {
  Plus,
  Image as ImageIcon,
  Film,
  Trash2,
  Loader2,
  AlertCircle,
  LayoutGrid,
  X,
  Check,
  PenLine,
} from 'lucide-react';
import DescriptionEditorModal from './DescriptionEditorModal';

export const MAX_PHOTOS_PER_CATEGORY = 5;
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per photo
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB per video
const CUSTOM_CAT_MAX = 32;
const PHOTO_DESC_MAX = 255;
const CATEGORY_DESC_MAX = 1500;

function stripHtmlPlain(html = '') {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export default function MediaStudioModal({
  open,
  onOpenChange,
  initialCategory = 'ALL',
  categories = [],
  mediaPhotos = [],
  categoryVideos = {},
  categoryDescriptions = {},
  onUpdateCategoryDescription,
  onAddCustomCategory,
  onRemoveCustomCategory,
  onUploadCategoryFiles,
  onUpdatePhotoItem,
  onRemovePhotoItem,
  onRetryPhotoItem,
  onUploadCategoryVideo,
  onUploadCategoryVideoThumbnail,
  onUpdateCategoryVideo,
  onRemoveCategoryVideo,
}) {
  const [activeCategory, setActiveCategory] = useState(initialCategory || 'ALL');
  const [showAddInput, setShowAddInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addError, setAddError] = useState('');
  const [photoSizeErrors, setPhotoSizeErrors] = useState({});
  const [videoSizeErrors, setVideoSizeErrors] = useState({});
  const [editingDescTarget, setEditingDescTarget] = useState(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  // Keep activeCategory synced when opened from a specific category chip
  React.useEffect(() => {
    if (open) {
      setActiveCategory(initialCategory || 'ALL');
      setSelectedPhotoIds([]);
    }
  }, [open, initialCategory]);

  const galleryPhotos = mediaPhotos.filter((p) => p.galleryCategory !== 'Cover');
  const totalVideosCount = Object.keys(categoryVideos || {}).length;

  const handleCreateCustomCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setAddError('Enter a category name.');
      return;
    }
    const exists = categories.some(
      (c) => c.label.toLowerCase() === trimmed.toLowerCase() || c.key.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setAddError('That category already exists.');
      return;
    }
    onAddCustomCategory?.(trimmed);
    setNewCategoryName('');
    setAddError('');
    setShowAddInput(false);
    setActiveCategory(trimmed);
  };

  const handlePhotoFilesPick = (catKey, fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const oversized = files.find((f) => f.size > MAX_PHOTO_SIZE_BYTES);
    const valid = files.filter((f) => f.type.startsWith('image/') && f.size <= MAX_PHOTO_SIZE_BYTES);

    if (oversized) {
      setPhotoSizeErrors((prev) => ({
        ...prev,
        [catKey]: `"${oversized.name}" exceeds the 10 MB per-photo limit.`,
      }));
    } else {
      setPhotoSizeErrors((prev) => ({ ...prev, [catKey]: null }));
    }

    if (valid.length > 0) {
      onUploadCategoryFiles?.(catKey, valid, MAX_PHOTOS_PER_CATEGORY);
    }
  };

  const handleVideoFilePick = (catKey, file) => {
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      setVideoSizeErrors((prev) => ({
        ...prev,
        [catKey]: `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB, which exceeds the 50 MB limit.`,
      }));
      return;
    }
    setVideoSizeErrors((prev) => ({ ...prev, [catKey]: null }));
    onUploadCategoryVideo?.(catKey, file);
  };

  const selectedMeta = categories.find((c) => c.key === activeCategory) || null;
  const activePhotos =
    activeCategory === 'ALL'
      ? galleryPhotos
      : galleryPhotos.filter((p) => p.galleryCategory === activeCategory);
  const activePhotoIdSet = new Set(activePhotos.map((p) => p.id));
  const visibleSelectedIds = selectedPhotoIds.filter((id) => activePhotoIdSet.has(id));

  const togglePhotoSelected = (photoId) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const handleConfirmBulkDelete = () => {
    visibleSelectedIds.forEach((id) => onRemovePhotoItem?.(id));
    setSelectedPhotoIds([]);
    setConfirmBulkDeleteOpen(false);
  };

  const renderPhotoCard = (item, showCategoryBadge = false) => {
    const src = item.imageUrl || item.mediaUrl;
    const descVal = item.shortDescription || '';
    const nearLimit = descVal.length >= Math.floor(PHOTO_DESC_MAX * 0.9);

    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.16 }}
        className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col shadow-xs"
      >
        <div className="relative h-44 bg-[#F8FAFC] flex items-center justify-center overflow-hidden">
          {src ? (
            <img
              src={src}
              alt={descVal || item.galleryCategory || 'Property photo'}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="size-8 text-slate-300" />
          )}

          {showCategoryBadge && (
            <button
              type="button"
              onClick={() => setActiveCategory(item.galleryCategory)}
              className="absolute top-2.5 left-2.5 cursor-pointer"
            >
              <Badge className="bg-white/95 text-[#1E293B] border border-[#E2E8F0] font-semibold shadow-xs hover:border-[#0F766E]">
                {item.galleryCategory}
              </Badge>
            </button>
          )}

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
            onClick={() => togglePhotoSelected(item.id)}
            aria-label={visibleSelectedIds.includes(item.id) ? 'Deselect photo' : 'Select photo'}
            aria-pressed={visibleSelectedIds.includes(item.id)}
            className={`absolute bottom-2.5 left-2.5 size-11 md:size-8 [@media(pointer:coarse)]:size-11 rounded-lg border shadow-xs flex items-center justify-center cursor-pointer transition-colors ${
              visibleSelectedIds.includes(item.id)
                ? 'bg-[#0F766E] border-[#0F766E] text-white'
                : 'bg-white/95 border-[#E2E8F0] text-[#475569] hover:border-[#0F766E]'
            }`}
          >
            {visibleSelectedIds.includes(item.id) ? (
              <Check className="size-4" />
            ) : (
              <span className="size-4 rounded border border-[#CBD5E1] bg-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onRemovePhotoItem?.(item.id)}
            aria-label="Remove photo"
            className="absolute top-2.5 right-2.5 size-11 md:size-9 [@media(pointer:coarse)]:size-11 rounded-lg bg-white/95 hover:bg-white text-[#1E293B] shadow-xs flex items-center justify-center cursor-pointer"
          >
            <Trash2 className="size-4 text-[#FF8559]" />
          </button>
        </div>

        <div className="p-3">
          <Field>
            <FieldLabel
              htmlFor={`studio-photo-desc-${item.id}`}
              className="text-xs font-semibold text-[#475569]"
            >
              Description
            </FieldLabel>
            <InputGroup className="h-11 bg-white border-[#E2E8F0] rounded-lg">
              <InputGroupInput
                id={`studio-photo-desc-${item.id}`}
                type="text"
                maxLength={PHOTO_DESC_MAX}
                placeholder="Add a caption..."
                value={descVal}
                onChange={(e) =>
                  onUpdatePhotoItem?.(item.id, { shortDescription: e.target.value })
                }
                className="text-sm"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText
                  className={cn(
                    'text-[11px] tabular-nums',
                    nearLimit ? 'text-[#FF8559] font-semibold' : 'text-[#64748B]'
                  )}
                >
                  {descVal.length}/{PHOTO_DESC_MAX}
                </InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </div>
      </motion.div>
    );
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[88vh] p-0 overflow-hidden bg-[#F8FAFC] border-[#E2E8F0] rounded-xl flex flex-col gap-0">
        <DialogHeader className="px-6 py-4 bg-white border-b border-[#E2E8F0] shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
            <div>
              <DialogTitle className="text-lg font-bold text-[#1E293B]">
                Gallery
              </DialogTitle>
              <DialogDescription className="text-sm text-[#64748B]">
                Select a category on the left or view all uploaded photos and videos.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#F0FDFA] text-[#0F766E] border border-[#0F766E]/20 font-semibold">
                {galleryPhotos.length} photos • {totalVideosCount} videos
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Main 2-Pane Modal Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          {/* Left Category Side Panel */}
          <aside className="lg:col-span-3 bg-white border-b lg:border-b-0 lg:border-r border-[#E2E8F0] p-4 flex flex-col gap-3 overflow-y-auto min-h-0">
            {/* All Photos & Videos Selection */}
            <button
              type="button"
              onClick={() => setActiveCategory('ALL')}
              className={cn(
                'relative min-h-11 px-3 py-2.5 rounded-lg flex items-center justify-between text-sm font-semibold transition-colors cursor-pointer',
                activeCategory === 'ALL'
                  ? 'text-white'
                  : 'text-[#1E293B] hover:bg-[#F8FAFC]'
              )}
            >
              {activeCategory === 'ALL' && (
                <motion.span
                  layoutId="studio-sidebar-pill"
                  transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                  className="absolute inset-0 rounded-lg bg-[#0F766E] shadow-xs"
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <LayoutGrid className="size-4" />
                <span>All Photos & Videos</span>
              </span>
              <span
                className={cn(
                  'relative z-10 text-xs font-bold px-2 py-0.5 rounded-full',
                  activeCategory === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#F8FAFC] text-[#475569]'
                )}
              >
                {galleryPhotos.length + totalVideosCount}
              </span>
            </button>

            <Separator className="bg-[#E2E8F0]" />

            {/* Unified Categories Header + Inline '+' Button */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wide text-[#64748B]">
                Categories
              </span>
              <button
                type="button"
                aria-label="Add custom category"
                onClick={() => {
                  setShowAddInput((prev) => !prev);
                  setAddError('');
                }}
                className="size-11 md:size-8 [@media(pointer:coarse)]:size-11 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#0F766E] text-[#0F766E] flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="size-4" />
              </button>
            </div>

            {/* Inline Quick-Add Custom Category Input */}
            <AnimatePresence initial={false}>
              {showAddInput && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden flex flex-col gap-1.5"
                >
                  <div className="flex gap-1.5">
                    <InputGroup className="h-10 flex-1 bg-white border-[#E2E8F0] rounded-lg">
                      <InputGroupInput
                        type="text"
                        maxLength={CUSTOM_CAT_MAX}
                        placeholder="e.g. Rooftop Deck"
                        value={newCategoryName}
                        onChange={(e) => {
                          setNewCategoryName(e.target.value);
                          setAddError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateCustomCategory();
                          }
                        }}
                        className="text-sm"
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText className="text-[11px] tabular-nums text-[#64748B]">
                          {newCategoryName.length}/{CUSTOM_CAT_MAX}
                        </InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    <Button
                      type="button"
                      size="icon"
                      onClick={handleCreateCustomCategory}
                      aria-label="Confirm category"
                      className="size-10 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg cursor-pointer shrink-0"
                    >
                      <Check />
                    </Button>
                  </div>
                  {addError && <span className="text-xs text-[#FF8559]">{addError}</span>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Unified Category List */}
            <div className="flex flex-col gap-1">
              {categories.map((cat) => {
                const count = galleryPhotos.filter((p) => p.galleryCategory === cat.key).length;
                const hasVideo = Boolean(categoryVideos?.[cat.key]);
                const active = activeCategory === cat.key;

                return (
                  <div key={cat.key} className="group relative flex items-center">
                    <button
                      type="button"
                      onClick={() => setActiveCategory(cat.key)}
                      className={cn(
                        'relative w-full min-h-11 px-3 py-2 rounded-lg flex items-center justify-between text-sm font-medium transition-colors cursor-pointer',
                        active ? 'text-white' : 'text-[#1E293B] hover:bg-[#F8FAFC]'
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="studio-sidebar-pill"
                          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                          className="absolute inset-0 rounded-lg bg-[#0F766E] shadow-xs"
                        />
                      )}
                      <span className="relative z-10 truncate pr-2">{cat.label}</span>
                      <span className="relative z-10 flex items-center gap-1.5 shrink-0">
                        {hasVideo && (
                          <Film
                            className={cn(
                              'size-3.5',
                              active ? 'text-white/90' : 'text-[#0F766E]'
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            'text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums',
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-[#F8FAFC] text-[#475569]'
                          )}
                        >
                          {count}/{MAX_PHOTOS_PER_CATEGORY}
                        </span>
                      </span>
                    </button>

                    {cat.isCustom && (
                      <button
                        type="button"
                        aria-label={`Remove ${cat.label}`}
                        onClick={() => {
                          if (activeCategory === cat.key) setActiveCategory('ALL');
                          onRemoveCustomCategory?.(cat.key);
                        }}
                        className="ml-1 size-11 md:size-8 [@media(pointer:coarse)]:size-11 rounded-md text-[#94A3B8] hover:text-[#FF8559] flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right Bento Grid Workspace */}
          <main className="lg:col-span-9 bg-[#F8FAFC] p-4 md:p-5 overflow-y-auto min-h-0">
            {visibleSelectedIds.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#1E293B]">
                  {visibleSelectedIds.length} selected
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedPhotoIds(activePhotos.map((p) => p.id))}
                    className="min-h-11 md:min-h-9 px-3 text-xs font-semibold rounded-lg border-[#E2E8F0]"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedPhotoIds([])}
                    className="min-h-11 md:min-h-9 px-3 text-xs font-semibold rounded-lg border-[#E2E8F0]"
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setConfirmBulkDeleteOpen(true)}
                    className="min-h-11 md:min-h-9 px-3 text-xs font-semibold rounded-lg"
                  >
                    <Trash2 className="size-3.5 mr-1.5" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            )}
            <AnimatePresence mode="wait">
              {activeCategory === 'ALL' ? (
                <motion.div
                  key="ALL"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16 }}
                  className="flex flex-col gap-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-[#1E293B]">
                        All Photos & Videos
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        Click any category on the left to add photos (up to 5 per category) or upload an area video.
                      </p>
                    </div>
                  </div>

                  {galleryPhotos.length === 0 && totalVideosCount === 0 ? (
                    <Empty className="bg-white border border-[#E2E8F0]">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <ImageIcon />
                        </EmptyMedia>
                        <EmptyTitle>No gallery photos or videos yet</EmptyTitle>
                        <EmptyDescription>
                          Choose a category on the left (like Living or Kitchen) and click the + tile to upload photos.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <>
                      {galleryPhotos.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {galleryPhotos.map((item) => renderPhotoCard(item, true))}
                        </div>
                      )}

                      {totalVideosCount > 0 && (
                        <div className="flex flex-col gap-3">
                          <h4 className="text-sm font-bold text-[#1E293B] flex items-center gap-1.5">
                            <Film className="size-4 text-[#0F766E]" />
                            Category Videos
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(categoryVideos).map(([catKey, vid]) => (
                              <Card
                                key={catKey}
                                className="bg-white border-[#E2E8F0] rounded-xl shadow-xs"
                              >
                                <CardContent className="p-3 flex items-center gap-3">
                                  {vid.thumbnailUrl ? (
                                    <img
                                      src={vid.thumbnailUrl}
                                      alt={`${catKey} video thumbnail`}
                                      className="size-16 rounded-lg object-cover border border-[#E2E8F0] shrink-0"
                                    />
                                  ) : (
                                    <div className="size-16 rounded-lg bg-[#F8FAFC] border border-dashed border-[#CBD5E1] flex items-center justify-center shrink-0">
                                      <Film className="size-5 text-[#0F766E]" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <Badge className="bg-[#F0FDFA] text-[#0F766E] border border-[#0F766E]/20 mb-1">
                                      {catKey}
                                    </Badge>
                                    <p className="text-xs font-medium text-[#475569] truncate">
                                      {vid.shortDescription || vid.fileName || 'Area Video'}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActiveCategory(catKey)}
                                    className="cursor-pointer"
                                  >
                                    Edit
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16 }}
                  className="flex flex-col gap-5"
                >
                  {/* Category Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-[#1E293B]">
                      {selectedMeta?.label || activeCategory}
                    </h3>
                    <Badge className="bg-white text-[#1E293B] border border-[#E2E8F0] font-semibold">
                      {activePhotos.length} / {MAX_PHOTOS_PER_CATEGORY} photos
                    </Badge>
                  </div>

                  {/* Room Category Text Editor Card (Pre-set "{Room}: Enter detail") */}
                  {(() => {
                    const catLabel = selectedMeta?.label || activeCategory;
                    const savedHtml = categoryDescriptions?.[activeCategory] || '';
                    const presetHtml = `<p><strong>${catLabel}:</strong></p><p>Enter detail</p>`;
                    const previewText = savedHtml
                      ? stripHtmlPlain(savedHtml)
                      : `${catLabel}:\nEnter detail`;

                    return (
                      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="min-w-0 flex-1 flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-wide text-[#0F766E]">
                                {catLabel} Details
                              </span>
                              <span className="text-[11px] text-[#64748B] tabular-nums">
                                ({stripHtmlPlain(savedHtml).length} / {CATEGORY_DESC_MAX})
                              </span>
                            </div>
                            <p className="text-sm text-[#1E293B] whitespace-pre-line line-clamp-2">
                              {previewText}
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setEditingDescTarget({
                                catKey: activeCategory,
                                title: `${catLabel} Description`,
                                value: savedHtml || presetHtml,
                              })
                            }
                            className="min-h-11 px-4 border-[#E2E8F0] hover:border-[#0F766E] text-[#0F766E] font-semibold rounded-lg shrink-0 cursor-pointer"
                          >
                            <PenLine data-icon="inline-start" />
                            Edit {catLabel} Text
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {photoSizeErrors[activeCategory] && (
                    <Alert className="bg-white border-[#FF8559]">
                      <AlertCircle className="size-4 text-[#FF8559]" />
                      <AlertDescription className="text-xs text-[#FF8559]">
                        {photoSizeErrors[activeCategory]}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Photo Bento Grid with In-Grid Clickable '+' Photo Placeholder */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {activePhotos.map((item) => renderPhotoCard(item, false))}

                    {activePhotos.length < MAX_PHOTOS_PER_CATEGORY && (
                      <label className="min-h-60 rounded-xl border-2 border-dashed border-[#CBD5E1] hover:border-[#0F766E] bg-white hover:bg-[#F0FDFA]/40 transition-colors flex flex-col items-center justify-center gap-2 p-6 text-center cursor-pointer group">
                        <div className="size-12 rounded-full bg-[#F8FAFC] group-hover:bg-[#F0FDFA] border border-[#E2E8F0] group-hover:border-[#0F766E]/30 flex items-center justify-center text-[#0F766E] transition-colors">
                          <Plus className="size-6" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-[#1E293B]">
                            Add Photo
                          </span>
                          <span className="text-xs text-[#64748B]">
                            Max 10 MB per photo • {MAX_PHOTOS_PER_CATEGORY - activePhotos.length} left
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            handlePhotoFilesPick(activeCategory, e.target.files);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <Separator className="bg-[#E2E8F0]" />

                  {/* Category Video + Video Thumbnail Card */}
                  <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Film className="size-4 text-[#0F766E]" />
                          <span className="text-sm font-bold text-[#1E293B]">
                            {selectedMeta?.label || activeCategory} Video
                          </span>
                          <span className="text-xs text-[#64748B]">(Max 50 MB)</span>
                        </div>
                        {categoryVideos?.[activeCategory] && (
                          <button
                            type="button"
                            onClick={() => onRemoveCategoryVideo?.(activeCategory)}
                            className="text-xs font-semibold text-[#FF8559] hover:underline cursor-pointer"
                          >
                            Remove video
                          </button>
                        )}
                      </div>

                      {videoSizeErrors[activeCategory] && (
                        <Alert className="bg-white border-[#FF8559] py-2 px-3">
                          <AlertCircle className="size-4 text-[#FF8559]" />
                          <AlertDescription className="text-xs text-[#FF8559]">
                            {videoSizeErrors[activeCategory]}
                          </AlertDescription>
                        </Alert>
                      )}

                      {!categoryVideos?.[activeCategory] ? (
                        <label className="min-h-24 rounded-xl border border-dashed border-[#CBD5E1] hover:border-[#0F766E] bg-[#F8FAFC] hover:bg-[#F0FDFA]/40 transition-colors flex flex-col items-center justify-center gap-1.5 p-4 text-center cursor-pointer">
                          <div className="size-9 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0F766E]">
                            <Plus className="size-4" />
                          </div>
                          <span className="text-xs font-semibold text-[#1E293B]">
                            Click to upload area video (MP4, WebM, MOV • Max 50 MB)
                          </span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            className="hidden"
                            onChange={(e) => {
                              handleVideoFilePick(activeCategory, e.target.files?.[0]);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          {/* Clickable Video Thumbnail Placeholder */}
                          <label
                            className="relative size-20 rounded-xl border border-dashed border-[#CBD5E1] hover:border-[#0F766E] bg-[#F8FAFC] overflow-hidden flex flex-col items-center justify-center gap-1 shrink-0 cursor-pointer group"
                            title="Upload or change video thumbnail"
                          >
                            {categoryVideos[activeCategory].thumbnailUrl ? (
                              <img
                                src={categoryVideos[activeCategory].thumbnailUrl}
                                alt="Video thumbnail"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <>
                                <Plus className="size-4 text-[#0F766E]" />
                                <span className="text-[10px] font-semibold text-[#64748B]">
                                  Thumbnail
                                </span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onUploadCategoryVideoThumbnail?.(activeCategory, file);
                                e.target.value = '';
                              }}
                            />
                          </label>

                          <div className="flex-1 w-full flex flex-col gap-2 min-w-0">
                            <span className="text-xs font-semibold text-[#1E293B] truncate">
                              {categoryVideos[activeCategory].isUploading
                                ? 'Uploading video...'
                                : categoryVideos[activeCategory].fileName || 'Area Video Uploaded'}
                            </span>
                            {categoryVideos[activeCategory].error && (
                              <span className="text-xs text-[#FF8559]">
                                {categoryVideos[activeCategory].error}
                              </span>
                            )}
                            <InputGroup className="h-10 bg-white border-[#E2E8F0] rounded-lg">
                              <InputGroupInput
                                type="text"
                                maxLength={PHOTO_DESC_MAX}
                                placeholder="Add a short note about this video"
                                value={categoryVideos[activeCategory].shortDescription || ''}
                                onChange={(e) =>
                                  onUpdateCategoryVideo?.(activeCategory, {
                                    shortDescription: e.target.value,
                                  })
                                }
                                className="text-sm"
                              />
                              <InputGroupAddon align="inline-end">
                                <InputGroupText className="text-[11px] tabular-nums text-[#64748B]">
                                  {(categoryVideos[activeCategory].shortDescription || '').length}/
                                  {PHOTO_DESC_MAX}
                                </InputGroupText>
                              </InputGroupAddon>
                            </InputGroup>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        <DialogFooter className="px-6 py-3 bg-white border-t border-[#E2E8F0] shrink-0">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="min-h-11 px-6 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold rounded-lg cursor-pointer"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <DescriptionEditorModal
      open={Boolean(editingDescTarget)}
      onOpenChange={(isOpen) => {
        if (!isOpen) setEditingDescTarget(null);
      }}
      title={editingDescTarget?.title || 'Room Category Description'}
      subtitle="Add rich details for this room or area using standard editing tools."
      initialValue={editingDescTarget?.value || ''}
      maxLength={CATEGORY_DESC_MAX}
      placeholder="Enter room details..."
      onSave={(html) => {
        if (editingDescTarget?.catKey) {
          onUpdateCategoryDescription?.(editingDescTarget.catKey, html);
        }
        setEditingDescTarget(null);
      }}
    />

    <Dialog open={confirmBulkDeleteOpen} onOpenChange={setConfirmBulkDeleteOpen}>
      <DialogContent className="max-w-md bg-white border-[#E2E8F0] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1E293B]">
            Delete {visibleSelectedIds.length} selected {visibleSelectedIds.length === 1 ? 'photo' : 'photos'}?
          </DialogTitle>
          <DialogDescription className="text-sm text-[#64748B]">
            This will remove the selected {visibleSelectedIds.length === 1 ? 'photo' : 'photos'} from this listing gallery.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmBulkDeleteOpen(false)}
            className="min-h-11 px-4 border-[#E2E8F0] rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmBulkDelete}
            className="min-h-11 px-4 rounded-lg"
          >
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
