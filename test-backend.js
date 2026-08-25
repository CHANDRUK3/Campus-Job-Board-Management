// Simple test script to verify backend is working
const API_BASE_URL = 'http://localhost:5000/api';

async function testBackend() {
  try {
    console.log('🧪 Testing backend API...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test drives endpoint
    console.log('\n2. Testing drives endpoint...');
    const drivesResponse = await fetch(`${API_BASE_URL}/drives`);
    const drivesData = await drivesResponse.json();
    console.log(`✅ Drives endpoint: Found ${drivesData.length} drives`);

    if (drivesData.length > 0) {
      console.log('Sample drive:', {
        company: drivesData[0].company,
        jobTitle: drivesData[0].jobTitle,
        location: drivesData[0].location
      });
    }

    // Test search endpoint
    console.log('\n3. Testing search endpoint...');
    const searchResponse = await fetch(`${API_BASE_URL}/drives/search?q=software&limit=5`);
    const searchData = await searchResponse.json();
    console.log(`✅ Search endpoint: Found ${searchData.jobs?.length || 0} drives`);

    // Test company profiles endpoint
    console.log('\n4. Testing company profiles endpoint...');
    const companiesResponse = await fetch(`${API_BASE_URL}/companies/profiles`);
    const companiesData = await companiesResponse.json();
    console.log(`✅ Company profiles: Found ${companiesData.length} companies`);

    console.log('\n🎉 Backend is working correctly!');
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. MongoDB is running');
    console.log('2. Backend server is running (npm run dev)');
    console.log('3. Database is seeded (npm run seed:drives)');
    process.exit(1);
  }
}

testBackend();
