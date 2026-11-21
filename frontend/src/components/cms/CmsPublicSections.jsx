import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const [collections, setCollections] = useState([]);
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      cmsService.getPublicCollections(),
      cmsService.getPublicContents('faq'),
    ]).then(([colRes, faqRes]) => {
      if (!mounted) return;
      if (colRes.status === 'fulfilled' && Array.isArray(colRes.value)) {
        setCollections(colRes.value.filter((c) => c.items && c.items.length > 0));
      }
      if (faqRes.status === 'fulfilled' && Array.isArray(faqRes.value)) {
        setFaqs(faqRes.value);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (collections.length === 0 && faqs.length === 0) return null;

  return (
    <section className="w-full bg-[#F8FAFC] py-12 px-4 md:px-6 lg:px-8 border-t border-[#E2E8F0]">
      <div className="max-w-[1440px] mx-auto space-y-12">
        {collections.map((col) => (
          <div key={col.id} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#1E293B]">
                  {col.title}
                </h2>
                {col.description && (
                  <p className="text-sm text-[#64748B] mt-1">{col.description}</p>
                )}
              </div>
              <Link to="/properties">
                <Button variant="outline" className="gap-2">
                  View All Listings <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {col.items.map((item) => {
                const prop = item.property || {};
                const thumb = Array.isArray(prop.images) ? prop.images[0] : null;
                return (
                  <Link key={item.id} to={`/listing/${prop.id}`} className="group">
                    <Card className="h-full bg-white border border-[#E2E8F0] rounded-xl shadow-xs group-hover:shadow-md transition-shadow overflow-hidden">
                      {thumb && (
                        <div className="h-48 w-full bg-[#F1F5F9] overflow-hidden">
                          <img
                            src={thumb}
                            alt={prop.title || 'Featured property'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        {item.custom_badge && (
                          <span className="inline-block w-fit px-2 py-1 rounded-full text-xs font-medium bg-[#CCFBF1] text-[#0F766E]">
                            {item.custom_badge}
                          </span>
                        )}
                        <CardTitle className="text-lg font-semibold text-[#1E293B]">
                          {prop.title || 'Property Listing'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-xs text-[#64748B]">
                          <MapPin className="size-3" />
                          <span>{[prop.barangay, prop.city].filter(Boolean).join(', ') || 'Philippines'}</span>
                        </CardDescription>
                      </CardHeader>
                      {prop.price != null && (
                        <CardContent>
                          <p className="text-base font-bold text-[#0F766E] tabular-nums">
                            ₱{Number(prop.price).toLocaleString()}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {faqs.length > 0 && (
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
        )}
      </div>
    </section>
  );
}
