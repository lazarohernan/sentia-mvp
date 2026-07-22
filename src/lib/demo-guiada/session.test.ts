import { describe, expect, it } from "vitest";
import { buildDemoCaseFromFeedback, buildDemoDashboardData } from "./session";

describe("buildDemoCaseFromFeedback", () => {
  it("builds a risk alert and comment from a low CSAT submission", () => {
    const demoCase = buildDemoCaseFromFeedback({
      csatScore: 2,
      freeText: "La atención fue lenta y nadie me dio solución en caja.",
      clarificationCategory: "wait_time",
      clarificationDetail: "Esperé casi veinte minutos",
      clarificationQuestion: "¿Qué fue lo principal que debemos corregir?",
    });

    expect(demoCase.comment.sentiment).toBe("Riesgo");
    expect(demoCase.comment.feedbackType).toBe("Queja");
    expect(demoCase.comment.dominantPattern).toBe("Tiempo de espera");
    expect(demoCase.comment.recommendedAction).toMatch(/responsable/i);
    expect(demoCase.alert.submissionId).toBe(demoCase.comment.id);
    expect(demoCase.alert.tone).toBe("danger");
    expect(demoCase.alert.workflowStatus).toBe("nuevo");
  });

  it("includes the generated case inside dashboard summary fixtures", () => {
    const demoCase = buildDemoCaseFromFeedback({
      csatScore: 1,
      freeText: "La mesa estaba pegajosa y pedí dos veces que la limpiaran.",
      clarificationCategory: "cleanliness",
    });
    const data = buildDemoDashboardData(demoCase);

    expect(data.comments[0]?.id).toBe(demoCase.comment.id);
    expect(data.attentionItems[0]?.submissionId).toBe(demoCase.comment.id);
    expect(data.branchHealth).toHaveLength(3);
  });
});
