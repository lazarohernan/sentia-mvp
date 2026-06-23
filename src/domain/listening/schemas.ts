import { z } from "zod";

import { listeningLevelSchema } from "@/domain/feedback/schemas";
import { sanitizeOptionalTextInput } from "@/lib/security/input";

export const createListeningEventInputSchema = z.object({
  branchId: z.string().uuid(),
  level: listeningLevelSchema,
  note: z
    .string()
    .optional()
    .transform(sanitizeOptionalTextInput)
    .refine((value) => value === undefined || value.length <= 500),
});

export type CreateListeningEventInput = z.infer<typeof createListeningEventInputSchema>;

export type ListeningEventRow = {
  id: string;
  organizationId: string;
  branchId: string | null;
  branchName: string | null;
  userId: string | null;
  userName: string;
  level: z.infer<typeof listeningLevelSchema>;
  levelLabel: string;
  note: string | null;
  createdAt: string;
};

export const listeningLevelLabels: Record<
  z.infer<typeof listeningLevelSchema>,
  string
> = {
  download: "Descarga",
  debate: "Debate",
  empathetic_listening: "Escucha empatica",
  generative_dialogue: "Dialogo generativo",
};

export const listeningLevelDescriptions: Record<
  z.infer<typeof listeningLevelSchema>,
  string
> = {
  download: "Reaccionas desde habitos, juicio rapido o respuestas automaticas.",
  debate: "Escuchas datos y diferencias, pero aun defiendes tu punto de vista.",
  empathetic_listening: "Comprendes la emocion, contexto y necesidad de la otra persona.",
  generative_dialogue: "La conversacion abre una posibilidad, decision o aprendizaje nuevo.",
};

export const listeningLevelReflectionPrompts: Record<
  z.infer<typeof listeningLevelSchema>,
  string
> = {
  download:
    "¿Hubo algún momento en el que reaccionaste en automático? Cuéntanos qué pasó, sin juicio.",
  debate:
    "¿En qué conversación escuchaste ideas distintas a las tuyas? ¿Qué te costó soltar o qué te sorprendió?",
  empathetic_listening:
    "¿Cuándo lograste entender cómo se sentía la otra persona? ¿Qué notaste en esa escena?",
  generative_dialogue:
    "¿Hubo algún momento donde la conversación abrió una idea o decisión nueva? ¿Qué surgió entre ustedes?",
};
