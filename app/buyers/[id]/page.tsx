/** eslint-disable @typescript-eslint/no-explicit-any */
// app/buyers/[id]/page.tsx
import { PrismaClient } from "@prisma/client";
import EditForm from "./edit-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const prisma = new PrismaClient();

type HistoryRow = {
  field: string;
  from: string;
  to: string;
  changedAt: Date;
  user: string;
};

export default async function BuyerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Fetch buyer and last 5 history entries
  const buyer = await prisma.buyer.findUnique({
    where: { id },
    include: { history: { orderBy: { changedAt: "desc" }, take: 5 } },
  });
  if (!buyer) return <p>Not found</p>;

  // Resolve usernames for changedBy ids
  const userIds = Array.from(
    new Set(buyer.history.map((h) => h.changedBy).filter(Boolean) as string[]),
  );
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true },
      })
    : [];
  const userById = new Map(users.map((u) => [u.id, u.username]));

  // Flatten diff JSON into display rows
  const rows: HistoryRow[] = buyer.history.flatMap((h) => {
    const by = userById.get(h.changedBy as string) ?? "unknown";
    const ts = h.changedAt;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diff = (h.diff ?? {}) as Record<string, any>;

    // Special flags (created/imported/deleted)
    const specials: HistoryRow[] = [];
    if (diff.created)
      specials.push({
        field: "created",
        from: "",
        to: "",
        changedAt: ts,
        user: by,
      });
    if (diff.imported)
      specials.push({
        field: "imported",
        from: "",
        to: "",
        changedAt: ts,
        user: by,
      });
    if (diff.deleted)
      specials.push({
        field: "deleted",
        from: "",
        to: "",
        changedAt: ts,
        user: by,
      });

    // Field-level changes { field: { from, to } }
    const fieldRows: HistoryRow[] = Object.entries(diff)
      .filter(
        ([_, v]) =>
          v &&
          typeof v === "object" &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "from" in (v as any) &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "to" in (v as any),
      )
      .map(([field, change]) => ({
        field,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        from: formatVal((change as any).from),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        to: formatVal((change as any).to),
        changedAt: ts,
        user: by,
      }));

    return [...specials, ...fieldRows];
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Buyer: <span className="text-foreground/90">{buyer.fullName}</span>
          </h1>
          <div className="flex items-center gap-2">
            {buyer.status ? (
              <Badge variant="secondary">{buyer.status}</Badge>
            ) : null}
            {buyer.city ? <Badge variant="outline">{buyer.city}</Badge> : null}
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <div className="relative">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex min-w-max">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="history">
                  Changes
                  {rows.length ? (
                    <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1 text-xs">
                      {rows.length}
                    </span>
                  ) : null}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="details" className="mt-4">
            <EditForm buyer={buyer} />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent changes</p>
            ) : (
              <ul className="space-y-4">
                {rows.map((r, idx) => (
                  <li
                    key={idx}
                    className="rounded-md border bg-card text-card-foreground"
                  >
                    <div className="p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{r.field}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>
                          {r.from || "—"}{" "}
                          <span className="text-muted-foreground">→</span>{" "}
                          {r.to || "—"}
                        </span>
                      </div>
                    </div>
                    <Separator />
                    <div className="px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
                      <small>{new Date(r.changedAt).toLocaleString()}</small>
                      <small>{r.user}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatVal(v: any): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.join("|");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
