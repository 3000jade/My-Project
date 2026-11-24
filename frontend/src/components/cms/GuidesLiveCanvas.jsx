import React, { useState } from 'react';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LiveEditableText, useLiveEdit } from '@/components/cms/LiveCmsEditor';
import {
  LiveEditableImage,
  LiveCardControls,
  LiveSectionAddButton,
} from '@/components/cms/LiveCmsPrimitives';

export default function GuidesLiveCanvas({
  items = [],
  onCreate,
  onUpdate,
  onTogglePublish,
  onRequestDelete,
}) {
  const { isEditing } = useLiveEdit();
  const [selectedId, setSelectedId] = useState(null);

  const guides = items.filter(
    (i) => i.content_type === 'article' && (isEditing ? i.status !== 'ARCHIVED' : i.status === 'PUBLISHED')
  );

  const selectedGuide = guides.find((g) => g.id === selectedId) || null;

  const handleAddGuide = async () => {
    const suffix = Math.random().toString(36).slice(2, 6);
    const created = await onCreate({
      content_type: 'article',
      slug: `buyer-guide-${suffix}`,
      title: 'New Buyer Guide',
      summary: 'One-sentence overview shown on the Guides page.',
      body: 'Click here to write practical advice for Philippine homebuyers.',
      payload: { category: 'Buyers' },
      status: 'DRAFT',
    });
    if (created?.id) {
      setSelectedId(created.id);
    }
  };

  if (selectedGuide) {
    return (
      <div className="p-6 md:p-8 bg-[#F8FAFC] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedId(null)}
            className="h-9 px-3 gap-2 text-xs"
          >
            <ArrowLeft className="size-4" />
            <span>Back to All Guides</span>
          </Button>
          <LiveCardControls
            item={selectedGuide}
            onTogglePublish={onTogglePublish}
            onRequestDelete={(item) => {
              onRequestDelete(item);
            }}
          />
        </div>

        <Card className="max-w-3xl mx-auto bg-white border border-[#E2E8F0] rounded-xl">
          <CardContent className="p-6 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
              <LiveEditableText
                value={selectedGuide.payload?.category || 'Guide'}
                ariaLabel="Edit guide category"
                onSave={(val) =>
                  onUpdate(selectedGuide.id, {
                    payload: { ...(selectedGuide.payload || {}), category: val },
                  })
                }
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E293B]">
              <LiveEditableText
                value={selectedGuide.title}
                ariaLabel="Edit guide title"
                onSave={(val) => onUpdate(selectedGuide.id, { title: val })}
              />
            </h1>

            <div className="text-base text-[#64748B]">
              <LiveEditableText
                value={selectedGuide.summary || ''}
                placeholder="Add short summary..."
                ariaLabel="Edit guide summary"
                onSave={(val) => onUpdate(selectedGuide.id, { summary: val })}
              />
            </div>

            <LiveEditableImage
              src={selectedGuide.media_url}
              alt={selectedGuide.title}
              emptyLabel="Add guide cover photo"
              className="w-full h-56 rounded-lg"
              onSave={(url) => onUpdate(selectedGuide.id, { media_url: url })}
            />

            <div className="text-sm text-[#1E293B] leading-relaxed whitespace-pre-line">
              <LiveEditableText
                multiline
                value={selectedGuide.body || ''}
                placeholder="Click to write the full article..."
                ariaLabel="Edit guide body"
                onSave={(val) => onUpdate(selectedGuide.id, { body: val })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-[#F8FAFC] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E293B]">
            Buying Guides &amp; Market Updates
          </h2>
          <p className="text-sm text-[#64748B] mt-1">
            Click any card to open and edit the full article, or click a title to rename it in place.
          </p>
        </div>
        <LiveSectionAddButton label="Add Buyer Guide" onClick={handleAddGuide} />
      </div>

      {guides.length === 0 ? (
        <p className="text-sm text-[#64748B]">No buyer guides yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Card key={guide.id} className="bg-white border border-[#E2E8F0] rounded-xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F766E]">
                    <BookOpen className="size-3.5" />
                    <span>{guide.payload?.category || 'Guide'}</span>
                  </div>
                  <LiveCardControls
                    item={guide}
                    onTogglePublish={onTogglePublish}
                    onRequestDelete={onRequestDelete}
                  />
                </div>

                <LiveEditableImage
                  src={guide.media_url}
                  alt={guide.title}
                  emptyLabel="Add cover photo"
                  className="w-full h-36 rounded-lg"
                  onSave={(url) => onUpdate(guide.id, { media_url: url })}
                />

                <div className="text-lg font-semibold text-[#1E293B]">
                  <LiveEditableText
                    value={guide.title}
                    ariaLabel={`Edit guide title ${guide.title}`}
                    onSave={(val) => onUpdate(guide.id, { title: val })}
                  />
                </div>

                <div className="text-xs text-[#64748B]">
                  <LiveEditableText
                    value={guide.summary || ''}
                    placeholder="Add short summary..."
                    onSave={(val) => onUpdate(guide.id, { summary: val })}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedId(guide.id)}
                  className="w-full h-9 text-xs font-semibold"
                >
                  Open &amp; Edit Full Article
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
