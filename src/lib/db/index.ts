import { env } from "@/lib/env.server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as agencySchema from "./schema/agency";
import * as authSchema from "./schema/auth";
import * as candidateSchema from "./schema/candidate";
import * as countrySchema from "./schema/countries";

export const db = drizzle({
  schema: {
    ...authSchema,
    ...agencySchema,
    ...candidateSchema,
    ...countrySchema,
  },
  connection: {
    connectionString: env.DATABASE_URL || "",
    ssl: false,
  },
});

export type DB = typeof db;
