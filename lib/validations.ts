import { z } from "zod";

export const buyerSchema = z
  .object({
    fullName: z.string().min(2).max(80),
    email: z.string().email().optional().or(z.literal("")),
    phone: z
      .string()
      .min(10)
      .max(15)
      .regex(/^\d+$/, "Phone must contain only digits"),
    city: z.enum(["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"]),
    propertyType: z.enum(["Apartment", "Villa", "Plot", "Office", "Retail"]),
    bhk: z.enum(["Studio", "1", "2", "3", "4"]).optional(),
    purpose: z.enum(["Buy", "Rent"]),
    budgetMin: z.number().int().positive().optional(),
    budgetMax: z.number().int().positive().optional(),
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
      .default("New"),
    notes: z.string().max(1000).optional(),
    tags: z.array(z.string()).optional().default([]),
    ownerId: z.string().uuid(),
  })
  .refine(
    (data) => {
      // Validate budgetMax >= budgetMin if both are present
      if (data.budgetMin && data.budgetMax) {
        return data.budgetMax >= data.budgetMin;
      }
      return true;
    },
    {
      message: "budgetMax must be greater than or equal to budgetMin",
      path: ["budgetMax"],
    },
  )
  .refine(
    (data) => {
      // BHK is required for residential properties
      const residentialTypes = ["Apartment", "Villa"];
      if (residentialTypes.includes(data.propertyType) && !data.bhk) {
        return false;
      }
      return true;
    },
    {
      message: "BHK is required for residential properties",
      path: ["bhk"],
    },
  );

export type BuyerInput = z.infer<typeof buyerSchema>;
