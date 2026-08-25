import React from 'react';
import { motion } from 'framer-motion';
import { Timeline, Text } from '@mantine/core';
import { leadershipTeam, journeyMilestones, accolades } from '../utils/mockAbout';

export default function AboutPage() {
  const revealVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 100 }
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen">
      <main className="">
        {/* Sophisticated Hero Section */}
        <section className="relative min-h-screen flex items-start pt-32 lg:pt-40 pb-20 px-5 md:px-10 lg:px-20 max-w-container-max mx-auto overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-24 items-start w-full">
            <motion.div
              className="z-10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={revealVariants}
            >
              <div className="flex items-center gap-4 mb-8">
                <span className="h-px w-12 bg-[#E07A5F]"></span>
                <span className="font-sans text-[#E07A5F] font-bold text-[12px] tracking-[0.3em] uppercase">Established 1989</span>
              </div>
              <h1 className="font-display text-5xl lg:text-7xl text-primary mb-8 leading-[1.1] font-extrabold tracking-tight">
                Crafting the Future of <span className="text-[#E07A5F]">Philippine</span> Luxury.
              </h1>
              <p className="font-display text-on-surface-variant max-w-xl mb-12 leading-relaxed text-xl opacity-90">
                EstateElite stands as the premier architectural and real estate consultancy in the Philippines.
                We are dedicated curators of exceptional living spaces, blending heritage with modern innovation.
              </p>
              <div className="flex flex-wrap gap-6">
                <button className="font-sans bg-primary text-white px-10 py-4 rounded-xl font-bold hover:bg-primary/90 hover:shadow-xl transition-all text-[12px] tracking-widest uppercase">
                  Our Heritage
                </button>
                <button className="font-sans text-primary font-bold px-8 py-4 flex items-center gap-3 group hover:bg-surface-container-low rounded-xl transition-all text-[12px] tracking-widest uppercase border border-outline-variant/30">
                  Global Portfolio
                  <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_right_alt</span>
                </button>
              </div>
            </motion.div>

            <motion.div 
              className="relative w-full max-w-lg mx-auto -mt-4 lg:-mt-8"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="rounded-[32px] overflow-hidden w-full h-[80vh] shadow-2xl bg-surface-container-high relative border-[12px] border-white/50">
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-1000 hover:scale-110"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDm3CZzHZRIlWACg2-cllubJnlL97uj0a5kP_KFk1ORg5yHcm8VjBnGwhrFtfGUP_05pB6WbvgAyih6UNwaI8SN-8HQsq03hXvHNOSVnD2_SZTBd3EOdOW8S11q-kYnMuQ3uybW23HI2jEof52geNa6TY6adiiWcB5Z41ITiQ_kcZuxLGjpPBL49k2rztrBilBLhSWwyQjcPbgHdVLMMg08LnqYlFFgRawk5-jKRepxGgZF_bwf6mtLSYxjV_pG95BgoFIVa3UGbSuG')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
              </div>
              <div className="absolute bottom-6 left-6 lg:bottom-10 lg:-left-6 bg-white/95 p-6 rounded-2xl shadow-2xl border border-outline-variant/30 hidden sm:block backdrop-blur-xl z-20">
                <div className="text-[#E07A5F] font-display text-5xl mb-1 font-black">35</div>
                <div className="font-sans text-primary font-bold text-[10px] tracking-[0.15em] uppercase">Years of Legacy</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Narrative Section with Texture */}
        <section className="min-h-screen flex flex-col justify-center py-20 bg-surface-container-low/50 border-y border-outline-variant/20 relative w-full">
          <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]"></div>
          <motion.div
            className="px-5 md:px-10 lg:px-20 max-w-container-max mx-auto text-center relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={revealVariants}
          >
            <div className="max-w-4xl mx-auto">
              <span className="material-symbols-outlined text-[#E07A5F] text-4xl mb-8">format_quote</span>
              <h2 className="font-display text-primary mb-12 italic leading-tight text-3xl lg:text-4xl font-bold">
                "We don't just facilitate transactions; we steward legacies through uncompromising market intelligence and architectural vision."
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#E07A5F] to-transparent mx-auto mb-12"></div>
              <p className="font-display text-on-surface-variant max-w-3xl mx-auto text-lg leading-relaxed">
                Founded with a singular vision to bridge global luxury standards with Philippine real estate,
                EstateElite has grown into the nation's most trusted advisor for high-net-worth individuals and
                global investors seeking permanence.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Vision & Mission Details */}
        <section className="min-h-screen flex flex-col justify-center py-20 px-5 md:px-10 lg:px-20 max-w-container-max mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-16 lg:gap-32">
            <motion.div
              className="p-12 rounded-[2.5rem] bg-white border border-outline-variant/30 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={revealVariants}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-10 group-hover:bg-primary transition-colors duration-500">
                <span className="material-symbols-outlined text-primary text-3xl group-hover:text-white transition-colors">visibility</span>
              </div>
              <h3 className="font-display text-primary mb-8 text-3xl font-bold">Global Standards, <br /><span className="text-[#E07A5F]">Local Soul</span></h3>
              <p className="font-display text-on-surface-variant leading-loose text-lg opacity-80">
                To be the undisputed bridge between global luxury standards and Philippine real estate, setting the benchmark for ethical advisory and bespoke property acquisition across the archipelago. We honor the heritage of our land while embracing the tech of tomorrow.
              </p>
            </motion.div>

            <motion.div
              className="p-12 rounded-[2.5rem] bg-white border border-outline-variant/30 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={revealVariants}
              transition={{ delay: 0.2 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#E07A5F]/5 flex items-center justify-center mb-10 group-hover:bg-[#E07A5F] transition-colors duration-500">
                <span className="material-symbols-outlined text-[#E07A5F] text-3xl group-hover:text-white transition-colors">diamond</span>
              </div>
              <h3 className="font-display text-primary mb-8 text-3xl font-bold">Empowering <br /><span className="text-[#E07A5F]">Legacies</span></h3>
              <p className="font-display text-on-surface-variant leading-loose text-lg opacity-80">
                To empower our clients through uncompromising market intelligence, personalized white-glove service, and exclusive access to the nation's most prestigious off-market portfolio. Your legacy is our blueprint for excellence.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Enhanced Timeline (Mantine Integration) */}
        <section className="min-h-screen flex flex-col justify-center py-20 bg-surface-container-low/30 border-y border-outline-variant/20 relative overflow-hidden w-full">
          <div className="px-5 md:px-10 lg:px-20 max-w-container-max mx-auto relative z-10">
            <motion.div
              className="text-center mb-32"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={revealVariants}
            >
              <span className="font-sans text-[#E07A5F] font-bold text-[12px] tracking-[0.3em] uppercase mb-4 block">Our Journey</span>
              <h2 className="text-primary font-display text-5xl mb-6 font-bold">Milestones of Excellence</h2>
              <p className="text-on-surface-variant font-display max-w-2xl mx-auto text-lg">
                Shaping the landscape of Philippine high-end living through decades of strategic vision.
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto pl-4 md:pl-0">
              <Timeline active={journeyMilestones.length} bulletSize={32} lineWidth={2} color="teal">
                {journeyMilestones.map((milestone, idx) => (
                  <Timeline.Item
                    key={milestone.id}
                    title={<span className="text-2xl font-bold font-display text-primary">{milestone.title}</span>}
                    bullet={<span className="material-symbols-outlined text-[16px]">{milestone.icon}</span>}
                    className="pb-16"
                  >
                    <motion.div
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-100px" }}
                      variants={revealVariants}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Text c="dimmed" size="sm" tt="uppercase" fw={700} tracking={2} mb={12} mt={4} className="font-sans text-[#E07A5F]">
                        {milestone.year}
                      </Text>
                      <Text size="lg" className="font-display leading-relaxed text-gray-600">
                        {milestone.description}
                      </Text>
                    </motion.div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </div>
        </section>

        {/* Enhanced Leadership Section */}
        <section className="min-h-screen flex flex-col justify-center py-20 px-5 md:px-10 lg:px-20 max-w-container-max mx-auto w-full">
          <motion.div
            className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={revealVariants}
          >
            <div className="max-w-2xl">
              <span className="font-sans text-[#E07A5F] font-bold text-[12px] tracking-[0.3em] uppercase mb-4 block">Leadership</span>
              <h2 className="font-display text-primary text-5xl mb-6 font-bold">The Minds Behind the Legacy</h2>
              <p className="text-on-surface-variant font-display text-lg">
                Our leadership combines decades of local heritage with global perspectives to deliver unparalleled advisory excellence.
              </p>
            </div>
            <div className="hidden md:block">
              <button className="font-sans text-primary font-bold border-b-2 border-primary pb-2 hover:text-[#E07A5F] hover:border-tertiary transition-all flex items-center gap-3 text-[12px] tracking-widest uppercase">
                View Full Advisory Board
                <span className="material-symbols-outlined text-sm">north_east</span>
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {leadershipTeam.map((leader, index) => (
              <motion.div
                key={leader.id}
                className="group"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={revealVariants}
                transition={{ delay: index * 0.15 }}
              >
                <div className="aspect-[3/4] rounded-3xl overflow-hidden mb-8 relative grayscale hover:grayscale-0 transition-all duration-700 bg-surface-container-high shadow-lg group-hover:shadow-2xl">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                    style={{ backgroundImage: `url('${leader.image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                    <p className="font-display text-white/90 text-sm font-medium leading-relaxed italic">"{leader.quote}"</p>
                  </div>
                </div>
                <h5 className="font-display text-primary mb-2 text-2xl font-bold">{leader.name}</h5>
                <p className="font-sans font-bold text-[#E07A5F] text-[10px] tracking-widest uppercase mb-4">{leader.title}</p>
                <p className="text-on-surface-variant text-sm font-display leading-relaxed opacity-80 line-clamp-3 group-hover:line-clamp-none transition-all">
                  {leader.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Improved Immersive CTA & Accolades */}
        <section className="min-h-screen flex flex-col justify-center py-20 px-5 md:px-10 lg:px-20 bg-surface-container-low/30 border-t border-outline-variant/20 w-full">
          <div className="max-w-container-max mx-auto">
            <motion.div
              className="text-center mb-24"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={revealVariants}
            >
              <span className="font-sans text-[#E07A5F] font-bold text-[12px] tracking-[0.3em] uppercase mb-4 block">Accolades</span>
              <h2 className="text-primary font-display text-5xl mb-6 font-bold">Accolades &amp; Recognition</h2>
              <p className="text-on-surface-variant font-display max-w-3xl mx-auto text-lg leading-relaxed">
                A testament to our unwavering commitment to excellence in Philippine luxury real estate.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {accolades.map((award, index) => (
                <motion.div
                  key={award.id}
                  className="bg-white p-10 rounded-[2rem] border border-outline-variant/30 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group text-center"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={revealVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-8 mx-auto group-hover:bg-primary transition-colors duration-500">
                    <span className="material-symbols-outlined text-primary text-3xl group-hover:text-white transition-colors">{award.icon}</span>
                  </div>
                  <h4 className="font-display text-primary text-xl font-bold mb-2">{award.title}</h4>
                  <p className="font-sans text-[#E07A5F] font-bold text-[10px] tracking-widest uppercase mb-4">{award.year}</p>
                  <p className="text-on-surface-variant text-sm font-display opacity-80">{award.organization}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="min-h-screen flex flex-col justify-center py-20 px-5 md:px-10 lg:px-20 w-full">
          <motion.div
            className="max-w-container-max mx-auto bg-primary rounded-[3rem] p-16 lg:p-32 text-center text-white relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,86,88,0.4)]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={revealVariants}
          >
            <div className="absolute inset-0 opacity-20 mix-blend-overlay">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDm3CZzHZRIlWACg2-cllubJnlL97uj0a5kP_KFk1ORg5yHcm8VjBnGwhrFtfGUP_05pB6WbvgAyih6UNwaI8SN-8HQsq03hXvHNOSVnD2_SZTBd3EOdOW8S11q-kYnMuQ3uybW23HI2jEof52geNa6TY6adiiWcB5Z41ITiQ_kcZuxLGjpPBL49k2rztrBilBLhSWwyQjcPbgHdVLMMg08LnqYlFFgRawk5-jKRepxGgZF_bwf6mtLSYxjV_pG95BgoFIVa3UGbSuG" className="w-full h-full object-cover" alt="Texture" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80"></div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#E07A5F]/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 max-w-4xl mx-auto">
              <h2 className="font-display text-5xl lg:text-7xl mb-10 font-bold tracking-tight">Secure Your <span className="text-[#E07A5F]-fixed-dim text-white">Legacy.</span></h2>
              <p className="font-display text-white/90 mb-16 text-xl leading-relaxed max-w-2xl mx-auto">
                Connect with an EstateElite advisor for a private consultation regarding your domestic or international portfolio. Let us build your future together.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-8">
                <button className="font-sans bg-white text-primary px-12 py-5 rounded-xl font-bold hover:bg-surface-container-low hover:shadow-2xl transition-all shadow-lg text-[12px] tracking-[0.2em] uppercase active:scale-95">
                  Request Consultation
                </button>
                <button className="font-sans border-2 border-white/30 text-white px-12 py-5 rounded-xl font-bold hover:bg-white/10 transition-all text-[12px] tracking-[0.2em] uppercase active:scale-95">
                  Explore Insights
                </button>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
