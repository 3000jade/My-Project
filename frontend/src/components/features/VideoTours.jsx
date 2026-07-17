import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoTours() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <>
      <section className="mb-stack-xl max-w-container-max mx-auto px-margin-desktop">
        <div className="flex flex-col md:flex-row justify-between items-end mb-stack-lg gap-4">
          <div>
            <h2 className="text-headline-md font-headline-md text-primary font-semibold">
              Immersive Property Tours
            </h2>
            <p className="text-body-md text-on-surface-variant mt-1">
              Experience our most exclusive estates through cinematic virtual walkthroughs.
            </p>
          </div>
          <button className="text-primary-container hover:text-primary text-label-md font-label-md flex items-center gap-1 transition-colors">
            View More Videos <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
        <div className="relative group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow aspect-video bg-surface-container-highest cursor-pointer" onClick={() => setIsVideoOpen(true)}>
          <img
            alt="Video tour thumbnail"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            src="https://lh3.googleusercontent.com/aida/AP1WRLsyjFnnl-W917UVIXGcIK9xyYtqUnj9La-PdTZjqyEPP4nxS0JMy8D2S8q-pLByiuZDAVlbwPi7_RZ8T4dgzIMuX7xl9SbjGKbed0lnfpOYvAet7VipCweeU3KrwKnjYv7vUO-eDQJOa3usVQMoMUaIssiCcHWgeGxuAr-dBLejTXnN4dL5-ZsfQokNnZ7I_O09OV3b2YEJnTdxceBF2drS5heqXivS_Ywe0Q30IkzWURbw97gmP3VNeBE"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity group-hover:bg-black/40">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-lg"
            >
              <span className="material-symbols-outlined text-[48px] icon-fill">play_arrow</span>
            </motion.div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <h3 className="text-title-lg font-title-lg text-white">The Grand Horizon Villa - Cinematic Tour</h3>
            <p className="text-body-md text-white/80">4:25 • 4K Ultra HD</p>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setIsVideoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsVideoOpen(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
              {/* Placeholder for actual video player */}
              <div className="w-full h-full flex items-center justify-center bg-surface-container-highest">
                <span className="text-on-surface-variant font-label-lg">Video Player Placeholder</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
