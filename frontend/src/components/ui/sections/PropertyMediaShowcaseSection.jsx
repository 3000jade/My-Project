import React from 'react';
import { Film, Layers, Image as ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function stripHtmlPlain(html = '') {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Renders Step 4 media sections from Create Listing:
 * 1) Room Gallery & Videos (#sec-media): categorized room photos, captions, area descriptions, and room videos.
 * 2) Floor Plan (#sec-floorplan): dedicated floor plan / lot cut image showcase.
 */
export default function PropertyMediaShowcaseSection({
  areas = [],
  floorPlans = [],
  onOpenGallery,
}) {
  if (areas.length === 0 && floorPlans.length === 0) return null;

  return (
    <>
      {areas.length > 0 && (
        <section id="sec-media" className="scroll-mt-36">
          <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                <span className="w-4 h-0.5 bg-[#FF6B6B] rounded-full shrink-0" aria-hidden="true" />
                <span>Gallery &amp; Video Tours</span>
              </div>
              <CardTitle className="text-xl font-bold text-[#1E293B] tracking-tight">
                Room Gallery &amp; Videos<span className="text-[#FF6B6B]">.</span>
              </CardTitle>
              <CardDescription>
                Photos, room notes, and walkthrough videos organized by area.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-4 border-t border-[#E2E8F0] flex flex-col gap-6">
              {areas.map((area) => {
                const cleanAreaDesc = stripHtmlPlain(area.description || '');
                return (
                  <div
                    key={area.key}
                    className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="size-4 text-[#0F766E]" aria-hidden="true" />
                        <h3 className="text-base font-semibold text-[#1E293B]">{area.label}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {area.photos.length > 0 && (
                          <Badge variant="outline" className="bg-white border-[#E2E8F0] text-[#1E293B]">
                            {area.photos.length} {area.photos.length === 1 ? 'Photo' : 'Photos'}
                          </Badge>
                        )}
                        {area.video && (
                          <Badge variant="default" className="gap-1">
                            <Film className="size-3.5 text-[#0F766E]" aria-hidden="true" />
                            <span>Video</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    {cleanAreaDesc && (
                      <p className="text-sm text-[#64748B] leading-relaxed whitespace-pre-line">
                        {cleanAreaDesc}
                      </p>
                    )}

                    {area.photos.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {area.photos.map((photo, idx) => (
                          <div key={`${area.key}-photo-${idx}`} className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenGallery?.(photo.lightboxIndex)}
                              aria-label={`View ${area.label} photo ${idx + 1}`}
                              className="relative h-44 rounded-lg overflow-hidden border border-[#E2E8F0] bg-white group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                            >
                              <img
                                src={photo.url}
                                alt={photo.caption || `${area.label} photo ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover motion-safe:group-hover:scale-[1.03] motion-safe:transition-transform motion-safe:duration-300"
                              />
                            </button>
                            {photo.caption && (
                              <p className="text-xs text-[#64748B] leading-snug">{photo.caption}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {area.video?.mediaUrl && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-[#E2E8F0]">
                        <video
                          controls
                          preload="metadata"
                          poster={area.video.thumbnailUrl || undefined}
                          className="w-full max-h-80 rounded-lg border border-[#E2E8F0] bg-[#0F172A]"
                        >
                          <source src={area.video.mediaUrl} type={area.video.mimeType || 'video/mp4'} />
                        </video>
                        {area.video.shortDescription && (
                          <p className="text-xs text-[#64748B]">{area.video.shortDescription}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      )}

      {floorPlans.length > 0 && (
        <section id="sec-floorplan" className="scroll-mt-36">
          <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                <span className="w-4 h-0.5 bg-[#FF6B6B] rounded-full shrink-0" aria-hidden="true" />
                <span>Layout</span>
              </div>
              <CardTitle className="text-xl font-bold text-[#1E293B] tracking-tight">
                Floor Plan<span className="text-[#FF6B6B]">.</span>
              </CardTitle>
              <CardDescription>Unit layouts or lot cut plans.</CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-4 border-t border-[#E2E8F0]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {floorPlans.map((fp, idx) => (
                  <div key={`floorplan-${idx}`} className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenGallery?.(fp.lightboxIndex)}
                      aria-label={`View floor plan ${idx + 1}`}
                      className="relative h-56 rounded-lg overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC] p-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                    >
                      <img
                        src={fp.url}
                        alt={fp.caption || `Floor plan ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F766E] inline-flex items-center gap-1 shadow-xs">
                        <Layers className="size-3.5" aria-hidden="true" />
                        Enlarge
                      </span>
                    </button>
                    {fp.caption && <p className="text-xs text-[#64748B]">{fp.caption}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </>
  );
}
