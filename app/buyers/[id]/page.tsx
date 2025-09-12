// app/buyers/[id]/page.tsx
import { PrismaClient } from "@prisma/client";
import EditForm from "./edit-form";

const prisma = new PrismaClient();

export default async function BuyerDetail({
  params,
}: {
  params: { id: string };
}) {
  const buyer = await prisma.buyer.findUnique({
    where: { id: params.id },
    include: { history: { orderBy: { changedAt: "desc" }, take: 5 } },
  });
  if (!buyer) return <p>Not found</p>;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Buyer: {buyer.fullName}</h1>
      <EditForm buyer={buyer} />
      <section>
        <h2 className="font-semibold">Recent Changes</h2>
        <ul>
          {buyer.history.map((h) => (
            <li key={h.id}>
              <pre>{JSON.stringify(h.diff, null, 2)}</pre>{" "}
              <small>{new Date(h.changedAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
