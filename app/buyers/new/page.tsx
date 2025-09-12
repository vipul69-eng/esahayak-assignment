"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buyerSchema, type BuyerInput } from "@/lib/validations";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, User, Home, DollarSign, Tag, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function CreateLeadPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<BuyerInput>>({
    city: "Chandigarh",
    propertyType: "Apartment",
    purpose: "Buy",
    timeline: "3-6m",
    source: "Website",
    status: "New",
    tags: [],
  });

  const isResidential =
    formData.propertyType === "Apartment" || formData.propertyType === "Villa";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = buyerSchema.parse(formData);

      const response = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validatedData,
          ownerId: "123e4567-e89b-12d3-a456-426614174000",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error && Array.isArray(errorData.error)) {
          const fieldErrors: Record<string, string> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          errorData.error.forEach((err: any) => {
            fieldErrors[err.path[0]] = err.message;
          });
          setErrors(fieldErrors);
        }
        return;
      }

      router.push("/buyers");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as never] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error("Unexpected error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFormData((prev: any) => ({
      ...prev,
      [name]:
        type === "number"
          ? value
            ? Number.parseInt(value)
            : undefined
          : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFormData((prev: any) => ({ ...prev, tags }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="h-6 w-px bg-border/60" />
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Create New Lead
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Add a new potential buyer to your pipeline
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="shadow-lg border-border/50 bg-card/95 backdrop-blur-sm">
          <CardContent className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Personal Information
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Basic contact details for the lead
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName || ""}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      className="h-11 bg-background/50 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone || ""}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      pattern="[0-9]{10,15}"
                      className="h-11 bg-background/50 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="h-11 bg-background/50 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Property Preferences Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2">
                  <div className="p-2 bg-secondary/20 rounded-lg">
                    <Home className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Property Preferences
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Specify the type and location preferences
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">
                      Preferred City <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.city || ""}
                      onValueChange={(value) =>
                        handleSelectChange("city", value)
                      }
                    >
                      <SelectTrigger className="h-11 bg-background/50 border-border/60 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                        <SelectItem value="Mohali">Mohali</SelectItem>
                        <SelectItem value="Zirakpur">Zirakpur</SelectItem>
                        <SelectItem value="Panchkula">Panchkula</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="propertyType"
                      className="text-sm font-medium"
                    >
                      Property Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.propertyType || ""}
                      onValueChange={(value) =>
                        handleSelectChange("propertyType", value)
                      }
                    >
                      <SelectTrigger className="h-11 bg-background/50 border-border/60 focus:ring-2 focus:ring-primary/20">
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
                  </div>
                </div>

                {isResidential && (
                  <div className="space-y-2">
                    <Label htmlFor="bhk" className="text-sm font-medium">
                      BHK Configuration{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.bhk || ""}
                      onValueChange={(value) =>
                        handleSelectChange("bhk", value)
                      }
                    >
                      <SelectTrigger className="h-11 bg-background/50 border-border/60 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select BHK" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Studio">Studio</SelectItem>
                        <SelectItem value="1">1 BHK</SelectItem>
                        <SelectItem value="2">2 BHK</SelectItem>
                        <SelectItem value="3">3 BHK</SelectItem>
                        <SelectItem value="4">4 BHK</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.bhk && (
                      <p className="text-sm text-destructive">{errors.bhk}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="purpose" className="text-sm font-medium">
                      Purpose <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.purpose || ""}
                      onValueChange={(value) =>
                        handleSelectChange("purpose", value)
                      }
                    >
                      <SelectTrigger className="h-11 bg-background/50 border-border/60 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Buy">Buy</SelectItem>
                        <SelectItem value="Rent">Rent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeline" className="text-sm font-medium">
                      Timeline <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.timeline || ""}
                      onValueChange={(value) =>
                        handleSelectChange("timeline", value)
                      }
                    >
                      <SelectTrigger className="h-11 bg-background/50 border-border/60 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-3m">0-3 months</SelectItem>
                        <SelectItem value="3-6m">3-6 months</SelectItem>
                        <SelectItem value=">6m">&gt;6 months</SelectItem>
                        <SelectItem value="Exploring">Exploring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Budget Range Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Budget Range
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Specify the budget constraints
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin" className="text-sm font-medium">
                      Minimum Budget (₹)
                    </Label>
                    <Input
                      id="budgetMin"
                      name="budgetMin"
                      type="number"
                      value={formData.budgetMin || ""}
                      onChange={handleChange}
                      placeholder="5000000"
                      min="0"
                      className="h-11 bg-background/50 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetMax" className="text-sm font-medium">
                      Maximum Budget (₹)
                    </Label>
                    <Input
                      id="budgetMax"
                      name="budgetMax"
                      type="number"
                      value={formData.budgetMax || ""}
                      onChange={handleChange}
                      placeholder="10000000"
                      min="0"
                      className="h-11 bg-background/50 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    {errors.budgetMax && (
                      <p className="text-sm text-destructive">
                        {errors.budgetMax}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Additional Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2">
                  <div className="p-2 bg-chart-4/20 rounded-lg">
                    <Tag className="h-5 w-5 text-chart-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Additional Information
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Source, notes, and tags for better organization
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source" className="text-sm font-medium">
                    Lead Source <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.source || ""}
                    onValueChange={(value) =>
                      handleSelectChange("source", value)
                    }
                  >
                    <SelectTrigger className="h-11 bg-background/50 border-border/60 focus:ring-2 focus:ring-primary/20">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleChange}
                    placeholder="Add any additional notes about this lead..."
                    rows={4}
                    maxLength={1000}
                    className="bg-background/50 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-sm font-medium">
                    Tags
                  </Label>
                  <Input
                    id="tags"
                    value={formData.tags?.join(", ") || ""}
                    onChange={handleTagsChange}
                    placeholder="hot-lead, first-time-buyer, urgent"
                    className="h-11 bg-background/50 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate tags with commas for better organization
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-8 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="px-8 h-11 border-border/60 hover:bg-accent/50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                >
                  {isSubmitting ? "Creating Lead..." : "Create Lead"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
