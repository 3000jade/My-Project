import React from 'react';
import { MessageCircle, Calendar, Mail, MapPin, Phone, Clock, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LiveEditableText, useLiveEdit } from '@/components/cms/LiveCmsEditor';
import {
  LiveEditableImage,
  LiveCardControls,
  LiveSectionAddButton,
} from '@/components/cms/LiveCmsPrimitives';

const DEFAULT_HEADLINE = 'Ready to start the conversation?';
const DEFAULT_INTRO =
  "Whether you're ready to buy, thinking of selling, or just want to understand the current market in BGC and beyond—let's grab coffee.";

export default function ContactLiveCanvas({
  items = [],
  onCreate,
  onUpdate,
  onTogglePublish,
  onRequestDelete,
}) {
  const { isEditing } = useLiveEdit();

  const contactPage = items.find(
    (i) => i.content_type === 'page' && i.slug === 'contact-us' && i.status !== 'ARCHIVED'
  );

  const offices = items.filter(
    (i) => i.content_type === 'office' && (isEditing ? i.status !== 'ARCHIVED' : i.status === 'PUBLISHED')
  );

  const saveContact = async (patch) => {
    if (contactPage?.id) {
      await onUpdate(contactPage.id, patch);
    } else {
      await onCreate({
        content_type: 'page',
        slug: 'contact-us',
        title: patch.title || DEFAULT_HEADLINE,
        summary: patch.summary || DEFAULT_INTRO,
        payload: patch.payload || {},
        status: 'PUBLISHED',
      });
    }
  };

  const saveChannel = (key, value) =>
    saveContact({
      payload: { ...(contactPage?.payload || {}), [key]: value },
    });

  return (
    <div className="divide-y divide-[#E2E8F0] bg-[#F8FAFC]">
      {/* 1. Contact Page Headline & Direct Channels */}
      <section className="p-6 md:p-8 bg-white space-y-6">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0F766E]">
            Contact Page Header &amp; Channels
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[#1E293B]">
            <LiveEditableText
              value={contactPage?.title || DEFAULT_HEADLINE}
              ariaLabel="Edit Contact page headline"
              onSave={(val) => saveContact({ title: val })}
            />
          </h1>
          <div className="text-sm text-[#64748B]">
            <LiveEditableText
              multiline
              value={contactPage?.summary || DEFAULT_INTRO}
              ariaLabel="Edit Contact page intro"
              onSave={(val) => saveContact({ summary: val })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <MessageCircle className="size-4 text-[#0F766E]" />
                <span>WhatsApp Link</span>
              </div>
              <div className="text-xs text-[#64748B] break-all">
                <LiveEditableText
                  value={contactPage?.payload?.whatsapp_url || 'https://wa.me/639170000000'}
                  ariaLabel="Edit WhatsApp link"
                  onSave={(val) => saveChannel('whatsapp_url', val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <Calendar className="size-4 text-[#0F766E]" />
                <span>Booking Calendar Link</span>
              </div>
              <div className="text-xs text-[#64748B] break-all">
                <LiveEditableText
                  value={contactPage?.payload?.calendly_url || 'https://calendly.com'}
                  ariaLabel="Edit booking calendar link"
                  onSave={(val) => saveChannel('calendly_url', val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <Mail className="size-4 text-[#0F766E]" />
                <span>Company Email</span>
              </div>
              <div className="text-xs text-[#64748B] break-all">
                <LiveEditableText
                  value={contactPage?.payload?.contact_email || 'hello@humanshelter.ph'}
                  ariaLabel="Edit company email"
                  onSave={(val) => saveChannel('contact_email', val)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 2. Office Branches */}
      <section className="p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
              <Building2 className="size-4" />
              <span>Locations</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1E293B] mt-1">
              Our Office Branches
            </h2>
          </div>
          <LiveSectionAddButton
            label="Add Office Branch"
            onClick={() =>
              onCreate({
                content_type: 'office',
                title: 'New Office Branch',
                payload: {
                  address: '123 Main Street, Metro Manila',
                  phone: '+63 2 8000 0000',
                  hours: 'Mon–Sat, 9:00 AM – 6:00 PM',
                },
                status: 'DRAFT',
              })
            }
          />
        </div>

        {offices.length === 0 ? (
          <p className="text-sm text-[#64748B]">
            No office branches yet. Click &ldquo;Add Office Branch&rdquo; to display branch cards on your Contact page.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offices.map((office) => (
              <Card key={office.id} className="bg-white border border-[#E2E8F0] rounded-xl">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-end">
                    <LiveCardControls
                      item={office}
                      onTogglePublish={onTogglePublish}
                      onRequestDelete={onRequestDelete}
                    />
                  </div>

                  <LiveEditableImage
                    src={office.media_url}
                    alt={office.title}
                    emptyLabel="Add branch photo (optional)"
                    className="w-full h-36 rounded-lg"
                    onSave={(url) => onUpdate(office.id, { media_url: url })}
                  />

                  <div className="text-lg font-bold text-[#1E293B]">
                    <LiveEditableText
                      value={office.title}
                      ariaLabel={`Edit branch name ${office.title}`}
                      onSave={(val) => onUpdate(office.id, { title: val })}
                    />
                  </div>

                  <div className="space-y-2 text-xs text-[#64748B]">
                    <div className="flex items-start gap-2">
                      <MapPin className="size-4 text-[#0F766E] shrink-0 mt-1" />
                      <LiveEditableText
                        value={office.payload?.address || ''}
                        placeholder="Branch address"
                        onSave={(val) =>
                          onUpdate(office.id, {
                            payload: { ...(office.payload || {}), address: val },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-[#0F766E] shrink-0" />
                      <LiveEditableText
                        value={office.payload?.phone || ''}
                        placeholder="Phone number"
                        onSave={(val) =>
                          onUpdate(office.id, {
                            payload: { ...(office.payload || {}), phone: val },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-[#0F766E] shrink-0" />
                      <LiveEditableText
                        value={office.payload?.hours || ''}
                        placeholder="Office hours"
                        onSave={(val) =>
                          onUpdate(office.id, {
                            payload: { ...(office.payload || {}), hours: val },
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
