/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/buyers/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, City, PropertyType, Purpose } from "@prisma/client";
import { getSession } from "@/lib/auth";
import {
  buyerSchema,
  toBhk,
  toTimeline,
  toSource,
  toStatus,
} from "@/lib/buyer";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();
const MAX_ROWS = 200;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file)
    return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const text = await file.text();
  let records: any[] = [];
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid CSV format" }, { status: 400 });
  }

  if (records.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (max ${MAX_ROWS})` },
      { status: 400 },
    );
  }

  const errors: Array<{ row: number; message: string }> = [];
  const valid: any[] = [];

  records.forEach((row, idx) => {
    // Normalize headers expected by assignment
    const input = {
      fullName: row.fullName,
      email: row.email || "",
      phone: row.phone,
      city: row.city,
      propertyType: row.propertyType,
      bhk: row.bhk || undefined,
      purpose: row.purpose,
      budgetMin: row.budgetMin ? Number(row.budgetMin) : undefined,
      budgetMax: row.budgetMax ? Number(row.budgetMax) : undefined,
      timeline: row.timeline,
      source: row.source,
      notes: row.notes || undefined,
      tags: row.tags
        ? String(row.tags)
            .split("|")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : undefined,
      status: row.status || undefined,
    };

    const parsed = buyerSchema.safeParse(input);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      errors.push({ row: idx + 2, message: JSON.stringify(flat.fieldErrors) });
      return;
    }

    try {
      valid.push({
        fullName: input.fullName,
        email: input.email?.trim() ? input.email : null,
        phone: input.phone,
        city: input.city as City,
        propertyType: input.propertyType as PropertyType,
        bhk: toBhk(input.bhk ?? null),
        purpose: input.purpose as Purpose,
        budgetMin: input.budgetMin ?? null,
        budgetMax: input.budgetMax ?? null,
        timeline: toTimeline(input.timeline),
        source: toSource(input.source),
        status: toStatus(input.status ?? null),
        notes: input.notes ?? null,
        tags: input.tags ?? [],
        ownerId: session.sub,
      });
    } catch (e: any) {
      errors.push({ row: idx + 2, message: e.message || "Invalid enum/value" });
    }
  });

  // Insert only valid
  let inserted = 0;
  if (valid.length) {
    await prisma.$transaction(async (tx) => {
      for (const v of valid) {
        const buyer = await tx.buyer.create({ data: v });
        await tx.buyerHistory.create({
          data: {
            buyerId: buyer.id,
            changedBy: session.sub,
            diff: { imported: true },
          },
        });
        inserted += 1;
      }
    });
  }

  return NextResponse.json({ inserted, errors });
}
