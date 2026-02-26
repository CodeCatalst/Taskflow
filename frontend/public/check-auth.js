// Quick debug script to check authentication status
// This file has been cleaned for production - console logs removed for security

// Check if tokens exist
const accessToken = localStorage.getItem('accessToken');
const refreshToken = localStorage.getItem('refreshToken');
const userStr = localStorage.getItem('user');

if (userStr) {
  try {
    const user = JSON.parse(userStr);
    // User data parsed successfully
  } catch (e) {
    // User data is corrupted
  }
}

// Add a helper function
window.fixAuth = function() {
  localStorage.clear();
  setTimeout(() => window.location.reload(), 1000);
};
