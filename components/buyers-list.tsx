/** eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { debounce } from "lodash";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Users,
  TrendingUp,
  Clock,
  MapPin,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface Buyer {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  city: string;
  propertyType: string;
  budgetMin: number | null;
  budgetMax: number | null;
  timeline: string;
  status: string;
  updatedAt: string;
}

interface BuyersResponse {
  buyers: Buyer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function BuyersList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<BuyersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );

  // Current filters from URL
  const currentPage = Number.parseInt(searchParams.get("page") || "1");
  const currentCity = searchParams.get("city") || "all";
  const currentPropertyType = searchParams.get("propertyType") || "all";
  const currentStatus = searchParams.get("status") || "all";
  const currentTimeline = searchParams.get("timeline") || "all";

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
          params.set("search", term);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
        router.push(`/buyers?${params.toString()}`);
      }, 300),
    [searchParams, router],
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1");
    router.push(`/buyers?${params.toString()}`);
  };

  const updatePage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/buyers?${params.toString()}`);
  };

  useEffect(() => {
    const fetchBuyers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams);
        const response = await fetch(`/api/buyers?${params.toString()}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch buyers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuyers();
  }, [searchParams]);

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return "—";
    const formatAmount = (amount: number) => {
      if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
      if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
      return `₹${amount.toLocaleString()}`;
    };

    if (min && max) return `${formatAmount(min)} - ${formatAmount(max)}`;
    if (min) return `${formatAmount(min)}+`;
    if (max) return `Up to ${formatAmount(max)}`;
    return "—";
  };

  const getStatusVariant = (
    status: string,
  ): "default" | "outline" | "secondary" | "destructive" => {
    const variants = {
      New: "default",
      Qualified: "default",
      Contacted: "secondary",
      Visited: "secondary",
      Negotiation: "outline",
      Converted: "default",
      Dropped: "destructive",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return variants[status as keyof typeof variants] || ("outline" as any);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <div className="space-y-4 p-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Buyers
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{data?.pagination.total || 0}</span>
              <span>Total Buyers</span>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-4 h-4" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  City
                </label>
                <Select
                  value={currentCity}
                  onValueChange={(value) => updateFilter("city", value)}
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Property Type</label>
                <Select
                  value={currentPropertyType}
                  onValueChange={(value) => updateFilter("propertyType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Property Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Property Types</SelectItem>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Plot">Plot</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Status
                </label>
                <Select
                  value={currentStatus}
                  onValueChange={(value) => updateFilter("status", value)}
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timeline
                </label>
                <Select
                  value={currentTimeline}
                  onValueChange={(value) => updateFilter("timeline", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Timeline</SelectItem>
                    <SelectItem value="0-3m">0-3 months</SelectItem>
                    <SelectItem value="3-6m">3-6 months</SelectItem>
                    <SelectItem value=">6m">&gt;6 months</SelectItem>
                    <SelectItem value="Exploring">Exploring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer Details</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location & Type</TableHead>
                  <TableHead>Budget Range</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.buyers.map((buyer) => (
                  <TableRow key={buyer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {buyer.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{buyer.fullName}</div>
                          {buyer.email && (
                            <div className="text-sm text-muted-foreground">
                              {buyer.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{buyer.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{buyer.city}</div>
                        <Badge variant="secondary" className="text-xs">
                          {buyer.propertyType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatBudget(buyer.budgetMin, buyer.budgetMax)}
                      </div>
                    </TableCell>
                    <TableCell>{buyer.timeline}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(buyer.status)}>
                        {buyer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(buyer.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/buyers/${buyer.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/buyers/${buyer.id}?edit=true`}>
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {data && data.pagination.totalPages > 1 && (
              <div className="border-t p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium">
                      {(data.pagination.page - 1) * data.pagination.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        data.pagination.page * data.pagination.limit,
                        data.pagination.total,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{data.pagination.total}</span>{" "}
                    results
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updatePage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.min(5, data.pagination.totalPages) },
                        (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={
                                page === data.pagination.page
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => updatePage(page)}
                            >
                              {page}
                            </Button>
                          );
                        },
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updatePage(
                          Math.min(data.pagination.totalPages, currentPage + 1),
                        )
                      }
                      disabled={currentPage === data.pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
