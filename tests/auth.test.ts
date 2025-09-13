/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests authorization for /api/buyers/[id] route handlers:
 * - USER can only access/edit/delete when ownerId matches session.sub
 * - ADMIN can access/edit/delete regardless of ownerId
 */
import { NextRequest } from "next/server";

// Mock getSession to control role and sub
jest.mock("@/lib/auth", () => ({
  getSession: jest.fn(),
}));
import { getSession } from "@/lib/auth";

// Mock Prisma used by the route
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockHistoryCreate = jest.fn();

jest.mock("@prisma/client", () => {
  const actual = jest.requireActual("@prisma/client");
  return {
    ...actual,
    PrismaClient: jest.fn().mockImplementation(() => ({
      buyer: {
        findUnique: mockFindUnique,
        update: mockUpdate,
        delete: mockDelete,
      },
      buyerHistory: {
        create: mockHistoryCreate,
      },
      $transaction: async (ops: any) => {
        // Support both array and callback signatures if used
        if (typeof ops === "function")
          return ops({
            buyer: { update: mockUpdate, delete: mockDelete },
            buyerHistory: { create: mockHistoryCreate },
          });
        return Promise.all(ops);
      },
    })),
  };
});

// Import the route handlers after mocks
import * as route from "@/app/api/buyers/[id]/route";

function makeRequest(method: string, body?: any) {
  // Minimal NextRequest shim for tests
  const url = "http://localhost/api/buyers/ID";
  const init: any = { method, headers: { "content-type": "application/json" } };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new NextRequest(url, init);
}

describe("RBAC for /api/buyers/[id]", () => {
  const ownedRecord = {
    id: "ID",
    ownerId: "u1",
    updatedAt: new Date(),
    fullName: "Vipul",
    city: "Chandigarh",
    propertyType: "Apartment",
    bhk: "TWO",
    purpose: "Buy",
    budgetMin: 1,
    budgetMax: 2,
    timeline: "T0_3M",
    source: "WEBSITE",
    status: "NEW",
    notes: "",
    tags: [],
  };
  const otherRecord = { ...ownedRecord, ownerId: "u2" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET: USER cannot view non-owned record (403)", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      sub: "u1",
      username: "user",
      role: "USER",
    });
    mockFindUnique.mockResolvedValue(otherRecord);

    // params is async in Next 15: pass as Promise
    const res = await route.GET(makeRequest("GET"), {
      params: Promise.resolve({ id: "ID" }),
    } as any);
    const json = await (res as Response).json();

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "ID" } }),
    );
    expect((res as Response).status).toBe(403);
    expect(json.error).toBeDefined();
  });

  test("GET: ADMIN can view any record (200)", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      sub: "a1",
      username: "admin",
      role: "ADMIN",
    });
    mockFindUnique.mockResolvedValue(otherRecord);

    const res = await route.GET(makeRequest("GET"), {
      params: Promise.resolve({ id: "ID" }),
    } as any);
    const json = await (res as Response).json();

    expect((res as Response).status).toBe(200);
    expect(json.buyer).toBeTruthy();
  });

  test("PUT: ADMIN can edit any record (200)", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      sub: "a1",
      username: "admin",
      role: "ADMIN",
    });
    mockFindUnique.mockResolvedValue({
      ...otherRecord,
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    });
    mockUpdate.mockResolvedValue({ ...otherRecord, fullName: "Edited" });

    const body = {
      updatedAt: "2024-01-01T00:00:00.000Z",
      fullName: "Edited",
      email: "",
      phone: "9876543210",
      city: "Chandigarh",
      propertyType: "Apartment",
      bhk: "2",
      purpose: "Buy",
      budgetMin: 1,
      budgetMax: 2,
      timeline: "0-3m",
      source: "Website",
      notes: "",
      tags: [],
      status: "New",
    };

    const res = await route.PUT(makeRequest("PUT", body), {
      params: Promise.resolve({ id: "ID" }),
    } as any);
    const json = await (res as Response).json();

    expect((res as Response).status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockHistoryCreate).toHaveBeenCalled();
    expect(json.buyer.fullName).toBe("Edited");
  });

  test("DELETE: USER cannot delete non-owned record (403)", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      sub: "u1",
      username: "user",
      role: "USER",
    });
    mockFindUnique.mockResolvedValue(otherRecord);

    const res = await route.DELETE(makeRequest("DELETE"), {
      params: Promise.resolve({ id: "ID" }),
    } as any);
    const json = await (res as Response).json();

    expect((res as Response).status).toBe(403);
    expect(mockDelete).not.toHaveBeenCalled();
    expect(json.error).toBeDefined();
  });
});
