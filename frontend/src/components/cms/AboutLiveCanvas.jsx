import React from 'react';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LiveEditableText, useLiveEdit } from '@/components/cms/LiveCmsEditor';
import {
  LiveEditableImage,
  LiveCardControls,
  LiveSectionAddButton,
} from '@/components/cms/LiveCmsPrimitives';

const DEFAULT_ABOUT_TITLE = 'Selling Homes, Building Dreams.';
const DEFAULT_ABOUT_SUMMARY =
  'Since 1989, Human Shelter has been selling homes and building dreams, helping Filipino families find the perfect home for their needs and empowering real estate agents to discover their purpose.';

export default function AboutLiveCanvas({
  items = [],
  onCreate,
  onUpdate,
  onTogglePublish,
  onRequestDelete,
}) {
  const { isEditing } = useLiveEdit();

  const aboutPage = items.find(
    (i) => i.content_type === 'page' && i.slug === 'about-us' && i.status !== 'ARCHIVED'
  );

  const staffItems = items.filter(
    (i) => i.content_type === 'staff' && (isEditing ? i.status !== 'ARCHIVED' : i.status === 'PUBLISHED')
  );

  const saveAboutField = async (field, nextValue) => {
    if (aboutPage?.id) {
      await onUpdate(aboutPage.id, { [field]: nextValue });
    } else {
      await onCreate({
        content_type: 'page',
        slug: 'about-us',
        title: field === 'title' ? nextValue : DEFAULT_ABOUT_TITLE,
        summary: field === 'summary' ? nextValue : DEFAULT_ABOUT_SUMMARY,
        body: field === 'body' ? nextValue : null,
        status: 'PUBLISHED',
      });
    }
  };

  // Group staff by department while preserving order
  const departmentMap = new Map();
  for (const member of staffItems) {
    const dept = member.payload?.department?.trim() || 'Our Team';
    if (!departmentMap.has(dept)) departmentMap.set(dept, []);
    departmentMap.get(dept).push(member);
  }
  const departments = Array.from(departmentMap.entries());

  return (
    <div className="divide-y divide-[#E2E8F0] bg-[#F8FAFC]">
      {/* 1. About Us Hero Story */}
      <section className="p-6 md:p-8 bg-white space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0F766E]">
            About Us Hero Story
          </span>
          {aboutPage && (
            <LiveCardControls
              item={aboutPage}
              onTogglePublish={onTogglePublish}
              onRequestDelete={onRequestDelete}
            />
          )}
        </div>

        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0F766E]">
            <LiveEditableText
              value={aboutPage?.title || DEFAULT_ABOUT_TITLE}
              ariaLabel="Edit About Us headline"
              onSave={(val) => saveAboutField('title', val)}
            />
          </h1>

          <div className="text-base text-[#1E293B] leading-relaxed">
            <LiveEditableText
              multiline
              value={aboutPage?.summary || DEFAULT_ABOUT_SUMMARY}
              ariaLabel="Edit About Us summary"
              onSave={(val) => saveAboutField('summary', val)}
            />
          </div>

          {(aboutPage?.body || isEditing) && (
            <div className="text-sm text-[#64748B] leading-relaxed">
              <LiveEditableText
                multiline
                value={aboutPage?.body || ''}
                placeholder="Click to add extra company story paragraphs..."
                ariaLabel="Edit About Us story body"
                onSave={(val) => saveAboutField('body', val)}
              />
            </div>
          )}
        </div>
      </section>

      {/* 2. Staff & Team Directory */}
      <section className="p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
              <Users className="size-4" />
              <span>Our People</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1E293B] mt-1">
              Human Shelter Realty Team
            </h2>
          </div>

          <LiveSectionAddButton
            label="Add Staff Member"
            onClick={() =>
              onCreate({
                content_type: 'staff',
                title: 'New Team Member',
                payload: {
                  department: 'Business Development & Growth',
                  role: 'Property Specialist',
                },
                status: 'DRAFT',
              })
            }
          />
        </div>

        {departments.length === 0 ? (
          <p className="text-sm text-[#64748B]">
            No CMS staff members yet (the public About Us page uses the built-in directory until you add &amp; publish staff here).
          </p>
        ) : (
          <div className="space-y-8">
            {departments.map(([deptName, members]) => (
              <div key={deptName} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
                  <h3 className="text-lg font-bold text-[#1E293B]">{deptName}</h3>
                  <Badge variant="outline" className="text-xs">
                    {members.length} {members.length === 1 ? 'Member' : 'Members'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {members.map((member) => (
                    <Card
                      key={member.id}
                      className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden"
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-end">
                          <LiveCardControls
                            item={member}
                            onTogglePublish={onTogglePublish}
                            onRequestDelete={onRequestDelete}
                          />
                        </div>

                        <LiveEditableImage
                          src={member.media_url}
                          alt={member.title}
                          emptyLabel="Add portrait photo"
                          className="w-full aspect-square rounded-lg"
                          onSave={(url) => onUpdate(member.id, { media_url: url })}
                        />

                        <div className="space-y-1">
                          <div className="text-base font-bold text-[#1E293B]">
                            <LiveEditableText
                              value={member.title}
                              ariaLabel={`Edit staff name ${member.title}`}
                              onSave={(val) => onUpdate(member.id, { title: val })}
                            />
                          </div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
                            <LiveEditableText
                              value={member.payload?.role || ''}
                              placeholder="Job role"
                              ariaLabel={`Edit staff role for ${member.title}`}
                              onSave={(val) =>
                                onUpdate(member.id, {
                                  payload: { ...(member.payload || {}), role: val },
                                })
                              }
                            />
                          </div>
                          {isEditing && (
                            <div className="text-xs text-[#64748B] pt-1">
                              <LiveEditableText
                                value={member.payload?.department || ''}
                                placeholder="Department"
                                ariaLabel={`Edit staff department for ${member.title}`}
                                onSave={(val) =>
                                  onUpdate(member.id, {
                                    payload: { ...(member.payload || {}), department: val },
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
