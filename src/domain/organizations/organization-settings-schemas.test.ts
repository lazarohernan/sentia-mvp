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
      peakHours: "  viernes 5pm a 8pm  ",
      servicePriorities: "  rapidez en caja y limpieza  ",
      compensationPolicy: "  ofrecer disculpa y bebida  ",
      followUpTone: "  cercano y claro  ",
      agentNotes: "",
      logoUrl: null,
    });

    expect(parsed.name).toBe("Cafe Central");
    expect(parsed.tagline).toBeNull();
    expect(parsed.contactEmail).toBeNull();
    expect(parsed.contactPhone).toBe("2222-3333");
    expect(parsed.websiteUrl).toBe("https://cafe-central.com");
    expect(parsed.peakHours).toBe("viernes 5pm a 8pm");
    expect(parsed.servicePriorities).toBe("rapidez en caja y limpieza");
    expect(parsed.compensationPolicy).toBe("ofrecer disculpa y bebida");
    expect(parsed.followUpTone).toBe("cercano y claro");
    expect(parsed.agentNotes).toBeNull();
  });
});
