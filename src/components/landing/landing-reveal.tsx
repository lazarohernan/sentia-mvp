"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

type LandingRevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  soft?: boolean;
};

let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver() {
  if (typeof window === "undefined") {
    return null;
  }

  if (sharedObserver) {
    return sharedObserver;
  }

  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        sharedObserver?.unobserve(entry.target);
      }
    },
    {
      root: null,
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.14,
    },
  );

  return sharedObserver;
}

export function LandingReveal({
  children,
  className = "",
  delayMs = 0,
  soft = false,
}: LandingRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      node.classList.add("is-visible");
      return;
    }

    const observer = getSharedObserver();
    if (!observer) {
      node.classList.add("is-visible");
      return;
    }

    observer.observe(node);
    return () => observer.unobserve(node);
  }, []);

  return (
    <div
      ref={ref}
      className={`${soft ? "reveal-soft" : "reveal"} ${className}`.trim()}
      style={{ "--reveal-delay": `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
