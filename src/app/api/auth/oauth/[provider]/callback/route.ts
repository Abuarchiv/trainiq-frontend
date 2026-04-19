import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://backend:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider } = params;
  const { searchParams } = request.nextUrl;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const loginUrl = new URL("/login", request.nextUrl.origin);

  if (error || !code || !state) {
    loginUrl.searchParams.set("error", "Anmeldung abgebrochen.");
    return NextResponse.redirect(loginUrl);
  }

  if (!["google", "github"].includes(provider)) {
    loginUrl.searchParams.set("error", "Unbekannter Anbieter.");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const backendUrl = BACKEND.replace(/\/+$/, "");
    const resp = await fetch(`${backendUrl}/auth/oauth/${provider}/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      loginUrl.searchParams.set("error", data?.detail || "OAuth fehlgeschlagen.");
      return NextResponse.redirect(loginUrl);
    }

    const { token, user } = await resp.json();

    const completeUrl = new URL("/auth-complete", request.nextUrl.origin);
    const response = NextResponse.redirect(completeUrl);

    const cookieOpts = {
      maxAge: 300,
      httpOnly: false,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    };
    response.cookies.set("_kc_token", token, cookieOpts);
    response.cookies.set("_kc_user", JSON.stringify(user), cookieOpts);

    return response;
  } catch (err) {
    loginUrl.searchParams.set("error", "Server-Fehler bei der Anmeldung.");
    return NextResponse.redirect(loginUrl);
  }
}
