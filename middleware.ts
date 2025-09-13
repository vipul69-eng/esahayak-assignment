// middleware.ts
import { NextResponse, NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const sid = req.cookies.get("sid")?.value;
  const url = req.nextUrl;

  // Allow auth routes and static assets
  if (
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/signup") ||
    url.pathname.startsWith("/_next") ||
    url.pathname === "/"
  ) {
    return NextResponse.next();
  }

  // middleware.ts (excerpt)
  if (url.pathname.startsWith("/profile")) {
    if (!sid) return NextResponse.redirect(new URL("/login", req.url));
  }

  // Gate buyers pages and APIs
  if (
    url.pathname.startsWith("/buyers") ||
    url.pathname.startsWith("/api/buyers")
  ) {
    if (!sid) return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
