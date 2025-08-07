import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		// Server Configuration
		PORT: z.coerce.number().default(3001),
		
		// Environment Configuration
		NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
		
		// Database Configuration - Support for separate staging/prod databases
		DATABASE_URL: z.string().url().optional(), // Fallback for single DB setup
		DATABASE_URL_STAGING: z.string().url().optional(),
		DATABASE_URL_PRODUCTION: z.string().url().optional(),
		
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

// Helper function to get the correct database URL based on environment
export function getDatabaseUrl(): string {
	const nodeEnv = env.NODE_ENV;
	
	// If we have environment-specific database URLs, use them
	if (nodeEnv === "staging" && env.DATABASE_URL_STAGING) {
		console.log("🔗 Using staging database");
		return env.DATABASE_URL_STAGING;
	}
	
	if (nodeEnv === "production" && env.DATABASE_URL_PRODUCTION) {
		console.log("🔗 Using production database");
		return env.DATABASE_URL_PRODUCTION;
	}
	
	// Fallback to single DATABASE_URL
	if (env.DATABASE_URL) {
		console.log(`🔗 Using fallback database for ${nodeEnv} environment`);
		return env.DATABASE_URL;
	}
	
	throw new Error(`No database URL configured for environment: ${nodeEnv}`);
}
