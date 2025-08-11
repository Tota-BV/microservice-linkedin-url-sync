// Environment variables will be loaded by env.server.ts
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { rapidAPIClient } from "./lib/rapidapi";

// Cache functionality removed - direct RapidAPI calls only
import { env } from "./lib/env.server";
import { findCandidateByLinkedInUrl } from "./lib/database";

// Simple configuration for local testing
const CONFIG = {
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
  REQUEST_TIMEOUT: 30000, // 30 seconds
};

// Simple request body parser
async function parseRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > CONFIG.MAX_REQUEST_SIZE) {
        req.destroy();
        reject(new Error("Request too large"));
        return;
      }
      body += chunk.toString();
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

// Simple logging
function logRequest(
  req: IncomingMessage,
  res: ServerResponse,
  startTime: number,
) {
  const duration = Date.now() - startTime;
  console.log(
    `📊 ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`,
  );
}

// Simple response helpers
function sendErrorResponse(
  res: ServerResponse,
  statusCode: number,
  error: string,
  details?: any,
) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });

  const response = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  };

  res.end(JSON.stringify(response));
}

function sendSuccessResponse(res: ServerResponse, data: any) {
  res.writeHead(200, {
    "Content-Type": "application/json",
  });

  const response = {
    success: true,
    ...data,
    timestamp: new Date().toISOString(),
  };

  res.end(JSON.stringify(response));
}

