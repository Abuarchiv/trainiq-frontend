import { NextRequest, NextResponse } from "next/server";

// Server-side requests must bypass nginx and reach the backend directly.
// BACKEND_URL is set to http://backend:8000 in Docker, falls back to localhost.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * Keycloak OAuth2 Callback Handler
 *
 * Keycloak redirects to: /api/auth/callback?code=...&state=...
 * This handler exchanges the code for tokens via the backend, stores
 * the JWT in a cookie readable by the frontend, and redirects to /dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const message = encodeURIComponent(errorDescription ?? error);
    return NextResponse.redirect(new URL(`/login?error=${message}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  // Behind nginx (SSL termination), request.url has http:// even in production.
  // Use X-Forwarded-Proto + Host headers to reconstruct the correct public origin.
  const proto = (request.headers.get("x-forwarded-proto") ?? "").split(",")[0].trim() || new URL(request.url).protocol.slice(0, -1);
  const host = request.headers.get("host") || new URL(request.url).host;
  const redirectUri = `${proto}://${host}/api/auth/callback`;

  try {
    const response = await fetch(`${BACKEND_URL}/auth/keycloak/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const msg = encodeURIComponent(body.detail ?? "auth_failed");
      return NextResponse.redirect(new URL(`/login?error=${msg}`, request.url));
    }

    const data = await response.json();
    const { access_token, user } = data;

    // Redirect to dashboard, passing token + user in a short-lived cookie
    // so the client-side can pick them up via the auth-complete page.
    const res = NextResponse.redirect(new URL("/auth-complete", request.url));
    res.cookies.set("_kc_token", access_token, {
      httpOnly: false, // must be readable by JS to store in localStorage
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60, // 60 seconds — only needed during the redirect
      path: "/",
    });
    res.cookies.set("_kc_user", JSON.stringify(user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.redirect(new URL("/login?error=server_error", request.url));
  }
}
