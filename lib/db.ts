import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __fb_pool: Pool | undefined;
}

export const db: Pool =
  global.__fb_pool ??
  (global.__fb_pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000
  }));
