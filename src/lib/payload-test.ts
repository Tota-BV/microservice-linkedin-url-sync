import { rapidAPIClient } from './rapidapi';
import { mapLinkedInToCandidate, validateCandidateData } from './linkedin-mapper';
import { saveToCache, loadFromCache } from './cache';

async function showPayloads() {
  const testUrl = 'https://www.linkedin.com/in/arnandsiem/';
  
  console.log('🔍 Showing payloads for:', testUrl);
  console.log('='.repeat(80));
  
  try {
    // Get raw data from RapidAPI
    console.log('📡 3RD PARTY API PAYLOAD (RapidAPI):');
    console.log('─'.repeat(50));
    const rawLinkedInData = await rapidAPIClient.getProfileData(testUrl);
    console.log(JSON.stringify(rawLinkedInData, null, 2));
    
    console.log('\n' + '='.repeat(80));
    
    // Show final mapped payload
    console.log('🎯 FINAL PAYLOAD (Mapped to your database schema):');
    console.log('─'.repeat(50));
    const finalPayload = mapLinkedInToCandidate(rawLinkedInData, testUrl);
    console.log(JSON.stringify(finalPayload, null, 2));
    
    console.log('\n' + '='.repeat(80));
    
    // Show validation
    console.log('✅ VALIDATION RESULT:');
    console.log('─'.repeat(50));
    const validation = validateCandidateData(finalPayload);
    console.log(JSON.stringify(validation, null, 2));
    
    console.log('\n' + '='.repeat(80));
    
    // Show what gets saved to cache
    console.log('💾 CACHE PAYLOAD (What gets saved to JSON file):');
    console.log('─'.repeat(50));
    const cachePayload = {
      metadata: {
        linkedinUrl: testUrl,
        username: 'arnandsiem',
        scrapedAt: new Date().toISOString(),
        cacheExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      profileData: rawLinkedInData
    };
    console.log(JSON.stringify(cachePayload, null, 2));
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

showPayloads().catch(console.error);
