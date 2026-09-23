import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function HowWeWorkPage() {
  useEffect(() => {
    document.title = 'How We Work | Human Shelter';
  }, []);

  const STEPS = [
    {
      number: '01',
      title: 'The Coffee Chat',
      description: 'Before viewing properties, we want to understand your exact lifestyle needs, non-negotiables, and investment goals. No pressure, just clarity.',
      icon: 'local_cafe'
    },
    {
      number: '02',
      title: 'The Curated Tour',
      description: 'We don’t believe in wasting your time. You will only see a handpicked selection of properties that align perfectly with your brief.',
      icon: 'map'
    },
    {
      number: '03',
      title: 'Due Diligence',
      description: 'Our Clean Title Guarantee kicks in. We handle all legal checks, background verifications, and structural assessments to ensure absolute peace of mind.',
      icon: 'verified_user'
    },
    {
      number: '04',
      title: 'The Handover',
      description: 'From securing escrow to the final key turnover, we manage the entire transaction smoothly. You just focus on moving in.',
      icon: 'vpn_key'
    }
  ];

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
              The Journey Home
            </span>
            <span className="w-6 h-[2px] bg-[#1b4d4b]" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-[#0f1722] mb-6 font-serif max-w-3xl">
            A seamless, transparent process designed around your peace of mind.
          </h1>
          <p className="text-gray-500 max-w-2xl text-lg md:text-xl font-sans leading-relaxed">
            Real estate in the Philippines doesn't have to be complex. We handle the friction so you can focus on the future.
          </p>
        </motion.div>
      </section>

      {/* Steps (Buyer Journey) */}
      <section className="bg-[#f9f9f7] py-20 border-y border-[#e5e5df]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {STEPS.map((step, idx) => (
              <motion.div 
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="flex flex-col"
              >
                <div className="text-[10px] font-bold text-[#c9684b] uppercase tracking-[0.3em] mb-4">
                  Step {step.number}
                </div>
                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center border border-[#e5e5df] shadow-sm mb-6">
                  <span className="material-symbols-outlined text-[#1b4d4b] text-3xl">
                    {step.icon}
                  </span>
                </div>
                <h3 className="text-2xl font-bold font-sans text-[#0f1722] mb-3">
                  {step.title}
                </h3>
                <p className="text-sm font-sans text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Seller Section */}
      <section className="py-24 max-w-[1200px] mx-auto px-5 md:px-10 lg:px-16">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full md:w-1/2 aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100"
          >
            <img 
              src="https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=1600&auto=format&fit=crop" 
              alt="Luxury property interior" 
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full md:w-1/2"
          >
            <div className="text-xs font-bold tracking-[0.25em] text-[#c9684b] uppercase font-sans mb-4">
              For Sellers
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#0f1722] tracking-tight font-sans mb-6">
              Positioning Your Property
            </h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed font-sans mb-8">
              We do more than just list your home. We craft a narrative. Using high-end architectural photography, targeted digital campaigns, and our exclusive network of vetted buyers, we ensure your property reaches the right audience at the right time.
            </p>
            <ul className="space-y-4 mb-10">
              {['Editorial-grade property photography', 'Discreet off-market placements', 'Rigorous buyer vetting'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm md:text-base font-semibold text-[#0f1722]">
                  <span className="material-symbols-outlined text-[#1b4d4b]">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link 
              to="/contact"
              className="inline-flex h-[54px] px-8 rounded-xl bg-[#1b4d4b] hover:bg-[#123635] text-white font-sans text-[15px] font-semibold transition-all duration-300 shadow-sm items-center justify-center"
            >
              Consult with us
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
