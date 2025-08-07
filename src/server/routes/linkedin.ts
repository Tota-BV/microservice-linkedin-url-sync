import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "@/lib/trpc/init";
import { rapidAPIClient } from "@/lib/rapidapi";
import { mapLinkedInToCandidate, validateCandidateData } from "@/lib/linkedin-mapper";
import { saveToCache, loadFromCache, isCacheFresh } from "@/lib/cache";
import { checkDatabaseSchema, insertLinkedInDataWithOrder } from "@/lib/database";
import { saveJsonToVolume, getVolumeInfo, listJsonFiles } from "@/lib/volume-storage";

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
  // Sync single LinkedIn URL (returns data for webapp to insert)
  sync: publicProcedure
    .input(singleUrlSchema)
    .mutation(async ({ input }) => {
      const { linkedinUrl } = input;
      
      try {
        console.log(`🔄 Processing single LinkedIn URL: ${linkedinUrl}`);
        
        // Check database schema compatibility
        const schemaCompatible = await checkDatabaseSchema();
        if (!schemaCompatible) {
          return {
            success: false,
            error: "Database schema not compatible",
            linkedinUrl,
            processedAt: new Date().toISOString(),
          };
        }
        
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

  // Sync and insert directly to database
  syncAndInsert: publicProcedure
    .input(singleUrlSchema)
    .mutation(async ({ input }) => {
      const { linkedinUrl } = input;
      
      try {
        console.log(`🔄 Processing and inserting LinkedIn URL: ${linkedinUrl}`);
        
        // Check database schema compatibility
        const schemaCompatible = await checkDatabaseSchema();
        if (!schemaCompatible) {
          return {
            success: false,
            error: "Database schema not compatible",
            linkedinUrl,
            processedAt: new Date().toISOString(),
          };
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
        
        // Fetch from RapidAPI if not cached
        if (!linkedinData) {
          console.log(`🌐 Fetching from RapidAPI: ${linkedinUrl}`);
          linkedinData = await rapidAPIClient.getProfileData(linkedinUrl);
          await saveToCache(linkedinUrl, linkedinData);
        }
        
        // Insert to database
        const result = await insertLinkedInDataWithOrder(linkedinUrl);
        
        return {
          success: result.success,
          source,
          candidateId: result.candidateId,
          skillsCreated: result.skillsCreated || 0,
          skillsLinked: result.skillsLinked || 0,
          error: result.error,
          metadata: {
            linkedinUrl,
            processedAt: new Date().toISOString(),
            totalPositions: linkedinData.position?.length || 0,
            totalSkills: linkedinData.skills?.length || 0,
          }
        };
        
      } catch (error: any) {
        console.error(`❌ Error processing and inserting ${linkedinUrl}:`, error.message);
        return {
          success: false,
          error: error.message,
          linkedinUrl,
          processedAt: new Date().toISOString(),
        };
      }
    }),

  // Sync multiple LinkedIn URLs (returns data for webapp to insert)
  syncBulk: publicProcedure
    .input(bulkUrlsSchema)
    .mutation(async ({ input }) => {
      const { linkedinUrls } = input;
      
      try {
        console.log(`🔄 Processing ${linkedinUrls.length} LinkedIn URLs`);
        
        // Check database schema compatibility
        const schemaCompatible = await checkDatabaseSchema();
        if (!schemaCompatible) {
          return {
            success: false,
            error: "Database schema not compatible",
            processedAt: new Date().toISOString(),
          };
        }
        
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

  // Sync with JSON backup and database insert
  syncWithBackup: publicProcedure
    .input(singleUrlSchema)
    .mutation(async ({ input }) => {
      const { linkedinUrl } = input;
      
      try {
        console.log(`🔄 Processing LinkedIn URL with backup: ${linkedinUrl}`);
        
        // Check database schema compatibility
        const schemaCompatible = await checkDatabaseSchema();
        if (!schemaCompatible) {
          return {
            success: false,
            error: "Database schema not compatible",
            linkedinUrl,
            processedAt: new Date().toISOString(),
          };
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
        
        // Fetch from RapidAPI if not cached
        if (!linkedinData) {
          console.log(`🌐 Fetching from RapidAPI: ${linkedinUrl}`);
          linkedinData = await rapidAPIClient.getProfileData(linkedinUrl);
          await saveToCache(linkedinUrl, linkedinData);
        }
        
        // Map to candidate format
        const candidateData = await mapLinkedInToCandidate(linkedinData, linkedinUrl);
        
        // STEP 1: Save JSON to volume (always do this first)
        let jsonFile = null;
        let jsonSaved = false;
        try {
          jsonFile = await saveJsonToVolume(candidateData, linkedinUrl);
          jsonSaved = true;
          console.log(`💾 JSON backup saved: ${jsonFile}`);
        } catch (jsonError) {
          console.error(`❌ Failed to save JSON backup:`, jsonError);
          // Continue with database insert even if JSON save fails
        }
        
        // STEP 2: Insert to database (skills first, then candidate)
        let dbResult = null;
        let databaseInserted = false;
        try {
          dbResult = await insertLinkedInDataWithOrder(linkedinUrl);
          databaseInserted = dbResult.success;
          console.log(`💾 Database insert result:`, dbResult);
        } catch (dbError) {
          console.error(`❌ Failed to insert to database:`, dbError);
          // JSON backup is still available as fallback
        }
        
        // Return comprehensive result
        return {
          success: jsonSaved || databaseInserted, // Success if either worked
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

  // Get volume info for debugging
  getVolumeInfo: publicProcedure
    .query(async () => {
      try {
        const volumeInfo = await getVolumeInfo();
        const jsonFiles = await listJsonFiles();
        
        return {
          success: true,
          volumeInfo,
          jsonFiles: jsonFiles.slice(0, 10), // Show first 10 files
          totalFiles: jsonFiles.length
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
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
