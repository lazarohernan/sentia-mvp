"use client";

import { useEffect } from "react";

export function LandingScrollReset() {
  useEffect(() => {
    if (window.location.hash) {
      return;
    }

    const resetScroll = () => window.scrollTo({ left: 0, top: 0 });

    resetScroll();
    const frameId = window.requestAnimationFrame(resetScroll);

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  return null;
}
