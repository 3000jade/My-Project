import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { inquiryService } from '../../services/inquiryService';
import cmsService from '../../services/cmsService';
import { LiveEditProvider, LiveEditFloatingBar, LiveEditableText } from '../../components/cms/LiveCmsEditor';

function safeHttpUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

function safeMediaUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return trimmed;
  return safeHttpUrl(trimmed);
}

const DEFAULT_HEADLINE = 'Ready to start the conversation?';
const DEFAULT_INTRO =
  "Whether you're ready to buy, thinking of selling, or just want to understand the current market in BGC and beyond—let's grab coffee.";

export default function ContactPage() {
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cmsContact, setCmsContact] = useState(null);
  const [offices, setOffices] = useState([]);

  const saveContactField = async (field, nextValue) => {
    const fallbackTitle = cmsContact?.title || DEFAULT_HEADLINE;
    const fallbackSummary = cmsContact?.summary || DEFAULT_INTRO;
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
      .getPublicContentBySlug('page', 'contact-us')
      .then((item) => {
        if (mounted && item) setCmsContact(item);
      })
      .catch(() => {});

    cmsService
      .getPublicContents('office')
      .then((items) => {
        if (mounted && Array.isArray(items)) setOffices(items);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const headline = cmsContact?.title || DEFAULT_HEADLINE;
  const intro = cmsContact?.summary || DEFAULT_INTRO;
  const eyebrow = cmsContact?.payload?.eyebrow || "Let's Talk";
  const whatsappUrl = safeHttpUrl(cmsContact?.payload?.whatsapp_url) || 'https://wa.me/639170000000';
  const calendlyUrl = safeHttpUrl(cmsContact?.payload?.calendly_url) || 'https://calendly.com';
  const rawEmail = typeof cmsContact?.payload?.contact_email === 'string'
    ? cmsContact.payload.contact_email.trim()
    : '';
  const contactEmail =
    rawEmail && !/[\r\n\s]/.test(rawEmail) && rawEmail.includes('@')
      ? rawEmail
      : 'hello@humanshelter.ph';

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactName || !contactInfo) return;

    setIsSubmitting(true);
    try {
      const isEmail = contactInfo.includes('@');
      await inquiryService.submitInquiry({
        name: contactName,
        email: isEmail ? contactInfo : `${contactName.toLowerCase().replace(/\s+/g, '')}@lead.client.ph`,
        phone: !isEmail ? contactInfo : undefined,
        message: contactMessage,
        type: 'general',
      });
    } catch (err) {
      console.warn('Contact submission error:', err.message);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <LiveEditProvider>
      <div
        className="text-[#141717] font-sans min-h-screen pt-24 pb-24"
        style={{
          backgroundColor: '#F8FAFC',
          backgroundImage: "url('/images/topographic-bg.svg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '600px 600px',
        }}
      >
        <main className="max-w-[1200px] mx-auto px-5 md:px-10 lg:px-16 pt-12 md:pt-16">
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-6 justify-center">
                <span className="w-6 h-[2px] bg-[#0D4446]" />
                <span className="text-xs font-bold tracking-[0.25em] text-[#0D4446] uppercase font-sans">
                  {eyebrow}
                </span>
                <span className="w-6 h-[2px] bg-[#0D4446]" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-[#141717] mb-6 font-serif">
                <LiveEditableText
                  value={headline}
                  onSave={(val) => saveContactField('title', val)}
                />
              </h1>
              <div className="text-[#5C6768] text-lg md:text-xl font-sans leading-relaxed">
                <LiveEditableText
                  value={intro}
                  onSave={(val) => saveContactField('summary', val)}
                />
              </div>
            </motion.div>
          </div>

          {/* Frictionless Contact Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Direct Channels (WhatsApp & Calendly) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col gap-6"
            >
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white p-8 rounded-2xl border border-[#D8DFDF] shadow-sm hover:shadow-md transition-all flex items-center gap-6 cursor-pointer"
              >
                <div className="w-14 h-14 bg-[#25D366]/10 text-[#25D366] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">chat</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold font-sans text-[#141717] mb-1">Chat on WhatsApp</h3>
                  <p className="text-sm text-[#5C6768] font-sans">Get an immediate response from our team.</p>
                </div>
              </a>

              {/* Calendly */}
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white p-8 rounded-2xl border border-[#D8DFDF] shadow-sm hover:shadow-md transition-all flex items-center gap-6 cursor-pointer"
              >
                <div className="w-14 h-14 bg-[#0D4446]/10 text-[#0D4446] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">calendar_month</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold font-sans text-[#141717] mb-1">Book a Coffee Chat</h3>
                  <p className="text-sm text-[#5C6768] font-sans">Pick a time that works for you on our calendar.</p>
                </div>
              </a>

              {/* Email */}
              <a
                href={`mailto:${contactEmail}`}
                className="group bg-white p-8 rounded-2xl border border-[#D8DFDF] shadow-sm hover:shadow-md transition-all flex items-center gap-6 cursor-pointer"
              >
                <div className="w-14 h-14 bg-[#E76F51]/10 text-[#E76F51] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">mail</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold font-sans text-[#141717] mb-1">Send an Email</h3>
                  <p className="text-sm text-[#5C6768] font-sans">{contactEmail}</p>
                </div>
              </a>
            </motion.div>

          {/* Simple Form (Optional/Fallback) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-white p-8 md:p-10 rounded-2xl border border-[#D8DFDF] shadow-sm"
          >
            <h3 className="text-2xl font-bold font-sans text-[#141717] mb-2">Drop a message</h3>
            <p className="text-sm text-[#5C6768] font-sans mb-8">No lengthy forms. Just the basics.</p>
            
            {isSubmitted ? (
              <div className="py-12 text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-[#0D4446]">check_circle</span>
                <h4 className="text-xl font-bold font-sans text-[#141717]">Message Received</h4>
                <p className="text-sm text-[#5C6768] font-sans">
                  Thank you, {contactName}. A partner from our private client advisory will reach out shortly.
                </p>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleContactSubmit}>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5C6768] mb-2 block">Name</label>
                  <input 
                    type="text" 
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-[#FBFBF9] border border-[#D8DFDF] focus:border-[#0D4446] focus:bg-white rounded-xl px-4 py-3.5 text-sm outline-none transition-all"
                    placeholder="How should we address you?"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5C6768] mb-2 block">Email or Phone</label>
                  <input 
                    type="text" 
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full bg-[#FBFBF9] border border-[#D8DFDF] focus:border-[#0D4446] focus:bg-white rounded-xl px-4 py-3.5 text-sm outline-none transition-all"
                    placeholder="Where can we reach you?"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5C6768] mb-2 block">What's on your mind?</label>
                  <textarea 
                    rows="4"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full bg-[#FBFBF9] border border-[#D8DFDF] focus:border-[#0D4446] focus:bg-white rounded-xl px-4 py-3.5 text-sm outline-none transition-all resize-none"
                    placeholder="I'm interested in looking at properties in BGC..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[54px] bg-[#0D4446] hover:bg-[#083335] text-white font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Transmitting...' : 'Send Message'}</span>
                  <span className={`material-symbols-outlined text-[18px] ${isSubmitting ? 'animate-spin' : ''}`}>
                    {isSubmitting ? 'sync' : 'send'}
                  </span>
                </button>
              </form>
            )}
          </motion.div>

          </div>

          {offices.length > 0 && (
            <section aria-labelledby="office-branches-heading" className="mt-16 md:mt-24">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="flex items-center gap-3 mb-4 justify-center">
                  <span className="w-6 h-[2px] bg-[#0F766E]" />
                  <span className="text-xs font-bold tracking-[0.2em] text-[#0F766E] uppercase font-sans">
                    Visit Us
                  </span>
                  <span className="w-6 h-[2px] bg-[#0F766E]" />
                </div>
                <h2
                  id="office-branches-heading"
                  className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E293B] font-serif"
                >
                  Our Office Branches
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offices.map((office) => {
                  const mapUrl = safeHttpUrl(office.payload?.map_url);
                  const photoUrl = safeMediaUrl(office.media_url);
                  return (
                    <Card
                      key={office.id}
                      className="border border-[#E2E8F0] rounded-xl bg-white p-6 shadow-xs flex flex-col justify-between gap-4"
                    >
                      <div className="flex flex-col gap-4">
                        {photoUrl && (
                          <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-[#F1F5F9]">
                            <img
                              src={photoUrl}
                              alt={office.title}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <h3 className="text-xl font-semibold tracking-tight text-[#1E293B] font-sans">
                          {office.title}
                        </h3>
                        <div className="flex flex-col gap-2 text-sm text-[#64748B]">
                          {office.payload?.address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="size-4 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
                              <span>{office.payload.address}</span>
                            </div>
                          )}
                          {office.payload?.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                              <span className="text-[#1E293B] font-medium">{office.payload.phone}</span>
                            </div>
                          )}
                          {office.payload?.hours && (
                            <div className="flex items-center gap-2">
                              <Clock className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                              <span>{office.payload.hours}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {mapUrl && (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F766E] hover:text-[#115E59] transition-colors min-h-11 self-start rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 focus-visible:border-[#0F766E]"
                        >
                          <span>View on Map</span>
                          <ExternalLink className="size-4" aria-hidden="true" />
                        </a>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </main>
        <LiveEditFloatingBar />
      </div>
    </LiveEditProvider>
  );
}
