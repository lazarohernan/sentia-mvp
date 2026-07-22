"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const MAX_SHIFT = 28;

export function LandingHeroMedia() {
  const layerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const latestScrollRef = useRef(0);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const mediaQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    if (mediaQuery?.matches) return;

    const applyParallax = () => {
      frameRef.current = 0;
      const shift = Math.min(latestScrollRef.current * 0.12, MAX_SHIFT);
      layer.style.transform = `translate3d(0, ${shift}px, 0) scale(1.03)`;
    };

    const onScroll = () => {
      latestScrollRef.current = window.scrollY;
      if (frameRef.current) return;
      frameRef.current = window.requestAnimationFrame(applyParallax);
    };

    applyParallax();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="hero-media-cut pointer-events-none absolute inset-x-0 top-0 h-[44svh] overflow-hidden sm:h-full"
    >
      <div
        ref={layerRef}
        className="absolute inset-[-3%] will-change-transform"
        style={{ transform: "translate3d(0, 0, 0) scale(1.03)" }}
      >
        <Image
          src="/images/perks-hero-latam-service-layout-v2.png"
          alt=""
          fill
          priority
          quality={92}
          sizes="(min-width: 1536px) 1800px, (min-width: 1280px) 1400px, 100vw"
          className="object-cover object-[58%_36%] sm:object-[68%_52%] lg:object-[66%_54%]"
        />
      </div>

      {/* Mobile: foto clara, solo un fade corto abajo. Desktop: degradado lateral para el texto. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,243,228,0.12)_0%,rgba(251,243,228,0.05)_55%,rgba(251,243,228,0.55)_82%,rgba(251,243,228,1)_100%)] sm:bg-[linear-gradient(105deg,rgba(251,243,228,0.98)_0%,rgba(251,243,228,0.88)_22%,rgba(251,243,228,0.32)_46%,rgba(251,243,228,0.02)_70%)]" />
    </div>
  );
}
