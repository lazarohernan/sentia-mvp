import { describe, expect, it } from "vitest";

import { hasMatchingApplicationServerKey } from "./push-notifications-toggle";

describe("hasMatchingApplicationServerKey", () => {
  it("returns false when an existing push subscription was created with a different VAPID key", () => {
    const currentKey = new Uint8Array([1, 2, 3, 4]);
    const subscription = {
      options: {
        applicationServerKey: new Uint8Array([4, 3, 2, 1]).buffer,
      },
    } as PushSubscription;

    expect(hasMatchingApplicationServerKey(subscription, currentKey)).toBe(false);
  });

  it("returns true when the existing push subscription uses the current VAPID key", () => {
    const currentKey = new Uint8Array([1, 2, 3, 4]);
    const subscription = {
      options: {
        applicationServerKey: new Uint8Array([1, 2, 3, 4]).buffer,
      },
    } as PushSubscription;

    expect(hasMatchingApplicationServerKey(subscription, currentKey)).toBe(true);
  });
});
