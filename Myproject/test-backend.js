// Simple test script to verify backend is working
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE_URL = 'http://localhost:5000/api';

async function testBackend() {
  try {
    console.log('🧪 Testing backend API...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test jobs endpoint
    console.log('\n2. Testing jobs endpoint...');
    const jobsResponse = await fetch(`${API_BASE_URL}/companies`);
    const jobsData = await jobsResponse.json();
    console.log(`✅ Jobs endpoint: Found ${jobsData.length} jobs`);
    
    if (jobsData.length > 0) {
      console.log('Sample job:', {
        company: jobsData[0].company,
        jobTitle: jobsData[0].jobTitle,
        location: jobsData[0].location
      });
    }

    // Test search endpoint
    console.log('\n3. Testing search endpoint...');
    const searchResponse = await fetch(`${API_BASE_URL}/companies/search?q=software&limit=5`);
    const searchData = await searchResponse.json();
    console.log(`✅ Search endpoint: Found ${searchData.jobs?.length || 0} jobs`);

    console.log('\n🎉 Backend is working correctly!');
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. MongoDB is running');
    console.log('2. Backend server is running (npm run dev)');
    console.log('3. Database is seeded (npm run seed)');
  }
}

testBackend();
