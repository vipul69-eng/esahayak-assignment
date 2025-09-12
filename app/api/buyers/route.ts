/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/buyers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  PrismaClient,
  BHK,
  Timeline,
  Source,
  Status,
  City,
  PropertyType,
  Purpose,
} from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Mappers from UI/CSV strings -> Prisma enum identifiers
const toBhk = (v?: string | null): BHK | null => {
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

const toTimeline = (v: string): Timeline => {
  switch (v) {
    case "0-3m":
      return Timeline.ZERO_TO_THREE; // @map("0-3m")
    case "3-6m":
      return Timeline.THREE_TO_SIX; // @map("3-6m")
    case ">6m":
      return Timeline.MORE_THAN_SIX; // @map(">6m")
    case "Exploring":
      return Timeline.EXPLORING; // @map("Exploring")
    default:
      throw new Error("Invalid timeline");
  }
};

const toSource = (v: string): Source => {
  switch (v) {
    case "Website":
      return Source.WEBSITE;
    case "Referral":
      return Source.REFERRAL;
    case "Walk-in":
      return Source.WALK_IN; // @map("Walk-in")
    case "Call":
      return Source.CALL;
    case "Other":
      return Source.OTHER;
    default:
      throw new Error("Invalid source");
  }
};

const toStatus = (v?: string | null): Status => {
  switch (v ?? "New") {
    case "New":
      return Status.NEW;
    case "Qualified":
      return Status.QUALIFIED;
    case "Contacted":
      return Status.CONTACTED;
    case "Visited":
      return Status.VISITED;
    case "Negotiation":
      return Status.NEGOTIATION;
    case "Converted":
      return Status.CONVERTED;
    case "Dropped":
      return Status.DROPPED;
    default:
      throw new Error("Invalid status");
  }
};

// Zod validation for incoming payload (UI/CSV strings)
const buyerSchema = z
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

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = buyerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const buyer = await prisma.$transaction(async (tx) => {
      const created = await tx.buyer.create({
        data: {
          fullName: data.fullName,
          email: data.email?.trim() ? data.email : null,
          phone: data.phone,
          city: data.city as City,
          propertyType: data.propertyType as PropertyType,
          bhk: toBhk(data.bhk ?? null),
          purpose: data.purpose as Purpose,
          budgetMin: data.budgetMin ?? null,
          budgetMax: data.budgetMax ?? null,
          timeline: toTimeline(data.timeline),
          source: toSource(data.source),
          status: toStatus(data.status ?? null),
          notes: data.notes ?? null,
          tags: data.tags ?? [],
          ownerId: session.sub,
        },
      });

      await tx.buyerHistory.create({
        data: {
          buyerId: created.id,
          changedBy: session.sub,
          diff: { created: true, by: session.username },
        },
      });

      return created;
    });

    return NextResponse.json({ buyer }, { status: 201 });
  } catch (err: any) {
    console.error("Create buyer error", err);
    return NextResponse.json(
      { error: "Failed to create buyer" },
      { status: 500 },
    );
  }
}
