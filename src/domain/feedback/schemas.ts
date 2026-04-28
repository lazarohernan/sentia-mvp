import { z } from "zod";

export const feedbackTypeSchema = z.enum([
  "complaint",
  "suggestion",
  "compliment",
  "recommendation",
]);

export const sentimentSchema = z.enum(["positive", "neutral", "negative"]);

export const urgencySchema = z.enum(["low", "medium", "high", "critical"]);

export const feedbackCategorySchema = z.enum([
  "customer_service",
  "wait_time",
  "product_quality",
  "cleanliness",
  "price",
  "environment",
  "billing",
  "other",
]);

export const listeningLevelSchema = z.enum([
  "download",
  "debate",
  "empathetic_listening",
  "generative_dialogue",
]);

export const feedbackContactSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().min(8).max(32).optional(),
    email: z.string().trim().email().max(160).optional(),
  })
  .refine((contact) => contact.name || contact.phone || contact.email, {
    message: "At least one contact field is required when contact is provided.",
  });

export const feedbackSubmissionSchema = z.object({
  branchSlug: z.string().trim().min(2).max(120),
  type: feedbackTypeSchema,
  npsScore: z.number().int().min(0).max(10).optional(),
  csatScore: z.number().int().min(1).max(5).optional(),
  emotionScore: z.number().int().min(1).max(5),
  freeText: z.string().trim().min(8).max(2_000),
  contact: feedbackContactSchema.optional(),
  consentAccepted: z.literal(true),
});

export const aiAnalysisSchema = z.object({
  sentiment: sentimentSchema,
  polarity: z.number().min(-1).max(1),
  emotionScore: z.number().int().min(1).max(5),
  urgency: urgencySchema,
  category: feedbackCategorySchema,
  entities: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  summary: z.string().trim().min(8).max(240),
  recommendedAction: z.string().trim().min(8).max(320),
  keywords: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
});

export const listeningEventSchema = z.object({
  collaboratorId: z.string().trim().min(2).max(120),
  branchId: z.string().trim().min(2).max(120),
  level: listeningLevelSchema,
  note: z.string().trim().max(500).optional(),
});

export type FeedbackType = z.infer<typeof feedbackTypeSchema>;
export type FeedbackSubmission = z.infer<typeof feedbackSubmissionSchema>;
export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;
export type ListeningLevel = z.infer<typeof listeningLevelSchema>;
export type ListeningEvent = z.infer<typeof listeningEventSchema>;
