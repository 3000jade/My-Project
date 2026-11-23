import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { salesDepartmentPhoto, staffDepartments } from '../../mockData/mockAbout';
import { Badge } from '@/components/ui/badge';
import cmsService from '../../services/cmsService';
import { LiveEditProvider, LiveEditFloatingBar, LiveEditableText } from '../../components/cms/LiveCmsEditor';

export default function AboutPage() {
  const [cmsAbout, setCmsAbout] = useState(null);

  const saveAboutField = async (field, nextValue) => {
    const fallbackTitle = cmsAbout?.title || 'Selling Homes, Building Dreams.';
    const fallbackSummary =
      cmsAbout?.summary ||
      'Since 1989, Human Shelter has been selling homes and building dreams, helping Filipino families find the perfect home for their needs and empowering real estate agents to discover their purpose.';
    if (cmsAbout?.id) {
      const updated = await cmsService.updateContent(cmsAbout.id, { [field]: nextValue });
      setCmsAbout(updated);
    } else {
      const created = await cmsService.createContent({
        content_type: 'page',
        slug: 'about-us',
        title: field === 'title' ? nextValue : fallbackTitle,
        summary: field === 'summary' ? nextValue : fallbackSummary,
        body: field === 'body' ? nextValue : null,
        status: 'PUBLISHED',
      });
      setCmsAbout(created);
    }
  };

  useEffect(() => {
    let mounted = true;
    cmsService
      .getPublicContentBySlug('page', 'about-us')
      .then((item) => {
        if (mounted && item) setCmsAbout(item);
      })
      .catch(() => { });
    return () => {
      mounted = false;
    };
  }, []);
  const revealVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 100 }
    }
  };

  return (
    <LiveEditProvider>
      <div
        className="text-on-surface font-body-md min-h-screen"
        style={{
          backgroundColor: '#F8FAFC',
          backgroundImage: "url('/images/topographic-bg.svg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '600px 600px',
        }}
      >
        <main className="">
          {/* Sophisticated Hero Section */}
          <section className="relative pt-32 lg:pt-40 pb-12 max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16 overflow-hidden">
            <div className="max-w-3xl w-full">
              <motion.div
                className="z-10"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={revealVariants}
              >
                <div className="flex items-center gap-4 mb-8">
                  <span className="h-px w-12 bg-[#E07A5F]"></span>
                  <span className="font-sans text-[#E07A5F] font-bold text-[12px] tracking-[0.2em] uppercase">Established 1989 • 37 Years of Trusted Homeownership in the Philippines</span>
                </div>
                <h1 className="font-display text-5xl lg:text-7xl text-[#0F766E] mb-8 leading-[1.1] font-extrabold tracking-tight">
                  <LiveEditableText
                    value={cmsAbout?.title || 'Selling Homes, Building Dreams.'}
                    onSave={(val) => saveAboutField('title', val)}
                  >
                    {cmsAbout?.title || (
                      <>
                        Selling Homes, <span className="text-[#E76F51] italic font-serif block">Building Dreams.</span>
                      </>
                    )}
                  </LiveEditableText>
                </h1>
                <p className="font-display text-on-surface-variant max-w-2xl mb-6 leading-relaxed text-xl opacity-90">
                  <LiveEditableText
                    value={
                      cmsAbout?.summary ||
                      'Since 1989, Human Shelter has been selling homes and building dreams, helping Filipino families find the perfect home for their needs and empowering real estate agents to discover their purpose.'
                    }
                    onSave={(val) => saveAboutField('summary', val)}
                  />
                </p>
                {(cmsAbout?.body || cmsAbout?.id) && (
                  <p className="text-base text-on-surface-variant max-w-2xl mb-6 leading-relaxed whitespace-pre-line">
                    <LiveEditableText
                      value={cmsAbout?.body || ''}
                      placeholder="Add extra company story text..."
                      onSave={(val) => saveAboutField('body', val)}
                    />
                  </p>
                )}
              </motion.div>
            </div>
          </section>

          {/* Human Shelter Realty Staff Directory */}
          <section id="our-team" className="py-24 max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16 w-full">
            <motion.div
              className="max-w-3xl mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={revealVariants}
            >
              <span className="font-sans text-[#E07A5F] font-bold text-[12px] tracking-[0.3em] uppercase mb-3 block">
                Our People
              </span>
              <h2 className="font-display text-primary text-4xl lg:text-5xl mb-4 font-bold">
                Human Shelter Realty Team
              </h2>
              <p className="text-on-surface-variant font-display text-lg">
                Meet the dedicated sales, business development, accounting, marketing, and logistics professionals serving Filipino families across our branches.
              </p>
            </motion.div>

            {/* Sales Department Group Photo Banner */}
            <motion.div
              className="mb-14 rounded-3xl overflow-hidden border border-[#E2E8F0] bg-white shadow-sm"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={revealVariants}
            >
              <div className="relative w-full aspect-[16/7] sm:aspect-[21/8] bg-slate-100 overflow-hidden">
                <img
                  src={salesDepartmentPhoto.image}
                  alt="Human Shelter Realty Corp. Sales Department group photograph"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white border-t border-[#E2E8F0]">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1E293B]">
                    {salesDepartmentPhoto.title}
                  </h3>
                  <p className="text-sm text-[#64748B] font-sans">
                    {salesDepartmentPhoto.subtitle}
                  </p>
                </div>
                <Badge variant="default">Human Shelter Realty Corp.</Badge>
              </div>
            </motion.div>

            {/* Stacked Department Sections (Scrollable Directory) */}
            <div className="space-y-16">
              {staffDepartments.map((dept) => (
                <div key={dept.id} id={dept.id} className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#1E293B]">
                      {dept.label}
                    </h3>
                    <Badge variant="outline" className="font-mono text-xs">
                      {dept.members.length} {dept.members.length === 1 ? 'Member' : 'Members'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {dept.members.map((member) => {
                      const initials = member.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <div
                          key={member.id}
                          className="group rounded-2xl overflow-hidden bg-white border border-[#E2E8F0] shadow-xs hover:shadow-md transition-all duration-300"
                        >
                          <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={`${member.name} — ${member.role}`}
                                loading="lazy"
                                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-[#F1F5F9] text-[#0F766E] gap-2">
                                <span className="w-16 h-16 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/20 flex items-center justify-center font-display font-bold text-xl">
                                  {initials}
                                </span>
                                <span className="text-[11px] font-sans text-[#64748B]">
                                  Photo coming soon
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h4 className="font-display text-lg font-bold text-[#1E293B] leading-snug">
                              {member.name}
                            </h4>
                            <p className="font-sans text-xs font-semibold text-[#0F766E] uppercase tracking-wider mt-1">
                              {member.role}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>
        <LiveEditFloatingBar />
      </div>
    </LiveEditProvider>
  );
}
