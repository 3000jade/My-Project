import React, { useState, useEffect, useCallback } from 'react';
import { FileText, BookOpen, HelpCircle, Image, Layers, Plus, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import KpiCard from '@/components/ui/cards/KpiCard';
import CmsContentTable from '@/components/cms/CmsContentTable';
import CmsContentEditorDrawer from '@/components/cms/CmsContentEditorDrawer';
import FeaturedCollectionEditor from '@/components/cms/FeaturedCollectionEditor';
import cmsService from '@/services/cmsService';

const CONTENT_TABS = [
  { id: 'page', label: 'Company Pages', icon: FileText },
  { id: 'article', label: 'Guides & Blog', icon: BookOpen },
  { id: 'faq', label: 'FAQs', icon: HelpCircle },
  { id: 'banner', label: 'Hero Banners', icon: Image },
  { id: 'collections', label: 'Featured Collections', icon: Layers },
];

export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState('page');
  const [contents, setContents] = useState([]);
  const [collections, setCollections] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allContents, allCollections] = await Promise.all([
        cmsService.listAdminContents(),
        cmsService.listAdminCollections(),
      ]);
      setContents(allContents);
      setCollections(allCollections);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to load CMS data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const publishedCount = contents.filter((c) => c.status === 'PUBLISHED').length;
  const draftCount = contents.filter((c) => c.status === 'DRAFT').length;

  const filteredContents = contents.filter((item) => {
    if (item.content_type !== activeTab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
  });

  const handleSaveContent = async (payload) => {
    setSaving(true);
    try {
      if (editingItem) {
        await cmsService.updateContent(editingItem.id, payload);
      } else {
        await cmsService.createContent(payload);
      }
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (item) => {
    const nextStatus = item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await cmsService.updateContent(item.id, { status: nextStatus });
    await loadData();
  };

  const handleArchive = async (item) => {
    await cmsService.updateContent(item.id, { status: 'ARCHIVED' });
    await loadData();
  };

  const handleDelete = async (item) => {
    await cmsService.deleteContent(item.id);
    await loadData();
  };

  return (
    <div className="flex flex-col gap-6 font-sans w-full min-w-0 max-w-full p-4 md:p-6 lg:p-8 bg-[#F8FAFC] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#1E293B]">
            Corporation Content Management
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Publish company pages, buying guides, FAQs, hero banners, and featured property collections.
          </p>
        </div>

        {activeTab !== 'collections' && (
          <Button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setDrawerOpen(true);
            }}
            className="bg-[#0F766E] hover:bg-[#115E59] text-white h-10 px-4"
          >
            <Plus className="size-4 mr-2" />
            New {CONTENT_TABS.find((t) => t.id === activeTab)?.label || 'Content'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Published Content" value={publishedCount} icon={FileText} statusVariant="success" />
        <KpiCard title="Drafts Pending" value={draftCount} icon={BookOpen} statusVariant="warning" />
        <KpiCard title="Hero Banners" value={contents.filter((c) => c.content_type === 'banner').length} icon={Image} statusVariant="primary" />
        <KpiCard title="Featured Collections" value={collections.length} icon={Layers} statusVariant="primary" />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#F1F5F9] border border-[#E2E8F0] p-1 flex-wrap h-auto">
          {CONTENT_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {activeTab !== 'collections' ? (
          <TabsContent value={activeTab} className="mt-6">
            <Card className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-semibold text-[#1E293B]">
                    {CONTENT_TABS.find((t) => t.id === activeTab)?.label}
                  </CardTitle>
                  <CardDescription>
                    Drafts stay hidden from the public website until you switch them to Published.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="size-4 text-[#64748B] absolute left-3 top-3" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title or slug..."
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-[#64748B] py-8 text-center">Loading content...</p>
                ) : (
                  <CmsContentTable
                    items={filteredContents}
                    onEdit={(item) => {
                      setEditingItem(item);
                      setDrawerOpen(true);
                    }}
                    onTogglePublish={handleTogglePublish}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ) : (
          <TabsContent value="collections" className="mt-6">
            <FeaturedCollectionEditor collections={collections} onRefresh={loadData} />
          </TabsContent>
        )}
      </Tabs>

      <CmsContentEditorDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        contentType={activeTab}
        initialItem={editingItem}
        onSave={handleSaveContent}
        isSaving={saving}
      />
    </div>
  );
}
