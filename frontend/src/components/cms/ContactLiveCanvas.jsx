import React from 'react';
import {
  MessageCircle,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Clock,
  Building2,
  Award,
  ExternalLink,
  Globe,
  Star,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LiveEditableText, useLiveEdit } from '@/components/cms/LiveCmsEditor';
import {
  LiveEditableImage,
  LiveCardControls,
  LiveSectionAddButton,
} from '@/components/cms/LiveCmsPrimitives';
import { DEFAULT_CONTACT_CONTENT } from '@/utils/contactHelpers';

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
        title: patch.title || DEFAULT_CONTACT_CONTENT.headline,
        summary: patch.summary || DEFAULT_CONTACT_CONTENT.intro,
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
      {/* 1. Contact Page Headline, Direct Channels & Trust Info */}
      <section className="p-6 md:p-8 bg-white flex flex-col gap-6">
        <div className="max-w-2xl flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0F766E]">
            Contact Page Header &amp; Channels
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[#1E293B]">
            <LiveEditableText
              value={contactPage?.title || DEFAULT_CONTACT_CONTENT.headline}
              ariaLabel="Edit Contact page headline"
              onSave={(val) => saveContact({ title: val })}
            />
          </h1>
          <div className="text-sm text-[#64748B]">
            <LiveEditableText
              multiline
              value={contactPage?.summary || DEFAULT_CONTACT_CONTENT.intro}
              ariaLabel="Edit Contact page intro"
              onSave={(val) => saveContact({ summary: val })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <Phone className="size-4 text-[#0F766E]" />
                <span>Main Phone Number</span>
              </div>
              <div className="text-xs text-[#64748B]">
                <LiveEditableText
                  value={contactPage?.payload?.contact_phone || DEFAULT_CONTACT_CONTENT.phone}
                  ariaLabel="Edit main phone number"
                  onSave={(val) => saveChannel('contact_phone', val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <MessageCircle className="size-4 text-[#0F766E]" />
                <span>WhatsApp Link</span>
              </div>
              <div className="text-xs text-[#64748B] break-all">
                <LiveEditableText
                  value={contactPage?.payload?.whatsapp_url || DEFAULT_CONTACT_CONTENT.whatsappUrl}
                  ariaLabel="Edit WhatsApp link"
                  onSave={(val) => saveChannel('whatsapp_url', val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <Calendar className="size-4 text-[#0F766E]" />
                <span>Booking Calendar Link</span>
              </div>
              <div className="text-xs text-[#64748B] break-all">
                <LiveEditableText
                  value={contactPage?.payload?.calendly_url || DEFAULT_CONTACT_CONTENT.calendlyUrl}
                  ariaLabel="Edit booking calendar link"
                  onSave={(val) => saveChannel('calendly_url', val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <Mail className="size-4 text-[#0F766E]" />
                <span>Company Email</span>
              </div>
              <div className="text-xs text-[#64748B] break-all">
                <LiveEditableText
                  value={contactPage?.payload?.contact_email || DEFAULT_CONTACT_CONTENT.email}
                  ariaLabel="Edit company email"
                  onSave={(val) => saveChannel('contact_email', val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <Clock className="size-4 text-[#0F766E]" />
                <span>Response Time</span>
              </div>
              <div className="text-xs text-[#64748B]">
                <LiveEditableText
                  value={contactPage?.payload?.response_time || DEFAULT_CONTACT_CONTENT.responseTime}
                  ariaLabel="Edit response time"
                  onSave={(val) => saveChannel('response_time', val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <Award className="size-4 text-[#0F766E]" />
                <span>Brokerage Credentials</span>
              </div>
              <div className="text-xs text-[#64748B]">
                <LiveEditableText
                  value={contactPage?.payload?.credentials_text || DEFAULT_CONTACT_CONTENT.credentialsText}
                  ariaLabel="Edit brokerage credentials"
                  onSave={(val) => saveChannel('credentials_text', val)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 2. Office Branches */}
      <section className="p-6 md:p-8 flex flex-col gap-6">
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
                  region: 'Metro Manila',
                  address: '123 Main Street, Metro Manila',
                  phone: '+63 2 8000 0000',
                  hours: 'Mon–Sat, 9:00 AM – 6:00 PM',
                  map_url: '',
                  whatsapp_url: '',
                  is_headquarters: offices.length === 0,
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
            {offices.map((office) => {
              const isHq = Boolean(office.payload?.is_headquarters);
              return (
                <Card key={office.id} className="bg-white border border-[#E2E8F0] rounded-xl">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant={isHq ? 'default' : 'outline'}
                        size="sm"
                        className="normal-case tracking-normal text-xs"
                        onClick={() =>
                          onUpdate(office.id, {
                            payload: { ...(office.payload || {}), is_headquarters: !isHq },
                          })
                        }
                      >
                        <Star className="size-3.5" aria-hidden="true" />
                        <span>{isHq ? 'Main Office' : 'Set as Main Office'}</span>
                      </Button>
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

                    <div className="flex flex-col gap-2 text-xs text-[#64748B]">
                      <div className="flex items-center gap-2">
                        <Globe className="size-4 text-[#0F766E] shrink-0" />
                        <LiveEditableText
                          value={office.payload?.region || ''}
                          placeholder="Area / City (e.g. Metro Manila, Cebu)"
                          onSave={(val) =>
                            onUpdate(office.id, {
                              payload: { ...(office.payload || {}), region: val },
                            })
                          }
                        />
                      </div>
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
                      <div className="flex items-center gap-2">
                        <ExternalLink className="size-4 text-[#0F766E] shrink-0" />
                        <LiveEditableText
                          value={office.payload?.map_url || ''}
                          placeholder="Google Maps link (https://...)"
                          onSave={(val) =>
                            onUpdate(office.id, {
                              payload: { ...(office.payload || {}), map_url: val },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="size-4 text-[#0F766E] shrink-0" />
                        <LiveEditableText
                          value={office.payload?.whatsapp_url || ''}
                          placeholder="Branch WhatsApp link (optional)"
                          onSave={(val) =>
                            onUpdate(office.id, {
                              payload: { ...(office.payload || {}), whatsapp_url: val },
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
