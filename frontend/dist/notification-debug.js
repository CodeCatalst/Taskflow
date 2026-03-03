/**
 * Notification Debug Script
 * Run this in your browser console to diagnose notification issues
 * 
 * Usage: Copy and paste this entire script into the browser console
 */

async function debugNotifications() {
  console.log('🔍 ==== NOTIFICATION DIAGNOSTIC REPORT ====\n');
  
  // 1. Check browser support
  console.log('1️⃣ BROWSER SUPPORT');
  console.log('   Notification API:', 'Notification' in window ? '✅ Supported' : '❌ Not supported');
  console.log('   Service Worker:', 'serviceWorker' in navigator ? '✅ Supported' : '❌ Not supported');
  console.log('   Push API:', 'PushManager' in window ? '✅ Supported' : '❌ Not supported');
  console.log('   User Agent:', navigator.userAgent);
  console.log('');
  
  // 2. Check permissions
  console.log('2️⃣ PERMISSIONS');
  if ('Notification' in window) {
    console.log('   Notification Permission:', Notification.permission);
    if (Notification.permission === 'denied') {
      console.log('   ⚠️  ISSUE: Notifications are blocked!');
      console.log('   Fix: Go to browser settings and allow notifications for this site');
    } else if (Notification.permission === 'default') {
      console.log('   ℹ️  Permission not requested yet');
    } else {
      console.log('   ✅ Notifications are allowed');
    }
  }
  console.log('');
  
  // 3. Check service worker
  console.log('3️⃣ SERVICE WORKER');
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        console.log('   Registration:', '✅ Found');
        console.log('   Scope:', registration.scope);
        console.log('   Active:', registration.active ? '✅ Yes' : '❌ No');
        if (registration.active) {
          console.log('   State:', registration.active.state);
          console.log('   Script URL:', registration.active.scriptURL);
        }
        console.log('   Installing:', registration.installing ? 'Yes' : 'No');
        console.log('   Waiting:', registration.waiting ? 'Yes' : 'No');
      } else {
        console.log('   ⚠️  No service worker registered');
        console.log('   Fix: The app should register a service worker automatically');
      }
    } catch (error) {
      console.log('   ❌ Error checking service worker:', error.message);
    }
  }
  console.log('');
  
  // 4. Check notification settings
  console.log('4️⃣ APP NOTIFICATION SETTINGS');
  try {
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    console.log('   Stored Settings:', settings);
    console.log('   Task Created:', settings.taskCreated !== false ? '✅ Enabled' : '❌ Disabled');
    console.log('   Task Updated:', settings.taskUpdated !== false ? '✅ Enabled' : '❌ Disabled');
    console.log('   Task Assigned:', settings.taskAssigned !== false ? '✅ Enabled' : '❌ Disabled');
    console.log('   New Comment:', settings.newComment !== false ? '✅ Enabled' : '❌ Disabled');
  } catch (error) {
    console.log('   ⚠️  Could not read settings from localStorage');
  }
  console.log('');
  
  // 5. Test notification
  console.log('5️⃣ NOTIFICATION TEST');
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      console.log('   Attempting to show test notification...');
      
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('🧪 Debug Test', {
          body: 'If you see this, notifications are working!',
          icon: '/icons/pwa-192x192.png',
          badge: '/icons/pwa-64x64.png',
          tag: 'debug-test',
          requireInteraction: false,
          vibrate: [200, 100, 200],
        });
        console.log('   ✅ Test notification sent via Service Worker');
      } else {
        new Notification('🧪 Debug Test', {
          body: 'If you see this, notifications are working!',
          icon: '/icons/pwa-192x192.png',
          badge: '/icons/pwa-64x64.png',
          tag: 'debug-test',
        });
        console.log('   ✅ Test notification sent (fallback method)');
      }
      console.log('   Did you see the notification? If not, check:');
      console.log('   - System notification settings (Focus/DND mode)');
      console.log('   - Browser notification settings');
      console.log('   - OS notification settings');
    } catch (error) {
      console.log('   ❌ Error showing test notification:', error.message);
    }
  } else {
    console.log('   ⏭️  Skipped (permission not granted)');
  }
  console.log('');
  
  // 6. Check Socket.IO connection
  console.log('6️⃣ REAL-TIME CONNECTION');
  if (window.socket || (window.io && window.io.sockets?.size > 0)) {
    console.log('   Socket.IO:', '✅ Connected');
    if (window.socket) {
      console.log('   Socket ID:', window.socket.id);
      console.log('   Connected:', window.socket.connected);
    }
  } else {
    console.log('   ⚠️  Socket.IO connection not detected');
    console.log('   This is normal if you\'re not logged in');
  }
  console.log('');
  
  // 7. Operating System Info
  console.log('7️⃣ SYSTEM INFORMATION');
  console.log('   Platform:', navigator.platform);
  console.log('   Online:', navigator.onLine ? 'Yes' : 'No');
  console.log('   Language:', navigator.language);
  console.log('');
  
  // 8. Common issues and solutions
  console.log('8️⃣ COMMON ISSUES & SOLUTIONS');
  console.log('');
  console.log('   ❌ Notifications don\'t appear:');
  console.log('      → Check if Focus/DND mode is enabled (macOS, Windows)');
  console.log('      → Check browser notification settings');
  console.log('      → Check site notification permissions');
  console.log('      → Try closing and reopening the browser');
  console.log('');
  console.log('   ❌ Permission is "denied":');
  console.log('      → Browser Settings → Privacy → Notifications');
  console.log('      → Find this site and allow notifications');
  console.log('      → Reload the page after changing');
  console.log('');
  console.log('   ❌ Service worker not registered:');
  console.log('      → Check if you\'re on HTTPS or localhost');
  console.log('      → Check browser console for errors');
  console.log('      → Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)');
  console.log('');
  
  // 9. Browser-specific tips
  console.log('9️⃣ BROWSER-SPECIFIC TIPS');
  console.log('');
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('chrome') || ua.includes('edg')) {
    console.log('   Chrome/Edge:');
    console.log('   → Settings → Privacy and security → Site Settings → Notifications');
    console.log('   → Check if this site is in the "Allowed" list');
  } else if (ua.includes('firefox')) {
    console.log('   Firefox:');
    console.log('   → Settings → Privacy & Security → Permissions → Notifications');
    console.log('   → Click "Settings" next to Notifications');
  } else if (ua.includes('safari')) {
    console.log('   Safari:');
    console.log('   → Safari → Settings → Websites → Notifications');
    console.log('   → Find this site and set to "Allow"');
    console.log('   → Also check System Preferences → Notifications → Safari');
  }
  console.log('');
  
  console.log('🔍 ==== END OF DIAGNOSTIC REPORT ====');
  console.log('');
  console.log('📋 QUICK ACTIONS:');
  console.log('   • Request permission: Notification.requestPermission()');
  console.log('   • Reset settings: localStorage.removeItem("notificationSettings")');
  console.log('   • Check settings: localStorage.getItem("notificationSettings")');
  console.log('');
}

// Auto-run on paste
debugNotifications();
