import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers (complements nginx headers; also active in dev without nginx)
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("X-DNS-Prefetch-Control", "on");

  // Forward correlation ID if present
  const reqId = request.headers.get("x-request-id");
  if (reqId) {
    response.headers.set("x-request-id", reqId);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|monitoring|.*\\..*).*)"],
};
