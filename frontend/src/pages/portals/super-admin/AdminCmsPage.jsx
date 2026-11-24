import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  FileEdit,
  Layers,
  Plus,
  Search,
  AlertCircle,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import KpiCard from '@/components/ui/cards/KpiCard';
import CmsContentTable from '@/components/cms/CmsContentTable';
import CmsContentEditorDrawer from '@/components/cms/CmsContentEditorDrawer';
import CmsDeleteDialog from '@/components/cms/CmsDeleteDialog';
import {
  CMS_TABS,
  CMS_STATUS_FILTERS,
  getTabById,
  filterCmsItems,
} from '@/components/cms/cmsConfig';
import cmsService from '@/services/cmsService';

export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState('banners');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [contents, setContents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const allContents = await cmsService.listAdminContents();
      setContents(Array.isArray(allContents) ? allContents : []);
    } catch (err) {
      setError(err?.message || err?.data?.error || 'Failed to load CMS data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeTabConfig = useMemo(() => getTabById(activeTab), [activeTab]);

  const publishedCount = useMemo(
    () => contents.filter((c) => c.status === 'PUBLISHED').length,
    [contents]
  );

  const draftCount = useMemo(
    () => contents.filter((c) => c.status === 'DRAFT').length,
    [contents]
  );

  const activeSectionsCount = useMemo(
    () =>
      CMS_TABS.filter((tab) =>
        contents.some(
          (item) =>
            tab.contentTypes.includes(item.content_type) &&
            item.status === 'PUBLISHED'
        )
      ).length,
    [contents]
  );

  const filteredContents = useMemo(
    () =>
      filterCmsItems(contents, {
        tabId: activeTab,
        status: statusFilter,
        search,
      }),
    [contents, activeTab, statusFilter, search]
  );

  const handleTabChange = (nextTabId) => {
    setActiveTab(nextTabId);
    setStatusFilter('ALL');
    setSearch('');
  };

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
    setError('');
    const nextStatus = item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await cmsService.updateContent(item.id, { status: nextStatus });
      await loadData();
    } catch (err) {
      setError(
        err?.message || err?.data?.error || 'Failed to update visibility status.'
      );
    }
  };

  const handleArchive = async (item) => {
    setError('');
    try {
      await cmsService.updateContent(item.id, { status: 'ARCHIVED' });
      await loadData();
    } catch (err) {
      setError(err?.message || err?.data?.error || 'Failed to archive item.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await cmsService.deleteContent(deletingItem.id);
      setDeletingItem(null);
      await loadData();
    } catch (err) {
      setDeleteError(
        err?.response?.data?.error ||
          err?.data?.error ||
          err?.message ||
          'Failed to delete content item.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans w-full min-w-0 max-w-full p-4 md:p-6 lg:p-8 bg-[#F8FAFC] min-h-screen">
      <div className="flex items-center justify-end">
        <Button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setDrawerOpen(true);
          }}
          className="bg-[#0F766E] hover:bg-[#115E59] text-white h-10 px-4"
        >
          <Plus className="size-4" data-icon="inline-start" />
          <span>{activeTabConfig.createLabel}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Published Items"
          value={publishedCount}
          icon={CheckCircle2}
          statusVariant="success"
        />
        <KpiCard
          title="Drafts Pending"
          value={draftCount}
          icon={FileEdit}
          statusVariant="warning"
        />
        <KpiCard
          title="Active Sections"
          value={`${activeSectionsCount} / ${CMS_TABS.length}`}
          icon={Layers}
          statusVariant="primary"
        />
      </div>

      {error && (
        <Alert variant="destructive" className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="size-4 shrink-0" />
            <AlertDescription>{error}</AlertDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={loadData}
            className="h-10 shrink-0"
          >
            Retry
          </Button>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full min-w-0">
        <TabsList className="bg-[#F1F5F9] border border-[#E2E8F0] p-1 flex-wrap h-auto">
          {CMS_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2 h-10">
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-xl font-semibold text-[#1E293B]">
                    {activeTabConfig.label}
                  </CardTitle>
                  <CardDescription>{activeTabConfig.description}</CardDescription>
                </div>
                <div className="relative w-full lg:w-72">
                  <Search className="size-4 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${activeTabConfig.label.toLowerCase()}...`}
                    aria-label="Search CMS content"
                    className="pl-10 h-10"
                  />
                </div>
              </div>

              <div
                role="group"
                aria-label="Filter by status"
                className="flex flex-wrap items-center gap-2"
              >
                {CMS_STATUS_FILTERS.map((filter) => {
                  const isSelected = statusFilter === filter.value;
                  return (
                    <Button
                      key={filter.value}
                      type="button"
                      variant="outline"
                      aria-pressed={isSelected}
                      onClick={() => setStatusFilter(filter.value)}
                      className={
                        isSelected
                          ? 'h-10 rounded-full px-4 border-[#0F766E] bg-[#CCFBF1] text-[#0F766E] hover:bg-[#CCFBF1] hover:text-[#0F766E]'
                          : 'h-10 rounded-full px-4 border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                      }
                    >
                      {filter.label}
                    </Button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col gap-4 py-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <CmsContentTable
                  tabId={activeTab}
                  items={filteredContents}
                  onEdit={(item) => {
                    setEditingItem(item);
                    setDrawerOpen(true);
                  }}
                  onTogglePublish={handleTogglePublish}
                  onArchive={handleArchive}
                  onRequestDelete={(item) => {
                    setDeleteError('');
                    setDeletingItem(item);
                  }}
                  emptyLabel={`No ${activeTabConfig.label.toLowerCase()} found.`}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CmsContentEditorDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingItem(null);
        }}
        tabId={activeTab}
        initialItem={editingItem}
        onSave={handleSaveContent}
        isSaving={saving}
      />

      <CmsDeleteDialog
        item={deletingItem}
        isDeleting={isDeleting}
        error={deleteError}
        onClose={() => {
          setDeletingItem(null);
          setDeleteError('');
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
