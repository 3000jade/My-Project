import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function PageLoader({ isLoading }) {
  const containerRef = useRef(null);
  const barRef = useRef(null);
  const textRef = useRef(null);
  const logoRef = useRef(null);
  const pRef = useRef(null);
  const tRef = useRef(null);
  const dotRef = useRef(null);
  const subtitleRef = useRef(null);
  
  useEffect(() => {
    // We only want to run the animation once when it mounts
    if (!containerRef.current) return;
    
    const tl = gsap.timeline();
    
    // 0. Make container visible first
    gsap.set(logoRef.current, { opacity: 1 });

    // 1. Staggered individual 3D fly-in from big to small (crisp & snappy)
    tl.fromTo([pRef.current, tRef.current, dotRef.current, subtitleRef.current], 
      { x: "-30vw", y: "-30vh", z: 600, rotationX: 180, rotationY: 180, rotationZ: 180, scale: 3, opacity: 0 },
      { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1, opacity: 1, duration: 0.6, ease: "power4.out", stagger: 0.08 },
      0.05
    );

    // 2. Subtle pulse effect on the logo container while loading
    tl.to(logoRef.current, {
      scale: 1.04,
      duration: 0.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    }, "+=0.05");

    // 3. Animate the loading bar width (completes at ~1.0s)
    tl.to(barRef.current, {
      width: "100%",
      duration: 0.85,
      ease: "power2.out"
    }, 0.2);
    
    // 4. Counter animation 0 to 100
    const counter = { value: 0 };
    tl.to(counter, {
      value: 100,
      duration: 0.85,
      ease: "power2.out",
      onUpdate: () => {
        if (textRef.current) {
          textRef.current.innerText = Math.round(counter.value) + "%";
        }
      }
    }, 0.2);
    
    return () => tl.kill();
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface transition-transform duration-700 ease-in-out ${isLoading ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-[0.03]"></div>
      
      <div className="relative z-10 w-full max-w-sm px-10 flex flex-col items-center" style={{ perspective: '1200px' }}>
        {/* 2D Logo representation for "PT" */}
        <div ref={logoRef} className="mb-16 flex flex-col items-center opacity-0 [transform-style:preserve-3d]">
          <div className="flex gap-1 mb-4 items-center">
            <div ref={pRef} className="text-7xl font-display font-black text-primary tracking-tighter inline-block">P</div>
            <div ref={tRef} className="text-7xl font-display font-black text-[#E07A5F] tracking-tighter inline-block">T</div>
            <div ref={dotRef} className="w-3 h-3 rounded-full bg-[#E07A5F] mt-6 ml-2 inline-block"></div>
          </div>
          <h2 ref={subtitleRef} className="font-sans text-primary text-[10px] font-bold tracking-[0.4em] uppercase inline-block">EstateElite</h2>
        </div>
        
        {/* Loading Bar Container */}
        <div className="w-full h-[3px] bg-outline-variant/30 rounded-full overflow-hidden mb-6">
          <div ref={barRef} className="h-full bg-gradient-to-r from-primary to-[#E07A5F] w-0"></div>
        </div>
        
        {/* Loading Text */}
        <div className="w-full flex justify-between items-end text-primary font-bold font-sans text-[10px] tracking-widest uppercase">
          <span className="opacity-70">Initializing</span>
          <span ref={textRef} className="font-display text-xl tracking-normal">0%</span>
        </div>
      </div>
    </div>
  );
}
