// lib/csvRowValidator.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";

// UI-level enums as CSV expects
const City = z.enum(["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"]);
const PropertyType = z.enum(["Apartment", "Villa", "Plot", "Office", "Retail"]);
const Purpose = z.enum(["Buy", "Rent"]);
const Timeline = z.enum(["0-3m", "3-6m", ">6m", "Exploring"]);
const Source = z.enum(["Website", "Referral", "Walk-in", "Call", "Other"]);
const Status = z.enum([
  "New",
  "Qualified",
  "Contacted",
  "Visited",
  "Negotiation",
  "Converted",
  "Dropped",
]);

export const csvRowSchema = z
  .object({
    fullName: z.string().min(2).max(80),
    email: z
      .string()
      .email()
      .or(z.literal(""))
      .optional()
      .transform((v) => v ?? ""),
    phone: z.string().regex(/^\d{10,15}$/),
    city: City,
    propertyType: PropertyType,
    bhk: z
      .union([
        z.literal(""),
        z.literal("1"),
        z.literal("2"),
        z.literal("3"),
        z.literal("4"),
        z.literal("Studio"),
      ])
      .optional(),
    purpose: Purpose,
    budgetMin: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
      .pipe(z.number().nonnegative().optional()),
    budgetMax: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
      .pipe(z.number().nonnegative().optional()),
    timeline: Timeline,
    source: Source,
    notes: z.string().max(1000).optional(),
    tags: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((v) =>
        Array.isArray(v)
          ? v
          : (v ?? "")
              .split("|")
              .map((s) => s.trim())
              .filter(Boolean),
      ),
    status: Status.optional(),
  })
  .superRefine((data, ctx) => {
    // If Apartment or Villa, bhk required
    if (
      (data.propertyType === "Apartment" || data.propertyType === "Villa") &&
      !data.bhk
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bhk"],
        message: "BHK is required for Apartment/Villa",
      });
    }
    // budgetMin <= budgetMax if both present
    if (
      data.budgetMin != null &&
      data.budgetMax != null &&
      data.budgetMin > data.budgetMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMax"],
        message: "budgetMax must be greater than or equal to budgetMin",
      });
    }
  });

export type CsvRowParsed = z.infer<typeof csvRowSchema>;

// Validate a single parsed CSV object row (keys must match header names)
export function validateCsvRow(row: any) {
  const input = {
    fullName: row.fullName,
    email: row.email ?? "",
    phone: row.phone,
    city: row.city,
    propertyType: row.propertyType,
    bhk: row.bhk ?? "",
    purpose: row.purpose,
    budgetMin: row.budgetMin,
    budgetMax: row.budgetMax,
    timeline: row.timeline,
    source: row.source,
    notes: row.notes,
    tags: row.tags,
    status: row.status,
  };
  const parsed = csvRowSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { ok: false as const, error: flat };
  }
  return { ok: true as const, data: parsed.data };
}
