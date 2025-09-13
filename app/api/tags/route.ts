import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // Optional: require auth or return public suggestions
  const session = await getSession().catch(() => null);
  if (!session)
    return new Response(JSON.stringify({ tags: [] }), { status: 200 });

  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(
    20,
    Math.max(1, parseInt(searchParams.get("limit") || "10")),
  );

  try {
    // If using Postgres and tags is text[]:
    // SELECT DISTINCT t FROM UNNEST(ARRAY(SELECT tags FROM "Buyer" WHERE tags IS NOT NULL)) AS t WHERE t ILIKE %q% LIMIT n
    const pattern = `%${q.replace(/[%_]/g, "\\$&")}%`;
    const rows = await prisma.$queryRaw<{ t: string }[]>`
      SELECT DISTINCT t
      FROM UNNEST(
        ARRAY(
          SELECT tags FROM "Buyer"
          WHERE tags IS NOT NULL
        )
      ) AS t
      WHERE ${q ? prisma.$queryRaw`t ILIKE ${pattern}` : prisma.$queryRaw`TRUE`}
      LIMIT ${limit}
    `;
    const tags = rows.map((r) => r.t);
    return new Response(JSON.stringify({ tags }), { status: 200 });
  } catch {
    const recent = await prisma.buyer.findMany({
      select: { tags: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });
    const set = new Set<string>();
    for (const r of recent) {
      for (const t of r.tags ?? []) {
        if (!q || t.toLowerCase().includes(q.toLowerCase())) set.add(t);
        if (set.size >= limit) break;
      }
      if (set.size >= limit) break;
    }
    return new Response(JSON.stringify({ tags: Array.from(set) }), {
      status: 200,
    });
  }
}
