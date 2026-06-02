// ========================================
// BROWSER CONSOLE DIAGNOSTIC SCRIPT
// ========================================
// Copy and paste this ENTIRE script into your browser console (F12)
// while you're logged in to the student portal
// ========================================

console.log('%c=== ASCEND STUDENT SUITE - AUTH DIAGNOSTIC ===', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
console.log('');

// Step 1: Check if token exists
console.log('%c1. Checking Authentication Token...', 'color: #2196F3; font-weight: bold;');
const token = localStorage.getItem('uni360_access_token');

if (!token) {
    console.error('%c❌ NO TOKEN FOUND!', 'color: red; font-weight: bold;');
    console.log('Token key used: uni360_access_token');
    console.log('You need to login first!');
    console.log('');
    console.log('All localStorage keys:', Object.keys(localStorage));
} else {
    console.log('%c✅ Token exists', 'color: green; font-weight: bold;');
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
    
    // Decode JWT to check expiry
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = new Date(payload.exp * 1000);
        const isExpired = expiry < new Date();
        
        console.log('Token expiry:', expiry.toLocaleString());
        console.log('Is expired?', isExpired ? '❌ YES - TOKEN IS EXPIRED!' : '✅ No');
        console.log('Token payload:', payload);
    } catch (e) {
        console.warn('⚠️ Could not decode token:', e.message);
    }
}

console.log('');

// Step 2: Check user data
console.log('%c2. Checking User Data...', 'color: #2196F3; font-weight: bold;');
const userStr = localStorage.getItem('uni360_user');
if (userStr) {
    try {
        const user = JSON.parse(userStr);
        console.log('%c✅ User data exists', 'color: green; font-weight: bold;');
        console.log('User:', user);
    } catch (e) {
        console.error('❌ User data is corrupted:', e.message);
    }
} else {
    console.error('❌ No user data found');
}

console.log('');

// Step 3: Test API with token
console.log('%c3. Testing Backend API Calls...', 'color: #2196F3; font-weight: bold;');

if (!token) {
    console.error('❌ Skipping API tests - no token available');
} else {
    console.log('Testing /api/v1/students/profile/builder/steps endpoint...');
    
    fetch('http://34.230.50.74:8080/api/v1/students/profile/builder/steps', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-Client-ID': 'uniflow',
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        
        if (response.ok) {
            console.log('%c✅ API CALL SUCCESSFUL!', 'color: green; font-weight: bold; font-size: 14px;');
            return response.json();
        } else {
            console.error('%c❌ API CALL FAILED', 'color: red; font-weight: bold; font-size: 14px;');
            const authError = response.headers.get('X-Auth-Error');
            if (authError) {
                console.error('X-Auth-Error:', authError);
            }
            return response.text().then(text => {
                console.error('Response:', text);
                throw new Error(`HTTP ${response.status}: ${text}`);
            });
        }
    })
    .then(data => {
        console.log('%c✅ Profile Steps Data:', 'color: green; font-weight: bold;');
        console.log(data);
    })
    .catch(error => {
        console.error('%c❌ Error:', 'color: red; font-weight: bold;', error.message);
        
        if (error.message.includes('401')) {
            console.log('');
            console.log('%c🔍 DIAGNOSIS: Token is invalid or expired', 'color: orange; font-weight: bold;');
            console.log('Solutions:');
            console.log('1. Log out and log back in');
            console.log('2. Clear localStorage: localStorage.clear()');
            console.log('3. Refresh the page');
        }
    });
    
    console.log('');
    console.log('Testing /student/document-status-overview/ endpoint...');
    
    fetch('http://34.230.50.74:8080/student/document-status-overview/?ngrok-skip-browser-warning=true', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        }
    })
    .then(response => {
        console.log('Document Status Response:', response.status);
        
        if (response.ok) {
            console.log('%c✅ DOCUMENT API SUCCESSFUL!', 'color: green; font-weight: bold;');
            return response.json();
        } else {
            console.error('%c❌ DOCUMENT API FAILED', 'color: red; font-weight: bold;');
            if (response.status === 404) {
                console.warn('⚠️ Endpoint might not exist on backend');
            }
            return response.text();
        }
    })
    .then(data => {
        console.log('Document Status Data:', data);
    })
    .catch(error => {
        console.error('Document Status Error:', error.message);
    });
}

console.log('');
console.log('%c=== DIAGNOSTIC COMPLETE ===', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
console.log('');
console.log('%cNext Steps:', 'color: #FF9800; font-weight: bold;');
console.log('1. Check the results above');
console.log('2. If token is expired → Log out and log back in');
console.log('3. If token is missing → Make sure you logged in successfully');
console.log('4. If API calls fail with 401 → Token might not match backend expectations');
console.log('5. If API calls succeed → Your frontend code is working correctly!');
