import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import Filters from "./filters";
import { getSession } from "@/lib/auth";
import ImportCsv from "./import-csv";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toTimeline } from "@/lib/buyer";

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
        ownerId: true,
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exportQs = toQueryString(sp as any);
  return (
    <div className="space-y-4 p-2">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Button asChild>
          <Link href="/profile">Profile</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/buyers/new">New</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/api/buyers/export?${exportQs}`}>Export CSV</Link>
          </Button>
          <ImportCsv />
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border p-3">
        <Filters />
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          No buyers found.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((b) => {
                const isOwner = session?.sub === b.ownerId;
                const budget =
                  (b.budgetMin ?? "") || (b.budgetMax ?? "")
                    ? `${b.budgetMin ?? ""}${
                        b.budgetMin || b.budgetMax ? " - " : ""
                      }${b.budgetMax ?? ""}`
                    : "";
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.fullName}</TableCell>
                    <TableCell>{b.phone}</TableCell>
                    <TableCell>{b.city}</TableCell>
                    <TableCell>{b.propertyType}</TableCell>
                    <TableCell>{budget}</TableCell>
                    <TableCell>
                      {b.timeline ? (
                        <Badge variant="outline">{b.timeline}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {b.status ? (
                        <Badge
                          variant={
                            b.status.toLowerCase() === "hot"
                              ? "destructive"
                              : b.status.toLowerCase() === "warm"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {b.status}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(b.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Link
                        href={`/buyers/${b.id}`}
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                      {isOwner && (
                        <>
                          <span className="mx-1 text-muted-foreground">·</span>
                          <Link
                            href={`/buyers/${b.id}`}
                            className="text-primary hover:underline"
                          >
                            Edit
                          </Link>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <nav
        className="flex flex-wrap items-center gap-2 justify-center"
        aria-label="Pagination"
      >
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => {
          const current = new URLSearchParams(sp.toString());
          current.set("page", String(n));
          const isActive = n === page;
          return (
            <Link
              key={n}
              href={`/buyers?${current.toString()}`}
              aria-current={isActive ? "page" : undefined}
              className={[
                "px-3 py-1.5 rounded-md border text-sm",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted",
              ].join(" ")}
            >
              {n}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
