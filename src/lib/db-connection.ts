import { Pool } from "pg";
import { getDatabaseUrl } from "./env.server";

// Production-ready database connection with connection pooling
export const pool = new Pool({
  connectionString: getDatabaseUrl(),
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
});

// Graceful shutdown handling
process.on("SIGINT", () => {
  pool.end();
  process.exit(0);
});

process.on("SIGTERM", () => {
  pool.end();
  process.exit(0);
});

// Enhanced database ping with detailed diagnostics
export async function pingDatabase(): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
  details?: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
}> {
  const startedAt = Date.now();
  try {
    await pool.query("SELECT 1");
    const details = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      details,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
