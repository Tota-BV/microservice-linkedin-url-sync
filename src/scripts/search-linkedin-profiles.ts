import { rapidAPIClient } from "../lib/rapidapi";
import { writeFileSync } from "fs";
import { join } from "path";

// Job titles to search for
const JOB_TITLES = [
  "frontend developer",
  "backend developer", 
  "machine learning engineer",
  "data scientist",
  "python developer"
];

// Keywords to enhance search - using "max" as in your Python example
const KEYWORDS = "max";

// Target total URLs
const TARGET_URLS = 250;

// Rate limiting: 5 requests per minute (as per your rate limiter)
const REQUESTS_PER_MINUTE = 5;
const DELAY_BETWEEN_REQUESTS = 60000 / REQUESTS_PER_MINUTE; // 12 seconds

interface SearchResult {
  jobTitle: string;
  start: number;
  totalResults: number;
  profiles: Array<{
    linkedinUrl: string;
    name: string;
    title: string;
    company: string;
  }>;
}

async function searchJobTitle(jobTitle: string, start: number = 0): Promise<SearchResult> {
  try {
    console.log(`🔍 Searching for: ${jobTitle} (start: ${start})`);
    
    const response = await rapidAPIClient.searchPeople(jobTitle, KEYWORDS, start);
    
    // Debug: Log the raw response structure
    console.log(`🔍 Raw API response structure:`, JSON.stringify(response, null, 2));
    
    // Check if response has data property and items
    if (!response.data || !response.data.items) {
      console.log(`⚠️ No 'items' in response.data. Response structure:`, {
        success: response.success,
        message: response.message,
        total: response.data?.total,
        hasItems: !!response.data?.items
      });
      
      // The API returns items: null, which means we need to adjust parameters
      // Let's try with different search parameters
      return {
        jobTitle,
        start,
        totalResults: response.data?.total || 0,
        profiles: []
      };
    }
    
    // Extract profiles from response.data.items
    const profiles = response.data.items.map((profile: any) => ({
      linkedinUrl: profile.profileURL || profile.linkedin_url || profile.linkedinUrl || profile.url,
      name: profile.fullName || profile.name || profile.full_name || "Unknown",
      title: profile.headline || profile.title || profile.job_title || profile.jobTitle || "Unknown",
      company: profile.company || profile.current_company || profile.currentCompany || "Unknown"
    })).filter((profile: any) => profile.linkedinUrl); // Only include profiles with LinkedIn URLs
    
    console.log(`✅ Found ${profiles.length} profiles for ${jobTitle}`);
    
    return {
      jobTitle,
      start,
      totalResults: response.total_results || response.totalResults || profiles.length,
      profiles
    };
    
  } catch (error: any) {
    console.error(`❌ Error searching for ${jobTitle}:`, error.message);
    return {
      jobTitle,
      start,
      totalResults: 0,
      profiles: []
    };
  }
}

async function collectLinkedInUrls(): Promise<string[]> {
  const allUrls = new Set<string>();
  let currentStart = 0;
  
  console.log(`🚀 Starting LinkedIn profile search for ${JOB_TITLES.length} job titles`);
  console.log(`🎯 Target: ${TARGET_URLS} unique LinkedIn URLs`);
  console.log(`⏱️ Rate limit: ${REQUESTS_PER_MINUTE} requests per minute`);
  
  // Search through each job title
  for (const jobTitle of JOB_TITLES) {
    console.log(`\n📋 Searching for: ${jobTitle}`);
    
    let jobTitleStart = 0;
    let jobTitleUrls = 0;
    
    // Keep searching until we have enough URLs or hit API limits
    while (allUrls.size < TARGET_URLS && jobTitleUrls < 50) { // Max 50 per job title to distribute evenly
      try {
        const result = await searchJobTitle(jobTitle, jobTitleStart);
        
        if (result.profiles.length === 0) {
          console.log(`⚠️ No more profiles found for ${jobTitle} at start ${jobTitleStart}`);
          break;
        }
        
        // Add new URLs to our collection
        const newUrls = result.profiles
          .map(profile => profile.linkedinUrl)
          .filter(url => url && !allUrls.has(url));
        
        newUrls.forEach(url => allUrls.add(url));
        jobTitleUrls += newUrls.length;
        
        console.log(`📊 ${jobTitle}: Found ${newUrls.length} new URLs (total: ${allUrls.size}/${TARGET_URLS})`);
        
        // Move to next page
        jobTitleStart += result.profiles.length;
        
        // Rate limiting delay
        if (allUrls.size < TARGET_URLS) {
          console.log(`⏳ Waiting ${DELAY_BETWEEN_REQUESTS}ms for rate limiting...`);
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
        }
        
      } catch (error: any) {
        console.error(`❌ Error in search loop for ${jobTitle}:`, error.message);
        break;
      }
    }
    
    console.log(`✅ Completed ${jobTitle}: ${jobTitleUrls} URLs collected`);
  }
  
  return Array.from(allUrls);
}

async function main() {
  try {
    console.log("🚀 LinkedIn Profile Search Script");
    console.log("================================\n");
    
    // Collect LinkedIn URLs
    const linkedinUrls = await collectLinkedInUrls();
    
    console.log(`\n🎉 Search completed!`);
    console.log(`📊 Total unique LinkedIn URLs found: ${linkedinUrls.length}`);
    
    if (linkedinUrls.length > 0) {
      // Save URLs to text file
      const outputPath = join(process.cwd(), "linkedin_urls.txt");
      const urlsText = linkedinUrls.join("\n");
      
      writeFileSync(outputPath, urlsText, "utf8");
      console.log(`💾 URLs saved to: ${outputPath}`);
      
      // Display first 10 URLs as preview
      console.log(`\n📋 Preview of first 10 URLs:`);
      linkedinUrls.slice(0, 10).forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
      
      if (linkedinUrls.length > 10) {
        console.log(`... and ${linkedinUrls.length - 10} more URLs`);
      }
    } else {
      console.log("⚠️ No LinkedIn URLs found. Check your API key and search parameters.");
    }
    
  } catch (error: any) {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
