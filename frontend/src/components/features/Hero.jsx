import { motion } from 'framer-motion';

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
    <section className="relative min-h-screen h-auto md:h-screen flex flex-col items-center justify-center overflow-hidden py-32 md:py-0">
      <div className="absolute inset-0">
        <img
          alt="Luxurious Modern Villa"
          className="w-full h-full object-cover"
        //src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#174849]/40 to-[#174849]/80"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative md:absolute z-10 max-w-[1440px] mx-auto px-5 md:px-10 lg:px-20 text-center"
      >
        <motion.span variants={itemVariants} className="text-xs font-bold uppercase tracking-widest text-accent font-sans mb-6 block">
          Elite Real Estate Intelligence
        </motion.span>
        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold font-display tracking-tight text-white mb-8 leading-tight max-w-5xl mx-auto">
          Where Heritage Meets <span className="text-accent">Strategic Advisory.</span>
        </motion.h1>
        <motion.p variants={itemVariants} className="text-base md:text-lg lg:text-xl text-white/90 leading-relaxed font-sans mb-12 max-w-3xl mx-auto">
          Experience the next evolution of luxury property acquisition. Our exclusive market insights analyze
          global markets to secure your legacy.
        </motion.p>
        <motion.div variants={itemVariants} className="flex gap-6 justify-center">
          <button className="bg-primary text-on-primary px-12 py-4 text-sm font-bold uppercase tracking-widest font-sans rounded-xl premium-btn">
            Explore Portfolio
          </button>
          <button className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-12 py-4 text-sm font-bold uppercase tracking-widest font-sans rounded-xl premium-btn hover:bg-white/20">
            The Private Office
          </button>
        </motion.div>
      </motion.div>

      {/* Advanced Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative md:absolute z-20 md:bottom-12 md:left-1/2 md:-translate-x-1/2 w-full max-w-[1440px] px-5 md:px-10 lg:px-20 mt-16 md:mt-0"
      >
        <div className="bg-white p-2 shadow-lg rounded-2xl flex flex-col md:flex-row gap-2 items-stretch">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="relative flex items-center px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary mr-3">location_on</span>
              <input
                className="bg-transparent border-none focus:ring-0 w-full text-sm md:text-base text-gray-500 leading-relaxed font-sans placeholder:text-gray-400"
                placeholder="Local Destination"
                type="text"
              />
            </div>
            <div className="relative flex items-center px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary mr-3">home_work</span>
              <select className="bg-transparent border-none focus:ring-0 w-full text-sm md:text-base text-gray-500 leading-relaxed font-sans">
                <option>Property Type</option>
                <option>Villa</option>
                <option>Penthouse</option>
                <option>Private Island</option>
              </select>
            </div>
            <div className="relative flex items-center px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary mr-3">payments</span>
              <input
                className="bg-transparent border-none focus:ring-0 w-full text-sm md:text-base text-gray-500 leading-relaxed font-sans placeholder:text-gray-400"
                placeholder="Minimum ₱10M"
                type="text"
              />
            </div>
          </div>
          <button className="bg-primary text-on-primary px-12 py-4 text-sm font-bold uppercase tracking-widest font-sans rounded-xl premium-btn flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">search</span> Search
          </button>
        </div>
      </motion.div>
    </section>
  );
}
