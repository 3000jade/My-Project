import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PropertyGalleryMosaic({
  images = [],
  title = 'Property Photos'
}) {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);

  const photoList = images && images.length > 0
    ? images
    : [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200'
      ];

  const primaryImage = photoList[0];
  const secondaryImages = photoList.slice(1, 3);

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveLightboxIndex(prev => (prev > 0 ? prev - 1 : photoList.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveLightboxIndex(prev => (prev < photoList.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      <div className="relative rounded-3xl overflow-hidden bg-[#FBFBF9] border border-[#D8DFDF] shadow-sm">
        {/* Desktop 1 Hero + 3 Stacked Grid / Mobile Single Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-[400px] md:h-[480px] lg:h-[560px]">
          {/* Main Hero Photo (8 Cols) */}
          <div
            onClick={() => setActiveLightboxIndex(0)}
            className="lg:col-span-8 relative h-full overflow-hidden cursor-pointer group"
          >
            <img
              src={primaryImage}
              alt={`${title} - Main View`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
              <span className="text-white text-xs font-semibold font-sans flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">zoom_in</span> Click to view high-res
              </span>
            </div>
          </div>

          {/* Secondary Stack (4 Cols, 3 rows) */}
          <div className="hidden lg:grid col-span-4 grid-rows-3 gap-2 h-full">
            {secondaryImages.map((img, idx) => {
              const actualIndex = idx + 1;
              return (
                <div
                  key={actualIndex}
                  onClick={() => setActiveLightboxIndex(actualIndex)}
                  className="relative h-full overflow-hidden cursor-pointer group"
                >
                  <img
                    src={img}
                    alt={`${title} - Photo ${actualIndex + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                </div>
              );
            })}
            
            {/* Floor Plans & 3D Tour Block */}
            <div className="relative h-full overflow-hidden cursor-pointer group bg-[#070D0E] flex items-center justify-center border border-[#0D4446]/20">
              <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600')] bg-cover bg-center grayscale group-hover:scale-105 transition-transform duration-700 ease-out"></div>
              <div className="relative z-10 flex flex-col items-center justify-center text-[#F4F7F7] p-4 text-center">
                <span className="material-symbols-outlined text-3xl text-[#14B8A6] mb-2">view_in_ar</span>
                <span className="text-sm font-bold font-sans tracking-wide">Floor Plans & 3D Tour</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Actions Strip */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => setActiveLightboxIndex(0)}
              className="px-4 py-2.5 bg-white/95 hover:bg-white text-[#0D4446] backdrop-blur-md rounded-xl text-xs font-bold font-sans shadow-lg border border-[#D8DFDF] flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">photo_library</span>
              {photoList.length} Photos
            </button>
            <button
              type="button"
              className="px-4 py-2.5 bg-white/95 hover:bg-white text-[#0D4446] backdrop-blur-md rounded-xl text-xs font-bold font-sans shadow-lg border border-[#D8DFDF] flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">360</span>
              360° Tour
            </button>
          </div>
          
          <div className="flex gap-2 pointer-events-auto">
            <button className="px-4 py-2.5 bg-white/95 hover:bg-white text-[#5C6768] hover:text-[#0D4446] backdrop-blur-md rounded-xl text-xs font-bold font-sans shadow-lg border border-[#D8DFDF] flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">share</span> Share
            </button>
            <button className="px-4 py-2.5 bg-white/95 hover:bg-white text-[#5C6768] hover:text-[#E76F51] backdrop-blur-md rounded-xl text-xs font-bold font-sans shadow-lg border border-[#D8DFDF] flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">favorite</span> Save
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Dialog adhering to project rules */}
      <AnimatePresence>
        {activeLightboxIndex !== null && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 overflow-hidden font-sans"
            onClick={() => setActiveLightboxIndex(null)}
          >
            <motion.div
              className="relative w-full max-w-5xl h-[85vh] bg-white rounded-3xl overflow-hidden flex flex-col items-center justify-center shadow-2xl border border-gray-200"
              initial={{ y: 100, scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 100, scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              data-lenis-prevent="true"
            >
              {/* Close Button: standard w-9 h-9 solid white circular button with dark icon */}
              <button
                onClick={() => setActiveLightboxIndex(null)}
                aria-label="Close lightbox"
                className="absolute top-4 right-4 z-50 w-9 h-9 bg-white text-black shadow-xl rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-gray-200"
              >
                <span className="material-symbols-outlined text-[18px] font-bold">close</span>
              </button>

              {/* Photo Counter Tag in Geist Mono */}
              <div className="absolute top-4 left-4 z-50 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-md text-gray-800 text-xs font-mono font-semibold border border-gray-200 shadow-sm">
                {activeLightboxIndex + 1} / {photoList.length}
              </div>

              {/* Main Expanded Image */}
              <div className="w-full h-full flex items-center justify-center p-4 md:p-12 overflow-hidden bg-gray-50" data-lenis-prevent="true">
                <img
                  src={photoList[activeLightboxIndex]}
                  alt={`${title} - Lightbox view`}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-xl transition-all duration-300"
                />
              </div>

              {/* Previous Photo Button */}
              <button
                onClick={handlePrev}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-gray-800 shadow-md rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 border border-gray-200"
              >
                <span className="material-symbols-outlined text-2xl">chevron_left</span>
              </button>

              {/* Next Photo Button */}
              <button
                onClick={handleNext}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-gray-800 shadow-md rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 border border-gray-200"
              >
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
