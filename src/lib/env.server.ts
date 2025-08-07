import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		SERVER_URL: z.string().url().optional(),
		DATABASE_URL: z.string().url(),
		REDIS_URL: z.string().url(),
		BETTER_AUTH_SECRET: z.string(),

		SMTP_URL: z.string(),
		SMTP_PORT: z.coerce.number(),

		// RapidAPI Configuration
		RAPIDAPI_KEY: z.string(),
		RAPIDAPI_HOST: z.string().default("professional-network-data.p.rapidapi.com"),
		
		// Cache Configuration
		CACHE_EXPIRATION_DAYS: z.coerce.number().default(30),
		CACHE_DIR: z.string().default("./src/cache/linkedin-profiles"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
