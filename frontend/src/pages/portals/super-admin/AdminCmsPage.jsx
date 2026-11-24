import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  Users,
  Phone,
  BookOpen,
  Pencil,
  Eye,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import cmsService from '@/services/cmsService';
import { LiveEditProvider } from '@/components/cms/LiveCmsEditor';
import CmsDeleteDialog from '@/components/cms/CmsDeleteDialog';
import HomeLiveCanvas from '@/components/cms/HomeLiveCanvas';
import AboutLiveCanvas from '@/components/cms/AboutLiveCanvas';
import ContactLiveCanvas from '@/components/cms/ContactLiveCanvas';
import GuidesLiveCanvas from '@/components/cms/GuidesLiveCanvas';

const STUDIO_PAGES = [
  { id: 'home', label: 'Homepage', icon: Home, urlHint: '/' },
  { id: 'about', label: 'About Us', icon: Users, urlHint: '/about' },
  { id: 'contact', label: 'Contact', icon: Phone, urlHint: '/contact' },
  { id: 'guides', label: 'Guides', icon: BookOpen, urlHint: '/guides' },
];

export default function AdminCmsPage() {
  const [activePage, setActivePage] = useState('home');
  const [isEditMode, setIsEditMode] = useState(true);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const allContents = await cmsService.listAdminContents();
      setContents(Array.isArray(allContents) ? allContents : []);
    } catch (err) {
      setError(err?.message || err?.data?.error || 'Failed to load website content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (payload) => {
    setSaving(true);
    setError('');
    try {
      const created = await cmsService.createContent(payload);
      if (created) {
        setContents((prev) => [created, ...prev]);
      } else {
        await loadData();
      }
      return created;
    } catch (err) {
      const msg = err?.message || err?.data?.error || 'Failed to add item.';
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, patch) => {
    setSaving(true);
    setError('');
    try {
      const updated = await cmsService.updateContent(id, patch);
      if (updated) {
        setContents((prev) => prev.map((item) => (item.id === id ? updated : item)));
      } else {
        await loadData();
      }
      return updated;
    } catch (err) {
      const msg = err?.message || err?.data?.error || 'Failed to save change.';
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (item) => {
    const nextStatus = item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await handleUpdate(item.id, { status: nextStatus });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await cmsService.deleteContent(deleteTarget.id);
      setContents((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err?.message || err?.data?.error || 'Failed to delete item.');
    } finally {
      setDeleting(false);
    }
  };

  const activePageMeta = STUDIO_PAGES.find((p) => p.id === activePage) || STUDIO_PAGES[0];

  const canvasProps = {
    items: contents,
    onCreate: handleCreate,
    onUpdate: handleUpdate,
    onTogglePublish: handleTogglePublish,
    onRequestDelete: (item) => {
      setDeleteError('');
      setDeleteTarget(item);
    },
  };

  return (
    <div className="flex flex-col gap-6 font-sans w-full min-w-0 max-w-full p-4 md:p-6 lg:p-8 bg-[#F8FAFC] min-h-screen">
      {/* Top Live Studio Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
        <Tabs value={activePage} onValueChange={setActivePage} className="w-full lg:w-auto">
          <TabsList className="bg-[#F1F5F9] border border-[#E2E8F0] p-1 flex-wrap h-auto">
            {STUDIO_PAGES.map((page) => {
              const Icon = page.icon;
              return (
                <TabsTrigger key={page.id} value={page.id} className="gap-2 h-9 px-3">
                  <Icon className="size-4 shrink-0" />
                  <span>{page.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none text-[#0F766E]" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span>All changes saved</span>
              </>
            )}
          </div>

          <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] p-1">
            <Button
              type="button"
              size="sm"
              variant={isEditMode ? 'default' : 'ghost'}
              onClick={() => setIsEditMode(true)}
              className={
                isEditMode
                  ? 'h-8 px-3 bg-[#0F766E] hover:bg-[#115E59] text-white gap-1.5 text-xs'
                  : 'h-8 px-3 text-[#64748B] hover:text-[#1E293B] gap-1.5 text-xs'
              }
            >
              <Pencil className="size-3.5" />
              <span>Edit Mode</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!isEditMode ? 'default' : 'ghost'}
              onClick={() => setIsEditMode(false)}
              className={
                !isEditMode
                  ? 'h-8 px-3 bg-[#1E293B] hover:bg-[#334155] text-white gap-1.5 text-xs'
                  : 'h-8 px-3 text-[#64748B] hover:text-[#1E293B] gap-1.5 text-xs'
              }
            >
              <Eye className="size-3.5" />
              <span>Preview as Visitor</span>
            </Button>
          </div>
        </div>
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
            className="h-9 px-3 shrink-0 gap-1.5 text-xs"
          >
            <RefreshCw className="size-3.5" />
            <span>Retry</span>
          </Button>
        </Alert>
      )}

      {/* Framed Live Website Preview Canvas */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-[#F1F5F9] border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 text-xs font-medium text-[#64748B] bg-white border border-[#E2E8F0] rounded-md px-2.5 py-0.5">
              humanshelter.ph{activePageMeta.urlHint}
            </span>
          </div>
          <span className="text-xs text-[#64748B]">
            {isEditMode
              ? 'Click any dashed text or photo to edit directly on the page.'
              : 'Visitor preview — hidden drafts and edit tools are concealed.'}
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-6">
            <Skeleton className="h-14 w-full rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <LiveEditProvider forceAdmin editing={isEditMode} onEditingChange={setIsEditMode}>
            {activePage === 'home' && <HomeLiveCanvas {...canvasProps} />}
            {activePage === 'about' && <AboutLiveCanvas {...canvasProps} />}
            {activePage === 'contact' && <ContactLiveCanvas {...canvasProps} />}
            {activePage === 'guides' && <GuidesLiveCanvas {...canvasProps} />}
          </LiveEditProvider>
        )}
      </div>

      <CmsDeleteDialog
        item={deleteTarget}
        isDeleting={deleting}
        error={deleteError}
        onClose={() => {
          setDeleteError('');
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
