import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "@/lib/trpc/init";
import { rapidAPIClient } from "@/lib/rapidapi";
import { mapLinkedInToCandidate, validateCandidateData } from "@/lib/linkedin-mapper";
import { saveToCache, loadFromCache, isCacheFresh } from "@/lib/cache";
import { syncLinkedInToDatabase } from "@/lib/database";

// Input schemas
const singleUrlSchema = z.object({
  linkedinUrl: z.string().url().refine(
    (url) => url.includes("linkedin.com"),
    "URL must be a valid LinkedIn profile"
  ),
});

const bulkUrlsSchema = z.object({
  linkedinUrls: z.array(z.string().url().refine(
    (url) => url.includes("linkedin.com"),
    "URL must be a valid LinkedIn profile"
  )).min(1, "At least one LinkedIn URL is required"),
});

export const linkedInRouter = createTRPCRouter({
  // Sync single LinkedIn URL (returns data only)
  sync: publicProcedure
    .input(singleUrlSchema)
    .mutation(async ({ input }) => {
      const { linkedinUrl } = input;
      
      try {
        console.log(`🔄 Processing single LinkedIn URL: ${linkedinUrl}`);
        
        // Check cache first
        const isFresh = await isCacheFresh(linkedinUrl);
        if (isFresh) {
          console.log(`📋 Loading from cache: ${linkedinUrl}`);
          const cachedData = await loadFromCache(linkedinUrl);
          if (cachedData) {
            const candidateData = await mapLinkedInToCandidate(cachedData, linkedinUrl);
            const validation = validateCandidateData(candidateData.candidateProfile);
            
            return {
              success: true,
              source: "cache",
              databaseOperations: candidateData.databaseOperations,
              candidateProfile: candidateData.candidateProfile,
              validation,
              metadata: {
                linkedinUrl,
                processedAt: new Date().toISOString(),
                totalPositions: cachedData.position?.length || 0,
                totalSkills: cachedData.skills?.length || 0,
              }
            };
          }
        }
        
        // Fetch from RapidAPI
        console.log(`🌐 Fetching from RapidAPI: ${linkedinUrl}`);
        const linkedinData = await rapidAPIClient.getProfileData(linkedinUrl);
        
        // Save to cache
        await saveToCache(linkedinUrl, linkedinData);
        
        // Map to candidate format
        const candidateData = await mapLinkedInToCandidate(linkedinData, linkedinUrl);
        const validation = validateCandidateData(candidateData.candidateProfile);
        
        return {
          success: true,
          source: "api",
          databaseOperations: candidateData.databaseOperations,
          candidateProfile: candidateData.candidateProfile,
          validation,
          metadata: {
            linkedinUrl,
            processedAt: new Date().toISOString(),
            totalPositions: linkedinData.position?.length || 0,
            totalSkills: linkedinData.skills?.length || 0,
          }
        };
        
      } catch (error: any) {
        console.error(`❌ Error processing ${linkedinUrl}:`, error.message);
        return {
          success: false,
          error: error.message,
          linkedinUrl,
          processedAt: new Date().toISOString(),
        };
      }
    }),

  // Sync single LinkedIn URL and save to database
  syncAndSave: publicProcedure
    .input(singleUrlSchema)
    .mutation(async ({ input }) => {
      const { linkedinUrl } = input;
      
      try {
        console.log(`🔄 Processing and saving LinkedIn URL: ${linkedinUrl}`);
        
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
        
        // Fetch from RapidAPI if not cached
        if (!linkedinData) {
          console.log(`🌐 Fetching from RapidAPI: ${linkedinUrl}`);
          linkedinData = await rapidAPIClient.getProfileData(linkedinUrl);
          await saveToCache(linkedinUrl, linkedinData);
        }
        
        // Sync to database
        const result = await syncLinkedInToDatabase(linkedinData, linkedinUrl);
        
        return {
          success: result.success,
          source,
          candidateId: result.candidateId,
          skillsCreated: result.skillsCreated,
          skillsLinked: result.skillsLinked,
          error: result.error,
          metadata: {
            linkedinUrl,
            processedAt: new Date().toISOString(),
            totalPositions: linkedinData.position?.length || 0,
            totalSkills: linkedinData.skills?.length || 0,
          }
        };
        
      } catch (error: any) {
        console.error(`❌ Error processing and saving ${linkedinUrl}:`, error.message);
        return {
          success: false,
          error: error.message,
          linkedinUrl,
          processedAt: new Date().toISOString(),
        };
      }
    }),

  // Sync multiple LinkedIn URLs
  syncBulk: publicProcedure
    .input(bulkUrlsSchema)
    .mutation(async ({ input }) => {
      const { linkedinUrls } = input;
      
      try {
        console.log(`🔄 Processing ${linkedinUrls.length} LinkedIn URLs`);
        
        const results = {
          successful: [] as any[],
          failed: [] as any[],
          summary: {
            total: linkedinUrls.length,
            successful: 0,
            failed: 0,
            fromCache: 0,
            fromApi: 0,
          }
        };
        
        // Process URLs in parallel with batching
        const apiResults = await rapidAPIClient.getProfilesData(linkedinUrls, 5, 1000);
        
        // Process successful results
        for (const result of apiResults.successful) {
          try {
            const candidateData = await mapLinkedInToCandidate(result.data, result.url);
            const validation = validateCandidateData(candidateData.candidateProfile);
            
            results.successful.push({
              linkedinUrl: result.url,
              databaseOperations: candidateData.databaseOperations,
              candidateProfile: candidateData.candidateProfile,
              validation,
              metadata: {
                processedAt: new Date().toISOString(),
                totalPositions: result.data.position?.length || 0,
                totalSkills: result.data.skills?.length || 0,
              }
            });
            
            results.summary.successful++;
            results.summary.fromApi++;
            
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
        
        return {
          success: true,
          results,
          summary: results.summary,
          processedAt: new Date().toISOString(),
        };
        
      } catch (error: any) {
        console.error(`❌ Error in bulk processing:`, error.message);
        return {
          success: false,
          error: error.message,
          processedAt: new Date().toISOString(),
        };
      }
    }),

  // Sync multiple LinkedIn URLs and save to database
  syncBulkAndSave: publicProcedure
    .input(bulkUrlsSchema)
    .mutation(async ({ input }) => {
      const { linkedinUrls } = input;
      
      try {
        console.log(`🔄 Processing and saving ${linkedinUrls.length} LinkedIn URLs`);
        
        const results = {
          successful: [] as any[],
          failed: [] as any[],
          summary: {
            total: linkedinUrls.length,
            successful: 0,
            failed: 0,
            fromCache: 0,
            fromApi: 0,
            totalSkillsCreated: 0,
            totalSkillsLinked: 0,
          }
        };
        
        // Process URLs sequentially to avoid overwhelming the database
        for (const linkedinUrl of linkedinUrls) {
          try {
            console.log(`🔄 Processing: ${linkedinUrl}`);
            
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
            
            // Fetch from RapidAPI if not cached
            if (!linkedinData) {
              console.log(`🌐 Fetching from RapidAPI: ${linkedinUrl}`);
              linkedinData = await rapidAPIClient.getProfileData(linkedinUrl);
              await saveToCache(linkedinUrl, linkedinData);
            }
            
            // Sync to database
            const result = await syncLinkedInToDatabase(linkedinData, linkedinUrl);
            
            if (result.success) {
              results.successful.push({
                linkedinUrl,
                candidateId: result.candidateId,
                skillsCreated: result.skillsCreated,
                skillsLinked: result.skillsLinked,
                source,
                metadata: {
                  processedAt: new Date().toISOString(),
                  totalPositions: linkedinData.position?.length || 0,
                  totalSkills: linkedinData.skills?.length || 0,
                }
              });
              
              results.summary.successful++;
              results.summary.totalSkillsCreated += result.skillsCreated || 0;
              results.summary.totalSkillsLinked += result.skillsLinked || 0;
              
              if (source === "cache") {
                results.summary.fromCache++;
              } else {
                results.summary.fromApi++;
              }
            } else {
              results.failed.push({
                linkedinUrl,
                error: result.error,
              });
              results.summary.failed++;
            }
            
          } catch (error: any) {
            console.error(`❌ Error processing ${linkedinUrl}:`, error.message);
            results.failed.push({
              linkedinUrl,
              error: error.message,
            });
            results.summary.failed++;
          }
        }
        
        console.log(`✅ Bulk processing complete: ${results.summary.successful} successful, ${results.summary.failed} failed`);
        
        return {
          success: true,
          results,
          summary: results.summary,
          processedAt: new Date().toISOString(),
        };
        
      } catch (error: any) {
        console.error(`❌ Error in bulk processing:`, error.message);
        return {
          success: false,
          error: error.message,
          processedAt: new Date().toISOString(),
        };
      }
    }),

  // Get cache info for debugging
  getCacheInfo: publicProcedure
    .input(singleUrlSchema)
    .query(async ({ input }) => {
      const { linkedinUrl } = input;
      
      try {
        const isFresh = await isCacheFresh(linkedinUrl);
        const cachedData = await loadFromCache(linkedinUrl);
        
        return {
          success: true,
          linkedinUrl,
          cacheExists: !!cachedData,
          isFresh,
          data: cachedData ? await mapLinkedInToCandidate(cachedData, linkedinUrl) : null,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          linkedinUrl,
        };
      }
    }),

  // Health check
  health: publicProcedure
    .query(async () => {
      return {
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        features: {
          caching: true,
          rapidApi: true,
          bulkProcessing: true,
          dataMapping: true,
        }
      };
    }),
});
