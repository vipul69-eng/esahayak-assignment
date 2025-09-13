// app/buyers/page.tsx
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import Filters from "./filters";
import { getSession } from "@/lib/auth";
import ImportCsv from "./import-csv";

function getFirst(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sp: any,
  key: string,
): string {
  const v = sp[key];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Array.isArray(v) ? ((v ?? "") as any) : ((v ?? "") as string);
}

function toQueryString(sp: Record<string, string | string[] | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach((val) => qs.append(k, val));
    else qs.set(k, v);
  }
  return qs.toString();
}
const prisma = new PrismaClient();
const PAGE_SIZE = 10;

export default async function BuyersPage({
  searchParams,
}: {
  searchParams: Promise<URLSearchParams>;
}) {
  const sp = await searchParams; // Next 15: await dynamic API
  const session = await getSession();

  const page = Math.max(1, parseInt(getFirst(sp, "page") || "1"));
  const search = (getFirst(sp, "search") || "").trim();
  const city = getFirst(sp, "city");
  const propertyType = getFirst(sp, "propertyType");
  const status = getFirst(sp, "status");
  const timeline = getFirst(sp, "timeline");

  const sortRaw = getFirst(sp, "sort") || "updatedAt:desc";
  const [sortField, sortDir] = sortRaw.split(":");
  const orderBy = {
    [sortField || "updatedAt"]:
      (sortDir || "desc").toLowerCase() === "asc" ? "asc" : "desc",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (city) where.city = city;
  if (propertyType) where.propertyType = propertyType;
  if (status) where.status = status;
  if (timeline) where.timeline = timeline;
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
        ownerId: true,
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exportQs = toQueryString(sp as any);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Buyers</h1>
        <div className="flex gap-2">
          <Link href="/buyers/new" className="btn">
            New
          </Link>
          <Link href={`/api/buyers/export?${exportQs}`} className="btn">
            Export CSV
          </Link>
        </div>
        <ImportCsv />
      </div>

      <Filters />

      {items.length === 0 ? (
        <p role="status">No buyers found.</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>City</th>
              <th>Property</th>
              <th>Budget</th>
              <th>Timeline</th>
              <th>Status</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => {
              const isOwner = session?.sub === b.ownerId;
              return (
                <tr key={b.id}>
                  <td>{b.fullName}</td>
                  <td>{b.phone}</td>
                  <td>{b.city}</td>
                  <td>{b.propertyType}</td>
                  <td>
                    {b.budgetMin ?? ""}
                    {b.budgetMin || b.budgetMax ? " - " : ""}
                    {b.budgetMax ?? ""}
                  </td>
                  <td>{b.timeline}</td>
                  <td>{b.status}</td>
                  <td>{new Date(b.updatedAt).toLocaleString()}</td>
                  <td className="whitespace-nowrap">
                    <Link href={`/buyers/${b.id}`}>View</Link>
                    {isOwner && (
                      <>
                        {" "}
                        <Link href={`/buyers/${b.id}`}>Edit</Link>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <nav className="flex gap-2" aria-label="Pagination">
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => {
          const current = new URLSearchParams(sp.toString());
          current.set("page", String(n));
          return (
            <Link
              key={n}
              href={`/buyers?${current.toString()}`}
              aria-current={n === page ? "page" : undefined}
              className={n === page ? "font-semibold" : ""}
            >
              {n}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
