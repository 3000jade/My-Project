import React, { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function toSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CmsContentEditorDrawer({
  isOpen,
  onClose,
  contentType = 'page',
  initialItem = null,
  onSave,
  isSaving = false,
}) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (initialItem) {
      setTitle(initialItem.title || '');
      setSlug(initialItem.slug || '');
      setSummary(initialItem.summary || '');
      setBody(initialItem.body || '');
      setMediaUrl(initialItem.media_url || '');
      setCtaLabel(initialItem.payload?.cta_label || '');
      setCtaUrl(initialItem.payload?.cta_url || '');
      setCategory(initialItem.payload?.category || '');
      setStatus(initialItem.status || 'DRAFT');
      setSortOrder(initialItem.sort_order ?? 0);
    } else {
      setTitle('');
      setSlug('');
      setSummary('');
      setBody('');
      setMediaUrl('');
      setCtaLabel('');
      setCtaUrl('');
      setCategory('');
      setStatus('DRAFT');
      setSortOrder(0);
    }
  }, [isOpen, initialItem]);

  const handleTitleChange = (val) => {
    setTitle(val);
    if (!initialItem) {
      setSlug(toSlug(val));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      setError('Title and URL slug are required.');
      return;
    }
    setError('');
    const payload = {};
    if (ctaLabel.trim()) payload.cta_label = ctaLabel.trim();
    if (ctaUrl.trim()) payload.cta_url = ctaUrl.trim();
    if (category.trim()) payload.category = category.trim();

    try {
      await onSave({
        content_type: initialItem?.content_type || contentType,
        title: title.trim(),
        slug: toSlug(slug),
        summary: summary.trim() || null,
        body: body.trim() || null,
        media_url: mediaUrl.trim() || null,
        payload,
        status,
        sort_order: Number(sortOrder) || 0,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to save content.');
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-white border-l border-[#E2E8F0]"
      >
        <DrawerHeader className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <DrawerTitle className="text-xl font-semibold text-[#1E293B]">
            {initialItem ? 'Edit Content' : `Create ${contentType.toUpperCase()}`}
          </DrawerTitle>
          <DrawerDescription className="text-sm text-[#64748B]">
            Save as Draft to keep it private, or switch to Published to show it on the public website.
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4" data-lenis-prevent="true">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="cms-title">Title</Label>
              <Input
                id="cms-title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. About Human Shelter Realty"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cms-slug">URL Slug</Label>
                <Input
                  id="cms-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="about-us"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cms-status">Visibility Status</Label>
                <select
                  id="cms-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 text-sm text-[#1E293B] focus-visible:outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                >
                  <option value="DRAFT">Draft (Hidden)</option>
                  <option value="PUBLISHED">Published (Live)</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cms-summary">Short Summary / Subtitle</Label>
              <Input
                id="cms-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="One-sentence overview shown on cards or hero banners"
              />
            </div>

            {contentType !== 'faq' && (
              <div className="space-y-2">
                <Label htmlFor="cms-media">Image URL (Optional)</Label>
                <Input
                  id="cms-media"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}

            {contentType === 'banner' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cms-cta-label">Button Text</Label>
                  <Input
                    id="cms-cta-label"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="Explore Listings"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cms-cta-url">Button Link</Label>
                  <Input
                    id="cms-cta-url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="/properties"
                  />
                </div>
              </div>
            )}

            {(contentType === 'article' || contentType === 'faq') && (
              <div className="space-y-2">
                <Label htmlFor="cms-category">Category</Label>
                <Input
                  id="cms-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Buyers, Financing, Market News"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cms-body">
                {contentType === 'faq' ? 'Answer' : 'Main Content'}
              </Label>
              <Textarea
                id="cms-body"
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write clear, helpful copy here..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cms-order">Display Order (0 = First)</Label>
              <Input
                id="cms-order"
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
          </div>

          <DrawerFooter className="p-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-row justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white"
            >
              {isSaving ? 'Saving...' : 'Save Content'}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
