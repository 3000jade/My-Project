import React from 'react';
import { Sparkles, ArrowRight, Building2, Landmark, Trophy, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { LiveEditableText, useLiveEdit } from '@/components/cms/LiveCmsEditor';
import {
  LiveEditableImage,
  LiveCardControls,
  LiveSectionAddButton,
} from '@/components/cms/LiveCmsPrimitives';

export default function HomeLiveCanvas({
  items = [],
  onCreate,
  onUpdate,
  onTogglePublish,
  onRequestDelete,
}) {
  const { isEditing } = useLiveEdit();

  const filterVisible = (type) =>
    items.filter((i) => i.content_type === type && (isEditing ? i.status !== 'ARCHIVED' : i.status === 'PUBLISHED'));

  const banners = filterVisible('banner');
  const partners = filterVisible('partner');
  const developers = partners.filter((p) => p.payload?.partner_type !== 'bank');
  const banks = partners.filter((p) => p.payload?.partner_type === 'bank');
  const awards = filterVisible('award');
  const faqs = filterVisible('faq');

  return (
    <div className="divide-y divide-[#E2E8F0] bg-[#F8FAFC]">
      {/* 1. Top Announcement Banners */}
      <section className="p-6 space-y-4 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
            <Sparkles className="size-4" />
            <span>Homepage Announcement Bar</span>
          </div>
          <LiveSectionAddButton
            label="Add Banner"
            onClick={() =>
              onCreate({
                content_type: 'banner',
                title: 'New Open House Announcement',
                summary: 'Click to describe your promo or event.',
                payload: { cta_label: 'Explore Listings', cta_url: '/properties' },
                status: 'DRAFT',
              })
            }
          />
        </div>

        {banners.length === 0 ? (
          <p className="text-sm text-[#64748B] py-4">
            {isEditing
              ? 'No announcement banner yet. Click "Add Banner" to place a notice bar at the top of your Homepage.'
              : 'No published announcement banner.'}
          </p>
        ) : (
          <div className="space-y-3">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="rounded-xl bg-[#0F766E] text-white p-4 flex flex-col gap-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                    <Sparkles className="size-4 shrink-0" />
                    <div className="font-semibold text-sm min-w-[180px]">
                      <LiveEditableText
                        value={banner.title}
                        ariaLabel={`Edit banner title ${banner.title}`}
                        className="text-white border-white/50 bg-white/10"
                        onSave={(val) => onUpdate(banner.id, { title: val })}
                      />
                    </div>
                    <div className="text-sm opacity-90 min-w-[200px]">
                      <LiveEditableText
                        value={banner.summary || ''}
                        placeholder="Add short subtext..."
                        ariaLabel={`Edit banner summary ${banner.title}`}
                        className="text-white border-white/50 bg-white/10"
                        onSave={(val) => onUpdate(banner.id, { summary: val })}
                      />
                    </div>
                  </div>
                  <LiveCardControls
                    item={banner}
                    onTogglePublish={onTogglePublish}
                    onRequestDelete={onRequestDelete}
                  />
                </div>

                {isEditing && (
                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/20 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="opacity-80">Button:</span>
                      <LiveEditableText
                        value={banner.payload?.cta_label || ''}
                        placeholder="Button text"
                        className="text-white border-white/40 bg-white/10 text-xs"
                        onSave={(val) =>
                          onUpdate(banner.id, {
                            payload: { ...(banner.payload || {}), cta_label: val },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="opacity-80">Link:</span>
                      <LiveEditableText
                        value={banner.payload?.cta_url || ''}
                        placeholder="/properties"
                        className="text-white border-white/40 bg-white/10 text-xs"
                        onSave={(val) =>
                          onUpdate(banner.id, {
                            payload: { ...(banner.payload || {}), cta_url: val },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {!isEditing && banner.payload?.cta_label && (
                  <div className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-4">
                    <span>{banner.payload.cta_label}</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Trusted Industry Partners (Developers & Banks) */}
      <section className="p-6 space-y-6 bg-white">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
            Collaboration &amp; Network
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[#1E293B]">
            Our Trusted Industry Partners
          </h2>
        </div>

        {/* Developers */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
              <Building2 className="size-4 text-[#0F766E]" />
              <span>Partner Developers</span>
            </div>
            <LiveSectionAddButton
              label="Add Developer"
              onClick={() =>
                onCreate({
                  content_type: 'partner',
                  title: 'New Partner Developer',
                  payload: { partner_type: 'developer' },
                  status: 'DRAFT',
                })
              }
            />
          </div>

          {developers.length === 0 ? (
            <p className="text-xs text-[#64748B]">
              No partner developers added yet (the public homepage shows placeholders until you add &amp; publish one).
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {developers.map((partner) => (
                <Card key={partner.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-end">
                      <LiveCardControls
                        item={partner}
                        onTogglePublish={onTogglePublish}
                        onRequestDelete={onRequestDelete}
                      />
                    </div>
                    <LiveEditableImage
                      src={partner.media_url}
                      alt={partner.title}
                      contain
                      emptyLabel="Add developer logo"
                      className="w-full h-24 rounded-lg bg-white p-2 border border-[#E2E8F0]"
                      onSave={(url) => onUpdate(partner.id, { media_url: url })}
                    />
                    <div className="text-sm font-semibold text-[#1E293B]">
                      <LiveEditableText
                        value={partner.title}
                        ariaLabel={`Edit developer name ${partner.title}`}
                        onSave={(val) => onUpdate(partner.id, { title: val })}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Partner Banks */}
        <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
              <Landmark className="size-4 text-[#0F766E]" />
              <span>Partner Banks</span>
            </div>
            <LiveSectionAddButton
              label="Add Partner Bank"
              onClick={() =>
                onCreate({
                  content_type: 'partner',
                  title: 'New Partner Bank',
                  payload: { partner_type: 'bank' },
                  status: 'DRAFT',
                })
              }
            />
          </div>

          {banks.length === 0 ? (
            <p className="text-xs text-[#64748B]">
              No partner banks added yet (the public homepage shows placeholders until you add &amp; publish one).
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {banks.map((bank) => (
                <Card key={bank.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-end">
                      <LiveCardControls
                        item={bank}
                        onTogglePublish={onTogglePublish}
                        onRequestDelete={onRequestDelete}
                      />
                    </div>
                    <LiveEditableImage
                      src={bank.media_url}
                      alt={bank.title}
                      contain
                      emptyLabel="Add bank logo"
                      className="w-full h-24 rounded-lg bg-white p-2 border border-[#E2E8F0]"
                      onSave={(url) => onUpdate(bank.id, { media_url: url })}
                    />
                    <div className="text-sm font-semibold text-[#1E293B]">
                      <LiveEditableText
                        value={bank.title}
                        ariaLabel={`Edit bank name ${bank.title}`}
                        onSave={(val) => onUpdate(bank.id, { title: val })}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Awards & Historical Honors */}
      <section className="p-6 space-y-4 bg-[#F8FAFC]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
              <Trophy className="size-4" />
              <span>Historical Honors</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1E293B] mt-1">
              Awards &amp; Achievements
            </h2>
          </div>
          <LiveSectionAddButton
            label="Add Award"
            onClick={() =>
              onCreate({
                content_type: 'award',
                title: 'New Brokerage Award',
                summary: 'Short highlight shown on the featured slider.',
                payload: {
                  year: String(new Date().getFullYear()),
                  organization: 'Awarding Organization',
                  media_type: 'image',
                  featured: true,
                },
                status: 'DRAFT',
              })
            }
          />
        </div>

        {awards.length === 0 ? (
          <p className="text-xs text-[#64748B]">
            No awards added yet (the public homepage shows default awards until you add &amp; publish one).
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {awards.map((award) => (
              <Card key={award.id} className="bg-white border border-[#E2E8F0] rounded-xl">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-block bg-[#CCFBF1] text-[#0F766E] rounded-full px-2.5 py-0.5 text-xs font-bold">
                      <LiveEditableText
                        value={String(award.payload?.year || '')}
                        placeholder="Year"
                        ariaLabel={`Edit award year for ${award.title}`}
                        onSave={(val) =>
                          onUpdate(award.id, {
                            payload: { ...(award.payload || {}), year: val },
                          })
                        }
                      />
                    </div>
                    <LiveCardControls
                      item={award}
                      onTogglePublish={onTogglePublish}
                      onRequestDelete={onRequestDelete}
                    />
                  </div>

                  <LiveEditableImage
                    src={award.media_url}
                    alt={award.title}
                    emptyLabel="Add award photo (optional)"
                    className="w-full h-36 rounded-lg"
                    onSave={(url) =>
                      onUpdate(award.id, {
                        media_url: url,
                        payload: { ...(award.payload || {}), media_type: 'image' },
                      })
                    }
                  />

                  <div className="text-base font-bold text-[#1E293B]">
                    <LiveEditableText
                      value={award.title}
                      ariaLabel={`Edit award title ${award.title}`}
                      onSave={(val) => onUpdate(award.id, { title: val })}
                    />
                  </div>

                  <div className="text-xs text-[#64748B]">
                    <LiveEditableText
                      value={award.summary || ''}
                      placeholder="Add short description..."
                      onSave={(val) => onUpdate(award.id, { summary: val })}
                    />
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0] text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    <LiveEditableText
                      value={award.payload?.organization || ''}
                      placeholder="Awarding organization"
                      onSave={(val) =>
                        onUpdate(award.id, {
                          payload: { ...(award.payload || {}), organization: val },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 4. Frequently Asked Questions */}
      <section className="p-6 space-y-4 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
              <HelpCircle className="size-4" />
              <span>Buyer Help</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1E293B] mt-1">
              Frequently Asked Questions
            </h2>
          </div>
          <LiveSectionAddButton
            label="Add FAQ"
            onClick={() =>
              onCreate({
                content_type: 'faq',
                title: 'New buyer question?',
                body: 'Click to write a clear, helpful answer for homebuyers.',
                payload: { category: 'Buyers' },
                status: 'DRAFT',
              })
            }
          />
        </div>

        {faqs.length === 0 ? (
          <p className="text-xs text-[#64748B]">No FAQs added yet.</p>
        ) : (
          <Accordion className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="px-4 py-2">
                <div className="flex items-center justify-between gap-2">
                  <AccordionTrigger className="flex-1 text-left text-sm font-semibold text-[#1E293B]">
                    <LiveEditableText
                      value={faq.title}
                      ariaLabel={`Edit FAQ question ${faq.title}`}
                      onSave={(val) => onUpdate(faq.id, { title: val })}
                    />
                  </AccordionTrigger>
                  <LiveCardControls
                    item={faq}
                    onTogglePublish={onTogglePublish}
                    onRequestDelete={onRequestDelete}
                  />
                </div>
                <AccordionContent className="pt-2 pb-4 text-sm text-[#64748B]">
                  <LiveEditableText
                    multiline
                    value={faq.body || ''}
                    placeholder="Write the answer..."
                    ariaLabel={`Edit FAQ answer for ${faq.title}`}
                    onSave={(val) => onUpdate(faq.id, { body: val })}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>
    </div>
  );
}
