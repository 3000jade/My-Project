import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import cmsService from '@/services/cmsService';
import { LiveEditableText } from '@/components/cms/LiveCmsEditor';

export function CmsPublicBanner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let mounted = true;
    cmsService
      .getPublicContents('banner')
      .then((items) => {
        if (mounted && Array.isArray(items) && items.length > 0) {
          setBanner(items[0]);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!banner) return null;

  const saveBannerField = async (field, val) => {
    const updated = await cmsService.updateContent(banner.id, { [field]: val });
    setBanner(updated);
  };

  return (
    <div className="bg-[#0F766E] text-white px-4 py-3 text-sm">
      <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Sparkles className="size-4 shrink-0" />
          <span className="font-semibold">
            <LiveEditableText value={banner.title} onSave={(val) => saveBannerField('title', val)} />
          </span>
          {banner.summary && (
            <span className="opacity-90">
              — <LiveEditableText value={banner.summary} onSave={(val) => saveBannerField('summary', val)} />
            </span>
          )}
        </div>
        {banner.payload?.cta_url && (
          <Link
            to={banner.payload.cta_url}
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 shrink-0"
          >
            {banner.payload.cta_label || 'Learn more'}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function CmsPublicCollectionsAndFaqs() {
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    let mounted = true;
    cmsService
      .getPublicContents('faq')
      .then((items) => {
        if (mounted && Array.isArray(items)) {
          setFaqs(items);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (faqs.length === 0) return null;

  return (
    <section className="w-full home-band-white py-12 px-4 md:px-6 lg:px-8 border-t border-[#E2E8F0]">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#1E293B]">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-[#64748B] mt-1">
            Quick answers about buying, viewing, and reserving properties.
          </p>
        </div>

        <Accordion className="bg-white border border-[#E2E8F0] rounded-xl">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-sm font-semibold text-[#1E293B]">
                <LiveEditableText
                  value={faq.title}
                  onSave={async (val) => {
                    const updated = await cmsService.updateContent(faq.id, { title: val });
                    setFaqs((prev) => prev.map((f) => (f.id === faq.id ? updated : f)));
                  }}
                />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm text-[#64748B]">
                <LiveEditableText
                  value={faq.body || ''}
                  onSave={async (val) => {
                    const updated = await cmsService.updateContent(faq.id, { body: val });
                    setFaqs((prev) => prev.map((f) => (f.id === faq.id ? updated : f)));
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
