import { z } from "zod";

import {
  sanitizeEmailInput,
  sanitizeOptionalTextInput,
  sanitizeTextInput,
} from "@/lib/security/input";

function normalizeOptionalText(value: unknown, maxLength: number) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const sanitized = sanitizeOptionalTextInput(value);
  if (!sanitized || sanitized.length > maxLength) {
    return sanitized && sanitized.length > maxLength ? sanitized.slice(0, maxLength) : null;
  }

  return sanitized;
}

function normalizeWebsiteUrl(value: unknown) {
  const normalized = normalizeOptionalText(value, 300);
  if (!normalized) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `https://${normalized}`;
}

export const organizationSettingsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(160),
  logoUrl: z.string().url().nullable(),
  tagline: z.string().max(160).nullable(),
  description: z.string().max(1000).nullable(),
  contactEmail: z.string().email().nullable(),
  contactPhone: z.string().max(40).nullable(),
  websiteUrl: z.string().url().nullable(),
  address: z.string().max(320).nullable(),
  alertEscalationPhone: z.string().max(40).nullable(),
  alertEscalationEmail: z.string().email().nullable(),
  peakHours: z.string().max(400).nullable(),
  servicePriorities: z.string().max(800).nullable(),
  compensationPolicy: z.string().max(1000).nullable(),
  followUpTone: z.string().max(240).nullable(),
  agentNotes: z.string().max(1200).nullable(),
  createdAt: z.string(),
});

export const updateOrganizationSettingsInputSchema = z.object({
  name: z
    .string()
    .transform(sanitizeTextInput)
    .pipe(z.string().min(2).max(160)),
  tagline: z.preprocess(
    (value) => normalizeOptionalText(value, 160),
    z.string().max(160).nullable(),
  ),
  description: z.preprocess(
    (value) => normalizeOptionalText(value, 1000),
    z.string().max(1000).nullable(),
  ),
  contactEmail: z.preprocess((value) => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== "string") {
      return null;
    }

    const sanitized = sanitizeOptionalTextInput(value);
    if (!sanitized) {
      return null;
    }

    return sanitizeEmailInput(sanitized);
  }, z.string().email().nullable()),
  contactPhone: z.preprocess(
    (value) => normalizeOptionalText(value, 40),
    z.string().max(40).nullable(),
  ),
  websiteUrl: z.preprocess(
    (value) => normalizeWebsiteUrl(value),
    z.string().url().nullable(),
  ),
  address: z.preprocess(
    (value) => normalizeOptionalText(value, 320),
    z.string().max(320).nullable(),
  ),
  peakHours: z.preprocess(
    (value) => normalizeOptionalText(value, 400),
    z.string().max(400).nullable(),
  ),
  servicePriorities: z.preprocess(
    (value) => normalizeOptionalText(value, 800),
    z.string().max(800).nullable(),
  ),
  compensationPolicy: z.preprocess(
    (value) => normalizeOptionalText(value, 1000),
    z.string().max(1000).nullable(),
  ),
  followUpTone: z.preprocess(
    (value) => normalizeOptionalText(value, 240),
    z.string().max(240).nullable(),
  ),
  agentNotes: z.preprocess(
    (value) => normalizeOptionalText(value, 1200),
    z.string().max(1200).nullable(),
  ),
  logoUrl: z.preprocess((value) => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== "string") {
      return null;
    }

    const sanitized = sanitizeOptionalTextInput(value);
    return sanitized ?? null;
  }, z.string().url().nullable()),
});

export const updateAlertEscalationInputSchema = z.object({
  alertEscalationPhone: z.preprocess(
    (value) => normalizeOptionalText(value, 40),
    z.string().max(40).nullable(),
  ),
  alertEscalationEmail: z.preprocess((value) => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== "string") {
      return null;
    }

    const sanitized = sanitizeOptionalTextInput(value);
    if (!sanitized) {
      return null;
    }

    return sanitizeEmailInput(sanitized);
  }, z.string().email().nullable()),
});

export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;
export type UpdateOrganizationSettingsInput = z.infer<
  typeof updateOrganizationSettingsInputSchema
>;
export type UpdateAlertEscalationInput = z.infer<
  typeof updateAlertEscalationInputSchema
>;

export type AlertEscalationSettings = {
  alertEscalationPhone: string | null;
  alertEscalationEmail: string | null;
};
