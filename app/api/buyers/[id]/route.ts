/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/buyers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, City, PropertyType, Purpose } from "@prisma/client";
import { getSession } from "@/lib/auth";
import {
  buyerSchema,
  toBhk,
  toTimeline,
  toSource,
  toStatus,
  fromBhk,
  fromTimeline,
} from "@/lib/buyer";
import { rateLimit } from "@/lib/rate-limit";

const prisma = new PrismaClient();

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const buyer = await prisma.buyer.findUnique({
    where: { id: params.id },
    include: {
      history: { orderBy: { changedAt: "desc" }, take: 5 },
      owner: { select: { id: true, username: true } },
    },
  });
  if (!buyer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Allow if admin or owner
  if (session.role !== "ADMIN" && buyer.ownerId !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ buyer });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Optional: simple rate limit per user
  if (!rateLimit?.(`update:${session.sub}`)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await req.json();
  const { updatedAt, ...rest } = body as any;
  if (!updatedAt)
    return NextResponse.json({ error: "Missing updatedAt" }, { status: 400 });
  console.log(session.role, "ROLE");

  const existing = await prisma.buyer.findUnique({
    where: { id: params.id },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Allow if admin or owner
  if (session.role !== "ADMIN" && existing.ownerId !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Convert existing DB enums -> UI strings, then merge with incoming partial
  const baseInput = {
    fullName: existing.fullName,
    email: existing.email ?? "",
    phone: existing.phone,
    city: existing.city,
    propertyType: existing.propertyType,
    bhk: fromBhk(existing.bhk) || undefined,
    purpose: existing.purpose,
    budgetMin: existing.budgetMin ?? undefined,
    budgetMax: existing.budgetMax ?? undefined,
    timeline: fromTimeline(existing.timeline),
    source: existing.source === "WALK_IN" ? "Walk-in" : existing.source,
    notes: existing.notes ?? undefined,
    tags: existing.tags ?? [],
    status: existing.status,
  };
  const input = { ...baseInput, ...rest };

  // Validate merged input with Zod
  const parsed = buyerSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Optimistic concurrency check
  const matchTs = new Date(updatedAt);
  if (existing.updatedAt.getTime() !== matchTs.getTime()) {
    return NextResponse.json(
      { error: "Record changed, please refresh" },
      { status: 409 },
    );
  }

  // Compute field-level diff using UI-string values for readability in history
  const diff: Record<string, { from: any; to: any }> = {};
  const compare = (a: any, b: any) => {
    if (a instanceof Date && b instanceof Date)
      return a.getTime() === b.getTime();
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
      return true;
    }
    return JSON.stringify(a) === JSON.stringify(b);
  };
  const uiNext = {
    fullName: d.fullName,
    email: d.email?.trim() || "",
    phone: d.phone,
    city: d.city,
    propertyType: d.propertyType,
    bhk: d.bhk || undefined,
    purpose: d.purpose,
    budgetMin: d.budgetMin ?? undefined,
    budgetMax: d.budgetMax ?? undefined,
    timeline: d.timeline,
    source: d.source,
    notes: d.notes ?? undefined,
    tags: d.tags ?? [],
    status: d.status ?? baseInput.status,
  };
  for (const k of Object.keys(uiNext) as Array<keyof typeof uiNext>) {
    const prev = (baseInput as any)[k];
    const next = (uiNext as any)[k];
    if (!compare(prev, next)) {
      diff[k as string] = { from: prev ?? "", to: next ?? "" };
    }
  }
  if (Object.keys(diff).length === 0) {
    return NextResponse.json({ buyer: existing });
  }

  // Map to DB enums and persist update + history atomically
  const patch = {
    fullName: d.fullName,
    email: d.email?.trim() ? d.email : null,
    phone: d.phone,
    city: d.city as City,
    propertyType: d.propertyType as PropertyType,
    bhk: toBhk(d.bhk ?? null),
    purpose: d.purpose as Purpose,
    budgetMin: d.budgetMin ?? null,
    budgetMax: d.budgetMax ?? null,
    timeline: toTimeline(d.timeline),
    source: toSource(d.source),
    status: toStatus(d.status ?? null),
    notes: d.notes ?? null,
    tags: d.tags ?? [],
  };

  const updated = await prisma.$transaction(async (tx) => {
    const buyer = await tx.buyer.update({
      where: { id: params.id, updatedAt: matchTs },
      data: patch,
    });
    await tx.buyerHistory.create({
      data: { buyerId: params.id, changedBy: session.sub, diff },
    });
    return buyer;
  });

  return NextResponse.json({ buyer: updated });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await prisma.buyer.findUnique({ where: { id: params.id } });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Allow if admin or owner
  if (session.role !== "ADMIN" && existing.ownerId !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.buyerHistory.create({
      data: {
        buyerId: params.id,
        changedBy: session.sub,
        diff: { deleted: true },
      },
    });
    await tx.buyer.delete({ where: { id: params.id } });
  });

  return NextResponse.json({ ok: true });
}
