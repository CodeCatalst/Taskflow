// Test script to verify bulk import endpoints
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testEndpoints() {
  try {
    // Test 1: Check if server is running
    const health = await axios.get(`${API_URL}/health`);
    // Test 2: Check if bulk import endpoints exist (will fail with 401 but that's expected)
    try {
      await axios.get(`${API_URL}/users/bulk-import/template`);
    } catch (error) {
      if (error.response?.status === 401) {
        ');
      } else if (error.response?.status === 404) {
        }
    }

    } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      }
  }
}

testEndpoints();
