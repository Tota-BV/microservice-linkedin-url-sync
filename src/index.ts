import { createServer } from "http";
import { appRouter } from "./server/router";
import { createTRPCContext } from "./lib/trpc/init";
import { fetchRequestHandler } from "@trpc/server/adapters/node-http";
import { env } from "./lib/env.server";

const server = createServer(async (req, res) => {
	// CORS headers
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Request-Method", "*");
	res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
	res.setHeader("Access-Control-Allow-Headers", "*");

	if (req.method === "OPTIONS") {
		res.writeHead(200);
		res.end();
		return;
	}

	// Health check endpoint
	if (req.url === "/health") {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
		return;
	}

	// tRPC handler
	const handler = fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: createTRPCContext,
	});

	await handler(req, res);
});

const port = env.PORT || 3001;

server.listen(port, () => {
	console.log(`🚀 LinkedIn Parser Microservice running on port ${port}`);
	console.log(`📊 Health check: http://localhost:${port}/health`);
	console.log(`🔗 tRPC endpoint: http://localhost:${port}/api/trpc`);
});
