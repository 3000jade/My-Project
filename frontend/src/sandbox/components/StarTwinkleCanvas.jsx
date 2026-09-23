import { useEffect, useRef } from 'react';

export default function StarTwinkleCanvas({ starCount = 65, speed = 0.8, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth || 1000);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight || 800);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth || 1000;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight || 800;
    };

    window.addEventListener('resize', handleResize);

    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.65), // Concentrated in the upper sky
      radius: Math.random() * 1.4 + 0.4,
      baseAlpha: Math.random() * 0.6 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: (Math.random() * 0.02 + 0.01) * speed
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        star.phase += star.speed;
        const currentAlpha = Math.max(0.1, star.baseAlpha + Math.sin(star.phase) * 0.35);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.shadowBlur = star.radius * 2;
        ctx.shadowColor = 'rgba(251, 142, 93, 0.5)';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [starCount, speed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none z-[2] ${className}`}
    />
  );
}
