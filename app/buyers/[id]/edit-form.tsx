// app/buyers/[id]/edit-form.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function formatZodFlatten(err: any): string {
  if (!err) return "Update failed";
  if (typeof err === "string") return err;
  if (Array.isArray(err.formErrors) && err.formErrors.length) {
    return err.formErrors.join(", ");
  }
  if (err.fieldErrors && typeof err.fieldErrors === "object") {
    const parts: string[] = [];
    for (const [field, msgs] of Object.entries(err.fieldErrors)) {
      if (Array.isArray(msgs) && msgs.length)
        parts.push(`${field}: ${msgs.join(", ")}`);
    }
    if (parts.length) return parts.join(" | ");
  }
  if (err.message && typeof err.message === "string") return err.message;
  return "Update failed";
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EditForm({ buyer }: { buyer: any }) {
  const r = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      updatedAt: buyer.updatedAt,
      fullName: fd.get("fullName"),
      email: fd.get("email") || "",
      phone: fd.get("phone"),
      city: fd.get("city"),
      propertyType: fd.get("propertyType"),
      bhk: fd.get("bhk") || undefined,
      purpose: fd.get("purpose"),
      budgetMin: fd.get("budgetMin") ? Number(fd.get("budgetMin")) : undefined,
      budgetMax: fd.get("budgetMax") ? Number(fd.get("budgetMax")) : undefined,
      timeline: fd.get("timeline"),
      source: fd.get("source"),
      notes: fd.get("notes") || undefined,
      tags: String(fd.get("tags") || "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
      status: fd.get("status") || undefined,
    };
    const res = await fetch(`/api/buyers/${buyer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      r.refresh();
    } else {
      const j = await res.json().catch(() => null);
      setErr(formatZodFlatten(j?.error));
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3"
      aria-describedby="edit-error"
    >
      {err && (
        <p id="edit-error" role="alert" className="text-red-600">
          {err}
        </p>
      )}

      <div>
        <label htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          name="fullName"
          defaultValue={buyer.fullName}
          required
          minLength={2}
          maxLength={80}
        />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={buyer.email ?? ""}
        />
      </div>
      <div>
        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          name="phone"
          pattern="\d{10,15}"
          defaultValue={buyer.phone}
          required
        />
      </div>

      <div>
        <label htmlFor="city">City</label>
        <select id="city" name="city" defaultValue={buyer.city}>
          <option>Chandigarh</option>
          <option>Mohali</option>
          <option>Zirakpur</option>
          <option>Panchkula</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="propertyType">Property Type</label>
        <select
          id="propertyType"
          name="propertyType"
          defaultValue={buyer.propertyType}
        >
          <option>Apartment</option>
          <option>Villa</option>
          <option>Plot</option>
          <option>Office</option>
          <option>Retail</option>
        </select>
      </div>

      <div>
        <label htmlFor="bhk">BHK</label>
        <select id="bhk" name="bhk" defaultValue={buyer.bhk ?? ""}>
          <option value="">None</option>
          <option>1</option>
          <option>2</option>
          <option>3</option>
          <option>4</option>
          <option>Studio</option>
        </select>
      </div>

      <div>
        <label htmlFor="purpose">Purpose</label>
        <select id="purpose" name="purpose" defaultValue={buyer.purpose}>
          <option>Buy</option>
          <option>Rent</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="budgetMin">Budget Min</label>
          <input
            id="budgetMin"
            name="budgetMin"
            type="number"
            defaultValue={buyer.budgetMin ?? ""}
            min="0"
          />
        </div>
        <div>
          <label htmlFor="budgetMax">Budget Max</label>
          <input
            id="budgetMax"
            name="budgetMax"
            type="number"
            defaultValue={buyer.budgetMax ?? ""}
            min="0"
          />
        </div>
      </div>

      <div>
        <label htmlFor="timeline">Timeline</label>
        <select id="timeline" name="timeline" defaultValue={buyer.timeline}>
          <option>0-3m</option>
          <option>3-6m</option>
          <option>&gt;6m</option>
          <option>Exploring</option>
        </select>
      </div>

      <div>
        <label htmlFor="source">Source</label>
        <select id="source" name="source" defaultValue={buyer.source}>
          <option>Website</option>
          <option>Referral</option>
          <option>Walk-in</option>
          <option>Call</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={buyer.status}>
          <option>New</option>
          <option>Qualified</option>
          <option>Contacted</option>
          <option>Visited</option>
          <option>Negotiation</option>
          <option>Converted</option>
          <option>Dropped</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={buyer.notes ?? ""}
          maxLength={1000}
        />
      </div>
      <div>
        <label htmlFor="tags">Tags (| separated)</label>
        <input
          id="tags"
          name="tags"
          defaultValue={(buyer.tags ?? []).join("|")}
        />
      </div>

      <button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
