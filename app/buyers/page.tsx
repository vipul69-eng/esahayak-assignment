import { Suspense } from "react";
import BuyersList from "@/components/buyers-list";

export default function BuyersPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leads Management</h1>
        <a
          href="/buyers/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
