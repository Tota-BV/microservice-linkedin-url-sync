import { 
  extractUsernameFromUrl, 
  saveToCache, 
  loadFromCache, 
  isCacheFresh,
  getCacheInfo 
} from './cache';

// Test the cache system
async function testCache() {
  const testProfiles = [
    'https://www.linkedin.com/in/ruben-timmermans-a79724aa/',
    'https://www.linkedin.com/in/raynoldsiem/',
    'https://www.linkedin.com/in/julian-de-vos-64b1aa1aa/'
  ];

  console.log('🧪 Testing cache system with real LinkedIn profiles...');
  
  for (const profileUrl of testProfiles) {
    console.log(`\n📋 Testing profile: ${profileUrl}`);
    
    // Test username extraction
    const username = extractUsernameFromUrl(profileUrl);
    console.log(`📝 Extracted username: ${username}`);
    
    // Test cache info
    const cacheInfo = await getCacheInfo(profileUrl);
    console.log('📊 Cache info:', cacheInfo);
    
    // Test cache freshness
    const isFresh = await isCacheFresh(profileUrl);
    console.log(`🔍 Cache is fresh: ${isFresh}`);
    
    console.log('─'.repeat(50));
  }
  
  console.log('\n✅ Cache test completed for all profiles!');
}

// Run the test
testCache().catch(console.error);
