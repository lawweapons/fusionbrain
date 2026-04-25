import { NextRequest, NextResponse } from "next/server";

/** Check Basic Auth from a request. Returns null if OK, or a 401 NextResponse. */
export function requireBasicAuth(req: NextRequest): NextResponse | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
    const colon = decoded.indexOf(":");
    if (colon !== -1) {
      const user = decoded.slice(0, colon);
      const pass = decoded.slice(colon + 1);
      if (user === process.env.BASIC_AUTH_USER && pass === process.env.BASIC_AUTH_PASS) {
        return null;
      }
    }
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="FusionBrain"' },
  });
}
