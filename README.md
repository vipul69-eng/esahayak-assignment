Buyer Lead Intake – Mini App
Setup
Prerequisites

Bun or Node 18+ installed; Bun recommended for faster dev.

PostgreSQL (or compatible) available and reachable via DATABASE_URL.

Create .env from .env.example and set:

DATABASE_URL=postgres://user:pass@host:5432/dbname

NEXT_AUTH_SECRET=long-random-secret

JWT_SECRET=jwt secret for auth

Install

bun install (or npm i / yarn)

bunx prisma generate

bunx prisma migrate dev -n init

Seed admin (optional)

Promote any user to admin for RBAC testing:
UPDATE "User" SET role='ADMIN' WHERE username='admin';

Run locally

bun --bun run dev (or npm run dev / yarn dev) and open http://localhost:3000

Tests

bun run test (or npm test) for Jest-based unit tests.

Stack and Architecture
Next.js App Router + TypeScript; Route Handlers for API (app/api/*).

Prisma ORM with migrations; Postgres schema for buyers, buyer_history, users.

Zod for validation (client + server).

Auth: Signed JWT in HTTP-only cookie (sid) with { sub, username, role }.

SSR list view with URL-synced filters and server-side pagination/sorting.

Data Model
buyers

id (uuid), ownerId (user id), updatedAt (timestamp)

fullName (2–80), email (optional email), phone (10–15 digits)

city (Chandigarh|Mohali|Zirakpur|Panchkula|Other), propertyType (Apartment|Villa|Plot|Office|Retail)

bhk (1|2|3|4|Studio; required for Apartment/Villa; optional otherwise)

purpose (Buy|Rent), budgetMin (int, optional), budgetMax (int, optional, ≥ budgetMin)

timeline (0-3m|3-6m|>6m|Exploring), source (Website|Referral|Walk-in|Call|Other)

status (New|Qualified|Contacted|Visited|Negotiation|Converted|Dropped; default New), notes (≤1000), tags (string[])

buyer_history

id, buyerId, changedBy, changedAt, diff JSON of per-field { from, to } with special flags (created/imported/deleted).

Pages & Flows
Create Lead – /buyers/new

Form fields: fullName, email, phone, city, propertyType, bhk (conditional), purpose, budgetMin, budgetMax, timeline, source, notes, tags[].

Client + server validation: name len ≥ 2, 10–15 digit phone, email valid if present, budgetMax ≥ budgetMin when both present, bhk required iff Apartment/Villa.

On submit: creates buyer with ownerId = session.sub and writes buyer_history with { created/imported }.

List & Search – /buyers

SSR list with real pagination (page size 10), updatedAt desc default.

URL-synced filters: city, propertyType, status, timeline; debounced search by fullName|phone|email; server-side filtering/sorting/paging.

Columns: Name, Phone, City, PropertyType, Budget (min–max), Timeline, Status, UpdatedAt; row actions: View/Edit.

View & Edit – /buyers/[id]

Shows all fields and allows edit with same validation; includes hidden updatedAt for optimistic concurrency.

If updatedAt mismatches, server returns 409 “Record changed, please refresh.”

History tab: renders last 5 changes from buyer_history showing field, old → new, timestamp, and username.

Import / Export

Import CSV (max 200 rows) with headers: fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags,status; validates per row; reports row errors; only inserts valid rows in a transaction; unknown enums → error.

Export CSV: exports current filtered set respecting filters/search/sort.

Ownership & Auth
Login creates a signed JWT cookie (sid) with { sub, username, role }.

Anyone logged in can read all buyers (GET); edit/delete restricted: owner only, or admin bypass.

Admin role (optional): ADMIN can edit/delete any entry; guard logic is if (role !== "ADMIN" && ownerId !== sub) → 403.

Nice-to-haves implemented
Tag chips with typeahead: Native datalist suggestions backed by /api/tags returning distinct tags filtered by q; stored as string[].

Optimistic edit with rollback: Client applies optimistic state, sends PUT, rolls back on error or 409, reconciles on success with router.refresh().

Status quick-actions: Inline status change via dropdown in the list (optional wire-up); server still validates and logs history.

Validation
Zod schemas used in UI and API; CSV row validator with superRefine for cross-field rules (budgetMax ≥ budgetMin; bhk presence by propertyType).

Server routes reject invalid payloads with readable errors; form shows inline messages.

SSR vs Client
SSR: List/search/pagination/sort resolved on server; buyer detail fetched server-side.

Client: Forms, optimistic edits, tag chips, toasts; dynamic-only code runs on client to avoid hydration mismatch.

Concurrency
Edit forms include updatedAt; server enforces optimistic concurrency by matching updatedAt in the WHERE clause and returning 409 on mismatch.

Import/Export details
Import: csv-parse/sync with header check and max row cap; per-row Zod validation; valid rows bulk inserted with nested buyer_history imported: true in a transaction.

Export: current filtered dataset to CSV with human-readable enums; honors server-side filters/sort/search.

Rate limiting
Simple per-user limiter on create/update routes; returns 429 when exceeded.

Tests
Jest unit test for authorization: USER vs ADMIN behavior on /api/buyers/[id] GET/PUT/DELETE via mocked getSession and Prisma.

Jest unit test for CSV row validator: accepts valid rows and rejects missing bhk or budgetMax < budgetMin.

Accessibility
Forms use labels, Input id associations, ARIA for errors; keyboard focus visible; buttons are reachable.

Troubleshooting
Next 15 dynamic APIs: await params (const { id } = await params) in route handlers; otherwise, “params should be awaited” error.

Hydration mismatch: avoid Date.now()/toLocaleString() on server; if needed, format on client or use suppressHydrationWarning on isolated nodes.

Admin 403 after code changes: re-login to refresh JWT with role; legacy cookie lacks role claim and fails admin bypass.

Scripts
Using Bun

bun install; bunx prisma generate; bunx prisma migrate dev -n init; bun --bun run dev.

Using Node

npm i; npx prisma generate; npx prisma migrate dev -n init; npm run dev.

What’s done
CRUD with SSR list, URL-synced filters, debounced search, server pagination/sort.

Zod validation both sides; cross-field CSV validator; helpful error messages on forms and CSV import.

Ownership enforcement and optional admin RBAC bypass in API handlers.

CSV import with row errors and transactional insert; filtered CSV export.

History tracking: per-field diffs and last 5 changes in UI with username.

Rate limiting on mutations; basic a11y; at least one unit test for auth and CSV row validator.

Nice-to-haves: Tag chips with typeahead; optimistic edit with rollback; status quick-actions.

What’s skipped (and why)
DB-level Row-Level Security (RLS): Authorization enforced in app layer; RLS adds DB session state and complexity not required for this scope.

External auth providers: Kept simple demo signup/login with cookie JWT to focus on app logic per assignment.

Full-text search infra: Implemented pragmatic search on name/email/phone; full-text indexing can be added later if needed.

File upload attachmentUrl: Left as an extension point; the API and schema can add a single file field later.

Notes
Always re-login after changing auth payloads to refresh the cookie with any new claims (e.g., role).

App Router Route Handlers rely on the Web API Request/Response; avoid Node-specific APIs in those paths.
