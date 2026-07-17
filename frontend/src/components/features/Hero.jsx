import { motion } from 'framer-motion';
import '../styles/Hero.css';

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          alt="Luxurious Modern Villa"
          className="w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
        />
        <div className="absolute inset-0 hero-gradient"></div>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-container-max-width mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop text-center"
      >
        <motion.span variants={itemVariants} className="font-label-lg text-label-lg text-accent uppercase tracking-widest mb-6 block">
          Elite Real Estate Intelligence
        </motion.span>
        <motion.h1 variants={itemVariants} className="font-display-lg text-display-lg text-white mb-8 leading-tight max-w-5xl mx-auto">
          Where Heritage Meets <span className="text-accent">Strategic Advisory.</span>
        </motion.h1>
        <motion.p variants={itemVariants} className="font-body-lg text-body-lg text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
          Experience the next evolution of luxury property acquisition. Our exclusive market insights analyze
          global markets to secure your legacy.
        </motion.p>
        <motion.div variants={itemVariants} className="flex gap-6 justify-center">
          <button className="bg-primary text-on-primary px-12 py-4 text-label-lg uppercase rounded-xl premium-btn">
            Explore Portfolio
          </button>
          <button className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-12 py-4 text-label-lg uppercase rounded-xl premium-btn hover:bg-white/20">
            The Private Office
          </button>
        </motion.div>
      </motion.div>

      {/* Advanced Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-12 w-full max-w-5xl"
      >
        <div className="bg-white p-2 shadow-lg rounded-2xl flex flex-col md:flex-row gap-2 items-stretch">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="relative flex items-center px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary mr-3">location_on</span>
              <input
                className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface placeholder:text-on-surface-variant/50"
                placeholder="Local Destination"
                type="text"
              />
            </div>
            <div className="relative flex items-center px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary mr-3">home_work</span>
              <select className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface">
                <option>Property Type</option>
                <option>Villa</option>
                <option>Penthouse</option>
                <option>Private Island</option>
              </select>
            </div>
            <div className="relative flex items-center px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary mr-3">payments</span>
              <input
                className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface placeholder:text-on-surface-variant/50"
                placeholder="Minimum ₱10M"
                type="text"
              />
            </div>
          </div>
          <button className="bg-primary text-on-primary px-12 py-4 text-label-lg uppercase rounded-xl premium-btn flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">search</span> Search
          </button>
        </div>
      </motion.div>
    </section>
  );
}
