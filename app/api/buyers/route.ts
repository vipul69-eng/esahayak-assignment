/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { rateLimit } from "@/lib/rate-limit";

const prisma = new PrismaClient();
const PAGE_SIZE = 10;

// GET /api/buyers?search=&city=&propertyType=&status=&timeline=&page=1&sort=updatedAt:desc
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const search = (searchParams.get("search") || "").trim();
  const city = searchParams.get("city") || "";
  const propertyType = searchParams.get("propertyType") || "";
  const status = searchParams.get("status") || "";
  const timeline = searchParams.get("timeline") || "";
  const [sortField, sortDir] = (
    searchParams.get("sort") || "updatedAt:desc"
  ).split(":");
  const orderBy = {
    [sortField]: sortDir?.toLowerCase() === "asc" ? "asc" : "desc",
  } as const;

  const where: any = {};
  if (city) where.city = city as City;
  if (propertyType) where.propertyType = propertyType as PropertyType;
  if (status) where.status = toStatus(status);
  if (timeline) where.timeline = toTimeline(timeline);
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.buyer.count({ where }),
    prisma.buyer.findMany({
      where,
      orderBy,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        fullName: true,
        phone: true,
        city: true,
        propertyType: true,
        budgetMin: true,
        budgetMax: true,
        timeline: true,
        status: true,
        updatedAt: true,
      },
    }),
  ]);

  return NextResponse.json({ total, page, pageSize: PAGE_SIZE, items });
}

// POST /api/buyers
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(`create:${session.sub}`)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = buyerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const created = await prisma.$transaction(async (tx) => {
    const buyer = await tx.buyer.create({
      data: {
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
        ownerId: session.sub,
      },
    });
    await tx.buyerHistory.create({
      data: {
        buyerId: buyer.id,
        changedBy: session.sub,
        diff: { created: true },
      },
    });
    return buyer;
  });

  return NextResponse.json({ buyer: created }, { status: 201 });
}
