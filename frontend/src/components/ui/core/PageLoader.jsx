import { useEffect, useRef, useState } from 'react';

export default function PageLoader({ isLoading, onComplete }) {
  const videoRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [hasError, setHasError] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setReducedMotion(true);
      const t = setTimeout(() => onCompleteRef.current?.(), 600);
      return () => clearTimeout(t);
    }

    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = 1;
    video.play().catch(() => {
      // Autoplay blocked — dismiss cleanly instead of freezing on the loader
      onCompleteRef.current?.();
    });
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => setShouldRender(false), 500);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div
      aria-busy={isLoading}
      aria-label="Loading Human Shelter Realty"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#EAECE7] transition-opacity duration-500 ease-out ${
        isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {reducedMotion || hasError ? (
        <img
          src="/images/human-shelter-logo.webp"
          alt="Human Shelter Realty"
          className="h-16 sm:h-20 w-auto object-contain"
        />
      ) : (
        <video
          ref={videoRef}
          src="/videos/human-shelter-loader.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={() => onCompleteRef.current?.()}
          onError={() => {
            setHasError(true);
            onCompleteRef.current?.();
          }}
          className="w-full max-w-3xl lg:max-w-6xl max-h-[85vh] h-auto object-contain pointer-events-none select-none"
        />
      )}
    </div>
  );
}
