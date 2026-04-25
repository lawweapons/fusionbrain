import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set(["/api/health"]);
const BEARER_PATHS = new Set(["/api/ingest"]);

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="FusionBrain"' }
  });
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (PUBLIC_PATHS.has(path)) return NextResponse.next();
  // Bearer-gated routes authenticate themselves inside the handler.
  if (BEARER_PATHS.has(path)) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return unauthorized();

  const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
  const colon = decoded.indexOf(":");
  if (colon === -1) return unauthorized();
  const user = decoded.slice(0, colon);
  const pass = decoded.slice(colon + 1);

  if (user !== process.env.BASIC_AUTH_USER || pass !== process.env.BASIC_AUTH_PASS) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  // Exclude /api/admin/* — those routes do their own Basic Auth check inside
  // the handler, because routing them through middleware imposes a 10MB body
  // limit that breaks file uploads.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/admin|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"
  ]
};
