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

      // New endpoint: Find candidates by first name
      if (req.url?.startsWith("/api/candidates/search?")) {
        try {
          const urlObj = new URL(req.url, `http://localhost:3000`);
          const firstName = urlObj.searchParams.get("firstName");
          
          if (!firstName) {
            sendErrorResponse(res, 400, "firstName parameter is required");
            return;
          }

          console.log(`🔍 Searching for candidates with first name: ${firstName}`);
          
          // Import database function
          const { pool } = await import("./lib/database");
          
          // Simple query: Basic candidate info with skills count
          const simpleQuery = `
            SELECT 
              c.id,
              c.first_name,
              c.last_name,
              c.email,
              c.linkedin_url,
              c.profile_image_url,
              c.bio,
              c.general_job_title,
              c.current_company,
              c.working_location,
              c.category,
              c.created_at,
              c.updated_at,
              COUNT(cs.skill_id) as skills_count
              
            FROM candidates c
            LEFT JOIN candidates_skills cs ON c.id = cs.candidate_id
            WHERE LOWER(c.first_name) = LOWER($1)
            GROUP BY c.id, c.first_name, c.last_name, c.email, c.linkedin_url, 
                     c.profile_image_url, c.bio, c.general_job_title, c.current_company, 
                     c.working_location, c.category, c.created_at, c.updated_at
            ORDER BY c.created_at DESC
          `;
          
          const result = await pool.query(simpleQuery, [firstName]);

          if (result.rows.length === 0) {
            sendErrorResponse(res, 404, "No candidates found", { firstName });
            return;
          }

          // Process the results to clean up the JSON arrays
          const processedCandidates = result.rows.map(candidate => ({
            ...candidate,
            skills_count: parseInt(candidate.skills_count) || 0
          }));

          sendSuccessResponse(res, {
            candidates: processedCandidates,
            count: processedCandidates.length,
            searchTerm: firstName,
            summary: {
              totalSkills: processedCandidates.reduce((sum, c) => sum + c.skills_count, 0),
              totalCandidates: processedCandidates.length
            }
          });

        } catch (error) {
          console.error("❌ Error searching candidates:", error);
          sendErrorResponse(res, 500, "Search failed", error);
        }
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

          // Update basic candidate fields with LinkedIn data (EXCEPT name, surname, email)
          console.log(`🔄 [SERVICE] Updating basic candidate fields with LinkedIn data...`);
          const { updateCandidate } = await import("./lib/database");
          
          const updateResult = await updateCandidate(existingCandidate.id, {
            // firstName: candidateData.firstName || existingCandidate.firstName,        // ❌ DO NOT UPDATE
            // lastName: candidateData.lastName || existingCandidate.lastName,          // ❌ DO NOT UPDATE
            // email: candidateData.email || existingCandidate.email,                  // ❌ DO NOT UPDATE
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
          
          // Import streaming utilities
          const { StreamingBatchProcessor } = await import("./lib/streaming-response");
          const { rapidAPIRateLimiter } = await import("./lib/rate-limiter");
          const { LinkedInSyncError } = await import("./lib/errors");
          
          const batchProcessor = new StreamingBatchProcessor(res);
          batchProcessor.startBatch(linkedinUrls.length, {
            concurrencyLimit,
            processedAt: new Date().toISOString()
          });

          for (let i = 0; i < linkedinUrls.length; i += concurrencyLimit) {
            const batch = linkedinUrls.slice(i, i + concurrencyLimit);
            const batchPromises = batch.map(async (url) => {
              try {
                // Rate limiting toepassen
                await rapidAPIRateLimiter.waitIfNeeded();
                
                // Fetch data directly from RapidAPI
                let linkedinData: any;
                
                try {
                  linkedinData = await rapidAPIClient.getProfileData(url);
                } catch (apiError: any) {
                  const error = LinkedInSyncError.fromRapidAPI(
                    `Failed to fetch: ${apiError.message}`,
                    apiError.status,
                    { url }
                  );
                  return { url, success: false, error: error.message, errorType: error.type, recoverable: error.recoverable };
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

                // Update basic candidate fields with LinkedIn data (EXCEPT name, surname, email)
                console.log(`🔄 [SERVICE] Updating basic candidate fields for ${url}...`);
                const { updateCandidate } = await import("./lib/database");
                
                const updateResult = await updateCandidate(existingCandidate.id, {
                  // firstName: candidateData.firstName || existingCandidate.firstName,        // ❌ DO NOT UPDATE
                  // lastName: candidateData.lastName || existingCandidate.lastName,          // ❌ DO NOT UPDATE
                  // email: candidateData.email || existingCandidate.email,                  // ❌ DO NOT UPDATE
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

                const result = {
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
                
                return result;
              } catch (error: any) {
                const syncError = LinkedInSyncError.fromError(error, 'UNKNOWN', false, { url });
                const errorResult = { 
                  url, 
                  success: false, 
                  error: syncError.message, 
                  errorType: syncError.type, 
                  recoverable: syncError.recoverable 
                };
                
                return errorResult;
              }
            });

            const batchResults = await Promise.all(batchPromises);
            
            // Verwerk resultaten voor streaming
            batchResults.forEach(result => {
              batchProcessor.processResult(result);
            });
            
            // Check of response nog actief is (client kan disconnecten)
            if (!batchProcessor.isActive()) {
              console.log("⚠️ Client disconnected, stopping batch processing");
              return;
            }
          }

          // Eindig batch processing met streaming
          batchProcessor.endBatch();
        } catch (error: any) {
          console.error(`❌ Error processing bulk LinkedIn URLs:`, error.message);
          sendErrorResponse(res, 500, error.message, {
            processingTime: Date.now() - startTime,
          });
        }
        return;
      }

      // CV sync endpoint - single CV data
      if (req.url === "/api/cv/sync" && req.method === "POST") {
        try {
          const body = await parseRequestBody(req);
          const { cvData, linkedinUrl, pdfUrl, useTestFile } = JSON.parse(body);

          if (!linkedinUrl) {
            sendErrorResponse(res, 400, "linkedinUrl is required to match existing candidate");
            return;
          }

          if (!validateLinkedInUrl(linkedinUrl)) {
            sendErrorResponse(res, 400, "Invalid LinkedIn URL format", {
              expectedFormat: "https://linkedin.com/in/username",
              providedUrl: linkedinUrl,
            });
            return;
          }

          let processedCvData = cvData;

          // If useTestFile is true, use a random PDF from test_resumes directory
          if (useTestFile) {
            console.log(`🧪 Using test file from test_resumes directory`);
            const { readdirSync } = await import("fs");
            const { join } = await import("path");
            
            try {
              const testResumesDir = join(process.cwd(), "test_resumes");
              const files = readdirSync(testResumesDir).filter(file => file.endsWith('.pdf'));
              
              if (files.length === 0) {
                sendErrorResponse(res, 400, "No test PDF files found in test_resumes directory");
                return;
              }
              
              // Pick a random PDF file
              const randomFile = files[Math.floor(Math.random() * files.length)];
              const testPdfPath = join(testResumesDir, randomFile);
              
              console.log(`📄 Using test file: ${randomFile}`);
              
              // Call your Railway Resume API with the local file
              try {
                const { readFileSync } = await import("fs");
                const pdfBuffer = readFileSync(testPdfPath);
                const pdfBase64 = pdfBuffer.toString('base64');
                
                console.log(`📡 Calling Resume API for file: ${randomFile}`);
                
                // Call the new Resume API endpoint
                const formData = new FormData();
                formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), randomFile);
                formData.append('filename', randomFile);
                
                const resumeApiResponse = await fetch('https://cvparser-production-450e.up.railway.app/parse-cv', {
                  method: 'POST',
                  headers: {
                    'User-Agent': 'LinkedIn-Microservice/1.0',
                    'Accept': 'application/json'
                  },
                  body: formData,
                  signal: AbortSignal.timeout(120000), // 2 minutes timeout
                  keepalive: true
                });
                
                if (!resumeApiResponse.ok) {
                  throw new Error(`Resume API error: ${resumeApiResponse.status} ${resumeApiResponse.statusText}`);
                }
                
                const parsedData = await resumeApiResponse.json();
                console.log(`✅ Resume API parsed data successfully for: ${randomFile}`);
                console.log(`📊 Resume API Response:`, JSON.stringify(parsedData, null, 2));
                
                // Validate API response structure
                if (!parsedData.success && !parsedData.result && !parsedData.personal_info) {
                  throw new Error(`Invalid API response structure: ${JSON.stringify(parsedData)}`);
                }
                
                // Map the Resume API response to our expected format
                // Handle both direct response and wrapped response formats
                const responseData = parsedData.result || parsedData;
                
                processedCvData = {
                  firstName: responseData?.personal_info?.first_name || responseData?.personal_info?.firstName || "Unknown",
                  lastName: responseData?.personal_info?.last_name || responseData?.personal_info?.lastName || "Unknown",
                  skills: Array.isArray(responseData?.skills) ? responseData.skills : [],
                  education: Array.isArray(responseData?.education) ? responseData.education : [],
                  workExperience: Array.isArray(responseData?.work_experience) ? responseData.workExperience : [],
                  certifications: Array.isArray(responseData?.certifications) ? responseData.certifications : [],
                  languages: Array.isArray(responseData?.languages) ? responseData.languages : [],
                  verification: Array.isArray(responseData?.verification) ? responseData.verification : [],
                  bio: responseData?.summary || responseData?.bio || "",
                  generalJobTitle: responseData?.personal_info?.job_title || responseData?.personal_info?.generalJobTitle || "",
                  currentCompany: responseData?.personal_info?.current_company || responseData?.personal_info?.currentCompany || "",
                  workingLocation: responseData?.personal_info?.location || responseData?.personal_info?.workingLocation || "",
                  category: responseData?.category || null,
                  dateOfBirth: responseData?.personal_info?.date_of_birth || responseData?.personal_info?.dateOfBirth || null,
                  profileImageUrl: responseData?.personal_info?.profile_image_url || responseData?.personal_info?.profileImageUrl || null
                };
                
                console.log(`🔄 Mapped CV Data:`, JSON.stringify(processedCvData, null, 2));
                
              } catch (apiError: any) {
                console.error(`❌ Resume API error:`, apiError);
                sendErrorResponse(res, 500, `Failed to parse PDF with Resume API: ${apiError.message || 'Unknown error'}`);
                return;
              }
              
            } catch (error) {
              console.error("❌ Error reading test resumes directory:", error);
              sendErrorResponse(res, 500, "Failed to read test resumes directory");
              return;
            }
          } else if (pdfUrl) {
            // Production: Process PDF from S3/blob storage URL
            console.log(`🔗 Processing PDF from URL: ${pdfUrl}`);
            
            try {
              console.log(`📡 Calling Resume API for URL: ${pdfUrl}`);
              
              // For URL-based processing, we need to fetch the PDF first
              const pdfResponse = await fetch(pdfUrl);
              if (!pdfResponse.ok) {
                throw new Error(`Failed to fetch PDF from URL: ${pdfResponse.status} ${pdfResponse.statusText}`);
              }
              const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
              
              const formData = new FormData();
              formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'remote_file.pdf');
              formData.append('filename', 'remote_file.pdf');
              
              const resumeApiResponse = await fetch('https://cvparser-production-450e.up.railway.app/parse-cv', {
                method: 'POST',
                headers: {
                  'User-Agent': 'LinkedIn-Microservice/1.0',
                  'Accept': 'application/json'
                },
                body: formData,
                signal: AbortSignal.timeout(120000), // 2 minutes timeout
                keepalive: true
              });
              
              if (!resumeApiResponse.ok) {
                throw new Error(`Resume API error: ${resumeApiResponse.status} ${resumeApiResponse.statusText}`);
              }
              
              const parsedData = await resumeApiResponse.json();
              console.log(`✅ Resume API parsed data successfully for URL: ${pdfUrl}`);
              
              // Map the Resume API response to our expected format
              // Handle both direct response and wrapped response formats
              const responseData = parsedData.result || parsedData;
              
              processedCvData = {
                firstName: responseData?.personal_info?.first_name || responseData?.personal_info?.firstName || "Unknown",
                lastName: responseData?.personal_info?.last_name || responseData?.personal_info?.lastName || "Unknown",
                skills: Array.isArray(responseData?.skills) ? responseData.skills : [],
                education: Array.isArray(responseData?.education) ? responseData.education : [],
                workExperience: Array.isArray(responseData?.work_experience) ? responseData.workExperience : [],
                certifications: Array.isArray(responseData?.certifications) ? responseData.certifications : [],
                languages: Array.isArray(responseData?.languages) ? responseData.languages : [],
                verification: Array.isArray(responseData?.verification) ? responseData.verification : [],
                bio: responseData?.summary || responseData?.bio || "",
                generalJobTitle: responseData?.personal_info?.job_title || responseData?.personal_info?.generalJobTitle || "",
                currentCompany: responseData?.personal_info?.current_company || responseData?.personal_info?.currentCompany || "",
                workingLocation: responseData?.personal_info?.location || responseData?.personal_info?.workingLocation || "",
                category: responseData?.category || null,
                dateOfBirth: responseData?.personal_info?.date_of_birth || responseData?.personal_info?.dateOfBirth || null,
                profileImageUrl: responseData?.personal_info?.profile_image_url || responseData?.personal_info?.profileImageUrl || null
              };
              
            } catch (apiError: any) {
              console.error(`❌ Resume API error:`, apiError);
              sendErrorResponse(res, 500, `Failed to parse PDF with Resume API: ${apiError.message || 'Unknown error'}`);
              return;
            }
          } else if (!cvData) {
            sendErrorResponse(res, 400, "Either cvData, pdfUrl, or useTestFile must be provided");
            return;
          }

          if (!validateLinkedInUrl(linkedinUrl)) {
            sendErrorResponse(res, 400, "Invalid LinkedIn URL format", {
              expectedFormat: "https://linkedin.com/in/username",
              providedUrl: linkedinUrl,
            });
            return;
          }

          console.log(`🔄 Processing CV data for LinkedIn URL: ${linkedinUrl}`);

          // Find existing candidate
          const existingCandidate = await findCandidateByLinkedInUrl(linkedinUrl);

          if (!existingCandidate) {
            sendErrorResponse(res, 404, "Candidate not found", {
              message: "The microservice can only enrich existing profiles. Please create the basic candidate profile in the main application first.",
              linkedinUrl,
              enrichmentData: {
                skills: processedCvData.skills,
                education: processedCvData.education,
                certifications: processedCvData.certifications,
                languages: processedCvData.languages,
                verification: processedCvData.verification,
              },
            });
            return;
          }

          // Update basic candidate fields with CV data (EXCEPT name, surname, email)
          console.log(`🔄 [SERVICE] Updating basic candidate fields with CV data...`);
          const { updateCandidate } = await import("./lib/database");
          
          const updateResult = await updateCandidate(existingCandidate.id, {
            // firstName: processedCvData.firstName || existingCandidate.firstName,        // ❌ DO NOT UPDATE
            // lastName: processedCvData.lastName || existingCandidate.lastName,          // ❌ DO NOT UPDATE
            // email: processedCvData.email || existingCandidate.email,                  // ❌ DO NOT UPDATE
            bio: processedCvData.bio || existingCandidate.bio,
            generalJobTitle: processedCvData.generalJobTitle || existingCandidate.generalJobTitle,
            currentCompany: processedCvData.currentCompany || existingCandidate.currentCompany,
            profileImageUrl: processedCvData.profileImageUrl || existingCandidate.profileImageUrl,
            category: processedCvData.category || existingCandidate.category,
            dateOfBirth: processedCvData.dateOfBirth || existingCandidate.dateOfBirth,
            workingLocation: processedCvData.workingLocation || existingCandidate.workingLocation,
            updatedAt: new Date()
          });

          if (!updateResult.success) {
            console.warn(`⚠️ [SERVICE] Failed to update basic candidate fields:`, updateResult.error);
          } else {
            console.log(`✅ [SERVICE] Basic candidate fields updated successfully`);
          }

          // Process skills and link them to candidate
          console.log(`🔄 [SKILLS] Processing skills for candidate...`);
          const { SkillsRepository } = await import("./lib/repositories/skills-repository");
          const { SkillsCandidateRepository } = await import("./lib/repositories/skills-candidate-repository");
          const skillsRepo = new SkillsRepository();
          const skillsCandidateRepo = new SkillsCandidateRepository();
          
          // Map CV skills to the format expected by processSkillsForDatabase
          const skillsToProcess = (processedCvData.skills || []).map((skill: any) => ({
            skillName: skill.name || skill, // Handle both object and string formats
            endorsementsCount: skill.endorsementsCount || 0,
            isCore: skill.passedSkillAssessment || false,
          }));
          
          console.log(`📊 Skills to process:`, JSON.stringify(skillsToProcess, null, 2));
          
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
          console.log(`🔄 [RELATED DATA] Inserting related data for candidate...`);
          const { RelatedDataRepository } = await import("./lib/repositories/related-data-repository");
          const relatedDataRepo = new RelatedDataRepository();

          // Debug: Log the data being passed to repositories
          console.log(`🔍 [SERVICE] Data being passed to repositories:`);
          console.log(`  - Education: ${processedCvData.education?.length || 0} records`);
          console.log(`  - Verification: ${processedCvData.verification?.length || 0} records`);
          console.log(`  - Languages: ${processedCvData.languages?.length || 0} records`);
          console.log(`  - Certifications: ${processedCvData.certifications?.length || 0} records`);

          const [
            educationResult,
            workExperienceResult,
            certificationsResult,
            languagesResult,
            verificationResult,
          ] = await Promise.allSettled([
            relatedDataRepo.insertEducation(existingCandidate.id, processedCvData.education),
            relatedDataRepo.insertWorkExperience(existingCandidate.id, processedCvData.workExperience),
            relatedDataRepo.insertCertifications(existingCandidate.id, processedCvData.certifications),
            relatedDataRepo.insertLanguages(existingCandidate.id, processedCvData.languages),
            relatedDataRepo.insertVerification(existingCandidate.id, processedCvData.verification),
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
            source: "cv-parser",
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
          console.error(`❌ Error processing CV data:`, error.message);
          sendErrorResponse(res, 500, error.message, {
            linkedinUrl: req.url || "unknown",
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
          "POST /api/cv/sync",
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
  console.log(`📄 CV sync: POST http://localhost:${PORT}/api/cv/sync`);
});
