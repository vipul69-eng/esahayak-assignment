/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/buyers/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  City,
  PropertyType,
  Purpose,
  type Prisma,
} from "@prisma/client";
import { getSession } from "@/lib/auth";
import {
  buyerSchema,
  toBhk,
  toTimeline,
  toSource,
  toStatus,
} from "@/lib/buyer";
import { parse } from "csv-parse/sync";
import { validateCsvRow } from "@/tests/rowValidator";

const prisma = new PrismaClient();
const MAX_ROWS = 200;
const REQUIRED_HEADERS = [
  "fullName",
  "email",
  "phone",
  "city",
  "propertyType",
  "bhk",
  "purpose",
  "budgetMin",
  "budgetMax",
  "timeline",
  "source",
  "notes",
  "tags",
  "status",
];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  let text = "";
  try {
    text = await file.text();
  } catch {
    return NextResponse.json({ error: "Could not read file" }, { status: 400 });
  }

  let records: any[] = [];
  try {
    records = parse(text, {
      bom: true, // handle UTF-8 BOM in header
      columns: true, // objects keyed by header names
      skip_empty_lines: true, // ignore empty lines
      trim: true, // trim cells
    });
    console.log(records);
  } catch {
    return NextResponse.json({ error: "Invalid CSV format" }, { status: 400 });
  }

  // Optional: strict header check for clearer feedback
  if (records.length > 0) {
    const present = Object.keys(records[0] ?? {});
    const missing = REQUIRED_HEADERS.filter((h) => !present.includes(h));

    console.log(present);
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing headers: ${missing.join(", ")}` },
        { status: 400 },
      );
    }
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
    const res = validateCsvRow(row);
    if (!res.ok) {
      errors.push({
        row: idx + 2,
        message: JSON.stringify(res.error.fieldErrors),
      });
      return;
    }

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
      errors.push({
        row: idx + 2,
        message: e?.message || "Invalid enum/value",
      });
    }
  });

  // ...previous code up to building `valid` and `errors`...

  let inserted = 0;
  if (valid.length) {
    // Build one write per row with nested history (1 round-trip per row)
    const ops = valid.map((v) =>
      prisma.buyer.create({
        data: {
          ...v,
          history: {
            create: {
              changedBy: session.sub,
              diff: { imported: true },
            },
          },
        },
      }),
    );

    const created = await prisma.$transaction(ops, {
      timeout: 20000,
      maxWait: 10000,
    } as Parameters<typeof prisma.$transaction>[1]);
    inserted = created.length;
  }

  return NextResponse.json({ inserted, errors });
}
