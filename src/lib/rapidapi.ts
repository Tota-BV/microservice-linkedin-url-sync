import axios from 'axios';
import { env } from './env.server';

// RapidAPI client for Professional Network Data
export class RapidAPIClient {
  private baseURL = 'https://professional-network-data.p.rapidapi.com';
  private headers = {
    'x-rapidapi-key': env.RAPIDAPI_KEY,
    'x-rapidapi-host': env.RAPIDAPI_HOST,
  };

  // Get LinkedIn profile data by URL
  async getProfileData(linkedinUrl: string): Promise<any> {
    try {
      console.log(`🌐 Fetching profile data for: ${linkedinUrl}`);
      
      const response = await axios.get(`${this.baseURL}/get-profile-data-by-url`, {
        headers: this.headers,
        params: {
          url: linkedinUrl
        },
        timeout: 30000, // 30 second timeout
      });

      console.log(`✅ Successfully fetched data for: ${linkedinUrl}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error fetching profile data for ${linkedinUrl}:`, error.message);
      
      if (error.response) {
        // API error response
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 429) {
          throw new Error(`Rate limit exceeded for ${linkedinUrl}. Please try again later.`);
        } else if (status === 404) {
          throw new Error(`Profile not found: ${linkedinUrl}`);
        } else if (status === 403) {
          throw new Error(`Access denied for ${linkedinUrl}. Profile might be private.`);
        } else {
          throw new Error(`API error (${status}): ${data?.message || 'Unknown error'}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error(`Request timeout for ${linkedinUrl}`);
      } else {
        throw new Error(`Network error for ${linkedinUrl}: ${error.message}`);
      }
    }
  }

  // Process multiple LinkedIn URLs with rate limiting
  async getProfilesData(linkedinUrls: string[], batchSize: number = 5, delayMs: number = 1000): Promise<{
    successful: Array<{ url: string; data: any }>;
    failed: Array<{ url: string; error: string }>;
  }> {
    const successful: Array<{ url: string; data: any }> = [];
    const failed: Array<{ url: string; error: string }> = [];

    console.log(`🚀 Processing ${linkedinUrls.length} LinkedIn URLs in batches of ${batchSize}`);

    // Process URLs in batches
    for (let i = 0; i < linkedinUrls.length; i += batchSize) {
      const batch = linkedinUrls.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(linkedinUrls.length / batchSize)}`);

      // Process batch in parallel
      const batchPromises = batch.map(async (url) => {
        try {
          const data = await this.getProfileData(url);
          return { url, data, success: true };
        } catch (error: any) {
          return { url, error: error.message, success: false };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      // Process results
      batchResults.forEach(result => {
        if (result.success) {
          successful.push({ url: result.url, data: result.data });
        } else {
          failed.push({ url: result.url, error: result.error });
        }
      });

      // Add delay between batches (except for the last batch)
      if (i + batchSize < linkedinUrls.length) {
        console.log(`⏳ Waiting ${delayMs}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log(`✅ Processing complete: ${successful.length} successful, ${failed.length} failed`);
    return { successful, failed };
  }
}

// Export singleton instance
export const rapidAPIClient = new RapidAPIClient();
