import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function GalleryCard({ property, variants }) {
  const animationVariants = variants || {};
  const ref = useRef(null);
  const navigate = useNavigate();

  // Cinematic 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      variants={animationVariants}
      className="relative w-full h-full group cursor-pointer flex flex-col gap-4"
      onClick={() => navigate(`?propertyId=${property.id}`)}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="w-full flex-1 overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500 relative perspective-1000 rounded-lg bg-surface-container"
      >
        {/* Background Image */}
        <img
          src={property.image}
          alt={property.name}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 select-none"
        />

        {/* Cinematic Gradient Overlays (lighter) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Badge (Top Left) */}
        {property.badge && (
          <div className="absolute top-4 md:top-6 left-4 md:left-6 z-20 bg-[teal] text-white text-[11px] font-bold uppercase tracking-wider font-sans px-4 py-1.5 shadow-md backdrop-blur-md">
            {property.badge}
          </div>
        )}

        {/* Content Container (Title on lower left) */}
        <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end items-start z-20 pointer-events-none" style={{ transform: "translateZ(30px)" }}>
          <h3 className="text-2xl md:text-4xl lg:text-5xl font-black font-display text-white text-left drop-shadow-md tracking-tight max-w-4xl">
            {property.name}
          </h3>
          <span className="text-[#FF7F50] font-bold text-sm md:text-base uppercase tracking-widest mt-1 mb-3 drop-shadow-md">
            {property.badge || "Luxury Property"}
          </span>

          {/* Details (Always visible, changes color on hover) */}
          <div className="overflow-hidden mt-2">
            <div className="flex items-center justify-start gap-2 transition-all duration-300 ease-out">
              <span className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-white group-hover:text-[Teal] transition-colors duration-300 font-sans drop-shadow-md">Click to view property</span>
              <span className="material-symbols-outlined text-white group-hover:text-[#FF7F50] transition-colors duration-300 text-[16px] drop-shadow-md">arrow_forward</span>
            </div>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