// Simple health check
async function performHealthCheck(): Promise<any> {
  try {
    const { pingDatabase } = await import("./lib/database");
    const db = await pingDatabase();

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      database: {
        connected: db.ok,
        latencyMs: db.latencyMs,
        status: db.ok ? "ready" : "error",
        error: db.error ?? null,
      },
    };
  } catch (error) {
    return {
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// LinkedIn URL validation
function validateLinkedInUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  try {
    const parsed = new URL(url);
    const isValidHostname = parsed.hostname === "linkedin.com" || parsed.hostname === "www.linkedin.com";
    return (
      isValidHostname &&
      parsed.pathname.startsWith("/in/") &&
      parsed.pathname.length > 4
    );
  } catch {
    return false;
  }
}

const server = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    const startTime = Date.now();

    try {
      // CORS headers for local testing
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Request-Method", "*");
      res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
      res.setHeader("Access-Control-Allow-Headers", "*");

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      // Health check endpoint
      if (req.url === "/health") {
        const healthData = await performHealthCheck();
        sendSuccessResponse(res, healthData);
        return;
      }

      // LinkedIn sync endpoint - single URL
      if (req.url === "/api/linkedin/sync" && req.method === "POST") {
        try {
          const body = await parseRequestBody(req);
          const { linkedinUrl } = JSON.parse(body);

          if (!linkedinUrl) {
            sendErrorResponse(res, 400, "linkedinUrl is required");
            return;
          }

          if (!validateLinkedInUrl(linkedinUrl)) {
            sendErrorResponse(res, 400, "Invalid LinkedIn URL format", {
              expectedFormat: "https://linkedin.com/in/username",
              providedUrl: linkedinUrl,
            });
            return;
          }

          console.log(`🔄 Processing single LinkedIn URL: ${linkedinUrl}`);

          // Fetch data directly from RapidAPI
          console.log(`🔍 Fetching fresh data from RapidAPI for ${linkedinUrl}`);
          
          let linkedinData: any;
          let source: string;
          
          try {
            linkedinData = await rapidAPIClient.getProfileData(linkedinUrl);
            source = "rapidapi";
            console.log(`✅ Successfully fetched data from RapidAPI for ${linkedinUrl}`);
          } catch (apiError: any) {
            console.error(`❌ RapidAPI error:`, apiError.message);
            throw new Error(`Failed to fetch LinkedIn data: ${apiError.message}`);
          }

          // Map to candidate format
          const { mapLinkedInData } = await import("./lib/core/data-mapper");
          const mappingResult = await mapLinkedInData(linkedinData, linkedinUrl);
          
          if (!mappingResult.success || !mappingResult.mappedData) {
            throw new Error(mappingResult.error || "Failed to map LinkedIn data");
          }
          
          const candidateData = mappingResult.mappedData;

          // Find existing candidate
          const { findCandidateByLinkedInUrl } = await import("./lib/database");
          const existingCandidate = await findCandidateByLinkedInUrl(linkedinUrl);

          if (!existingCandidate) {
            sendErrorResponse(res, 404, "Candidate not found", {
              message: "The microservice can only enrich existing profiles. Please create the basic candidate profile in the main application first.",
              linkedinUrl,
              enrichmentData: {
                skills: candidateData.skills,
                education: candidateData.education,
                certifications: candidateData.certifications,
                languages: candidateData.languages,
                verification: candidateData.verification,
              },
            });
            return;
          }

          // Update basic candidate fields with LinkedIn data
          console.log(`🔄 [SERVICE] Updating basic candidate fields with LinkedIn data...`);
          const { updateCandidate } = await import("./lib/database");
          
          const updateResult = await updateCandidate(existingCandidate.id, {
            firstName: candidateData.firstName || existingCandidate.firstName,
            lastName: candidateData.lastName || existingCandidate.lastName,
            bio: candidateData.bio || existingCandidate.bio,
            generalJobTitle: candidateData.generalJobTitle || existingCandidate.generalJobTitle,
            currentCompany: candidateData.currentCompany || existingCandidate.currentCompany,
            profileImageUrl: candidateData.profileImageUrl || existingCandidate.profileImageUrl,
            category: candidateData.category || existingCandidate.category,
            dateOfBirth: candidateData.dateOfBirth || existingCandidate.dateOfBirth,
            workingLocation: candidateData.workingLocation || existingCandidate.workingLocation,
            updatedAt: new Date()
          });

          if (!updateResult.success) {
            console.warn(`⚠️ [SERVICE] Failed to update basic candidate fields:`, updateResult.error);
          } else {
            console.log(`✅ [SERVICE] Basic candidate fields updated successfully`);
          }

          // Process skills and link them to candidate
          const { SkillsRepository } = await import("./lib/repositories/skills-repository");
          const { SkillsCandidateRepository } = await import("./lib/repositories/skills-candidate-repository");
          const skillsRepo = new SkillsRepository();
          const skillsCandidateRepo = new SkillsCandidateRepository();
          
          // Map LinkedIn skills to the format expected by processSkillsForDatabase
          // Handle nested data structure from RapidAPI
          const profileData = (linkedinData as any).data || linkedinData;
          const skillsToProcess = (profileData.skills || []).map((skill: any) => ({
            skillName: skill.name || skill, // Handle both object and string formats
            endorsementsCount: skill.endorsementsCount || 0, // Use LinkedIn data if available
            isCore: skill.passedSkillAssessment || false, // Use LinkedIn assessment data
          }));
          
          const skillsResult = await skillsRepo.processSkillsForDatabase(skillsToProcess);

          // Link skills to candidate using the processed skills result
          const skillsToLink = skillsResult.processedSkills.map((skill) => ({
            skillId: skill.skillId,
            skillName: skill.skillName,
            wasCreated: skill.wasCreated,
            wasMatched: skill.wasMatched,
          }));

          const skillsLinkResult = await skillsCandidateRepo.linkSkillsToCandidate(
            existingCandidate.id,
            skillsToLink,
          );

          // Insert related data
          const { RelatedDataRepository } = await import("./lib/repositories/related-data-repository");
          const relatedDataRepo = new RelatedDataRepository();

          // Debug: Log the data being passed to repositories
          console.log(`🔍 [SERVICE] Data being passed to repositories:`);
          console.log(`  - Education: ${candidateData.education?.length || 0} records`);
          console.log(`  - Verification: ${candidateData.verification?.length || 0} records`);
          console.log(`  - Languages: ${candidateData.languages?.length || 0} records`);
          console.log(`  - Certifications: ${candidateData.certifications?.length || 0} records`);

          const [
            educationResult,
            workExperienceResult,
            certificationsResult,
            languagesResult,
            verificationResult,
          ] = await Promise.allSettled([
            relatedDataRepo.insertEducation(existingCandidate.id, candidateData.education),
            relatedDataRepo.insertWorkExperience(existingCandidate.id, candidateData.workExperience),
            relatedDataRepo.insertCertifications(existingCandidate.id, candidateData.certifications),
            relatedDataRepo.insertLanguages(existingCandidate.id, candidateData.languages),
            relatedDataRepo.insertVerification(existingCandidate.id, candidateData.verification),
          ]);

          // Process results
          const results = {
            education: educationResult.status === "fulfilled" ? educationResult.value : { success: false, error: "Failed" },
            workExperience: workExperienceResult.status === "fulfilled" ? workExperienceResult.value : { success: false, error: "Failed" },
            certifications: certificationsResult.status === "fulfilled" ? certificationsResult.value : { success: false, error: "Failed" },
            languages: languagesResult.status === "fulfilled" ? languagesResult.value : { success: false, error: "Failed" },
            verification: verificationResult.status === "fulfilled" ? verificationResult.value : { success: false, error: "Failed" },
          };

          // Return enrichment result
          sendSuccessResponse(res, {
            source,
            candidateId: existingCandidate.id,
            enrichment: {
              skillsLinked: skillsLinkResult.success ? skillsLinkResult.skillsLinked : 0,
              educationAdded: educationResult.status === "fulfilled" ? educationResult.value : 0,
              workExperienceAdded: workExperienceResult.status === "fulfilled" ? workExperienceResult.value : 0,
              certificationsAdded: certificationsResult.status === "fulfilled" ? certificationsResult.value : 0,
              languagesIdentified: languagesResult.status === "fulfilled" ? languagesResult.value : 0,
              verificationStatus: verificationResult.status === "fulfilled" ? "updated" : "failed",
            },
            metadata: {
              linkedinUrl,
              processedAt: new Date().toISOString(),
              totalSkills: skillsToLink.length,
              totalEducation: educationResult.status === "fulfilled" ? educationResult.value : 0,
              totalWorkExperience: workExperienceResult.status === "fulfilled" ? workExperienceResult.value : 0,
              totalCertifications: certificationsResult.status === "fulfilled" ? certificationsResult.value : 0,
              totalLanguages: languagesResult.status === "fulfilled" ? languagesResult.value : 0,
              processingTime: Date.now() - startTime,
            },
            results,
          });
        } catch (error: any) {
          console.error(`❌ Error processing LinkedIn URL:`, error.message);
          sendErrorResponse(res, 500, error.message, {
            linkedinUrl: req.url || "unknown",
            processingTime: Date.now() - startTime,
          });
        }
        return;
      }

      // LinkedIn sync endpoint - bulk URLs
      if (req.url === "/api/linkedin/sync-bulk" && req.method === "POST") {
        try {
          const body = await parseRequestBody(req);
          const { linkedinUrls } = JSON.parse(body);

          if (!Array.isArray(linkedinUrls) || linkedinUrls.length === 0) {
            sendErrorResponse(res, 400, "linkedinUrls array is required and must not be empty");
            return;
          }

          if (linkedinUrls.length > 50) {
            sendErrorResponse(res, 400, "Too many URLs", {
              maxAllowed: 50,
              provided: linkedinUrls.length,
            });
            return;
          }

          // Validate each URL
          const invalidUrls = linkedinUrls.filter((url) => !validateLinkedInUrl(url));
          if (invalidUrls.length > 0) {
            sendErrorResponse(res, 400, "Invalid LinkedIn URLs detected", {
              invalidUrls,
              expectedFormat: "https://linkedin.com/in/username",
            });
            return;
          }

          console.log(`🔄 Processing ${linkedinUrls.length} LinkedIn URLs in bulk`);

          // Process URLs in parallel with concurrency limit
          const concurrencyLimit = 5;
          const results = [];

          for (let i = 0; i < linkedinUrls.length; i += concurrencyLimit) {
            const batch = linkedinUrls.slice(i, i + concurrencyLimit);
            const batchPromises = batch.map(async (url) => {
              try {
                // Fetch data directly from RapidAPI
                let linkedinData: any;
                
                try {
                  linkedinData = await rapidAPIClient.getProfileData(url);
                } catch (apiError: any) {
                  return { url, success: false, error: `Failed to fetch: ${apiError.message}` };
                }

                // Map to candidate format
                const { mapLinkedInData } = await import("./lib/core/data-mapper");
                const mappingResult = await mapLinkedInData(linkedinData, url);
                
                if (!mappingResult.success || !mappingResult.mappedData) {
                  return { url, success: false, error: mappingResult.error || "Failed to map LinkedIn data" };
                }
                
                const candidateData = mappingResult.mappedData;

                // Find existing candidate
                const existingCandidate = await findCandidateByLinkedInUrl(url);

                if (!existingCandidate) {
                  return { url, success: false, error: "Candidate not found" };
                }

                // Update basic candidate fields with LinkedIn data
                console.log(`🔄 [SERVICE] Updating basic candidate fields for ${url}...`);
                const { updateCandidate } = await import("./lib/database");
                
                const updateResult = await updateCandidate(existingCandidate.id, {
                  firstName: candidateData.firstName || existingCandidate.firstName,
                  lastName: candidateData.lastName || existingCandidate.lastName,
                  bio: candidateData.bio || existingCandidate.bio,
                  generalJobTitle: candidateData.generalJobTitle || existingCandidate.generalJobTitle,
                  currentCompany: candidateData.currentCompany || existingCandidate.currentCompany,
                  profileImageUrl: candidateData.profileImageUrl || existingCandidate.profileImageUrl,
                  category: candidateData.category || existingCandidate.category,
                  dateOfBirth: candidateData.dateOfBirth || existingCandidate.dateOfBirth,
                  workingLocation: candidateData.workingLocation || existingCandidate.workingLocation,
                  updatedAt: new Date()
                });

                if (!updateResult.success) {
                  console.warn(`⚠️ [SERVICE] Failed to update basic candidate fields for ${url}:`, updateResult.error);
                } else {
                  console.log(`✅ [SERVICE] Basic candidate fields updated successfully for ${url}`);
                }

                // Process skills and link them
                const { SkillsRepository } = await import("./lib/repositories/skills-repository");
                const { SkillsCandidateRepository } = await import("./lib/repositories/skills-candidate-repository");
                const skillsRepo = new SkillsRepository();
                const skillsCandidateRepo = new SkillsCandidateRepository();
                
                // Handle nested data structure from RapidAPI
                const profileData = (linkedinData as any).data || linkedinData;
                const skillsToProcess = (profileData.skills || []).map((skill: any) => ({
                  skillName: skill.name || skill,
                  endorsementsCount: skill.endorsementsCount || 0,
                  isCore: skill.passedSkillAssessment || false,
                }));
                
                const skillsResult = await skillsRepo.processSkillsForDatabase(skillsToProcess);

                const skillsToLink = skillsResult.processedSkills.map((skill) => ({
                  skillId: skill.skillId,
                  skillName: skill.skillName,
                  wasCreated: skill.wasCreated,
                  wasMatched: skill.wasMatched,
                }));

                await skillsCandidateRepo.linkSkillsToCandidate(existingCandidate.id, skillsToLink);

                // Insert related data
                const { RelatedDataRepository } = await import("./lib/repositories/related-data-repository");
                const relatedDataRepo = new RelatedDataRepository();

                const [educationResult, workExperienceResult, certificationsResult, languagesResult, verificationResult] = await Promise.allSettled([
                  relatedDataRepo.insertEducation(existingCandidate.id, candidateData.education),
                  relatedDataRepo.insertWorkExperience(existingCandidate.id, candidateData.workExperience),
                  relatedDataRepo.insertCertifications(existingCandidate.id, candidateData.certifications),
                  relatedDataRepo.insertLanguages(existingCandidate.id, candidateData.languages),
                  relatedDataRepo.insertVerification(existingCandidate.id, candidateData.verification),
                ]);

                return {
                  url,
                  success: true,
                  candidateId: existingCandidate.id,
                  results: {
                    skillsLinked: skillsToLink.length,
                    educationAdded: educationResult.status === "fulfilled" ? educationResult.value : 0,
                    workExperienceAdded: workExperienceResult.status === "fulfilled" ? workExperienceResult.value : 0,
                    certificationsAdded: certificationsResult.status === "fulfilled" ? certificationsResult.value : 0,
                    languagesIdentified: languagesResult.status === "fulfilled" ? languagesResult.value : 0,
                    verificationStatus: verificationResult.status === "fulfilled" ? "updated" : "failed",
                  },
                };
              } catch (error: any) {
                return { url, success: false, error: error.message };
              }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
          }

          // Calculate summary
          const successful = results.filter((r) => r.success);
          const failed = results.filter((r) => !r.success);

          sendSuccessResponse(res, {
            summary: {
              total: linkedinUrls.length,
              successful: successful.length,
              failed: failed.length,
            },
            results,
            metadata: {
              processedAt: new Date().toISOString(),
              processingTime: Date.now() - startTime,
              concurrencyLimit,
            },
          });
        } catch (error: any) {
          console.error(`❌ Error processing bulk LinkedIn URLs:`, error.message);
          sendErrorResponse(res, 500, error.message, {
            processingTime: Date.now() - startTime,
          });
        }
        return;
      }

      // 404 for unknown endpoints
      sendErrorResponse(res, 404, "Endpoint not found", {
        availableEndpoints: [
          "GET /health",
          "POST /api/linkedin/sync",
          "POST /api/linkedin/sync-bulk",
        ],
      });
    } catch (error: any) {
      console.error("❌ Unhandled server error:", error);
      sendErrorResponse(res, 500, "Internal server error", {
        processingTime: Date.now() - startTime,
      });
    } finally {
      // Log request details
      logRequest(req, res, startTime);
    }
  },
);

// Simple shutdown handling
process.on("SIGINT", () => {
  console.log("🛑 Shutting down...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 LinkedIn Parser Microservice started on port ${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
  console.log(`🔗 Single sync: POST http://localhost:${PORT}/api/linkedin/sync`);
  console.log(`📦 Bulk sync: POST http://localhost:${PORT}/api/linkedin/sync-bulk`);
});
