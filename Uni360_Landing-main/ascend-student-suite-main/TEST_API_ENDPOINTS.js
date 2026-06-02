/**
 * API DIAGNOSTIC TOOL
 * Copy this entire script into your browser console (F12) to test APIs
 */

const testAPIEndpoints = async () => {
  console.log('🔍 Starting API Diagnostics...\n');
  
  // Get token
  const token = localStorage.getItem('uni360_access_token');
  
  if (!token) {
    console.error('❌ No access token found in localStorage!');
    console.log('Please log in first.');
    return;
  }
  
  console.log('✅ Token found:', token.substring(0, 50) + '...');
  
  // Decode token to check expiry
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryDate = new Date(payload.exp * 1000);
    const now = new Date();
    const minutesLeft = Math.floor((expiryDate - now) / 1000 / 60);
    
    console.log(`⏰ Token expires at: ${expiryDate.toLocaleString()}`);
    console.log(`⏰ Minutes remaining: ${minutesLeft} minutes`);
    
    if (expiryDate < now) {
      console.error('❌ Token is EXPIRED! Please log in again.');
      return;
    }
  } catch (e) {
    console.warn('⚠️ Could not decode token:', e.message);
  }
  
  console.log('\n📡 Testing API Endpoints...\n');
  
  // Base URL
  const BASE_URL = 'http://34.230.50.74:8080';
  
  // Test endpoints
  const endpoints = [
    {
      name: 'Universities List',
      url: `${BASE_URL}/api/v1/universities`,
      method: 'GET'
    },
    {
      name: 'Profile Progress',
      url: `${BASE_URL}/api/v1/students/profile/builder/progress`,
      method: 'GET'
    },
    {
      name: 'Profile Builder Config',
      url: `${BASE_URL}/api/v1/students/profile/builder`,
      method: 'GET'
    },
    {
      name: 'Profile Builder Steps',
      url: `${BASE_URL}/api/v1/students/profile/builder/steps`,
      method: 'GET'
    },
    {
      name: 'Current Step',
      url: `${BASE_URL}/api/v1/students/profile/builder/current`,
      method: 'GET'
    },
    {
      name: 'Student Profile',
      url: `${BASE_URL}/api/v1/students/profile`,
      method: 'GET'
    }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'X-Client-ID': 'uniflow'
        }
      });
      
      const status = response.status;
      console.log(`   Status: ${status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS`);
        console.log('   Response:', data);
        
        results.push({
          endpoint: endpoint.name,
          status: 'SUCCESS',
          statusCode: status,
          data: data
        });
      } else {
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Could not read error response';
        }
        
        console.log(`   ❌ FAILED: ${status}`);
        console.log('   Error:', errorText);
        
        results.push({
          endpoint: endpoint.name,
          status: 'FAILED',
          statusCode: status,
          error: errorText
        });
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      
      results.push({
        endpoint: endpoint.name,
        status: 'ERROR',
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n\n📊 SUMMARY\n');
  console.log('═══════════════════════════════════════════\n');
  
  const successful = results.filter(r => r.status === 'SUCCESS');
  const failed = results.filter(r => r.status === 'FAILED');
  const errored = results.filter(r => r.status === 'ERROR');
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`⚠️  Errors: ${errored.length}`);
  console.log(`📝 Total: ${results.length}\n`);
  
  if (successful.length > 0) {
    console.log('✅ Working Endpoints:');
    successful.forEach(r => {
      console.log(`   • ${r.endpoint} (${r.statusCode})`);
    });
    console.log('');
  }
  
  if (failed.length > 0) {
    console.log('❌ Failed Endpoints:');
    failed.forEach(r => {
      console.log(`   • ${r.endpoint} (${r.statusCode})`);
    });
    console.log('');
  }
  
  if (errored.length > 0) {
    console.log('⚠️  Errored Endpoints:');
    errored.forEach(r => {
      console.log(`   • ${r.endpoint} - ${r.error}`);
    });
    console.log('');
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS\n');
  console.log('═══════════════════════════════════════════\n');
  
  if (failed.some(r => r.statusCode === 401)) {
    console.log('⚠️  401 Unauthorized errors detected:');
    console.log('   Possible causes:');
    console.log('   1. Endpoint not implemented on backend');
    console.log('   2. Token doesn\'t have required permissions');
    console.log('   3. Endpoint requires different authentication');
    console.log('   → Contact your backend engineer to verify these endpoints exist\n');
  }
  
  if (failed.some(r => r.statusCode === 404)) {
    console.log('⚠️  404 Not Found errors detected:');
    console.log('   → These endpoints don\'t exist on the backend yet\n');
  }
  
  if (successful.length > 0) {
    console.log('✅ Good news! Some endpoints are working.');
    console.log('   The authentication is set up correctly.\n');
  }
  
  console.log('📋 Full Results Object:');
  console.log('   Copy this and send to your backend engineer:');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
};

// Run the test
console.log('');
console.log('═══════════════════════════════════════════');
console.log('  API ENDPOINT DIAGNOSTIC TOOL');
console.log('═══════════════════════════════════════════');
console.log('');

testAPIEndpoints();
