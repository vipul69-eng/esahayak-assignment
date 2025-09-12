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

  const getStatusColor = (status: string) => {
    const colors = {
      New: "bg-blue-50 text-blue-700 border-blue-200",
      Qualified: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Contacted: "bg-amber-50 text-amber-700 border-amber-200",
      Visited: "bg-indigo-50 text-indigo-700 border-indigo-200",
      Negotiation: "bg-orange-50 text-orange-700 border-orange-200",
      Converted: "bg-green-50 text-green-700 border-green-200",
      Dropped: "bg-red-50 text-red-700 border-red-200",
    };
    return (
      colors[status as keyof typeof colors] ||
      "bg-gray-50 text-gray-700 border-gray-200"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading buyers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200/60">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 text-balance">
                Buyers Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and track your property buyers
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    {data?.pagination.total || 0}
                  </span>
                  <span className="text-gray-600">Total Buyers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm">
          <div className="p-6 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  City
                </label>
                <select
                  value={currentCity}
                  onChange={(e) => updateFilter("city", e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900"
                >
                  <option value="all">All Cities</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Mohali">Mohali</option>
                  <option value="Zirakpur">Zirakpur</option>
                  <option value="Panchkula">Panchkula</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Property Type
                </label>
                <select
                  value={currentPropertyType}
                  onChange={(e) => updateFilter("propertyType", e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900"
                >
                  <option value="all">All Property Types</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Plot">Plot</option>
                  <option value="Office">Office</option>
                  <option value="Retail">Retail</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Status
                </label>
                <select
                  value={currentStatus}
                  onChange={(e) => updateFilter("status", e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900"
                >
                  <option value="all">All Status</option>
                  <option value="New">New</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Visited">Visited</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Converted">Converted</option>
                  <option value="Dropped">Dropped</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timeline
                </label>
                <select
                  value={currentTimeline}
                  onChange={(e) => updateFilter("timeline", e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900"
                >
                  <option value="all">All Timeline</option>
                  <option value="0-3m">0-3 months</option>
                  <option value="3-6m">3-6 months</option>
                  <option value=">6m">&gt;6 months</option>
                  <option value="Exploring">Exploring</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200/60">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Buyer Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Location & Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Budget Range
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60">
                {data?.buyers.map((buyer) => (
                  <tr
                    key={buyer.id}
                    className="hover:bg-gray-50/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {buyer.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {buyer.fullName}
                          </div>
                          {buyer.email && (
                            <div className="text-sm text-gray-500">
                              {buyer.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {buyer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {buyer.city}
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md inline-block">
                          {buyer.propertyType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatBudget(buyer.budgetMin, buyer.budgetMax)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {buyer.timeline}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(buyer.status)}`}
                      >
                        {buyer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(buyer.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/buyers/${buyer.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-150"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </a>
                        <a
                          href={`/buyers/${buyer.id}?edit=true`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors duration-150"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="bg-gray-50/30 border-t border-gray-200/60 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-medium text-gray-900">
                    {(data.pagination.page - 1) * data.pagination.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-gray-900">
                    {Math.min(
                      data.pagination.page * data.pagination.limit,
                      data.pagination.total,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-900">
                    {data.pagination.total}
                  </span>{" "}
                  results
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updatePage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {Array.from(
                      { length: Math.min(5, data.pagination.totalPages) },
                      (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => updatePage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                              page === data.pagination.page
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <button
                    onClick={() =>
                      updatePage(
                        Math.min(data.pagination.totalPages, currentPage + 1),
                      )
                    }
                    disabled={currentPage === data.pagination.totalPages}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
