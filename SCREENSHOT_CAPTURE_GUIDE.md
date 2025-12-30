# 📸 Screenshot Capture Guide

## Overview
This guide helps you capture high-quality screenshots with realistic mock data for marketing materials, documentation, and the landing page.

## Quick Start

1. **Navigate to Screenshot Demo Page**
   ```
   http://localhost:5173/screenshot-demo
   ```

2. **Select View Type**
   - 📊 Dashboard - Overview with stats and recent tasks
   - 📋 Kanban Board - Visual task management
   - ✓ Task List - Detailed task table
   - 📈 Analytics - Charts and metrics
   - 📅 Calendar - Calendar view with events
   - 👥 Teams - Team management cards

3. **Hide Controls**
   - Click "Hide Controls (Take Screenshot)" button
   - Control panel disappears for clean screenshots

4. **Capture Screenshot**
   Use one of these methods:

   ### Browser Extensions (Recommended)
   - **Chrome/Edge**: [GoFullPage](https://chrome.google.com/webstore/detail/gofullpage-full-page-scre/fdpohaocaechififmbbbbbknoalclacl)
   - **Firefox**: [Awesome Screenshot](https://addons.mozilla.org/en-US/firefox/addon/screenshot-capture-annotate/)

   ### Built-in Browser Tools
   - **Firefox**: 
     - Press `Shift + F2`
     - Type: `screenshot --fullpage`
     - Or right-click page → "Take Screenshot"
   
   - **Chrome DevTools**:
     - Press `Cmd/Ctrl + Shift + P`
     - Type: "Capture full size screenshot"
     - Press Enter

   ### macOS Native
   - `Cmd + Shift + 4` → Drag to select area
   - `Cmd + Shift + 3` → Full screen

   ### Windows Native
   - `Win + Shift + S` → Snipping tool
   - `Win + PrtScn` → Full screen to Pictures folder

5. **Show Controls Again**
   - Click the eye icon in top-right corner
   - Select different view type
   - Repeat process

## Mock Data Details

The screenshot demo uses realistic mock data:

### Users (8 profiles)
- Sarah Chen (Admin)
- Marcus Johnson (HR)
- Emma Rodriguez (Team Lead)
- James Kim, Olivia Patel, David Martinez, Sophia Anderson, Michael Brown (Members)

### Teams (3 teams)
- Product Engineering (3 members)
- Design & UX (2 members)
- Marketing & Growth (1 member)

### Tasks (12 tasks)
- Various statuses: todo, in_progress, in_review, done
- Multiple priorities: low, medium, high, urgent
- Realistic dates (past, present, future)
- Team assignments
- Multi-user assignments

### Analytics Data
- Status distribution charts
- Priority distribution charts
- Completion trends
- Team distribution metrics

## Best Practices

### Resolution
- **Desktop**: Capture at 1920x1080 or higher
- **Mobile**: Use browser DevTools device toolbar
- **Retina/HiDPI**: Ensure 2x pixel density for sharp images

### Composition
1. **Include enough context** - Show full interface with navigation
2. **Consistent branding** - Dark theme is default
3. **Realistic data** - Mock data already looks production-ready
4. **Remove distractions** - Hide control panel before capture

### File Management
Recommended naming convention:
```
taskflow_dashboard_hero.png
taskflow_kanban_detailed.png
taskflow_analytics_charts.png
```

### Optimization
After capturing, optimize images:
```bash
# Using ImageOptim (macOS)
# Or TinyPNG.com
# Or Squoosh.app

# Target: < 500KB per screenshot for web
```

## Screenshot Checklist

- [ ] Select view type
- [ ] Wait for content to load (smooth animations)
- [ ] Hide control panel
- [ ] Ensure browser is full screen
- [ ] No personal data visible
- [ ] Clean browser toolbar (optional: hide)
- [ ] Capture screenshot
- [ ] Verify image quality
- [ ] Optimize file size
- [ ] Rename with descriptive name
- [ ] Save to `/UI/[view_name]/screen.png`

## Updating Landing Page

After capturing new screenshots:

1. **Save to project**
   ```
   frontend/public/UI/
   ├── main_dashboard/screen.png
   ├── kanban_board/screen.png
   ├── analytics_&_reports/screen.png
   └── calendar_view/screen.png
   ```

2. **Screenshots are automatically used** in:
   - Landing page hero section (bento layout)
   - Product experience section
   - Any marketing materials

3. **Verify on landing page**
   ```
   http://localhost:5173/
   ```

## Troubleshooting

### Screenshots are blurry
- Capture at higher resolution (1920x1080+)
- Use browser extensions for better quality
- Ensure browser zoom is at 100%

### Control panel visible
- Click "Hide Controls" button first
- Wait 1 second before capturing

### Mock data not loading
- Check browser console for errors
- Ensure `/screenshot-demo` route is accessible
- Refresh page

### Want different data
- Edit `frontend/src/utils/mockDataGenerator.js`
- Modify tasks, users, teams, or analytics
- Refresh screenshot demo page

## Advanced Customization

### Custom Views
Create new demo components in `ScreenshotDemo.jsx`:

```jsx
const MyCustomDemo = ({ data }) => (
  <div className="space-y-6">
    {/* Your custom layout */}
  </div>
);
```

### Custom Mock Data
Add to `mockDataGenerator.js`:

```javascript
export const customMockData = {
  // Your custom data
};
```

### Responsive Screenshots
Use browser DevTools device toolbar:
1. Open DevTools (`F12`)
2. Click device icon (top-left)
3. Select device (iPhone, iPad, etc.)
4. Capture screenshot

## Need Help?

Issues or questions:
1. Check console for errors
2. Verify route is registered in App.jsx
3. Ensure mock data is loading
4. Check browser compatibility

---

**Pro Tip**: Capture screenshots at different times of day to show different data states (morning stats, afternoon progress, evening completion).
