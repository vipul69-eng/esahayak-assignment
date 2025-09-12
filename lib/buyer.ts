/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/buyers.ts
import { z } from "zod";
import { BHK, Timeline, Source, Status } from "@prisma/client";

export const buyerSchema = z
  .object({
    fullName: z.string().min(2).max(80),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().regex(/^\d{10,15}$/),
    city: z.enum(["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"]),
    propertyType: z.enum(["Apartment", "Villa", "Plot", "Office", "Retail"]),
    bhk: z.enum(["1", "2", "3", "4", "Studio"]).optional(),
    purpose: z.enum(["Buy", "Rent"]),
    budgetMin: z.number().int().nonnegative().optional(),
    budgetMax: z.number().int().nonnegative().optional(),
    timeline: z.enum(["0-3m", "3-6m", ">6m", "Exploring"]),
    source: z.enum(["Website", "Referral", "Walk-in", "Call", "Other"]),
    status: z
      .enum([
        "New",
        "Qualified",
        "Contacted",
        "Visited",
        "Negotiation",
        "Converted",
        "Dropped",
      ])
      .optional(),
    notes: z.string().max(1000).optional(),
    tags: z.array(z.string()).optional(),
  })
  .superRefine((d, ctx) => {
    if (
      d.budgetMin != null &&
      d.budgetMax != null &&
      d.budgetMax < d.budgetMin
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "budgetMax must be ≥ budgetMin",
        path: ["budgetMax"],
      });
    }
    if (
      (d.propertyType === "Apartment" || d.propertyType === "Villa") &&
      !d.bhk
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "bhk required for Apartment/Villa",
        path: ["bhk"],
      });
    }
  });

export const toBhk = (v?: string | null): BHK | null => {
  if (!v) return null;
  switch (v) {
    case "1":
      return BHK.ONE;
    case "2":
      return BHK.TWO;
    case "3":
      return BHK.THREE;
    case "4":
      return BHK.FOUR;
    case "Studio":
      return BHK.STUDIO;
    default:
      throw new Error("Invalid BHK");
  }
};

export const toTimeline = (v: string): Timeline => {
  switch (v) {
    case "0-3m":
      return Timeline.T0_3M;
    case "3-6m":
      return Timeline.T3_6M;
    case ">6m":
      return Timeline.GT_6M;
    case "Exploring":
      return Timeline.EXPLORING;
    default:
      throw new Error("Invalid timeline");
  }
};

export const toSource = (v: string): Source => {
  switch (v) {
    case "Website":
      return Source.WEBSITE;
    case "Referral":
      return Source.REFERRAL;
    case "Walk-in":
      return Source.WALK_IN;
    case "Call":
      return Source.CALL;
    case "Other":
      return Source.OTHER;
    default:
      throw new Error("Invalid source");
  }
};

export const toStatus = (v?: string | null): Status => {
  switch (v ?? "New") {
    case "New":
      return Status.New;
    case "Qualified":
      return Status.Qualified;
    case "Contacted":
      return Status.Contacted;
    case "Visited":
      return Status.Visited;
    case "Negotiation":
      return Status.Negotiation;
    case "Converted":
      return Status.Converted;
    case "Dropped":
      return Status.Dropped;
    default:
      throw new Error("Invalid status");
  }
};

// Optional inverse mappers for export formatting
export const fromTimeline = (t: Timeline) =>
  t === "T0_3M"
    ? "0-3m"
    : t === "T3_6M"
      ? "3-6m"
      : t === "GT_6M"
        ? ">6m"
        : "Exploring";

export const fromBhk = (b: BHK | null) =>
  b === null
    ? ""
    : b === "ONE"
      ? "1"
      : b === "TWO"
        ? "2"
        : b === "THREE"
          ? "3"
          : b === "FOUR"
            ? "4"
            : "Studio";

// Minimal CSV stringify utility
export function toCsv(rows: Array<Record<string, any>>): string {
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const headers = Object.keys(rows ?? {});
  const lines = [
    headers.map(esc).join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ];
  return lines.join("\n");
}
