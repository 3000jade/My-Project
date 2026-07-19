import { motion } from 'framer-motion';


export default function Consultation() {
  const revealProps = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <>
      {/* Mission Statement */}
      <motion.section {...revealProps} className="reveal bg-surface-variant py-24 lg:py-36 overflow-hidden relative">
        <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display text-tertiary mb-8">
            Redefining Real Estate through Strategic Intelligence
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-gray-500 leading-relaxed font-sans mb-12 px-4">
            "Our mission is to bridge the gap between timeless property value and modern computational power. We
            don't just find houses; we secure generational wealth using predictive analytics that see market trends
            before they happen."
          </p>
          <div className="w-24 h-1 bg-accent mx-auto rounded-full"></div>
          <p className="mt-8 text-xs font-bold uppercase tracking-widest text-primary font-sans">
            The Executive Manifesto
          </p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
          <span className="text-[400px] font-bold text-primary select-none">AI</span>
        </div>
      </motion.section>

      {/* Specialist Agents */}
      <motion.section {...revealProps} className="reveal py-24 lg:py-36 px-5 md:px-10 lg:px-20 max-w-[1440px] mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-accent font-sans mb-4 block">
            World Class Advisory
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display text-tertiary">Meet Our Elite Partners</h2>
        </div>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-12"
        >
          <motion.div variants={itemVariants} className="text-center group transition-transform duration-500 hover:-translate-y-2">
            <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border border-surface-container-high p-2 group-hover:border-primary group-hover:shadow-lg transition-all duration-700">
              <img
                alt="Alexander Sterling"
                className="w-full h-full object-cover rounded-full grayscale hover:grayscale-0 transition-transform duration-700 group-hover:scale-110"
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80"
              />
            </div>
            <h4 className="text-xl font-bold font-display text-tertiary">Alexander Sterling</h4>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans mt-1">
              Founding Partner
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="text-center group transition-transform duration-500 hover:-translate-y-2">
            <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border border-surface-container-high p-2 group-hover:border-primary group-hover:shadow-lg transition-all duration-700">
              <img
                alt="Helena Vance"
                className="w-full h-full object-cover rounded-full grayscale hover:grayscale-0 transition-transform duration-700 group-hover:scale-110"
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
              />
            </div>
            <h4 className="text-xl font-bold font-display text-tertiary">Helena Vance</h4>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans mt-1">
              Head of EMEA
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="text-center group transition-transform duration-500 hover:-translate-y-2">
            <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border border-surface-container-high p-2 group-hover:border-primary group-hover:shadow-lg transition-all duration-700">
              <img
                alt="Marcus Thorne"
                className="w-full h-full object-cover rounded-full grayscale hover:grayscale-0 transition-transform duration-700 group-hover:scale-110"
                src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80"
              />
            </div>
            <h4 className="text-xl font-bold font-display text-tertiary">Marcus Thorne</h4>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans mt-1">
              Market Analytics Specialist
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="text-center group transition-transform duration-500 hover:-translate-y-2">
            <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border border-surface-container-high p-2 group-hover:border-primary group-hover:shadow-lg transition-all duration-700">
              <img
                alt="Elena Rossi"
                className="w-full h-full object-cover rounded-full grayscale hover:grayscale-0 transition-transform duration-700 group-hover:scale-110"
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80"
              />
            </div>
            <h4 className="text-xl font-bold font-display text-tertiary">Elena Rossi</h4>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans mt-1">
              Private Client Advisor
            </p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Testimonials */}
      <motion.section {...revealProps} className="reveal bg-surface-variant py-24 lg:py-36">
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 lg:px-20">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-1/3">
              <span className="text-xs font-bold uppercase tracking-widest text-accent font-sans mb-4 block">
                Proven Excellence
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display text-tertiary mb-6">Client Experiences</h2>
              <div className="flex gap-1 text-accent mb-4">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <p className="text-base md:text-lg lg:text-xl text-gray-500 leading-relaxed font-sans">Verified Satisfaction</p>
            </div>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <motion.div variants={itemVariants} className="bg-white p-10 shadow-sm rounded-2xl border-l-4 border-primary">
                <p className="text-base md:text-lg text-gray-500 leading-relaxed font-sans mb-6">
                  "The market intelligence provided by PropAI allowed us to identify an emerging pocket in Mayfair six
                  months before the market spiked. Truly transformative service."
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-tertiary font-sans">
                  Sir Jonathan H.
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">Venture Capitalist</p>
              </motion.div>
              <motion.div variants={itemVariants} className="bg-white p-10 shadow-sm rounded-2xl border-l-4 border-primary">
                <p className="text-base md:text-lg text-gray-500 leading-relaxed font-sans mb-6">
                  "Discretion is my highest priority. The Private Office handled our acquisition with absolute secrecy
                  and surgical precision. Exceptional."
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-tertiary font-sans">
                  Anonymous Client
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">Technology Founder</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Private Consultation Form */}
      <motion.section {...revealProps} className="reveal py-24 lg:py-36 px-5 md:px-10 lg:px-20 max-w-[1440px] mx-auto">
        <div className="bg-white p-12 md:p-20 shadow-xl rounded-2xl relative overflow-hidden border border-surface-container-high">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
            <div>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display text-tertiary mb-6">Begin Your Legacy</h2>
              <p className="text-base md:text-lg lg:text-xl text-gray-500 leading-relaxed font-sans mb-10">
                Secure your invitation to our exclusive marketplace. One of our senior advisors will contact you
                within 24 hours for a confidential discovery call.
              </p>
              <ul className="space-y-6">
                <li className="flex items-center gap-4 text-on-surface">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500 font-sans">
                    Access to Private Portfolio
                  </span>
                </li>
                <li className="flex items-center gap-4 text-on-surface">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500 font-sans">
                    Strategic Growth Analysis
                  </span>
                </li>
                <li className="flex items-center gap-4 text-on-surface">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500 font-sans">
                    Dedicated 24/7 Elite Advisory
                  </span>
                </li>
              </ul>
            </div>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">
                    Full Name
                  </label>
                  <input
                    className="w-full bg-surface-container-low rounded-xl border border-surface-container-high focus:border-primary focus:ring-0 py-3 px-4 transition-colors text-sm md:text-base font-sans"
                    type="text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">
                    Email Address
                  </label>
                  <input
                    className="w-full bg-surface-container-low rounded-xl border border-surface-container-high focus:border-primary focus:ring-0 py-3 px-4 transition-colors text-sm md:text-base font-sans"
                    type="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">
                  Interest Area
                </label>
                <select className="w-full bg-surface-container-low rounded-xl border border-surface-container-high focus:border-primary focus:ring-0 py-3 px-4 transition-colors appearance-none text-sm md:text-base font-sans">
                  <option>Residential Acquisition</option>
                  <option>Commercial Portfolio</option>
                  <option>Portfolio Analytics</option>
                  <option>Development Advisory</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">
                  Message (Optional)
                </label>
                <textarea
                  className="w-full bg-surface-container-low rounded-xl border border-surface-container-high focus:border-primary focus:ring-0 py-3 px-4 transition-colors text-sm md:text-base font-sans"
                  rows="3"
                ></textarea>
              </div>
              <button className="w-full py-5 rounded-xl text-xs font-bold uppercase tracking-widest font-sans premium-btn animate-pulse-glow bg-accent text-white hover:bg-accent/90">
                Send Inquiry
              </button>
            </form>
          </div>
          {/* Decorative accent */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
      </motion.section>
    </>
  );
}
