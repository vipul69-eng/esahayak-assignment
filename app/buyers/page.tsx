// app/buyers/page.tsx
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import Filters from "./filters";

const prisma = new PrismaClient();
const PAGE_SIZE = 10;

function toQueryString(sp: Record<string, string | string[] | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach((val) => qs.append(k, String(val)));
    else qs.set(k, String(v));
  }
  return qs.toString();
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
export default async function BuyersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const page = Math.max(1, parseInt(String(searchParams.page ?? "1")));
  const search = String(searchParams.search ?? "").trim();
  const city = String(searchParams.city ?? "");
  const propertyType = String(searchParams.propertyType ?? "");
  const status = String(searchParams.status ?? "");
  const timeline = String(searchParams.timeline ?? "");
  const [sortField, sortDir] = (
    (searchParams.sort as string) || "updatedAt:desc"
  ).split(":");
  const orderBy = {
    [sortField]: sortDir?.toLowerCase() === "asc" ? "asc" : "desc",
  } as const;

  const where: Any = {};
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
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Buyers</h1>
        <div className="flex gap-2">
          <Link href="/buyers/new" className="btn">
            New
          </Link>
          <Link
            href={`/api/buyers/export?${toQueryString(searchParams as Any).toString()}`}
            className="btn"
          >
            Export CSV
          </Link>
        </div>
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
            {items.map((b) => (
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
                <td>
                  <Link href={`/buyers/${b.id}`}>View / Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <nav className="flex gap-2" aria-label="Pagination">
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => {
          const usp = new URLSearchParams(searchParams.toString());

          usp.set("page", String(n));
          return (
            <Link
              key={n}
              href={`/buyers?${usp.toString()}`}
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
