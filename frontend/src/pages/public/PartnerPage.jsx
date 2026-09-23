import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function PartnerPage() {
  useEffect(() => {
    document.title = 'Your Partner | Human Shelter';
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0f1722] font-sans pt-24 pb-16">
      
      {/* Masthead */}
      <section className="max-w-[1200px] mx-auto px-5 md:px-10 lg:px-16 pt-12 md:pt-20 pb-16 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="w-6 h-[2px] bg-[#1b4d4b]" />
            <span className="text-xs font-bold tracking-[0.25em] text-[#1b4d4b] uppercase font-sans">
              Our Philosophy
            </span>
            <span className="w-6 h-[2px] bg-[#1b4d4b]" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-[#0f1722] mb-6 font-serif max-w-3xl">
            We don't just close transactions. We build long-term relationships.
          </h1>
          <p className="text-gray-500 max-w-2xl text-lg md:text-xl font-sans leading-relaxed">
            Human Shelter was founded on a simple principle: absolute transparency in an often opaque market.
          </p>
        </motion.div>
      </section>

      {/* Profile Section */}
      <section className="bg-[#f9f9f7] py-20 md:py-28 border-y border-[#e5e5df]">
        <div className="max-w-[1000px] mx-auto px-5 md:px-10 lg:px-16">
          <div className="flex flex-col md:flex-row gap-12 lg:gap-16 items-start">
            
            {/* Broker Portrait */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="w-full md:w-5/12 flex-shrink-0"
            >
              <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-gray-200 border border-[#e5e5df] shadow-lg mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1600&auto=format&fit=crop" 
                  alt="Principal Broker" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold font-sans text-[#0f1722]">
                  Marcus Reyes
                </h3>
                <p className="text-sm font-semibold tracking-wider text-[#c9684b] uppercase mt-1 mb-4">
                  Principal Broker & Founder
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase bg-white border border-[#e5e5df] text-gray-600">
                    PRC Lic. 12345
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase bg-white border border-[#e5e5df] text-gray-600">
                    15+ Years Exp.
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Biography & Credentials */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="w-full md:w-7/12 pt-4"
            >
              <h2 className="text-3xl font-bold font-sans text-[#0f1722] mb-6">
                Your Dedicated Advisor
              </h2>
              <div className="space-y-6 text-base text-gray-600 font-sans leading-relaxed">
                <p>
                  For over a decade, Marcus has specialized in the acquisition and curation of high-value real estate across Metro Manila's most prestigious enclaves, including Forbes Park, Dasmariñas Village, and Bonifacio Global City.
                </p>
                <p>
                  Recognizing a gap in the market for a truly client-first advisory, he established Human Shelter to move away from volume-based selling. Instead, the focus is entirely on rigorous due diligence, bespoke property matching, and safeguarding the client's peace of mind throughout the transaction.
                </p>
                <p>
                  Whether you are a local family looking for your forever home, or an expatriate navigating the Philippine property laws for the first time, Marcus and his team provide end-to-end guidance—from the initial consultation to the final title transfer.
                </p>
              </div>
              
              <div className="mt-10 pt-10 border-t border-[#e5e5df]">
                <Link 
                  to="/contact"
                  className="inline-flex h-[54px] px-8 rounded-xl border-2 border-[#1b4d4b] text-[#1b4d4b] hover:bg-[#1b4d4b] hover:text-white font-sans text-[15px] font-bold transition-all duration-300 items-center justify-center gap-2"
                >
                  <span>Schedule a Consultation</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

    </div>
  );
}
