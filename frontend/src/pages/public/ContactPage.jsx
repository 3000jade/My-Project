import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MotionConfig, motion } from 'framer-motion';
import {
  Phone,
  MessageCircle,
  Calendar,
  Mail,
  Clock,
  Award,
  Quote,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import cmsService from '@/services/cmsService';
import { LiveEditProvider, LiveEditFloatingBar, LiveEditableText } from '@/components/cms/LiveCmsEditor';
import BranchDirectory from '@/components/contact/BranchDirectory';
import ContactInquiryForm from '@/components/contact/ContactInquiryForm';
import {
  DEFAULT_CONTACT_CONTENT,
  safeHttpUrl,
  toTelHref,
  normalizeBranches,
} from '@/utils/contactHelpers';

export default function ContactPage() {
  const [cmsContact, setCmsContact] = useState(null);
  const [offices, setOffices] = useState([]);
  const [isLoadingOffices, setIsLoadingOffices] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const saveContactField = async (field, nextValue) => {
    const fallbackTitle = cmsContact?.title || DEFAULT_CONTACT_CONTENT.headline;
    const fallbackSummary = cmsContact?.summary || DEFAULT_CONTACT_CONTENT.intro;
    if (cmsContact?.id) {
      const updated = await cmsService.updateContent(cmsContact.id, { [field]: nextValue });
      setCmsContact(updated);
    } else {
      const created = await cmsService.createContent({
        content_type: 'page',
        slug: 'contact-us',
        title: field === 'title' ? nextValue : fallbackTitle,
        summary: field === 'summary' ? nextValue : fallbackSummary,
        status: 'PUBLISHED',
      });
      setCmsContact(created);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Contact | Human Shelter';

    let mounted = true;
    cmsService
      .getPublicContents('page')
      .then((items) => {
        const match = Array.isArray(items)
          ? items.find((item) => item?.slug === 'contact-us')
          : null;
        if (mounted && match) setCmsContact(match);
      })
      .catch(() => {});

    cmsService
      .getPublicContents('office')
      .then((items) => {
        if (mounted && Array.isArray(items)) setOffices(items);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoadingOffices(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const payload = cmsContact?.payload || {};
  const headline = cmsContact?.title || DEFAULT_CONTACT_CONTENT.headline;
  const intro = cmsContact?.summary || DEFAULT_CONTACT_CONTENT.intro;
  const eyebrow = payload.eyebrow || DEFAULT_CONTACT_CONTENT.eyebrow;
  const contactPhone = payload.contact_phone || DEFAULT_CONTACT_CONTENT.phone;
  const contactTelHref = toTelHref(contactPhone);
  const whatsappUrl = safeHttpUrl(payload.whatsapp_url) || DEFAULT_CONTACT_CONTENT.whatsappUrl;
  const calendlyUrl = safeHttpUrl(payload.calendly_url) || DEFAULT_CONTACT_CONTENT.calendlyUrl;
  const responseTime = payload.response_time || DEFAULT_CONTACT_CONTENT.responseTime;
  const credentialsText = payload.credentials_text || DEFAULT_CONTACT_CONTENT.credentialsText;
  const testimonialQuote = payload.testimonial_quote || DEFAULT_CONTACT_CONTENT.testimonialQuote;
  const testimonialAuthor = payload.testimonial_author || DEFAULT_CONTACT_CONTENT.testimonialAuthor;

  const rawEmail = typeof payload.contact_email === 'string' ? payload.contact_email.trim() : '';
  const contactEmail =
    rawEmail && !/[\r\n\s]/.test(rawEmail) && rawEmail.includes('@')
      ? rawEmail
      : DEFAULT_CONTACT_CONTENT.email;

  const branches = useMemo(() => {
    const normalized = normalizeBranches(offices);
    return normalized.length > 0 ? normalized : [DEFAULT_CONTACT_CONTENT.fallbackBranch];
  }, [offices]);

  const handleSelectBranchFromDirectory = (branch) => {
    setSelectedBranchId(branch.id);
    const formEl = document.getElementById('contact-form');
    if (formEl && typeof formEl.scrollIntoView === 'function') {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      formEl.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <LiveEditProvider>
        <div
          className="text-[#1E293B] font-sans min-h-screen pt-24 pb-24 bg-[#F8FAFC]"
          style={{
            backgroundImage: "url('/images/topographic-bg.svg')",
            backgroundRepeat: 'repeat',
            backgroundSize: '600px 600px',
          }}
        >
          <main className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 pt-8 md:pt-12 flex flex-col gap-12">
            {/* Header Section */}
            <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="flex items-center gap-3 justify-center">
                  <span className="w-6 h-0.5 bg-[#0F766E]" />
                  <span className="text-xs font-semibold tracking-wider text-[#0F766E] uppercase">
                    {eyebrow}
                  </span>
                  <span className="w-6 h-0.5 bg-[#0F766E]" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1E293B]">
                  <LiveEditableText
                    value={headline}
                    onSave={(val) => saveContactField('title', val)}
                  />
                </h1>
                <div className="text-[#64748B] text-base md:text-lg leading-relaxed">
                  <LiveEditableText
                    value={intro}
                    onSave={(val) => saveContactField('summary', val)}
                  />
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-4 py-2 text-xs font-medium text-[#0F766E]">
                  <Clock className="size-4 shrink-0" aria-hidden="true" />
                  <span>{responseTime}</span>
                </div>
              </motion.div>
            </div>

            {/* Direct Channels + Trust Card (Left) & Contact Form (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-5 flex flex-col gap-4">
                {contactTelHref && (
                  <a
                    href={contactTelHref}
                    className="group bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#0F766E] transition-all flex items-center gap-4 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                  >
                    <div className="size-12 bg-teal-50 text-[#0F766E] rounded-lg flex items-center justify-center shrink-0">
                      <Phone className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-[#1E293B]">Call Our Main Line</h2>
                      <p className="text-sm text-[#64748B]">{contactPhone}</p>
                    </div>
                  </a>
                )}

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#0F766E] transition-all flex items-center gap-4 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                >
                  <div className="size-12 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center shrink-0">
                    <MessageCircle className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[#1E293B]">Chat on WhatsApp</h2>
                    <p className="text-sm text-[#64748B]">Quick answers from our live advisory desk.</p>
                  </div>
                </a>

                <a
                  href={calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#0F766E] transition-all flex items-center gap-4 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                >
                  <div className="size-12 bg-teal-50 text-[#0F766E] rounded-lg flex items-center justify-center shrink-0">
                    <Calendar className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[#1E293B]">Book a Consultation</h2>
                    <p className="text-sm text-[#64748B]">Pick a time that works for you on our calendar.</p>
                  </div>
                </a>

                <a
                  href={`mailto:${contactEmail}`}
                  className="group bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#0F766E] transition-all flex items-center gap-4 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                >
                  <div className="size-12 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[#1E293B]">Send an Email</h2>
                    <p className="text-sm text-[#64748B] truncate">{contactEmail}</p>
                  </div>
                </a>

                {/* Trust & Credentials Card */}
                <Card className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs mt-2">
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
                      <Award className="size-4 shrink-0" aria-hidden="true" />
                      <span>{credentialsText}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Quote className="size-4 text-[#64748B] shrink-0 mt-1" aria-hidden="true" />
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-[#1E293B] leading-relaxed">
                          &ldquo;{testimonialQuote}&rdquo;
                        </p>
                        <span className="text-xs text-[#64748B]">{testimonialAuthor}</span>
                      </div>
                    </div>
                    <Link
                      to="/about"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] hover:text-[#115E59] min-h-11 self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-sm"
                    >
                      <span>Meet Our Advisory Team</span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-7">
                <ContactInquiryForm
                  branches={branches}
                  selectedBranchId={selectedBranchId}
                  onBranchChange={setSelectedBranchId}
                  responseTime={responseTime}
                  fallbackPhone={contactPhone}
                  fallbackTelHref={contactTelHref}
                  whatsappUrl={whatsappUrl}
                />
              </div>
            </div>

            {/* Multi-Branch Directory */}
            <BranchDirectory
              branches={branches}
              selectedBranchId={selectedBranchId}
              onSelectBranch={handleSelectBranchFromDirectory}
              isLoading={isLoadingOffices}
            />
          </main>
          <LiveEditFloatingBar />
        </div>
      </LiveEditProvider>
    </MotionConfig>
  );
}
