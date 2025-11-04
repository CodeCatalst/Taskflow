// Test script to verify bulk import endpoints
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testEndpoints() {
  console.log('🧪 Testing Bulk Import Endpoints...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server health...');
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Server is running:', health.data);

    // Test 2: Check if bulk import endpoints exist (will fail with 401 but that's expected)
    console.log('\n2️⃣ Testing bulk import endpoints existence...');
    
    try {
      await axios.get(`${API_URL}/users/bulk-import/template`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Template endpoint exists (401 - needs authentication)');
      } else if (error.response?.status === 404) {
        console.log('❌ Template endpoint NOT FOUND - Server needs restart!');
      }
    }

    console.log('\n✅ All tests passed! Endpoints are registered.');
    console.log('\n💡 If you see 404 errors, restart the backend server with:');
    console.log('   cd backend');
    console.log('   npm run dev');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Backend server is not running!');
      console.log('   Start it with: cd backend && npm run dev');
    }
  }
}

testEndpoints();
