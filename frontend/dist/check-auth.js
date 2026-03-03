// Quick debug script to check authentication status
// Open browser console (F12) and paste this to diagnose auth issues

console.log('🔍 Checking Authentication Status...\n');

// Check if tokens exist
const accessToken = localStorage.getItem('accessToken');
const refreshToken = localStorage.getItem('refreshToken');
const userStr = localStorage.getItem('user');

console.log('Access Token:', accessToken ? '✅ EXISTS' : '❌ MISSING');
console.log('Refresh Token:', refreshToken ? '✅ EXISTS' : '❌ MISSING');
console.log('User Data:', userStr ? '✅ EXISTS' : '❌ MISSING');

if (userStr) {
  try {
    const user = JSON.parse(userStr);
    console.log('\n👤 Current User:');
    console.log('  - Name:', user.full_name);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);
    console.log('  - ID:', user.id);
  } catch (e) {
    console.log('❌ User data is corrupted');
  }
}

if (!accessToken || !refreshToken) {
  console.log('\n⚠️  AUTHENTICATION ISSUE DETECTED!');
  console.log('\n🔧 Fix:');
  console.log('1. Run: localStorage.clear()');
  console.log('2. Refresh page');
  console.log('3. Log in again');
  console.log('\nOr click here to fix now:');
  console.log('%cFIX NOW', 'background: red; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer;');
} else {
  console.log('\n✅ Authentication looks good!');
  console.log('If still getting 401 errors, the token may be expired.');
  console.log('\n🔧 Solution:');
  console.log('1. Log out from UI');
  console.log('2. Log back in');
}

// Add a helper function
window.fixAuth = function() {
  localStorage.clear();
  console.log('✅ Cleared storage. Please refresh and log in again.');
  setTimeout(() => window.location.reload(), 1000);
};

console.log('\n💡 TIP: Type fixAuth() to auto-fix and reload');
