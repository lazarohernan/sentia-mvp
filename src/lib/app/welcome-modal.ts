export const DASHBOARD_WELCOME_STORAGE_KEY = "perks.dashboard.welcome.v5";
export const DASHBOARD_WELCOME_DISMISSED_EVENT = "perks:welcome-dismissed";

export function hasSeenDashboardWelcome() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem(DASHBOARD_WELCOME_STORAGE_KEY) === "1";
}

export function markDashboardWelcomeSeen() {
  window.localStorage.setItem(DASHBOARD_WELCOME_STORAGE_KEY, "1");
  window.dispatchEvent(new Event(DASHBOARD_WELCOME_DISMISSED_EVENT));
}
