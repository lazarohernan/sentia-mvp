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
  userId: string;
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
