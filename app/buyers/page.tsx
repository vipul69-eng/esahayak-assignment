import { Suspense } from "react";
import BuyersList from "@/components/buyers-list";

export default function BuyersPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <a
          href="/buyers/new"
          className="bg-primary text-white px-4 py-1 rounded hover:bg-neutral-900"
        >
          Create Lead
        </a>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <BuyersList />
      </Suspense>
    </div>
  );
}
