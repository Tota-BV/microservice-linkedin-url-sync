import { env } from "@/lib/env.server";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  // strict: true,
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
