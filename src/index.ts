import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { rapidAPIClient } from "./lib/rapidapi";
import { mapLinkedInToCandidate, validateCandidateData } from "./lib/linkedin-mapper";
import { saveToCache, loadFromCache, isCacheFresh } from "./lib/cache";
// Removed imports that no longer exist in database.ts
import { saveJsonToVolume } from "./lib/volume-storage";
import { env } from "./lib/env.server";

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
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
		try {
			const { pingDatabase } = await import('./lib/database');
			const db = await pingDatabase();

			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				status: "ok",
				timestamp: new Date().toISOString(),
				version: "1.0.0",
				features: {
					caching: true,
					rapidApi: true,
					bulkProcessing: true,
					dataMapping: true
				},
				database: {
					connected: db.ok,
					latencyMs: db.latencyMs,
					status: db.ok ? "ready" : "error",
					error: db.error ?? null
				}
			}));
		} catch (error) {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				status: "ok",
				timestamp: new Date().toISOString(),
				version: "1.0.0",
				features: {
					caching: true,
					rapidApi: true,
					bulkProcessing: true,
					dataMapping: true
				},
				database: {
					connected: false,
					latencyMs: 0,
					status: "error",
					error: error instanceof Error ? error.message : "Unknown error"
				}
			}));
		}
		return;
	}

	// Test endpoint to check skills in database
	if (req.url === "/api/test/skills" && req.method === "GET") {
		try {
			const { getAllSkills } = await import('./lib/database');
			const skills = await getAllSkills();
			
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ 
				success: true,
				totalSkills: skills.length,
				skills: skills.slice(0, 10) // Show first 10 skills
			}));
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ 
				success: false,
				error: error instanceof Error ? error.message : "Unknown error"
			}));
		}
		return;
	}

	// Test endpoint to check candidate skills
	if (req.url === "/api/test/candidate-skills" && req.method === "GET") {
		try {
			const { getCandidateSkills } = await import('./lib/database');
			const candidateId = "b3679811-1997-4978-b212-c64f981dcb87"; // Arnand's ID
			const skills = await getCandidateSkills(candidateId);
			
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ 
				success: true,
				candidateId,
				totalSkills: skills.length,
				skills: skills
			}));
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ 
				success: false,
				error: error instanceof Error ? error.message : "Unknown error"
			}));
		}
		return;
	}

	// Test endpoint for Step 5a: Education insertion only
	if (req.url === "/api/test/step5a-education" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { linkedinUrl } = JSON.parse(body);
					
					const { findCandidateByLinkedInUrl, insertEducation } = await import('./lib/database');
					const { loadFromCache } = await import('./lib/cache');
					const { mapLinkedInToCandidate } = await import('./lib/linkedin-mapper');
					
					const candidate = await findCandidateByLinkedInUrl(linkedinUrl);
					if (!candidate) {
						res.writeHead(404, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ success: false, error: "Candidate not found" }));
						return;
					}
					
					// Get LinkedIn data from cache or API
					const linkedinData = await loadFromCache(linkedinUrl);
					const candidateData = await mapLinkedInToCandidate(linkedinData, linkedinUrl);
					
					const result = await insertEducation(candidate.id, candidateData);
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						result,
						processedAt: new Date().toISOString()
					}));
				} catch (error) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error',
						processedAt: new Date().toISOString()
					}));
				}
			});
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				processedAt: new Date().toISOString()
			}));
		}
		return;
	}

	// Test endpoint for Step 5b: Certifications insertion only
	if (req.url === "/api/test/step5b-certifications" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { linkedinUrl } = JSON.parse(body);
					
					const { findCandidateByLinkedInUrl, insertCertifications } = await import('./lib/database');
					const { loadFromCache } = await import('./lib/cache');
					const { mapLinkedInToCandidate } = await import('./lib/linkedin-mapper');
					
					const candidate = await findCandidateByLinkedInUrl(linkedinUrl);
					if (!candidate) {
						res.writeHead(404, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ success: false, error: "Candidate not found" }));
						return;
					}
					
					const linkedinData = await loadFromCache(linkedinUrl);
					const candidateData = await mapLinkedInToCandidate(linkedinData, linkedinUrl);
					
					const result = await insertCertifications(candidate.id, candidateData);
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						result,
						processedAt: new Date().toISOString()
					}));
				} catch (error) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error',
						processedAt: new Date().toISOString()
					}));
				}
			});
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				processedAt: new Date().toISOString()
			}));
		}
		return;
	}

	// Test endpoint for Step 5c: Languages insertion only
	if (req.url === "/api/test/step5c-languages" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { linkedinUrl } = JSON.parse(body);
					
					const { findCandidateByLinkedInUrl, insertLanguages } = await import('./lib/database');
					const { loadFromCache } = await import('./lib/cache');
					const { mapLinkedInToCandidate } = await import('./lib/linkedin-mapper');
					
					const candidate = await findCandidateByLinkedInUrl(linkedinUrl);
					if (!candidate) {
						res.writeHead(404, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ success: false, error: "Candidate not found" }));
						return;
					}
					
					const linkedinData = await loadFromCache(linkedinUrl);
					const candidateData = await mapLinkedInToCandidate(linkedinData, linkedinUrl);
					
					const result = await insertLanguages(candidate.id, candidateData);
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						result,
						processedAt: new Date().toISOString()
					}));
				} catch (error) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error',
						processedAt: new Date().toISOString()
					}));
				}
			});
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				processedAt: new Date().toISOString()
			}));
		}
		return;
	}

	// Test endpoint for Step 5d: Verification (work experience) insertion only
	if (req.url === "/api/test/step5d-verification" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { linkedinUrl } = JSON.parse(body);
					
					const { findCandidateByLinkedInUrl, insertVerification } = await import('./lib/database');
					const { loadFromCache } = await import('./lib/cache');
					const { mapLinkedInToCandidate } = await import('./lib/linkedin-mapper');
					
					const candidate = await findCandidateByLinkedInUrl(linkedinUrl);
					if (!candidate) {
						res.writeHead(404, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ success: false, error: "Candidate not found" }));
						return;
					}
					
					const linkedinData = await loadFromCache(linkedinUrl);
					const candidateData = await mapLinkedInToCandidate(linkedinData, linkedinUrl);
					
					const result = await insertVerification(candidate.id, candidateData);
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						result,
						processedAt: new Date().toISOString()
					}));
				} catch (error) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error',
						processedAt: new Date().toISOString()
					}));
				}
			});
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				processedAt: new Date().toISOString()
			}));
		}
		return;
	}

	// Test endpoint for sequential processing (Step 4 then Step 5)
	if (req.url === "/api/test/sequential-processing" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { linkedinUrl } = JSON.parse(body);
					
					const { processLinkedInDataSequentially } = await import('./lib/database');
					const result = await processLinkedInDataSequentially(linkedinUrl);
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						result,
						processedAt: new Date().toISOString()
					}));
				} catch (error) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error',
						processedAt: new Date().toISOString()
					}));
				}
			});
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				processedAt: new Date().toISOString()
			}));
		}
		return;
	}

	// Test endpoint to link skills to candidate
	if (req.url === "/api/test/link-skills" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { candidateId, skills } = JSON.parse(body);
					
					const { linkSkillsToCandidate } = await import('./lib/database');
					const result = await linkSkillsToCandidate(candidateId, skills);
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						result,
						processedAt: new Date().toISOString()
					}));
				} catch (error) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error',
						processedAt: new Date().toISOString()
					}));
				}
			});
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				processedAt: new Date().toISOString()
			}));
		}
		return;
	}

	// Test endpoint to find candidate by LinkedIn URL
	if (req.url === "/api/test/find-candidate" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { linkedinUrl } = JSON.parse(body);
					
					const { findCandidateByLinkedInUrl } = await import('./lib/database');
					const candidate = await findCandidateByLinkedInUrl(linkedinUrl);
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						found: !!candidate,
						candidate: candidate ? {
							id: candidate.id,
							first_name: candidate.first_name,
							last_name: candidate.last_name,
							linkedin_url: candidate.linkedin_url
						} : null
					}));
				} catch (error) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: false,
						error: error instanceof Error ? error.message : "Unknown error"
					}));
				}
			});
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ 
				success: false, 
				error: "Internal server error" 
			}));
		}
		return;
	}

	// Test endpoint to directly check database
	if (req.url === "/api/test/db-check" && req.method === "GET") {
		try {
			const { pool } = await import('./lib/database');
			
			// Check if candidates_skills table exists
			const tableExistsResult = await pool.query(`
				SELECT EXISTS (
					SELECT FROM information_schema.tables 
					WHERE table_schema = 'public' 
					AND table_name = 'candidates_skills'
				);
			`);
			
			// Check candidates_skills table
			const candidateSkillsResult = await pool.query(`
				SELECT COUNT(*) as count FROM candidates_skills 
				WHERE candidate_id = 'b3679811-1997-4978-b212-c64f981dcb87'
			`);
			
			// Check skills table
			const skillsResult = await pool.query(`
				SELECT COUNT(*) as count FROM skills WHERE source = 'user'
			`);
			
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ 
				success: true,
				candidatesSkillsTableExists: tableExistsResult.rows[0].exists,
				candidateSkillsCount: candidateSkillsResult.rows[0].count,
				userSkillsCount: skillsResult.rows[0].count
			}));
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ 
				success: false,
				error: error instanceof Error ? error.message : "Unknown error"
			}));
		}
		return;
	}

	// Step 3 only: Ensure skills exist from LinkedIn data (no linking)
	if (req.url === "/api/test/step3-ensure-skills" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
			req.on("end", async () => {
				try {
					const { linkedinUrl } = JSON.parse(body || '{}');
					const { ensureSkillsExistFromLinkedInData } = await import('./lib/database');
					const { loadFromCache } = await import('./lib/cache');
					const linkedinData = await loadFromCache(linkedinUrl);
					if (!linkedinData) {
						res.writeHead(404, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ success: false, error: 'No cached LinkedIn data' }));
						return;
					}
					const result = await ensureSkillsExistFromLinkedInData(linkedinData);
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ success: true, step: 3, ensureResult: result }));
				} catch (error) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }));
				}
			});
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }));
		}
		return;
	}

	// Step 4 only: Link skills to candidate (assumes Step 3 done)
	if (req.url === "/api/test/step4-link-skills" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
			req.on("end", async () => {
				try {
					const { linkedinUrl } = JSON.parse(body || '{}');
					const { findCandidateByLinkedInUrl, linkSkillsToCandidate } = await import('./lib/database');
					const { loadFromCache } = await import('./lib/cache');
					const { mapLinkedInToCandidate } = await import('./lib/linkedin-mapper');

					const candidate = await findCandidateByLinkedInUrl(linkedinUrl);
					if (!candidate) {
						res.writeHead(404, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ success: false, error: 'Candidate not found' }));
						return;
					}

					const linkedinData = await loadFromCache(linkedinUrl);
					if (!linkedinData) {
						res.writeHead(404, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ success: false, error: 'No cached LinkedIn data' }));
						return;
					}

					const candidateData = await mapLinkedInToCandidate(linkedinData, linkedinUrl);
					const skillsToLink = candidateData.candidateProfile.skills
						.filter(s => s.skillId !== null)
						.map(s => ({ skillId: s.skillId as string, endorsementsCount: s.endorsementsCount, source: s.source }));

					await linkSkillsToCandidate(candidate.id, skillsToLink);
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ success: true, step: 4, linked: skillsToLink.length, totalSkills: candidateData.candidateProfile.skills.length }));
				} catch (error) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }));
				}
			});
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }));
		}
		return;
	}

	// Read-only DB stats per candidate (no hardcoded IDs)
	if (req.url === "/api/test/db-stats" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
			req.on("end", async () => {
				try {
					const { candidateId: candidateIdInput, linkedinUrl } = JSON.parse(body || '{}');
					const { pool, findCandidateByLinkedInUrl } = await import('./lib/database');

					let candidateId = candidateIdInput as string | undefined;
					if (!candidateId && linkedinUrl) {
						const candidate = await findCandidateByLinkedInUrl(linkedinUrl);
						candidateId = candidate?.id;
					}

					if (!candidateId) {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ success: false, error: 'Provide candidateId or linkedinUrl' }));
						return;
					}

					const [skills, edu, certs, langs, verif] = await Promise.all([
						pool.query('SELECT COUNT(*)::int AS count FROM candidates_skills WHERE candidate_id = $1', [candidateId]),
						pool.query('SELECT COUNT(*)::int AS count FROM candidates_education WHERE candidate_id = $1', [candidateId]),
						pool.query('SELECT COUNT(*)::int AS count FROM candidates_certifications WHERE candidate_id = $1', [candidateId]),
						pool.query('SELECT COUNT(*)::int AS count FROM candidates_languages WHERE candidate_id = $1', [candidateId]),
						pool.query('SELECT COUNT(*)::int AS count FROM candidates_verification WHERE candidate_id = $1', [candidateId])
					]);

					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						candidateId,
						counts: {
							skills: skills.rows[0]?.count ?? 0,
							education: edu.rows[0]?.count ?? 0,
							certifications: certs.rows[0]?.count ?? 0,
							languages: langs.rows[0]?.count ?? 0,
							verification: verif.rows[0]?.count ?? 0
						}
					}));
				} catch (error) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }));
				}
			});
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }));
		}
		return;
	}

	// List skills for a candidate (by candidateId or linkedinUrl)
	if (req.url === "/api/test/list-skills" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
			req.on("end", async () => {
				try {
					const { candidateId: candidateIdInput, linkedinUrl } = JSON.parse(body || '{}');
					const { pool, findCandidateByLinkedInUrl } = await import('./lib/database');

					let candidateId = candidateIdInput as string | undefined;
					if (!candidateId && linkedinUrl) {
						const candidate = await findCandidateByLinkedInUrl(linkedinUrl);
						candidateId = candidate?.id;
					}

					if (!candidateId) {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ success: false, error: 'Provide candidateId or linkedinUrl' }));
						return;
					}

					const result = await pool.query(
						`SELECT s.id, s.name
						 FROM candidates_skills cs
						 JOIN skills s ON s.id = cs.skill_id
						 WHERE cs.candidate_id = $1
						 ORDER BY s.name`,
						[candidateId]
					);

					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ success: true, candidateId, skills: result.rows }));
				} catch (error) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }));
				}
			});
		} catch (error) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }));
		}
		return;
	}

	// Initialize cache with real RapidAPI data
	if (req.url === "/api/cache/init" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { linkedinUrls } = JSON.parse(body);
					
					console.log(`🔄 Initializing cache with ${linkedinUrls.length} LinkedIn URLs`);
					
					const results = {
						successful: [] as any[],
						failed: [] as any[],
						summary: {
							total: linkedinUrls.length,
							successful: 0,
							failed: 0,
						}
					};
					
					// Process URLs one by one to avoid rate limits
					for (const linkedinUrl of linkedinUrls) {
						try {
							console.log(`🌐 Fetching from RapidAPI: ${linkedinUrl}`);
							const linkedinData = await rapidAPIClient.getProfileData(linkedinUrl);
							
							// Save to cache
							await saveToCache(linkedinUrl, linkedinData);
							
							results.successful.push({
								linkedinUrl,
								cached: true,
								totalPositions: linkedinData.position?.length || 0,
								totalSkills: linkedinData.skills?.length || 0,
							});
							
							results.summary.successful++;
							
							// Wait 1 second between requests to avoid rate limits
							await new Promise(resolve => setTimeout(resolve, 1000));
							
						} catch (error: any) {
							console.error(`❌ Error fetching ${linkedinUrl}:`, error.message);
							results.failed.push({
								linkedinUrl,
								error: error.message,
							});
							results.summary.failed++;
						}
					}
					
					console.log(`✅ Cache initialization complete: ${results.summary.successful} successful, ${results.summary.failed} failed`);
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						results,
						summary: results.summary,
						processedAt: new Date().toISOString(),
					}));
					
				} catch (error: any) {
					console.error(`❌ Error in cache initialization:`, error.message);
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

	// Get cache status
	if (req.url === "/api/cache/status" && req.method === "GET") {
		try {
			const { isCacheFresh, loadFromCache } = await import('./lib/cache');
			
			// List of URLs to check
			const testUrls = [
				"https://www.linkedin.com/in/satya-nadella/",
				"https://www.linkedin.com/in/julian-klumpers-383a20145/",
				"https://www.linkedin.com/in/jeffweiner08/"
			];
			
			const cacheStatus = [];
			
			for (const url of testUrls) {
				const isFresh = await isCacheFresh(url);
				const cachedData = await loadFromCache(url);
				
				cacheStatus.push({
					url,
					exists: !!cachedData,
					isFresh,
					totalPositions: cachedData?.position?.length || 0,
					totalSkills: cachedData?.skills?.length || 0,
				});
			}
			
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				success: true,
				cacheStatus,
				processedAt: new Date().toISOString(),
			}));
			
		} catch (error: any) {
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				success: false,
				error: error.message,
				processedAt: new Date().toISOString(),
			}));
		}
		return;
	}

	// LinkedIn sync endpoint
	if (req.url === "/api/linkedin/sync" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { linkedinUrl, testDatabase = false, testSkillsOnly = false } = JSON.parse(body);
					
					if (!linkedinUrl || !linkedinUrl.includes("linkedin.com")) {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ 
							success: false, 
							error: "Invalid LinkedIn URL" 
						}));
						return;
					}

					console.log(`🔄 Processing single LinkedIn URL: ${linkedinUrl}${testDatabase ? ' (with database test)' : ''}${testSkillsOnly ? ' (skills only)' : ''}`);
					
					// Check cache first
					const isFresh = await isCacheFresh(linkedinUrl);
					let linkedinData;
					let source = "api";
					
					if (isFresh) {
						console.log(`📋 Loading from cache: ${linkedinUrl}`);
						linkedinData = await loadFromCache(linkedinUrl);
						if (linkedinData) {
							source = "cache";
						}
					}
					
					// If no cache, try cached data
					if (!linkedinData) {
						try {
							const { getCachedData, hasCachedData } = await import('./lib/cache-data');
							if (hasCachedData(linkedinUrl)) {
								console.log(`📋 Loading from cached data: ${linkedinUrl}`);
								linkedinData = getCachedData(linkedinUrl);
								source = "cached";
							}
						} catch (error) {
							console.log(`❌ No cached data available for: ${linkedinUrl}`);
						}
					}
					
					// Fetch from RapidAPI if not cached
					if (!linkedinData) {
						console.log(`🌐 Fetching from RapidAPI: ${linkedinUrl}`);
						linkedinData = await rapidAPIClient.getProfileData(linkedinUrl);
						await saveToCache(linkedinUrl, linkedinData);
					}
					
					// Map to candidate format
					const candidateData = await mapLinkedInToCandidate(linkedinData, linkedinUrl);
					const validation = validateCandidateData(candidateData.candidateProfile);
					
					// Skills-only test if requested
					let skillsResult = null;
					if (testSkillsOnly) {
						try {
							const { insertSkillsOnly } = await import('./lib/database');
							console.log(`💾 Testing skills-only insert for: ${linkedinUrl}`);
							skillsResult = await insertSkillsOnly(linkedinUrl);
							console.log(`💾 Skills insert result:`, skillsResult);
						} catch (skillsError) {
							console.error(`❌ Skills test failed:`, skillsError);
						}
					}
					
					// Database test if requested
					let dbResult = null;
					if (testDatabase) {
						try {
							const { checkDatabaseSchema, insertLinkedInDataWithOrder } = await import('./lib/database');
							const schemaCompatible = await checkDatabaseSchema();
							
							if (schemaCompatible) {
								console.log(`💾 Testing database insert for: ${linkedinUrl}`);
								dbResult = await insertLinkedInDataWithOrder(linkedinUrl);
								console.log(`💾 Database insert result:`, dbResult);
							} else {
								console.log(`❌ Database schema not compatible`);
							}
						} catch (dbError) {
							console.error(`❌ Database test failed:`, dbError);
						}
					}
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						source,
						databaseOperations: candidateData.databaseOperations,
						candidateProfile: candidateData.candidateProfile,
						validation,
						skillsTest: testSkillsOnly ? skillsResult : null,
						databaseTest: testDatabase ? {
							success: dbResult?.success || false,
							candidateId: dbResult?.candidateId,
							skillsCreated: dbResult?.skillsCreated || 0,
							skillsLinked: dbResult?.skillsLinked || 0,
							duplicate: dbResult?.duplicate || false,
							error: dbResult?.error || null
						} : null,
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
			req.on("data", (chunk: Buffer) => {
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
							const candidateData = await mapLinkedInToCandidate(result.data, result.url);
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

	// LinkedIn sync with backup and database insert endpoint
	if (req.url === "/api/linkedin/sync-with-backup" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
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

					console.log(`🔄 Processing LinkedIn URL with backup: ${linkedinUrl}`);
					
					// Check database schema compatibility
					const schemaCompatible = await checkDatabaseSchema();
					if (!schemaCompatible) {
						res.writeHead(500, { "Content-Type": "application/json" });
						res.end(JSON.stringify({
							success: false,
							error: "Database schema not compatible",
							linkedinUrl,
							processedAt: new Date().toISOString(),
						}));
						return;
					}
					
					// Check cache first
					const isFresh = await isCacheFresh(linkedinUrl);
					let linkedinData;
					let source = "api";
					
					if (isFresh) {
						console.log(`📋 Loading from cache: ${linkedinUrl}`);
						linkedinData = await loadFromCache(linkedinUrl);
						if (linkedinData) {
							source = "cache";
						}
					}
					
					// If no cache, try cached data
					if (!linkedinData) {
						try {
							const { getCachedData, hasCachedData } = await import('./lib/cache-data');
							if (hasCachedData(linkedinUrl)) {
								console.log(`📋 Loading from cached data: ${linkedinUrl}`);
								linkedinData = getCachedData(linkedinUrl);
								source = "cached";
							}
						} catch (error) {
							console.log(`❌ No cached data available for: ${linkedinUrl}`);
						}
					}
					
					// Fetch from RapidAPI if not cached
					if (!linkedinData) {
						console.log(`🌐 Fetching from RapidAPI: ${linkedinUrl}`);
						linkedinData = await rapidAPIClient.getProfileData(linkedinUrl);
						await saveToCache(linkedinUrl, linkedinData);
					}
					
					// Map to candidate format
					const candidateData = await mapLinkedInToCandidate(linkedinData, linkedinUrl);
					
					// STEP 1: Save JSON to volume
					let jsonFile = null;
					let jsonSaved = false;
					try {
						jsonFile = await saveJsonToVolume(candidateData, linkedinUrl);
						jsonSaved = true;
						console.log(`💾 JSON backup saved: ${jsonFile}`);
					} catch (jsonError) {
						console.error(`❌ Failed to save JSON backup:`, jsonError);
					}
					
					// STEP 2: Insert to database (skills first, then candidate)
					let dbResult = null;
					let databaseInserted = false;
					try {
						const { insertLinkedInDataWithOrder } = await import('./lib/database');
						dbResult = await insertLinkedInDataWithOrder(linkedinUrl);
						databaseInserted = dbResult.success;
						console.log(`💾 Database insert result:`, dbResult);
					} catch (dbError) {
						console.error(`❌ Failed to insert to database:`, dbError);
					}
					
					// Return comprehensive result
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: jsonSaved || databaseInserted,
						source,
						jsonBackup: {
							saved: jsonSaved,
							filepath: jsonFile,
							error: jsonSaved ? null : "Failed to save JSON backup"
						},
						databaseInsert: {
							inserted: databaseInserted,
							candidateId: dbResult?.candidateId,
							skillsCreated: dbResult?.skillsCreated || 0,
							skillsLinked: dbResult?.skillsLinked || 0,
							duplicate: dbResult?.duplicate || false,
							error: databaseInserted ? null : dbResult?.error || "Failed to insert to database"
						},
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

	// Mock LinkedIn sync endpoint (uses cached data)
	if (req.url === "/api/linkedin/sync-mock" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { linkedinUrl, profileType = "satya-nadella" } = JSON.parse(body);
					
					console.log(`🧪 Using mock data for: ${linkedinUrl} (profile: ${profileType})`);
					
					// Import mock data
					const { getMockData } = await import('./lib/mock-data');
					const mockData = getMockData(profileType);
					
					// Map to candidate format
					const candidateData = await mapLinkedInToCandidate(mockData, linkedinUrl);
					const validation = validateCandidateData(candidateData.candidateProfile);
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						source: "mock",
						databaseOperations: candidateData.databaseOperations,
						candidateProfile: candidateData.candidateProfile,
						validation,
						metadata: {
							linkedinUrl,
							processedAt: new Date().toISOString(),
							totalPositions: mockData.position?.length || 0,
							totalSkills: mockData.skills?.length || 0,
							profileType
						}
					}));
					
				} catch (error: any) {
					console.error(`❌ Error processing mock data:`, error.message);
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

	// Mock sync with backup and database insert
	if (req.url === "/api/linkedin/sync-mock-with-backup" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { linkedinUrl, profileType = "satya-nadella" } = JSON.parse(body);
					
					console.log(`🧪 Processing mock data with backup: ${linkedinUrl} (profile: ${profileType})`);
					
					// Check database schema compatibility
					const schemaCompatible = await checkDatabaseSchema();
					if (!schemaCompatible) {
						res.writeHead(500, { "Content-Type": "application/json" });
						res.end(JSON.stringify({
							success: false,
							error: "Database schema not compatible",
							linkedinUrl,
							processedAt: new Date().toISOString(),
						}));
						return;
					}
					
					// Import mock data
					const { getMockData } = await import('./lib/mock-data');
					const mockData = getMockData(profileType);
					
					// Map to candidate format
					const candidateData = await mapLinkedInToCandidate(mockData, linkedinUrl);
					
					// STEP 1: Save JSON to volume
					let jsonFile = null;
					let jsonSaved = false;
					try {
						jsonFile = await saveJsonToVolume(candidateData, linkedinUrl);
						jsonSaved = true;
						console.log(`💾 JSON backup saved: ${jsonFile}`);
					} catch (jsonError) {
						console.error(`❌ Failed to save JSON backup:`, jsonError);
					}
					
					// STEP 2: Insert to database (skills first, then candidate)
					let dbResult = null;
					let databaseInserted = false;
					try {
						// Use mock data for database insert
						const { insertLinkedInDataWithOrder } = await import('./lib/database');
						dbResult = await insertLinkedInDataWithOrder(linkedinUrl);
						databaseInserted = dbResult.success;
						console.log(`💾 Database insert result:`, dbResult);
					} catch (dbError) {
						console.error(`❌ Failed to insert to database:`, dbError);
					}
					
					// Return comprehensive result
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: jsonSaved || databaseInserted,
						source: "mock",
						jsonBackup: {
							saved: jsonSaved,
							filepath: jsonFile,
							error: jsonSaved ? null : "Failed to save JSON backup"
						},
						databaseInsert: {
							inserted: databaseInserted,
							candidateId: dbResult?.candidateId,
							skillsCreated: dbResult?.skillsCreated || 0,
							skillsLinked: dbResult?.skillsLinked || 0,
							duplicate: dbResult?.duplicate || false,
							error: databaseInserted ? null : dbResult?.error || "Failed to insert to database"
						},
						metadata: {
							linkedinUrl,
							processedAt: new Date().toISOString(),
							totalPositions: mockData.position?.length || 0,
							totalSkills: mockData.skills?.length || 0,
							profileType
						}
					}));
					
				} catch (error: any) {
					console.error(`❌ Error processing mock data:`, error.message);
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

	// Test with cached data
	if (req.url === "/api/linkedin/sync-cached" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { linkedinUrl } = JSON.parse(body);
					
					console.log(`🧪 Using cached data for: ${linkedinUrl}`);
					
					// Import cached data
					const { getCachedData, hasCachedData } = await import('./lib/cache-data');
					
					if (!hasCachedData(linkedinUrl)) {
						res.writeHead(404, { "Content-Type": "application/json" });
						res.end(JSON.stringify({
							success: false,
							error: "No cached data available for this URL",
							linkedinUrl,
							processedAt: new Date().toISOString(),
						}));
						return;
					}
					
					const cachedData = getCachedData(linkedinUrl);
					
					// Map to candidate format
					const candidateData = await mapLinkedInToCandidate(cachedData, linkedinUrl);
					const validation = validateCandidateData(candidateData.candidateProfile);
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						source: "cached",
						databaseOperations: candidateData.databaseOperations,
						candidateProfile: candidateData.candidateProfile,
						validation,
						metadata: {
							linkedinUrl,
							processedAt: new Date().toISOString(),
							totalPositions: cachedData.position?.length || 0,
							totalSkills: cachedData.skills?.length || 0,
						}
					}));
					
				} catch (error: any) {
					console.error(`❌ Error processing cached data:`, error.message);
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

	// Mock skills test endpoint
	if (req.url === "/api/linkedin/sync-mock-skills" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { profileType = "unique-skills-test" } = JSON.parse(body);
					
					console.log(`🔄 Testing skills with mock data: ${profileType}`);
					
					// Get mock data
					const { getMockData } = await import('./lib/mock-data');
					const mockData = getMockData(profileType);
					
					// Map to candidate format
					const { mapLinkedInToCandidate } = await import('./lib/linkedin-mapper');
					const candidateData = await mapLinkedInToCandidate(mockData, "https://www.linkedin.com/in/mock-test/");
					
					// Test skills insertion
					let skillsResult = null;
					try {
						const { insertSkillsOnly } = await import('./lib/database');
						console.log(`💾 Testing skills-only insert with mock data`);
						skillsResult = await insertSkillsOnly("https://www.linkedin.com/in/mock-test/", mockData);
						console.log(`💾 Skills insert result:`, skillsResult);
					} catch (skillsError) {
						console.error(`❌ Skills test failed:`, skillsError);
					}
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						source: "mock",
						databaseOperations: candidateData.databaseOperations,
						candidateProfile: candidateData.candidateProfile,
						skillsTest: skillsResult,
						metadata: {
							profileType,
							processedAt: new Date().toISOString(),
							totalSkills: mockData.skills?.length || 0,
						}
					}));
					
				} catch (error: any) {
					console.error(`❌ Error in mock skills test:`, error.message);
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

	// Database test endpoint
	if (req.url === "/api/test/database" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { testType } = JSON.parse(body);
					
					console.log(`🧪 Testing database: ${testType}`);
					
					// Check database schema
					const schemaCompatible = await checkDatabaseSchema();
					if (!schemaCompatible) {
						res.writeHead(500, { "Content-Type": "application/json" });
						res.end(JSON.stringify({
							success: false,
							error: "Database schema not compatible",
							testType,
							processedAt: new Date().toISOString(),
						}));
						return;
					}
					
					if (testType === "skill") {
						// Test skill creation
						const { skillNames = ["Test Skill"] } = JSON.parse(body);
						const { createSkill } = await import('./lib/database');
						
						const results = [];
						for (const skillName of skillNames) {
							try {
								const skillId = await createSkill(skillName, "linkedin");
								results.push({ skillName, skillId, success: true });
							} catch (error) {
								results.push({ skillName, error: error instanceof Error ? error.message : 'Unknown error', success: false });
							}
						}
						
						res.writeHead(200, { "Content-Type": "application/json" });
						res.end(JSON.stringify({
							success: true,
							testType: "skill",
							results,
							message: "Skills test completed",
							processedAt: new Date().toISOString(),
						}));
					} else if (testType === "candidate") {
						// Test candidate creation
						const { createCandidate } = await import('./lib/database');
						const candidateData = {
							firstName: "Test",
							lastName: "Candidate",
							email: "test@example.com",
							dateOfBirth: "1990-01-01",
							linkedinUrl: "https://www.linkedin.com/in/test-candidate-123/",
							profileImageUrl: "https://example.com/image.jpg",
							workingLocation: "Amsterdam",
							bio: "Test bio",
							generalJobTitle: "Software Engineer",
							currentCompany: "Test Company",
							category: "Technology",
							isActive: true
						};
						
						const candidateId = await createCandidate(candidateData);
						
						res.writeHead(200, { "Content-Type": "application/json" });
						res.end(JSON.stringify({
							success: true,
							testType: "candidate",
							candidateId,
							message: "Candidate created successfully",
							processedAt: new Date().toISOString(),
						}));
					} else {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({
							success: false,
							error: "Invalid test type. Use 'skill' or 'candidate'",
							testType,
							processedAt: new Date().toISOString(),
						}));
					}
					
				} catch (error: any) {
					console.error(`❌ Database test error:`, error.message);
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

	// Update existing candidate with LinkedIn data
	if (req.url === "/api/linkedin/update-candidate" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { linkedinUrl, mockData } = JSON.parse(body);
					
					if (!linkedinUrl) {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ "Content-Type": "application/json" }));
						return;
					}
					
					console.log(`🔄 Updating candidate with LinkedIn data: ${linkedinUrl}`);
					
					const { updateCandidateWithLinkedInData } = await import('./lib/database');
					const result = await updateCandidateWithLinkedInData(linkedinUrl, mockData);
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify(result));
					
				} catch (error: any) {
					console.error('❌ Error updating candidate:', error);
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ 
						success: false, 
						error: error instanceof Error ? error.message : 'Unknown error' 
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

	// Update existing candidate with mock data
	if (req.url === "/api/linkedin/update-candidate-mock" && req.method === "POST") {
		try {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			
			req.on("end", async () => {
				try {
					const { profileType = 'satya-nadella' } = JSON.parse(body);
					
					console.log(`🔄 Updating candidate with mock data: ${profileType}`);
					
					const { getMockData } = await import('./lib/mock-data');
					const mockData = getMockData(profileType);
					
					const { updateCandidateWithLinkedInData } = await import('./lib/database');
					const result = await updateCandidateWithLinkedInData(mockData.linkedinUrl, mockData);
					
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						success: true,
						updateResult: result,
						mockDataUsed: profileType
					}));
					
				} catch (error: any) {
					console.error('❌ Error updating candidate with mock data:', error);
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ 
						success: false, 
						error: error instanceof Error ? error.message : 'Unknown error' 
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
			"POST /api/linkedin/sync-bulk",
			"POST /api/linkedin/sync-with-backup"
		]
	}));
});

const port = env.PORT;

server.listen(port, () => {
	console.log(`🚀 LinkedIn Parser Microservice running on port ${port}`);
	console.log(`📊 Health check: http://localhost:${port}/health`);
	console.log(`🔗 Single sync: POST http://localhost:${port}/api/linkedin/sync`);
	console.log(`🔗 Bulk sync: POST http://localhost:${port}/api/linkedin/sync-bulk`);
});
