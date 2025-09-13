"use client";
import { debounce } from "lodash";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      {/* Search */}
      <Input
        aria-label="Search"
        defaultValue={sp.get("search") ?? ""}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search name/phone/notes"
      />

      {/* City */}
      <Select
        defaultValue={sp.get("city") ?? ""}
        onValueChange={(v) => setParam("city", v == "all" ? "" : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Cities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Cities</SelectItem>
          <SelectItem value="Chandigarh">Chandigarh</SelectItem>
          <SelectItem value="Mohali">Mohali</SelectItem>
          <SelectItem value="Zirakpur">Zirakpur</SelectItem>
          <SelectItem value="Panchkula">Panchkula</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>

      {/* Property Type */}
      <Select
        defaultValue={sp.get("propertyType") ?? ""}
        onValueChange={(v) => setParam("propertyType", v == "all" ? "" : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="Apartment">Apartment</SelectItem>
          <SelectItem value="Villa">Villa</SelectItem>
          <SelectItem value="Plot">Plot</SelectItem>
          <SelectItem value="Office">Office</SelectItem>
          <SelectItem value="Retail">Retail</SelectItem>
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        defaultValue={sp.get("status") ?? ""}
        onValueChange={(v) => setParam("status", v == "all" ? "" : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="New">New</SelectItem>
          <SelectItem value="Qualified">Qualified</SelectItem>
          <SelectItem value="Contacted">Contacted</SelectItem>
          <SelectItem value="Visited">Visited</SelectItem>
          <SelectItem value="Negotiation">Negotiation</SelectItem>
          <SelectItem value="Converted">Converted</SelectItem>
          <SelectItem value="Dropped">Dropped</SelectItem>
        </SelectContent>
      </Select>

      {/* Timeline */}
      <Select
        defaultValue={sp.get("timeline") ?? ""}
        onValueChange={(v) => setParam("timeline", v == "all" ? "" : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Timelines" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Timelines</SelectItem>
          <SelectItem value="0-3m">0-3m</SelectItem>
          <SelectItem value="3-6m">3-6m</SelectItem>
          <SelectItem value=">6m">&gt;6m</SelectItem>
          <SelectItem value="Exploring">Exploring</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select
        defaultValue={sp.get("sort") ?? "updatedAt:desc"}
        onValueChange={(v) => setParam("sort", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updatedAt:desc">Updated desc</SelectItem>
          <SelectItem value="updatedAt:asc">Updated asc</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
