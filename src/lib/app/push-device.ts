export type DeviceProbe = {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
};

export function isAppleMobileDevice(probe: DeviceProbe) {
  if (/iPad|iPhone|iPod/.test(probe.userAgent)) {
    return true;
  }

  return probe.platform === "MacIntel" && (probe.maxTouchPoints ?? 0) > 1;
}

export function readDeviceProbe(): DeviceProbe | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
  };
}

export function isStandaloneWebApp() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean(navigator.standalone))
  );
}

export function requiresStandaloneForWebPush(probe = readDeviceProbe()) {
  if (!probe) {
    return false;
  }

  return isAppleMobileDevice(probe) && !isStandaloneWebApp();
}
