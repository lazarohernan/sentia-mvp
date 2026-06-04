import { describe, expect, it } from "vitest";

import { updateOrganizationSettingsInputSchema } from "./organization-settings-schemas";

describe("updateOrganizationSettingsInputSchema", () => {
  it("normalizes optional fields and website urls", () => {
    const parsed = updateOrganizationSettingsInputSchema.parse({
      name: "  Cafe Central  ",
      tagline: "",
      description: "Atencion cercana y productos frescos.",
      contactEmail: "",
      contactPhone: " 2222-3333 ",
      websiteUrl: "cafe-central.com",
      address: "",
      logoUrl: null,
    });

    expect(parsed.name).toBe("Cafe Central");
    expect(parsed.tagline).toBeNull();
    expect(parsed.contactEmail).toBeNull();
    expect(parsed.contactPhone).toBe("2222-3333");
    expect(parsed.websiteUrl).toBe("https://cafe-central.com");
  });
});
