// app/buyers/filters.tsx
"use client";
import { debounce } from "lodash";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Filters() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const setParam = (key: string, val: string) => {
    const next = new URLSearchParams(sp.toString());
    if (val) next.set(key, val);
    else next.delete(key);
    next.set("page", "1"); // reset to first page
    router.push(`${pathname}?${next.toString()}`);
  };
  const onSearch = debounce((v: string) => setParam("search", v), 300);

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
      <input
        aria-label="Search"
        defaultValue={sp.get("search") ?? ""}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search name/phone/email"
      />
      <select
        aria-label="City"
        defaultValue={sp.get("city") ?? ""}
        onChange={(e) => setParam("city", e.target.value)}
      >
        <option value="">All Cities</option>
        <option>Chandigarh</option>
        <option>Mohali</option>
        <option>Zirakpur</option>
        <option>Panchkula</option>
        <option>Other</option>
      </select>
      <select
        aria-label="Property Type"
        defaultValue={sp.get("propertyType") ?? ""}
        onChange={(e) => setParam("propertyType", e.target.value)}
      >
        <option value="">All Types</option>
        <option>Apartment</option>
        <option>Villa</option>
        <option>Plot</option>
        <option>Office</option>
        <option>Retail</option>
      </select>
      <select
        aria-label="Status"
        defaultValue={sp.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
      >
        <option value="">All Status</option>
        <option>New</option>
        <option>Qualified</option>
        <option>Contacted</option>
        <option>Visited</option>
        <option>Negotiation</option>
        <option>Converted</option>
        <option>Dropped</option>
      </select>
      <select
        aria-label="Timeline"
        defaultValue={sp.get("timeline") ?? ""}
        onChange={(e) => setParam("timeline", e.target.value)}
      >
        <option value="">All Timelines</option>
        <option>0-3m</option>
        <option>3-6m</option>
        <option>&gt;6m</option>
        <option>Exploring</option>
      </select>
      <select
        aria-label="Sort"
        defaultValue={sp.get("sort") ?? "updatedAt:desc"}
        onChange={(e) => setParam("sort", e.target.value)}
      >
        <option value="updatedAt:desc">Updated desc</option>
        <option value="updatedAt:asc">Updated asc</option>
      </select>
    </div>
  );
}
