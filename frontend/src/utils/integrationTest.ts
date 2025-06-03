/**
 * Frontend-Backend Integration Test
 * Tests the connection between frontend and backend APIs
 */

const API_BASE_URL = 'http://localhost:8000';

async function testBackendIntegration() {
  console.log('🧪 Testing Frontend-Backend Integration...\n');
  
  const tests = [
    {
      name: 'Health Check',
      url: `${API_BASE_URL}/health`,
      method: 'GET'
    },
    {
      name: 'Get Chats',
      url: `${API_BASE_URL}/api/v1/chats`,
      method: 'GET'
    },
    {
      name: 'CORS Check',
      url: `${API_BASE_URL}/api/v1/chats`,
      method: 'OPTIONS'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`⏳ Testing: ${test.name}`);
      
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = test.method === 'GET' ? await response.json() : null;
        console.log(`✅ ${test.name}: SUCCESS`);
        if (data) {
          console.log(`   Status: ${response.status}`);
          console.log(`   Data: ${JSON.stringify(data).substring(0, 100)}...`);
        }
      } else {
        console.log(`❌ ${test.name}: FAILED - Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${(error as Error).message || error}`);
    }
    console.log('');
  }
}

// Test frontend configuration
function testFrontendConfig() {
  console.log('🔧 Frontend Configuration Check:');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API Base URL: ${API_BASE_URL}`);
  console.log('');
}

// Run tests
async function runIntegrationTests() {
  console.clear();
  console.log('🚀 Frontend-Backend Integration Test Suite');
  console.log('==========================================\n');
  
  testFrontendConfig();
  await testBackendIntegration();
  
  console.log('📋 Integration Test Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Fix any failed tests');
  console.log('   2. Check CORS configuration if needed');
  console.log('   3. Test actual data flow in frontend');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testIntegration = runIntegrationTests;
  console.log('💡 Run window.testIntegration() in browser console to test');
}

export default runIntegrationTests;
