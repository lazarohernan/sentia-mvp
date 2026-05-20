import { describe, expect, it } from "vitest";

import { getAccountStatusFromAuthUser } from "./resend-team-member-invite";

describe("getAccountStatusFromAuthUser", () => {
  it("marks users without sign-in as pending activation", () => {
    expect(
      getAccountStatusFromAuthUser({
        last_sign_in_at: null,
        email_confirmed_at: null,
      }),
    ).toBe("pending_activation");
  });

  it("marks users with sign-in as active", () => {
    expect(
      getAccountStatusFromAuthUser({
        last_sign_in_at: "2026-05-20T12:00:00.000Z",
        email_confirmed_at: "2026-05-20T12:00:00.000Z",
      }),
    ).toBe("active");
  });
});
