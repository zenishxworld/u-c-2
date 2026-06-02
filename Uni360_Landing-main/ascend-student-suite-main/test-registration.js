// Test script to verify registration integration
const API_URL = 'http://34.230.50.74:8080/api/v1/auth/register/student';

async function testRegistration() {
  const testData = {
    username: `test.student.${Date.now()}`,
    email: `test${Date.now()}@uniflow.com`,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    firstName: 'Test',
    lastName: 'Student',
    privacyPolicyAccepted: true,
    termsOfServiceAccepted: true
  };

  console.log('Testing registration with:', {
    ...testData,
    password: '[HIDDEN]',
    confirmPassword: '[HIDDEN]'
  });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Registration failed!');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Error testing registration:', error.message);
  }
}

// Run the test
console.log('Starting registration test...\n');
testRegistration();