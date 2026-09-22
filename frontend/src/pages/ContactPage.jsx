import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { inquiryService } from '../services/inquiryService';

export default function ContactPage() {
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Contact | Human Shelter';
  }, []);

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
    <div className="bg-[#f9f9f7] text-[#0f1722] font-sans min-h-screen pt-24 pb-24">
      <main className="max-w-[1200px] mx-auto px-5 md:px-10 lg:px-16 pt-12 md:pt-16">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-6 justify-center">
              <span className="w-6 h-[2px] bg-[#1b4d4b]" />
              <span className="text-xs font-bold tracking-[0.25em] text-[#1b4d4b] uppercase font-sans">
                Let's Talk
              </span>
              <span className="w-6 h-[2px] bg-[#1b4d4b]" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-[#0f1722] mb-6 font-serif">
              Ready to start the conversation?
            </h1>
            <p className="text-gray-500 text-lg md:text-xl font-sans leading-relaxed">
              Whether you're ready to buy, thinking of selling, or just want to understand the current market in BGC and beyond—let's grab coffee.
            </p>
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
              href="https://wa.me/639170000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group bg-white p-8 rounded-2xl border border-[#e5e5df] shadow-sm hover:shadow-md transition-all flex items-center gap-6 cursor-pointer"
            >
              <div className="w-14 h-14 bg-[#25D366]/10 text-[#25D366] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">chat</span>
              </div>
              <div>
                <h3 className="text-xl font-bold font-sans text-[#0f1722] mb-1">Chat on WhatsApp</h3>
                <p className="text-sm text-gray-500 font-sans">Get an immediate response from our team.</p>
              </div>
            </a>

            {/* Calendly */}
            <a 
              href="https://calendly.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group bg-white p-8 rounded-2xl border border-[#e5e5df] shadow-sm hover:shadow-md transition-all flex items-center gap-6 cursor-pointer"
            >
              <div className="w-14 h-14 bg-[#1b4d4b]/10 text-[#1b4d4b] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">calendar_month</span>
              </div>
              <div>
                <h3 className="text-xl font-bold font-sans text-[#0f1722] mb-1">Book a Coffee Chat</h3>
                <p className="text-sm text-gray-500 font-sans">Pick a time that works for you on our calendar.</p>
              </div>
            </a>

            {/* Email */}
            <a 
              href="mailto:hello@humanshelter.ph"
              className="group bg-white p-8 rounded-2xl border border-[#e5e5df] shadow-sm hover:shadow-md transition-all flex items-center gap-6 cursor-pointer"
            >
              <div className="w-14 h-14 bg-[#c9684b]/10 text-[#c9684b] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">mail</span>
              </div>
              <div>
                <h3 className="text-xl font-bold font-sans text-[#0f1722] mb-1">Send an Email</h3>
                <p className="text-sm text-gray-500 font-sans">hello@humanshelter.ph</p>
              </div>
            </a>
          </motion.div>

          {/* Simple Form (Optional/Fallback) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-white p-8 md:p-10 rounded-2xl border border-[#e5e5df] shadow-sm"
          >
            <h3 className="text-2xl font-bold font-sans text-[#0f1722] mb-2">Drop a message</h3>
            <p className="text-sm text-gray-500 font-sans mb-8">No lengthy forms. Just the basics.</p>
            
            {isSubmitted ? (
              <div className="py-12 text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-[#1b4d4b]">check_circle</span>
                <h4 className="text-xl font-bold font-sans text-[#0f1722]">Message Received</h4>
                <p className="text-sm text-gray-500 font-sans">
                  Thank you, {contactName}. A partner from our private client advisory will reach out shortly.
                </p>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleContactSubmit}>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">Name</label>
                  <input 
                    type="text" 
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-[#f9f9f7] border border-transparent focus:border-[#1b4d4b] focus:bg-white rounded-xl px-4 py-3.5 text-sm outline-none transition-all"
                    placeholder="How should we address you?"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">Email or Phone</label>
                  <input 
                    type="text" 
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full bg-[#f9f9f7] border border-transparent focus:border-[#1b4d4b] focus:bg-white rounded-xl px-4 py-3.5 text-sm outline-none transition-all"
                    placeholder="Where can we reach you?"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">What's on your mind?</label>
                  <textarea 
                    rows="4"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full bg-[#f9f9f7] border border-transparent focus:border-[#1b4d4b] focus:bg-white rounded-xl px-4 py-3.5 text-sm outline-none transition-all resize-none"
                    placeholder="I'm interested in looking at properties in BGC..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[54px] bg-[#1b4d4b] hover:bg-[#123635] text-white font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60 cursor-pointer"
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
      </main>
    </div>
  );
}
