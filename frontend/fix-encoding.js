const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'ChangeLog.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all encoding issues
const replacements = [
  // Event type options
  ['ðŸŒ€ All Events', '🌐 All Events'],
  ['ðŸŽ¯ All Types', '🎯 All Types'],
  
  // Emoji replacements in options
  ['âœ… Task', '✅ Task'],
  ['ðŸ‘¤ User', '👤 User'],
  ['ðŸ‘¥ Team', '👥 Team'],
  ['ðŸ"Š Report', '📊 Report'],
  ['ðŸ’¬ Comment', '💬 Comment'],
  ['ðŸ" Notification', '🔔 Notification'],
  ['âš™ï¸� Automation', '⚙️ Automation'],
  
  // Emoji in emojis list  
  ['ðŸ" 25 items', '📄 25 items'],
  ['ðŸ" 50 items', '📋 50 items'],
  ['ðŸ" 100 items', '📘 100 items'],
  ['ðŸ" 200 items', '📦 200 items'],
  
  // Date range
  ['ðŸ" Date Range', '📅 Date Range'],
  
  // User role icons
  ['ðŸ"" Admin', '👑 Admin'],
  ['â­" Manager', '⭐ Manager'],
  ['ðŸ' Member', '👤 Member'],
  
  // More event type emojis
  ['ðŸ" Created', '✨ Created'],
  ['ðŸ" Updated', '📝 Updated'],
  ['ðŸ—\'ï¸\' Deleted', '🗑️ Deleted'],
  ['ðŸ"" Login', '🔑 Login'],
  ['ðŸ"\' Logout', '🔒 Logout'],
  ['ðŸ"" Default', '📌 Default'],
];

replacements.forEach(([from, to]) => {
  content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
});

fs.writeFileSync(filePath, content);
console.log('Fixed ChangeLog.jsx encoding issues');