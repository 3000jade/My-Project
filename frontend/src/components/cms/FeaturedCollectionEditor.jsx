import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Layers, Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import propertyService from '@/services/propertyService';
import cmsService from '@/services/cmsService';

export default function FeaturedCollectionEditor({ collections = [], onRefresh }) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [activeProperties, setActiveProperties] = useState([]);
  const [pickedItems, setPickedItems] = useState([]);
  const [pickPropertyId, setPickPropertyId] = useState('');
  const [customBadge, setCustomBadge] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    propertyService
      .getProperties({ standardStatus: 'Active', limit: 50 })
      .then((res) => setActiveProperties(res?.data || []))
      .catch(() => setActiveProperties([]));
  }, []);

  useEffect(() => {
    if (!selectedCollectionId && collections.length > 0) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId]);

  const currentCollection = collections.find((c) => c.id === selectedCollectionId);

  useEffect(() => {
    if (currentCollection) {
      setPickedItems(
        (currentCollection.items || []).map((item, idx) => ({
          property_id: item.property_id,
          sort_order: item.sort_order ?? idx,
          custom_badge: item.custom_badge || '',
          title: item.property?.title || item.property_id,
        }))
      );
    } else {
      setPickedItems([]);
    }
  }, [currentCollection]);

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;
    setSaving(true);
    setError('');
    try {
      const created = await cmsService.createCollection({
        title: title.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
        status: 'PUBLISHED',
      });
      setTitle('');
      setSlug('');
      setSelectedCollectionId(created.id);
      await onRefresh();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to create collection.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddProperty = () => {
    if (!pickPropertyId) return;
    if (pickedItems.some((item) => item.property_id === pickPropertyId)) {
      setError('That property is already in this collection.');
      return;
    }
    setError('');
    const prop = activeProperties.find((p) => String(p.id) === String(pickPropertyId));
    setPickedItems((prev) => [
      ...prev,
      {
        property_id: pickPropertyId,
        sort_order: prev.length,
        custom_badge: customBadge.trim() || null,
        title: prop?.title || pickPropertyId,
      },
    ]);
    setPickPropertyId('');
    setCustomBadge('');
  };

  const moveItem = (index, direction) => {
    const next = [...pickedItems];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setPickedItems(next.map((item, idx) => ({ ...item, sort_order: idx })));
  };

  const handleToggleCollectionStatus = async (col) => {
    const nextStatus = col.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await cmsService.updateCollection(col.id, { status: nextStatus });
    await onRefresh();
  };

  const handleDeleteCollection = async (col) => {
    await cmsService.deleteCollection(col.id);
    if (selectedCollectionId === col.id) setSelectedCollectionId('');
    await onRefresh();
  };

  const handleSaveItems = async () => {
    if (!currentCollection) return;
    setSaving(true);
    setError('');
    try {
      await cmsService.syncCollectionItems(
        currentCollection.id,
        pickedItems.map((item, idx) => ({
          property_id: item.property_id,
          sort_order: idx,
          custom_badge: item.custom_badge || null,
        }))
      );
      await onRefresh();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to save collection listings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <Card className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#1E293B]">Collections</CardTitle>
          <CardDescription>Group active listings for homepage spotlights.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {collections.map((col) => (
              <div
                key={col.id}
                className={`p-4 rounded-lg border transition-colors flex items-center justify-between gap-2 ${
                  col.id === selectedCollectionId
                    ? 'border-[#0F766E] bg-[#CCFBF1]/40 text-[#1E293B]'
                    : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCollectionId(col.id)}
                  className="text-left min-w-0 flex-1"
                >
                  <div className="font-medium text-sm truncate">{col.title}</div>
                  <div className="text-xs text-[#64748B] mt-1">
                    /{col.slug} · {col.status || 'DRAFT'} · {col.items?.length || 0} listings
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={col.status === 'PUBLISHED' ? 'Move to Draft' : 'Publish'}
                    aria-label={col.status === 'PUBLISHED' ? `Unpublish ${col.title}` : `Publish ${col.title}`}
                    onClick={() => handleToggleCollectionStatus(col)}
                  >
                    <Globe className={`size-4 ${col.status === 'PUBLISHED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                    aria-label={`Delete ${col.title}`}
                    onClick={() => handleDeleteCollection(col)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateCollection} className="pt-4 border-t border-[#E2E8F0] space-y-4">
            <div className="space-y-2">
              <Label htmlFor="col-title">New Collection Name</Label>
              <Input
                id="col-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
                }}
                placeholder="e.g. Featured Metro Condos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="col-slug">Slug</Label>
              <Input id="col-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="featured-metro-condos" />
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled={saving}>
              <Plus className="size-4 mr-2" /> Create Collection
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#1E293B] flex items-center gap-2">
            <Layers className="size-4 text-[#0F766E]" />
            {currentCollection ? currentCollection.title : 'Select or create a collection'}
          </CardTitle>
          <CardDescription>
            Only Active properties appear on the public site. Closed or Draft listings are hidden automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {currentCollection && (
            <>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={pickPropertyId}
                  onChange={(e) => setPickPropertyId(e.target.value)}
                  className="h-10 flex-1 rounded-lg border border-[#E2E8F0] bg-white px-4 text-sm text-[#1E293B]"
                  aria-label="Select property to add"
                >
                  <option value="">Choose an active property...</option>
                  {activeProperties.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.title} — {prop.location?.city || prop.city || ''}
                    </option>
                  ))}
                </select>
                <Input
                  value={customBadge}
                  onChange={(e) => setCustomBadge(e.target.value)}
                  placeholder="Optional tag (e.g. Hot)"
                  className="sm:w-44"
                />
                <Button type="button" variant="outline" onClick={handleAddProperty}>
                  <Plus className="size-4 mr-2" /> Add
                </Button>
              </div>

              <div className="space-y-2">
                {pickedItems.map((item, idx) => (
                  <div
                    key={item.property_id}
                    className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#1E293B] truncate">{item.title}</div>
                      {item.custom_badge && (
                        <span className="text-xs text-[#0F766E] font-medium">{item.custom_badge}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => moveItem(idx, -1)} disabled={idx === 0}>
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => moveItem(idx, 1)} disabled={idx === pickedItems.length - 1}>
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => setPickedItems((prev) => prev.filter((p) => p.property_id !== item.property_id))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
        {currentCollection && (
          <CardFooter className="border-t border-[#E2E8F0] pt-4 flex justify-end">
            <Button
              type="button"
              onClick={handleSaveItems}
              disabled={saving}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white"
            >
              {saving ? 'Saving...' : 'Save Featured Order'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
