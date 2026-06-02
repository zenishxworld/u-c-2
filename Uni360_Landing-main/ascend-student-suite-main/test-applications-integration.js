// Test script to verify Applications integration
const API_URL = 'http://34.230.50.74:8080';

// Use the token from requirements (expires 2025-10-13)
const TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJmaXJzdE5hbWUiOiJUZXN0IiwibGFzdE5hbWUiOiJTdHVkZW50IiwiY2xpZW50VHlwZSI6IlVOSUZMT1ciLCJ0aW1lem9uZSI6IlVUQyIsImxhbmd1YWdlIjoiZW4iLCJzZXNzaW9uVGltZW91dCI6NDgwLCJ1c2VyVHlwZSI6IlNUVURFTlQiLCJ0b2tlblR5cGUiOiJBQ0NFU1MiLCJ1c2VySWQiOjEsImVtYWlsIjoibXVrdW5kLnN0dWRlbnQxQHVuaWZsb3cuY29tIiwidXNlcm5hbWUiOiJtdWt1bmQuc3R1ZGVudDEiLCJzdGF0dXMiOiJBQ1RJVkUiLCJzdWIiOiIxIiwiaXNzIjoidW5pZmxvdy1wbGF0Zm9ybSIsImF1ZCI6InVuaWZsb3ctY2xpZW50IiwiaWF0IjoxNzYwMzM4MTk3LCJleHAiOjE3NjAzNDE3OTcsImp0aSI6ImQ1MDJmN2Q0LWExNjctNDgxOC1hMmExLTFlNjE1MDkzNzBlMCJ9.VCx4ktJ4Q00NvHpN9STXXJ_oXajw7nKmr2izTWtT_JDCtvuaBBdUMgkIaVaqfGcTp2nM_G3lFegfHyp3aHJsaQ';

async function testListApplications() {
  console.log('\n=== Testing List Applications ===\n');
  
  try {
    const response = await fetch(`${API_URL}/api/v1/students/applications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ List Applications successful!');
      console.log('Response structure:', {
        success: result.success,
        hasData: !!result.data,
        hasApplications: !!result.data?.applications,
        applicationCount: result.data?.applications?.length || 0
      });
      
      if (result.data?.applications?.length > 0) {
        const app = result.data.applications[0];
        console.log('\nFirst application sample:');
        console.log({
          id: app.id,
          referenceNumber: app.referenceNumber,
          universityName: app.universityName,
          programName: app.programName,
          intakeTerm: app.intakeTerm,
          status: app.status,
          completionPercentage: app.completionPercentage
        });
      }
      
      return result;
    } else {
      console.log('❌ List Applications failed!');
      console.log('Status:', response.status);
      console.log('Response:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing List Applications:', error.message);
    return null;
  }
}

async function testCreateApplication() {
  console.log('\n=== Testing Create Application ===\n');
  
  const applicationData = {
    studentId: 1,
    targetUniversityId: "4eb4ad88-155e-4d7d-9c9a-ee3e80b7e3dd",
    targetCourseId: "3858cc7a-f6d0-4b6d-861c-0a68d03668e0",
    targetSemester: "WINTER",
    targetYear: 2026
  };

  console.log('Request payload:', applicationData);
  
  try {
    const response = await fetch(`${API_URL}/api/v1/students/applications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(applicationData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Create Application successful!');
      console.log('Created application:', {
        id: result.data?.id,
        reference_number: result.data?.reference_number,
        status: result.data?.status
      });
      return result.data;
    } else {
      console.log('❌ Create Application failed!');
      console.log('Status:', response.status);
      console.log('Response:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing Create Application:', error.message);
    return null;
  }
}

async function testSubmitApplication(applicationId) {
  console.log('\n=== Testing Submit Application ===\n');
  
  const submissionData = {
    confirmationStatement: "I confirm that all information provided is accurate and complete.",
    agreeToTerms: true,
    additionalNotes: "Test submission via integration script."
  };

  console.log('Application ID:', applicationId);
  console.log('Submission data:', submissionData);
  
  try {
    const response = await fetch(`${API_URL}/api/v1/students/applications/${applicationId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submissionData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Submit Application successful!');
      console.log('Submission response:', result);
      return result;
    } else {
      console.log('❌ Submit Application failed!');
      console.log('Status:', response.status);
      console.log('Response:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing Submit Application:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Backend Integration Tests\n');
  console.log('Base URL:', API_URL);
  console.log('Token:', TOKEN.substring(0, 50) + '...');
  
  // Test 1: List Applications
  const listResult = await testListApplications();
  
  // Test 2: Create Application (optional - uncomment to test)
  // const createResult = await testCreateApplication();
  
  // Test 3: Submit Application (optional - requires application ID)
  // if (createResult?.id) {
  //   await testSubmitApplication(createResult.id);
  // }
  
  console.log('\n=== Test Summary ===\n');
  console.log('✅ List Applications:', listResult ? 'PASSED' : 'FAILED');
  console.log('\nNote: Create and Submit tests are commented out to avoid');
  console.log('creating duplicate test applications. Uncomment to test.');
}

// Run the tests
runTests();