import { createServer } from "http";
import { rapidAPIClient } from "./lib/rapidapi";
import { mapLinkedInToCandidate, validateCandidateData } from "./lib/linkedin-mapper";
import { saveToCache, loadFromCache, isCacheFresh } from "./lib/cache";
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
		res.end(JSON.stringify({ 
			status: "ok", 
			timestamp: new Date().toISOString(),
			version: "1.0.0",
			features: {
				caching: true,
				rapidApi: true,
				bulkProcessing: true,
				dataMapping: true,
			}
		}));
		return;
	}

	// LinkedIn sync endpoint
	if (req.url === "/api/linkedin/sync" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", chunk => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { linkedinUrl } = JSON.parse(body);
					
					if (!linkedinUrl || !linkedinUrl.includes("linkedin.com")) {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ 
							success: false, 
							error: "Invalid LinkedIn URL" 
						}));
						return;
					}

					console.log(`🔄 Processing single LinkedIn URL: ${linkedinUrl}`);
					
					// Check cache first
					const isFresh = await isCacheFresh(linkedinUrl);
					if (isFresh) {
						console.log(`📋 Loading from cache: ${linkedinUrl}`);
						const cachedData = await loadFromCache(linkedinUrl);
						if (cachedData) {
							const candidateData = mapLinkedInToCandidate(cachedData, linkedinUrl);
							const validation = validateCandidateData(candidateData);
							
							res.writeHead(200, { "Content-Type": "application/json" });
							res.end(JSON.stringify({
								success: true,
								source: "cache",
								data: candidateData,
								validation,
								metadata: {
									linkedinUrl,
									processedAt: new Date().toISOString(),
									totalPositions: cachedData.position?.length || 0,
									totalSkills: cachedData.skills?.length || 0,
								}
							}));
							return;
						}
					}
					
					// Fetch from RapidAPI
					console.log(`🌐 Fetching from RapidAPI: ${linkedinUrl}`);
					const linkedinData = await rapidAPIClient.getProfileData(linkedinUrl);
					
					// Save to cache
					await saveToCache(linkedinUrl, linkedinData);
					
					// Map to candidate format
					const candidateData = mapLinkedInToCandidate(linkedinData, linkedinUrl);
					const validation = validateCandidateData(candidateData);
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						source: "api",
						data: candidateData,
						validation,
						metadata: {
							linkedinUrl,
							processedAt: new Date().toISOString(),
							totalPositions: linkedinData.position?.length || 0,
							totalSkills: linkedinData.skills?.length || 0,
						}
					}));
					
				} catch (error: any) {
					console.error(`❌ Error processing LinkedIn URL:`, error.message);
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: false,
						error: error.message,
						processedAt: new Date().toISOString(),
					}));
				}
			});
		} catch (error: any) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ 
				success: false, 
				error: "Internal server error" 
			}));
		}
		return;
	}

	// LinkedIn bulk sync endpoint
	if (req.url === "/api/linkedin/sync-bulk" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", chunk => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { linkedinUrls } = JSON.parse(body);
					
					if (!Array.isArray(linkedinUrls) || linkedinUrls.length === 0) {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ 
							success: false, 
							error: "linkedinUrls array is required" 
						}));
						return;
					}

					console.log(`🔄 Processing ${linkedinUrls.length} LinkedIn URLs`);
					
					const apiResults = await rapidAPIClient.getProfilesData(linkedinUrls, 5, 1000);
					
					const results = {
						successful: [] as any[],
						failed: [] as any[],
						summary: {
							total: linkedinUrls.length,
							successful: 0,
							failed: 0,
						}
					};

					// Process successful results
					for (const result of apiResults.successful) {
						try {
							const candidateData = mapLinkedInToCandidate(result.data, result.url);
							const validation = validateCandidateData(candidateData);
							
							results.successful.push({
								linkedinUrl: result.url,
								data: candidateData,
								validation,
							});
							
							results.summary.successful++;
						} catch (error: any) {
							results.failed.push({
								linkedinUrl: result.url,
								error: `Data mapping failed: ${error.message}`,
							});
							results.summary.failed++;
						}
					}

					// Process failed results
					for (const result of apiResults.failed) {
						results.failed.push({
							linkedinUrl: result.url,
							error: result.error,
						});
						results.summary.failed++;
					}

					console.log(`✅ Bulk processing complete: ${results.summary.successful} successful, ${results.summary.failed} failed`);
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						results,
						summary: results.summary,
						processedAt: new Date().toISOString(),
					}));
					
				} catch (error: any) {
					console.error(`❌ Error in bulk processing:`, error.message);
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: false,
						error: error.message,
						processedAt: new Date().toISOString(),
					}));
				}
			});
		} catch (error: any) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ 
				success: false, 
				error: "Internal server error" 
			}));
		}
		return;
	}

	// 404 for other routes
	res.writeHead(404, { "Content-Type": "application/json" });
	res.end(JSON.stringify({ 
		success: false, 
		error: "Endpoint not found",
		availableEndpoints: [
			"GET /health",
			"POST /api/linkedin/sync",
			"POST /api/linkedin/sync-bulk"
		]
	}));
});

const port = process.env.PORT || 3001;

server.listen(port, () => {
	console.log(`🚀 LinkedIn Parser Microservice running on port ${port}`);
	console.log(`📊 Health check: http://localhost:${port}/health`);
	console.log(`🔗 Single sync: POST http://localhost:${port}/api/linkedin/sync`);
	console.log(`🔗 Bulk sync: POST http://localhost:${port}/api/linkedin/sync-bulk`);
});
