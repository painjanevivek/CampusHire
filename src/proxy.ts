import { NextRequest, NextResponse } from "next/server";

const studentRoutes = [
  "/dashboard",
  "/onboarding",
  "/profile",
  "/applications",
  "/opportunities",
  "/resume",
  "/roadmap",
];

function isProtected(pathname: string) {
  return pathname.startsWith("/admin/") && pathname !== "/admin/sign-in"
    ? "admin"
    : studentRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
      ? "student"
      : null;
}

export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const development = process.env.NODE_ENV === "development";
  const configuredApi = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  let apiOrigin = "http://localhost:8000";
  try {
    const parsed = new URL(configuredApi);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") apiOrigin = parsed.origin;
  } catch {
    // A malformed deployment value remains blocked by the restrictive fallback policy.
  }
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    `script-src-elem 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin}${development ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  const protectedLane = isProtected(request.nextUrl.pathname);
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  requestHeaders.set("x-campushire-return-to", returnTo);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  if (protectedLane && !request.cookies.has("campushire_session")) {
    const destination = protectedLane === "admin" ? "/admin/sign-in" : "/sign-in";
    const signIn = new URL(destination, request.url);
    signIn.searchParams.set("returnTo", returnTo);
    const redirect = NextResponse.redirect(signIn);
    redirect.headers.set("Content-Security-Policy", policy);
    return redirect;
  }
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [{ source: "/((?!api|_next/static|_next/image|favicon.ico).*)", missing: [{ type: "header", key: "next-router-prefetch" }] }],
};
