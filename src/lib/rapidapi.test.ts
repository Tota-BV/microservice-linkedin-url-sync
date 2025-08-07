import { rapidAPIClient } from './rapidapi';
import { mapLinkedInToCandidate, validateCandidateData } from './linkedin-mapper';
import { saveToCache, loadFromCache, isCacheFresh } from './cache';

async function testBulkRapidAPI() {
  const testUrls = [
    'https://www.linkedin.com/in/julian-klumpers-383a20145/',
    'https://www.linkedin.com/in/bas-rienstra/',
    'https://www.linkedin.com/in/juriaanblok/',
    'https://www.linkedin.com/in/julia-elich-0b8434b7/',
    'https://www.linkedin.com/in/parvin-m-ghasemi/',
    'https://www.linkedin.com/in/dante-borst-b1a88a1a0/',
    'https://www.linkedin.com/in/sjoerdsommen/',
    'https://www.linkedin.com/in/daan-enders-57859122a/',
    'https://www.linkedin.com/in/max-frinsel-7aa111114/',
    'https://www.linkedin.com/in/ricardopereirarodrigues/',
    'https://www.linkedin.com/in/amanda-schoonhoven-craftingpanda/',
    'https://www.linkedin.com/in/robbinhabermehl/',
    'https://www.linkedin.com/in/arnandsiem/',
    'https://www.linkedin.com/in/jane-de-kort-60a937208/',
    'https://www.linkedin.com/in/zac-clery-285897201/',
    'https://www.linkedin.com/in/fons-thijssen-5154911bb/',
    'https://www.linkedin.com/in/qamarnazir/',
    'https://www.linkedin.com/in/stijnlegtenberg/',
    'https://www.linkedin.com/in/ayman-berkane/'
  ];

  console.log('🧪 Testing bulk RapidAPI processing...');
  console.log(`📋 Processing ${testUrls.length} LinkedIn profiles`);
  
  try {
    // Process in batches of 5 with 1 second delay
    const results = await rapidAPIClient.getProfilesData(testUrls, 5, 1000);
    
    console.log('\n📊 Results Summary:');
    console.log(`✅ Successful: ${results.successful.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    // Show successful results
    if (results.successful.length > 0) {
      console.log('\n✅ Successful profiles:');
      results.successful.forEach((result, index) => {
        const candidateData = mapLinkedInToCandidate(result.data, result.url);
        console.log(`${index + 1}. ${candidateData.firstName} ${candidateData.lastName} - ${candidateData.generalJobTitle} at ${candidateData.currentCompany}`);
      });
    }
    
    // Show failed results
    if (results.failed.length > 0) {
      console.log('\n❌ Failed profiles:');
      results.failed.forEach((result, index) => {
        console.log(`${index + 1}. ${result.url} - ${result.error}`);
      });
    }
    
    // Save successful results to cache
    console.log('\n💾 Saving successful results to cache...');
    for (const result of results.successful) {
      await saveToCache(result.url, result.data);
    }
    
    console.log('\n🎉 Bulk processing completed!');
    
  } catch (error: any) {
    console.error('❌ Error in bulk processing:', error.message);
  }
}

testBulkRapidAPI().catch(console.error);
