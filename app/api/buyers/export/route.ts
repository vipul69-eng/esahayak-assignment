// app/api/buyers/export/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { PrismaClient, City, PropertyType } from "@prisma/client";
import { getSession } from "@/lib/auth";
import {
  toStatus,
  toTimeline,
  fromTimeline,
  fromBhk,
  toCsv,
  fromStatus,
  fromSource,
} from "@/lib/buyer";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { searchParams } = req.nextUrl;
  const search = (searchParams.get("search") || "").trim();
  const city = searchParams.get("city") || "";
  const propertyType = searchParams.get("propertyType") || "";
  const status = searchParams.get("status") || "";
  const timeline = searchParams.get("timeline") || "";
  const owner = searchParams.get("owner") || ""; // NEW: owner filter
  const [sortField, sortDir] = (
    searchParams.get("sort") || "updatedAt:desc"
  ).split(":");
  const orderBy = {
    [sortField]: (sortDir || "").toLowerCase() === "asc" ? "asc" : "desc",
  } as const;

  const where: any = {};
  if (owner === "me") where.ownerId = session.sub; // NEW: scope to current user
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

  const rows = await prisma.buyer.findMany({
    where,
    orderBy,
    select: {
      fullName: true,
      email: true,
      phone: true,
      city: true,
      propertyType: true,
      bhk: true,
      purpose: true,
      budgetMin: true,
      budgetMax: true,
      timeline: true,
      source: true,
      status: true,
      notes: true,
      tags: true,
      updatedAt: true,
    },
  });
  console.log(rows);
  const data = rows.map((r) => ({
    fullName: r.fullName,
    email: r.email ?? "",
    phone: r.phone,
    city: r.city, // already user-facing
    propertyType: r.propertyType, // already user-facing
    bhk: fromBhk(r.bhk), // map back to "1|2|3|4|Studio"
    purpose: r.purpose, // already user-facing
    budgetMin: r.budgetMin ?? "",
    budgetMax: r.budgetMax ?? "",
    timeline: fromTimeline(r.timeline), // map back to "0-3m|3-6m|>6m|Exploring"
    source: fromSource(r.source as any), // NEW: map back to "Walk-in|..."
    status: fromStatus(r.status as any), // NEW: map back to "New|..."
    notes: r.notes ?? "",
    tags: (r.tags ?? []).join("|"),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const csv = data.length
    ? toCsv(data)
    : "fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,status,notes,tags,updatedAt\n";
  console.log(csv);
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="buyers.csv"`,
    },
  });
}
