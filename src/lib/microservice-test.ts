import { rapidAPIClient } from './rapidapi';
import { mapLinkedInToCandidate, validateCandidateData } from './linkedin-mapper';
import { saveToCache, loadFromCache, isCacheFresh } from './cache';

// Test the new microservice endpoints
async function testMicroservice() {
  const testUrl = 'https://www.linkedin.com/in/arnandsiem/';
  const testUrls = [
    'https://www.linkedin.com/in/arnandsiem/',
    'https://www.linkedin.com/in/julian-klumpers-383a20145/',
    'https://www.linkedin.com/in/bas-rienstra/'
  ];

  console.log('🧪 Testing LinkedIn Microservice...');
  console.log('='.repeat(60));

  // Test single URL sync
  console.log('📋 Testing single URL sync...');
  try {
    // Check cache first
    const isFresh = await isCacheFresh(testUrl);
    if (isFresh) {
      const cachedData = await loadFromCache(testUrl);
      if (cachedData) {
        const candidateData = mapLinkedInToCandidate(cachedData, testUrl);
        const validation = validateCandidateData(candidateData);
        
        console.log('✅ Single URL (from cache):', {
          success: true,
          source: "cache",
          data: candidateData,
          validation,
        });
      }
    } else {
      // Fetch from API
      const linkedinData = await rapidAPIClient.getProfileData(testUrl);
      await saveToCache(testUrl, linkedinData);
      
      const candidateData = mapLinkedInToCandidate(linkedinData, testUrl);
      const validation = validateCandidateData(candidateData);
      
      console.log('✅ Single URL (from API):', {
        success: true,
        source: "api",
        data: candidateData,
        validation,
      });
    }
  } catch (error: any) {
    console.log('❌ Single URL error:', {
      success: false,
      error: error.message,
    });
  }

  console.log('\n' + '='.repeat(60));

  // Test bulk URL sync
  console.log('📋 Testing bulk URL sync...');
  try {
    const apiResults = await rapidAPIClient.getProfilesData(testUrls, 3, 1000);
    
    const results = {
      successful: [] as any[],
      failed: [] as any[],
      summary: {
        total: testUrls.length,
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

    console.log('✅ Bulk sync results:', {
      success: true,
      results,
      summary: results.summary,
    });

  } catch (error: any) {
    console.log('❌ Bulk sync error:', {
      success: false,
      error: error.message,
    });
  }

  console.log('\n🎉 Microservice test completed!');
}

testMicroservice().catch(console.error);
