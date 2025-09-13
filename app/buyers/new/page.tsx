// app/buyers/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

type FormValues = {
  fullName: string;
  email?: string;
  phone: string;
  city: string;
  propertyType: string;
  bhk?: string;
  purpose: string;
  budgetMin?: number | string;
  budgetMax?: number | string;
  timeline: string;
  source: string;
  notes?: string;
  tags?: string;
  status?: string;
};

export default function NewBuyerPage() {
  const r = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      city: "Chandigarh",
      propertyType: "Apartment",
      bhk: "",
      purpose: "Buy",
      budgetMin: "",
      budgetMax: "",
      timeline: "0-3m",
      source: "Website",
      notes: "",
      tags: "",
      status: "New",
    },
  });

  async function onSubmit(values: FormValues) {
    setErr(null);
    setSubmitting(true);
    const payload = {
      fullName: values.fullName,
      email: values.email || "",
      phone: values.phone,
      city: values.city,
      propertyType: values.propertyType,
      bhk: values.bhk || undefined,
      purpose: values.purpose,
      budgetMin:
        values.budgetMin !== undefined && values.budgetMin !== ""
          ? Number(values.budgetMin)
          : undefined,
      budgetMax:
        values.budgetMax !== undefined && values.budgetMax !== ""
          ? Number(values.budgetMax)
          : undefined,
      timeline: values.timeline,
      source: values.source,
      notes: values.notes || undefined,
      tags: String(values.tags || "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
      status: values.status || undefined,
    };

    try {
      const res = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        r.push("/buyers");
      } else {
        const j = await res.json().catch(() => ({}));
        const message = j.error ? JSON.stringify(j.error) : "Failed to create";
        setErr(message);
        toast.error(message);
      }
    } catch (e) {
      const message =
        (e as Error)?.message || "Network error. Failed to create buyer.";
      setErr(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100dvh)] my-4 flex items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Create Buyer</CardTitle>
          <CardDescription>Enter details to add a new buyer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
              aria-describedby="form-error"
            >
              {err && (
                <p
                  id="form-error"
                  role="alert"
                  className="text-sm text-red-600"
                >
                  {err}
                </p>
              )}

              <FormField
                control={form.control}
                name="fullName"
                rules={{ required: true, minLength: 2, maxLength: 80 }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input required minLength={2} maxLength={80} {...field} />
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
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                rules={{ required: true, pattern: /\d{10,15}/ }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input required pattern="\d{10,15}" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="city"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
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
                  rules={{ required: true }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <FormControl>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
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

              <FormField
                control={form.control}
                name="bhk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BHK (Apartment/Villa)</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value || undefined}
                        onValueChange={(v) => field.onChange(v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
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
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="budgetMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Min</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
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
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="timeline"
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeline</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
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

              <FormField
                control={form.control}
                name="source"
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                          <SelectValue />
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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea maxLength={1000} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (| separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="hot|nr|vip" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="px-0 pb-0 flex flex-col sm:flex-row gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  {submitting ? "Saving..." : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => r.push("/buyers")}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
