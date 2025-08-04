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
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
