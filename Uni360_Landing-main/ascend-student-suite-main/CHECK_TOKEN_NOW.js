// Run this in browser console to check your current token
console.log('=== TOKEN STATUS CHECK ===');

const token = localStorage.getItem('uni360_access_token');

if (!token) {
  console.error('❌ NO TOKEN! Please log in.');
} else {
  console.log('✅ Token exists');
  console.log('Token:', token.substring(0, 50) + '...');
  
  // Decode JWT
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = new Date(payload.exp * 1000);
    const now = new Date();
    const isExpired = expiry < now;
    
    console.log('Expires at:', expiry.toLocaleString());
    console.log('Current time:', now.toLocaleString());
    console.log('Is expired?', isExpired ? '❌ YES - EXPIRED!' : '✅ No - Valid');
    
    if (isExpired) {
      const expiredMinutes = Math.floor((now - expiry) / 1000 / 60);
      console.error(`Token expired ${expiredMinutes} minutes ago!`);
      console.log('🔧 Solution: Log out and log back in');
    } else {
      const remainingMinutes = Math.floor((expiry - now) / 1000 / 60);
      console.log(`✅ Token valid for ${remainingMinutes} more minutes`);
    }
    
    console.log('\nToken details:');
    console.log('- User ID:', payload.userId);
    console.log('- Username:', payload.username);
    console.log('- Email:', payload.email);
    console.log('- User Type:', payload.userType);
    
  } catch (e) {
    console.error('❌ Cannot decode token:', e);
  }
}

// Test API call
console.log('\n=== TESTING API CALL ===');
fetch('http://34.230.50.74:8080/api/v1/students/profile/builder/progress', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Client-ID': 'uniflow',
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('API Response Status:', r.status);
  if (r.ok) {
    console.log('✅ API CALL SUCCESSFUL!');
    return r.json();
  } else {
    console.error('❌ API CALL FAILED');
    throw new Error(`HTTP ${r.status}`);
  }
})
.then(data => {
  console.log('✅ Profile Progress Data:', data);
})
.catch(err => {
  console.error('❌ Error:', err.message);
  if (err.message.includes('401')) {
    console.log('\n🔧 SOLUTION:');
    console.log('1. Your token is expired or invalid');
    console.log('2. Log out from the app');
    console.log('3. Log back in');
    console.log('4. Try again');
  }
});
