import { afterEach, describe, expect, it } from "vitest";

import {
  DASHBOARD_WELCOME_DISMISSED_EVENT,
  DASHBOARD_WELCOME_STORAGE_KEY,
  hasSeenDashboardWelcome,
  markDashboardWelcomeSeen,
} from "./welcome-modal";

describe("welcome modal storage", () => {
  afterEach(() => {
    window.localStorage.removeItem(DASHBOARD_WELCOME_STORAGE_KEY);
  });

  it("starts unseen", () => {
    expect(hasSeenDashboardWelcome()).toBe(false);
  });

  it("remembers the first dismissal", () => {
    markDashboardWelcomeSeen();
    expect(hasSeenDashboardWelcome()).toBe(true);
  });

  it("notifies listeners when the welcome is dismissed", () => {
    let notified = false;
    const handleDismissed = () => {
      notified = true;
    };

    window.addEventListener(DASHBOARD_WELCOME_DISMISSED_EVENT, handleDismissed);
    markDashboardWelcomeSeen();
    window.removeEventListener(DASHBOARD_WELCOME_DISMISSED_EVENT, handleDismissed);

    expect(notified).toBe(true);
  });
});
