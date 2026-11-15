import { NextResponse, type NextRequest } from "next/server";
import { CASHIER_COOKIE, cashierCookieMatches } from "@/lib/auth";

const CONFIG_ERROR = "Falta configurar el PIN de la caja. Define CASHIER_PIN en el servidor.";

function needsCashier(pathname: string, method: string): boolean {
  if (pathname === "/caja" || pathname.startsWith("/caja/")) return true;
  if (pathname === "/qrs" || pathname.startsWith("/qrs/")) return true;
  if (pathname === "/api/tables") return true;
  if (pathname.startsWith("/api/tables/") && method !== "GET") return true;
  if (pathname === "/api/bills" || pathname.startsWith("/api/bills/")) return true;
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/caja/login" || pathname.startsWith("/caja/login/")) return NextResponse.next();
  if (pathname === "/api/caja/login") return NextResponse.next();
  if (!needsCashier(pathname, request.method)) return NextResponse.next();
  // Demo pública: CASHIER_OPEN=true deja la caja abierta sin PIN. Quita la variable para volver a exigirlo.
  if (process.env.CASHIER_OPEN === "true") return NextResponse.next();

  const pin = process.env.CASHIER_PIN?.trim() ?? "";
  const production = process.env.NODE_ENV === "production";

  if (!pin) {
    if (!production) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: CONFIG_ERROR }, { status: 503 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/caja/login";
    url.search = "?config=1";
    return NextResponse.redirect(url);
  }

  if (cashierCookieMatches(request.cookies.get(CASHIER_COOKIE)?.value, pin)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Entra con el PIN de la caja." }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/caja/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/caja", "/caja/:path*", "/qrs", "/qrs/:path*", "/api/tables", "/api/tables/:path*", "/api/bills", "/api/bills/:path*"],
};
