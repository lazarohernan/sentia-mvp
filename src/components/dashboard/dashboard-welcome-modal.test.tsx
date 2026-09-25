import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { DASHBOARD_WELCOME_STORAGE_KEY, hasSeenDashboardWelcome } from "@/lib/app/welcome-modal";
import { DashboardWelcomeModal } from "./dashboard-welcome-modal";

afterEach(() => {
  cleanup();
  window.localStorage.removeItem(DASHBOARD_WELCOME_STORAGE_KEY);
});

it("requires the start button to complete the welcome", () => {
  render(<DashboardWelcomeModal />);
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getAllByRole("button")).toHaveLength(1);

  fireEvent.keyDown(document, { key: "Escape" });
  fireEvent.click(dialog.previousElementSibling!);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(hasSeenDashboardWelcome()).toBe(false);

  fireEvent.click(screen.getByRole("button", { name: "Vamos a empezar" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(hasSeenDashboardWelcome()).toBe(true);
});
