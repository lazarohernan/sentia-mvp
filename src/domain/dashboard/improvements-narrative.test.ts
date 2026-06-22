import { describe, expect, it } from "vitest";

import {
  humanizeNarrativeText,
  humanizePatternLabel,
} from "./improvements-narrative";

describe("improvements-narrative labels", () => {
  it("traduce códigos internos a lenguaje humano", () => {
    expect(humanizePatternLabel("wait_time")).toBe("Tiempo de espera");
    expect(humanizePatternLabel("customer_service")).toBe("Atención al cliente");
    expect(humanizePatternLabel("Tiempo de espera")).toBe("Tiempo de espera");
  });

  it("limpia códigos técnicos que se cuelen en la narrativa", () => {
    expect(
      humanizeNarrativeText(
        "El patrón [[wait_time]] aparece en [[2 casos]] durante la tarde.",
      ),
    ).toBe("El patrón [[tiempo de espera]] aparece en [[2 casos]] durante la tarde.");
  });
});
