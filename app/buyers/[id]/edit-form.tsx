// app/buyers/[id]/edit-form.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fromBhk,
  fromSource,
  fromTimeline,
  toTimeline,
  fromStatus,
  toStatus,
  toSource,
} from "@/lib/buyer";
import { BHK, Source, Timeline } from "@prisma/client";
import TagChips from "@/components/tag-chips";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Types reflect the same names used in payload (tags managed separately)
type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  propertyType: string;
  bhk?: string;
  purpose: string;
  budgetMin?: string; // keep as string in inputs, convert to number in payload
  budgetMax?: string;
  timeline: string;
  source: string;
  notes?: string;
  status?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EditForm({ buyer }: { buyer: any }) {
  const r = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // NEW: manage tags as chips (typeahead suggestions come from /api/tags used by TagChips)
  const [tags, setTags] = useState<string[]>(
    Array.isArray(buyer.tags) ? buyer.tags : [],
  );

  const form = useForm<FormValues>({
    defaultValues: {
      fullName: buyer.fullName ?? "",
      email: buyer.email ?? "",
      phone: buyer.phone ?? "",
      city: buyer.city ?? "Chandigarh",
      propertyType: buyer.propertyType ?? "Apartment",
      bhk: fromBhk(buyer.bhk as BHK) || "",
      purpose: buyer.purpose ?? "Buy",
      budgetMin: buyer.budgetMin?.toString() ?? "",
      budgetMax: buyer.budgetMax?.toString() ?? "",
      timeline: fromTimeline(buyer.timeline as Timeline) ?? "0-3m",
      source: fromSource(buyer.source as Source) ?? "Website",
      notes: buyer.notes ?? "",
      status: fromStatus?.(buyer.status) ?? buyer.status ?? "New",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  async function onSubmit(values: FormValues) {
    setErr(null);
    setSaving(true);

    const payload = {
      updatedAt: buyer.updatedAt,
      fullName: values.fullName,
      email: values.email || "",
      phone: values.phone,
      city: values.city,
      propertyType: values.propertyType,
      bhk: values.bhk || undefined,
      purpose: values.purpose,
      budgetMin: values.budgetMin ? Number(values.budgetMin) : undefined,
      budgetMax: values.budgetMax ? Number(values.budgetMax) : undefined,
      timeline: values.timeline, // UI label
      source: values.source, // UI label
      notes: values.notes || undefined,
      tags, // send array from TagChips
      status: values.status || undefined,
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Edit Buyer</CardTitle>
        </CardHeader>
        <CardContent>
          {err && (
            <p
              id="edit-error"
              role="alert"
              className="mb-4 text-sm text-red-600"
            >
              {err}
            </p>
          )}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              aria-describedby="edit-error"
            >
              <FormField
                control={form.control}
                name="fullName"
                rules={{ required: true, minLength: 2, maxLength: 80 }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Full Name"
                        required
                        minLength={2}
                        maxLength={80}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="10-15 digits"
                        pattern="\d{10,15}"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Chandigarh">
                              Chandigarh
                            </SelectItem>
                            <SelectItem value="Mohali">Mohali</SelectItem>
                            <SelectItem value="Zirakpur">Zirakpur</SelectItem>
                            <SelectItem value="Panchkula">Panchkula</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <FormControl>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Apartment">Apartment</SelectItem>
                            <SelectItem value="Villa">Villa</SelectItem>
                            <SelectItem value="Plot">Plot</SelectItem>
                            <SelectItem value="Office">Office</SelectItem>
                            <SelectItem value="Retail">Retail</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bhk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BHK</FormLabel>
                      <FormControl>
                        <Select
                          defaultValue={fromBhk(field.value as BHK) || ""}
                          onValueChange={(val) =>
                            field.onChange(val === "none" ? "" : val)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select BHK" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="Studio">Studio</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <FormControl>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select purpose" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Buy">Buy</SelectItem>
                            <SelectItem value="Rent">Rent</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="budgetMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Min</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Optional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budgetMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Max</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Optional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeline</FormLabel>
                      <FormControl>
                        <Select
                          defaultValue={fromTimeline(field.value as Timeline)}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timeline" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-3m">0-3m</SelectItem>
                            <SelectItem value="3-6m">3-6m</SelectItem>
                            <SelectItem value=">6m">&gt;6m</SelectItem>
                            <SelectItem value="Exploring">Exploring</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <FormControl>
                        <Select
                          defaultValue={fromSource(field.value) as Source}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Website">Website</SelectItem>
                            <SelectItem value="Referral">Referral</SelectItem>
                            <SelectItem value="Walk-in">Walk-in</SelectItem>
                            <SelectItem value="Call">Call</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Qualified">Qualified</SelectItem>
                            <SelectItem value="Contacted">Contacted</SelectItem>
                            <SelectItem value="Visited">Visited</SelectItem>
                            <SelectItem value="Negotiation">
                              Negotiation
                            </SelectItem>
                            <SelectItem value="Converted">Converted</SelectItem>
                            <SelectItem value="Dropped">Dropped</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* NEW: Tag chips with typeahead */}
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <TagChips
                  value={tags}
                  onChange={setTags}
                  placeholder="hot, vip, nr…"
                />
                <FormDescription>
                  Press Enter to add, Backspace to remove, or pick from
                  suggestions.
                </FormDescription>
              </FormItem>

              <div className="pt-2">
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
