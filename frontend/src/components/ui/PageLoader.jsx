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

    // 1. Staggered individual 3D fly-in from big to small
    tl.fromTo([pRef.current, tRef.current, dotRef.current, subtitleRef.current], 
      { x: "-50vw", y: "-50vh", z: 1000, rotationX: 360, rotationY: 360, rotationZ: 360, scale: 5, opacity: 0 },
      { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1, opacity: 1, duration: 1.2, ease: "power4.out", stagger: 0.15 },
      0.1
    );

    // 2. Continuous pulse effect on the logo container while loading
    tl.to(logoRef.current, {
      scale: 1.05,
      duration: 0.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    }, "+=0.1");

    // 2. Animate the loading bar width
    tl.to(barRef.current, {
      width: "100%",
      duration: 2.2, // fits inside the 3s global loading state
      ease: "power3.inOut"
    }, 0.5);
    
    // 3. Counter animation 0 to 100
    const counter = { value: 0 };
    tl.to(counter, {
      value: 100,
      duration: 2.2,
      ease: "power3.inOut",
      onUpdate: () => {
        if (textRef.current) {
          textRef.current.innerText = Math.round(counter.value) + "%";
        }
      }
    }, 0.5);
    
    return () => tl.kill();
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface transition-transform duration-1000 ease-in-out ${isLoading ? 'translate-y-0' : '-translate-y-full'}`}
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
