# TaskFlow - Enterprise Task Management System

A **modern**, **comprehensive**, and **role-based** task management system built with **Node.js**, **Express**, **MongoDB**, **React**, and **Socket.IO**. Featuring real-time collaboration, advanced analytics, PWA capabilities, and intelligent automation.

---

## 🆕 Recent Updates (December 2025)

### ✅ Major Fixes & Enhancements
- **Landing Page** - Production-ready conversion-focused page with cinematic UI
- **Dashboard Search & Filters** - Fixed non-functional search bar and filter panel
- **Enhanced Analytics** - Added 5 new graphs (11 total) with advanced metrics
- **Mobile Responsiveness** - Comprehensive mobile optimization across all pages
- **Notifications Fixed** - Desktop notifications now working with smart filtering
- **Session Management** - Fixed automatic logout with proper timer persistence
- **PWA Install Banner** - Smart installation prompt on dashboard
- **Export Functionality** - Fixed dropdown positioning for Excel/PDF export
- **Workspace Activation** - Enhanced control for activating/deactivating workspaces

### 📊 New Analytics Graphs
- Weekly Progress (8-week trend line chart)
- Hourly Distribution (24-hour task creation patterns)
- Task Age Distribution (pending task analysis)
- Priority Trend (12-week stacked area chart)
- Team Completion Rate (efficiency comparison)

### 🎨 New Landing Page Features
- Dark-first cinematic design with glassmorphism
- Animated UI previews (no screenshots)
- Floating 3D elements with parallax
- Scroll-based reveals with staggered animations
- Community vs CORE pricing comparison
- 6 capability trust cards
- Philosophy section explaining "why TaskFlow"

---

## 🎯 Core Features

### 🔐 Authentication & Security
- **JWT Authentication** with access and refresh tokens
- **Role-Based Access Control (RBAC)** - System Admin, Workspace Admin, Community Admin, HR, Team Lead, Member
- **Multi-Workspace Support** - CORE (enterprise) and COMMUNITY (free tier)
- **Public Community Registration** - Self-service workspace creation
- **System Administrator** - Full cross-workspace management
- **Enhanced Session Management** (Fixed & Improved):
  - Configurable session timeouts (30 min - 24 hours)
  - Smart inactivity detection using useRef for proper timer persistence
  - 5-minute warning before session expires
  - Automatic logout on inactivity
  - Tab visibility detection - validates session when returning to tab
  - Activity-based timer reset (mouse movement, clicks, keyboard)
  - Console logging for debugging timer activity
- **Secure Password Hashing** with bcrypt
- **Workspace Isolation** - Complete data separation between workspaces
- **Workspace Activation Control** - Admins can activate/deactivate workspaces to restrict access

### 👥 User Management
- **Comprehensive User Profiles** - Full name, email, role, team assignment
- **Bulk User Import** - Excel/CSV upload for mass user creation
- **Bulk User Deletion** - Select and delete multiple users at once
- **Automated Welcome Emails** - New users receive credentials via email
- **Role Management** - Admin/HR can assign and modify user roles
- **User Activity Tracking** - Monitor user actions via audit logs

### 🏢 Workspace Management (System Admin)
- **Multi-Workspace Administration** - Manage all workspaces from one interface
- **Workspace Creation** - Create CORE or COMMUNITY workspaces with instant setup
- **Workspace Activation Control** (Enhanced):
  - Toggle workspaces active/inactive to control access
  - Deactivated workspaces block all user access immediately
  - Clear error messages for users of deactivated workspaces
  - Visual status indicators (green badge for active, red for inactive)
  - Reactivation restores full access instantly
  - All data preserved during deactivation
- **Usage Monitoring** - Real-time tracking of users, tasks, and teams per workspace
- **Limit Management** - Configure and monitor COMMUNITY workspace limits
- **Workspace Statistics** - Live metrics, completion rates, and usage trends
- **User Assignment** - Assign workspace owners and admins
- **Workspace Deletion** - Safe removal with validation checks (only empty workspaces)

### 🎯 Task Management
- **Complete Task Lifecycle** - Create, assign, update, track, and complete tasks
- **Multiple Status Stages** - Todo, In Progress, Review, Done
- **Priority Levels** - Low, Medium, High, Critical
- **Task Assignment** - Assign to team members or self
- **Due Date Tracking** - Visual indicators for overdue and upcoming tasks
- **Rich Descriptions** - Detailed task information with multiline support
- **Task Comments** - Collaborative discussions on each task
- **Task Filtering** - Filter by status, priority, team, assignee, date range
- **Task Search** - Quick search across all task fields
- **Overdue Task Alerts** - Visual warnings for missed deadlines

### 👨‍👩‍👧‍👦 Team Management
- **Team Creation & Management** - Organize users into functional teams
- **Team Lead Assignment** - Designate team leaders with elevated permissions
- **Team Member Management** - Add/remove members dynamically
- **Team-based Task Views** - Filter and view tasks by team
- **Drag & Drop Team Reordering** - Reorganize teams with intuitive UI
- **Team Statistics** - View team performance and task counts

---

## 🎨 UI Enhancements & User Experience

### 🌓 Advanced Theming System
- **Multiple Theme Modes**:
  - ☀️ **Light Mode** - Clean, bright interface
  - 🌙 **Dark Mode** - Eye-friendly dark interface
  - 🖥️ **Auto Mode** - Follows system preference
- **Multiple Color Schemes**:
  - 💜 **Purple** (Default)
  - 🔵 **Blue**
  - 💚 **Green**
  - 🔴 **Red**
  - ⚫ **Slate**
- **Persistent Preferences** - Theme settings saved per user
- **Smooth Transitions** - Animated theme switching
- **System-wide Consistency** - All components themed uniformly

### 📱 Mobile Responsiveness (Enhanced)
- **Fully Responsive Design** - Optimized for all screen sizes
- **Mobile-First Approach** - Touch-friendly interfaces
- **Adaptive Layouts**:
  - Mobile (< 640px)
  - Tablet (640px - 1024px)  
  - Desktop (> 1024px)
- **Enhanced Tables** (Improved):
  - Horizontal scroll on mobile with min-width constraints
  - Hidden non-essential columns on mobile
  - Reduced cell padding on small screens
  - Smaller badges and icons (4x4 on mobile, 5x5 on desktop)
  - Compact font sizes (10px-12px on mobile)
- **Touch-Optimized Controls** - Larger tap targets on mobile
- **Responsive Navigation** - Collapsible sidebar for mobile
- **Mobile-Friendly Forms** - Simplified inputs with responsive padding
- **Optimized Chart Rendering** (Major Improvements):
  - Dynamic chart heights (250px mobile, 300-400px desktop)
  - Responsive axis labels with dynamic font sizes
  - Adjusted pie chart radius for mobile
  - Angled X-axis labels on mobile for readability
  - Touch-friendly chart interactions
- **Responsive Filter Panels** - Stack vertically on mobile
- **Adaptive Key Metrics Cards** - 2-column grid on mobile, 4-column on desktop

### 🎯 Dashboard Views
- **📊 Comprehensive Dashboard** (Default View)
  - Real-time task statistics with visual cards
  - **Interactive search bar** with real-time filtering
  - **Advanced filter panel** - Filter by status, priority, date range
  - **Working export dropdown** - Excel and PDF export
  - **PWA install banner** - Smart installation prompt
  - 3 live charts: Status distribution (pie), Priority breakdown (bar), Team distribution (bar)
  - Recent tasks overview with smart filtering
  - Overdue task alerts with visual indicators
  - Completion rate metrics
  - Quick action buttons
  - "View Detailed Analytics" link to full analytics page
  
- **📋 Kanban Board** (Drag & Drop)
  - Visual task workflow (Todo → In Progress → Review → Done)
  - Drag & drop task status updates
  - Color-coded columns
  - Real-time synchronization
  - Advanced filtering options
  - Column-specific task counts
  - Smooth animations and transitions
  
- **📅 Calendar View**
  - Interactive calendar with task due dates
  - Month/Week/Day views
  - Color-coded by priority
  - Click to view task details
  - Filter by status and priority
  - Visual task distribution
  
- **📈 Analytics & Reports** (11 Comprehensive Graphs)
  - **Status Distribution** (Pie Chart) - Task breakdown by status
  - **Priority Distribution** (Bar Chart) - Workload urgency levels
  - **Overdue Tasks by Priority** (Bar Chart) - Critical bottleneck analysis
  - **30-Day Completion Trend** (Area Chart) - Creation vs completion tracking
  - **User Performance** (Grouped Bar Chart) - Individual productivity metrics
  - **Team Distribution** (Multi-color Bar Chart) - Tasks per team
  - **Weekly Progress** (Line Chart) - 8-week trend analysis NEW!
  - **Hourly Distribution** (Bar Chart) - Task creation patterns (24-hour) NEW!
  - **Task Age Distribution** (Horizontal Bar Chart) - Pending task analysis NEW!
  - **Priority Trend** (Stacked Area Chart) - 12-week urgency evolution NEW!
  - **Team Completion Rate** (Bar Chart) - Team efficiency comparison NEW!
  - Custom date range filtering
  - Export capabilities (Excel & PDF with embedded charts)
  - Mobile-optimized responsive charts

### 🔔 Notifications System (Fixed & Working)
- **PWA Push Notifications** - Desktop and mobile notifications ✅ WORKING
- **Real-time Alerts** for:
  - ✅ Task assignments
  - ✅ Task updates
  - ✅ New comments
  - ✅ Due date reminders (24 hours before)
  - ✅ Overdue task alerts
  - ✅ Status changes
- **Smart User Filtering** - Only notifies involved users (assignee, creator, commenters)
- **Granular Control** - Enable/disable by notification type (all enabled by default)
- **Click-to-Open** - Notifications link directly to relevant tasks
- **Browser Support** - Chrome, Firefox, Edge, Safari (iOS 16.4+)
- **Permission Management** - Easy enable/disable interface
- **Enhanced Test Notifications** - Built-in testing with detailed diagnostic output
- **Comprehensive Logging** - Console logs with emojis for easy debugging
- **Diagnostic Tools** - Built-in troubleshooting script (notification-debug.js)
- **Fixed Issues**:
  - ✅ Removed duplicate Socket.IO event listeners
  - ✅ All notification types enabled by default
  - ✅ Added user involvement filtering
  - ✅ Enhanced debugging capabilities

### 📊 Advanced Analytics Features
- **Real-time Data Visualization** using Recharts:
  - 🥧 **Pie Charts** - Status and priority distribution
  - 📊 **Bar Charts** - Team distribution and overdue analysis
  - 📈 **Line Charts** - Completion trends over time
  - 📉 **Area Charts** - Task volume analysis
- **Comprehensive Filtering**:
  - Date ranges (custom or preset)
  - Status filters
  - Priority filters
  - Team filters
  - User filters
- **Export Reports**:
  - 📄 **PDF Reports** - Comprehensive formatted reports with charts
  - 📊 **Excel Reports** - Detailed spreadsheets with data analysis
  - Custom period selection
  - Automated report generation

### 🎭 Interactive UI Components
- **Avatar System** - User avatars with initials and colors
- **Loading States** - Skeleton screens and spinners
- **Toast Notifications** - Success/error feedback messages
- **Modal Dialogs** - Create, edit, and view task details
- **Dropdown Menus** - Context menus and action lists
- **Badge Components** - Status, priority, and category badges
- **Icon System** - Lucide React icons throughout
- **Smooth Animations** - Transitions and hover effects
- **Drag Handles** - Visual indicators for draggable items

---

## ⚡ Real-time Features

### 🔄 Real-time Synchronization
- **Socket.IO Integration** - Instant updates across all clients
- **Live Data Updates** - No page refresh required
- **Multi-tab Sync** - Changes reflect across all open tabs
- **Real-time Events**:
  - Task created/updated/deleted
  - User created/updated/deleted
  - Team created/updated/deleted
  - Comment added
  - Status changed
  - Task assigned
- **Automatic Data Refresh** - Smart polling when socket disconnects
- **Connection Status** - Visual indicators for connection state

---

## 🤖 Automation & Scheduled Tasks

### 📧 Email Automation
- **Daily Overdue Reminders** (9:00 AM):
  - Automatic emails to users with overdue tasks
  - Beautiful HTML email templates
  - Task details and direct links
  - Grouped by user for efficiency
  
- **Weekly Reports** (Monday 8:00 AM):
  - Comprehensive Excel and PDF reports
  - Sent to all admins automatically
  - Include analytics and task summaries
  - Historical trend analysis
  
- **Welcome Emails**:
  - Instant email on user creation
  - Includes login credentials
  - Platform introduction
  - Professional branding

### 📝 Audit Logging
- **ChangeLog System** - Complete audit trail for Admin
- **Tracked Events**:
  - User actions (create, update, delete)
  - Task actions (create, update, delete, status change)
  - Team actions (create, update, delete)
  - Authentication events (login, logout)
  - Automation triggers
- **Detailed Metadata** - Before/after states, timestamps, user info
- **Search & Filter** - Query logs by event type, date, user
- **Export Logs** - Download audit trails for compliance
- **Pagination** - Efficient handling of large log datasets

---

## 🚀 Progressive Web App (PWA)

### 📱 PWA Features
- **Installable** - Add to home screen on mobile and desktop
- **Offline Support** - Service worker caching for offline access
- **App-like Experience** - Standalone display mode
- **Fast Loading** - Pre-cached assets for instant startup
- **Background Sync** - Queue actions when offline
- **App Shortcuts** - Quick access to Dashboard, Tasks, Kanban
- **Responsive Icons** - Adaptive icons for all platforms
- **Manifest Configuration** - Full PWA metadata

---

## 📊 Reporting & Export

### 📄 Report Generation
- **Excel Reports**:
  - Multi-sheet workbooks
  - Task details with formatting
  - Analytics summaries
  - Team breakdowns
  - Priority and status distributions
  
- **PDF Reports**:
  - Professional formatting
  - Embedded charts and graphs
  - Company branding
  - Task tables with details
  - Analytics visualizations
  - Comprehensive summaries

- **Custom Periods**:
  - Today, Last 7 days, Last 30 days
  - This month, Last month
  - Custom date ranges

---

## 🎪 Role Capabilities

| Feature | System Admin | Workspace Admin | Community Admin | HR | Team Lead | Member |
|---------|--------------|-----------------|-----------------|-----|-----------|--------|
| Manage Workspaces | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View All Workspaces | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Bulk User Import | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Bulk User Delete | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Create Teams | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View All Tasks | ✅ | ✅ | ✅ | ✅ | Team Only | Own Only |
| Create Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assign Tasks | ✅ | ✅ | ✅ | ✅ | Team Only | Self Only |
| Delete Tasks | ✅ | ✅ | ✅ | ✅ | Own Tasks | ❌ |
| Manage Teams | ✅ | ✅ | ✅ | ✅ | View Only | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Generate Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change Theme | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Configure Sessions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Role Descriptions:**
- **System Admin**: Full platform control, manages all workspaces
- **Workspace Admin**: Full control within their CORE workspace
- **Community Admin**: Limited admin for COMMUNITY workspaces (no bulk imports, no audit logs)
- **HR**: User and team management within workspace
- **Team Lead**: Team-level task management
- **Member**: Individual task management

---

## 🏗️ Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service
- **Node-Cron** - Scheduled tasks
- **ExcelJS** - Excel report generation
- **jsPDF** - PDF report generation

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **TailwindCSS** - Utility-first CSS framework
- **Recharts** - Data visualization
- **React Big Calendar** - Calendar component
- **Lucide React** - Icon library
- **Socket.IO Client** - Real-time updates
- **jsPDF & jsPDF-AutoTable** - Client-side PDF generation
- **XLSX** - Excel file handling
- **html2canvas** - Screenshot and export
- **Workbox** - PWA and service worker

---

## 📁 Project Architecture

```
TaskFlow/
├── backend/                    # Node.js + Express API
│   ├── config/
│   │   └── db.js              # MongoDB connection configuration
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   ├── roleCheck.js       # Role-based access control
│   │   └── auditLogger.js     # Audit logging middleware
│   ├── models/
│   │   ├── User.js            # User schema and model
│   │   ├── Task.js            # Task schema and model
│   │   ├── Team.js            # Team schema and model
│   │   ├── Comment.js         # Comment schema and model
│   │   ├── Notification.js    # Notification schema and model
│   │   └── ChangeLog.js       # Audit log schema and model
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── users.js           # User management routes
│   │   ├── tasks.js           # Task management routes
│   │   ├── teams.js           # Team management routes
│   │   ├── comments.js        # Comment routes
│   │   ├── notifications.js   # Notification routes
│   │   └── changelog.js       # Audit log routes
│   ├── utils/
│   │   ├── jwt.js             # JWT token utilities
│   │   ├── emailService.js    # Email sending service
│   │   ├── scheduler.js       # Cron job scheduler
│   │   ├── reportGenerator.js # Report generation utilities
│   │   └── changeLogService.js # Audit logging service
│   ├── scripts/
│   │   ├── seedAdmin.js       # Create default admin user
│   │   ├── cleanupAdminUsers.js # Admin user cleanup
│   │   └── checkUserRole.js   # User role verification
│   └── server.js              # Main server entry point
│
└── frontend/                   # React + Vite Application
    ├── public/
    │   ├── manifest.json       # PWA manifest
    │   ├── sw-custom.js        # Custom service worker
    │   ├── icons/              # PWA icons
    │   └── notification-test.html # Notification testing page
    ├── src/
    │   ├── api/
    │   │   └── axios.js        # Axios instance with interceptors
    │   ├── components/
    │   │   ├── Navbar.jsx      # Navigation bar
    │   │   ├── Avatar.jsx      # User avatar component
    │   │   ├── ThemeToggle.jsx # Theme switcher
    │   │   ├── NotificationPrompt.jsx # Notification permission prompt
    │   │   ├── NotificationSettings.jsx # Notification preferences
    │   │   ├── SessionSettings.jsx # Session timeout settings
    │   │   └── AuthDebug.jsx   # Authentication debugging
    │   ├── context/
    │   │   ├── AuthContext.jsx # Authentication context
    │   │   └── ThemeContext.jsx # Theme context
    │   ├── hooks/
    │   │   └── useRealtimeSync.js # Real-time sync hook
    │   ├── pages/
    │   │   ├── Login.jsx       # Login page
    │   │   ├── Dashboard.jsx   # Main dashboard
    │   │   ├── Tasks.jsx       # Task list view
    │   │   ├── Kanban.jsx      # Kanban board view
    │   │   ├── Calendar.jsx    # Calendar view
    │   │   ├── Analytics.jsx   # Analytics and reports
    │   │   ├── Teams.jsx       # Team management
    │   │   ├── UserManagement.jsx # User management
    │   │   ├── ChangeLog.jsx   # Audit logs (Admin only)
    │   │   └── Settings.jsx    # User settings
    │   ├── routes/
    │   │   └── ProtectedRoute.jsx # Route protection
    │   ├── utils/
    │   │   ├── notificationService.js # Notification API
    │   │   ├── reportGenerator.js # Client-side report generation
    │   │   └── comprehensiveReportGenerator.js # PDF reports
    │   ├── App.jsx             # Main app component
    │   ├── main.jsx            # App entry point
    │   └── index.css           # Global styles
    ├── vite.config.js          # Vite configuration
    ├── tailwind.config.js      # TailwindCSS configuration
    └── package.json            # Frontend dependencies
```

---


## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB Atlas** account (or local MongoDB instance)
- **npm** or **yarn** package manager
- **Email Service** (Gmail, SendGrid, or SMTP server)

---

### 📦 Backend Setup

#### 1. Navigate to backend directory
```bash
cd backend
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Secrets (Use strong, random strings)
JWT_SECRET=your_jwt_secret_key_here
REFRESH_SECRET=your_refresh_secret_key_here

# Frontend URL
CLIENT_URL=http://localhost:3000

# Email Configuration (Gmail Example)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Email Configuration (Custom SMTP)
# EMAIL_HOST=smtp.example.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_USER=your-email@example.com
# EMAIL_PASSWORD=your-email-password

# Application Settings
APP_NAME=TaskFlow
COMPANY_NAME=Your Company
```

#### 4. MongoDB Atlas Setup

⚠️ **CRITICAL** - Configure MongoDB Atlas properly:

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Navigate to **Network Access**
3. Click **"Add IP Address"**
4. Choose one of:
   - Add your current IP address (recommended for development)
   - Allow access from anywhere: `0.0.0.0/0` (for testing only)
5. Click **"Confirm"**

#### 5. Email Service Setup

**For Gmail:**
1. Enable 2-Factor Authentication in your Google Account
2. Generate an App Password:
   - Go to [Google Account Settings](https://myaccount.google.com/security)
   - Select "2-Step Verification" → "App passwords"
   - Generate a new app password
   - Use this password in `EMAIL_PASSWORD`

**For Other Services:**
- Configure SMTP settings in `.env`
- Ensure your email service allows programmatic access

#### 6. Create Default Admin User

```bash
npm run seed:admin
```

This creates a default **system administrator** account:
- **Email**: `admin@taskflow.com`
- **Password**: `Admin@123`
- **Type**: System Admin (no workspace required)
- **Access**: Full system-wide access to all workspaces

⚠️ **Change this password immediately after first login!**

**System Admin vs Regular Admin:**
- **System Admin** (no workspace): Can see and manage ALL workspaces and data
- **Regular Admin** (with workspace): Can only manage their own workspace

You can create workspace-specific admins later through User Management.

#### 7. Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Backend will run at: `http://localhost:5000`

---

### 🎨 Frontend Setup

#### 1. Navigate to frontend directory
```bash
cd frontend
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

#### 4. Start Development Server

```bash
npm run dev
```

Frontend will run at: `http://localhost:3000`

#### 5. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

---

### 🔐 First Time Login

**For System Administrators:**
1. Open your browser to `http://localhost:3000`
2. Login with default system admin credentials:
   - **Email**: `admin@taskflow.com`
   - **Password**: `Admin@123`
3. **Immediately change the password** in Settings
4. As a system admin, you can:
   - View and manage ALL workspaces via Workspaces menu
   - Create CORE or COMMUNITY workspaces
   - Access all data across the system
   - Create workspace-specific admins

**For New Community Users:**
1. Open your browser to `http://localhost:3000`
2. Click **"Create Community Workspace"** on the login page
3. Fill in the registration form:
   - Workspace name (your company/team name)
   - Your full name
   - Email address
   - Password
4. Your FREE community workspace will be created instantly with:
   - ✅ Up to 10 users
   - ✅ Up to 100 tasks
   - ✅ Up to 3 teams
   - ✅ All core task management features
   - ⚠️ Limited admin features (no bulk imports, no audit logs)
5. You'll be automatically logged in as the **Community Admin**
6. To upgrade features, contact a System Administrator to upgrade to CORE workspace

**For Invited Users:**
- Wait for your workspace admin to create your account
- Check your email for login credentials
- Use the credentials to log in at `http://localhost:3000`

---

### 📧 Email Testing

Test email functionality:

```bash
# In backend directory
npm run test:email
```

This sends a test email to verify configuration.

---

### 🛠️ Additional Scripts

**Backend:**
```bash
npm run dev              # Start with nodemon (auto-reload)
npm start                # Start production server
npm run seed:admin       # Create default admin user
npm run cleanup:admins   # Cleanup duplicate admin users
```

**Frontend:**
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
```

---

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Click the **install icon** (⊕) in the address bar
2. Click **"Install"**
3. App will open in a standalone window

### iOS (Safari)
1. Open in Safari browser
2. Tap the **Share** button
3. Select **"Add to Home Screen"**
4. Tap **"Add"**

### Android (Chrome)
1. Open in Chrome browser
2. Tap the **menu** (⋮)
3. Select **"Install App"** or **"Add to Home Screen"**

---

## 🔔 Enabling Notifications

1. Go to **Settings** → **Notifications**
2. Click **"Enable Notifications"**
3. Allow permissions in browser prompt
4. Customize notification preferences
5. Test with the **"Test Notification"** button

**Supported Browsers:**
- ✅ Chrome (Desktop & Android)
- ✅ Firefox (Desktop & Android)
- ✅ Edge (Desktop)
- ✅ Safari (iOS 16.4+, macOS)

---

## 🎨 Customizing Your Instance

### Change Theme
- Click the **theme icon** (🌙/☀️) in the navigation bar
- Select your preferred theme mode
- Choose a color scheme
- Settings are saved automatically

### Configure Session Timeout
- Go to **Settings** → **Session Timeout**
- Select desired timeout period (30 min - 24 hours)
- Save settings
- Takes effect on next login

### Customize Notifications
- Go to **Settings** → **Notifications**
- Toggle notification types on/off
- Preferences are saved per user

---

## 📊 Using the Platform

### For Admins
1. **Create Teams** - Organize users into functional teams
2. **Add Users** - Create user accounts (they receive welcome emails)
3. **Assign Roles** - Set appropriate roles for each user
4. **Monitor Activity** - View audit logs in ChangeLog
5. **Generate Reports** - Export analytics as Excel/PDF

### For Team Leads
1. **Create Tasks** - Add tasks for your team
2. **Assign Work** - Assign tasks to team members
3. **Track Progress** - Monitor task status in Kanban view
4. **Review Analytics** - Check team performance

### For All Users
1. **View Dashboard** - See your tasks and statistics
2. **Manage Tasks** - Update status, add comments
3. **Use Calendar** - Plan work with calendar view
4. **Enable Notifications** - Stay updated on task changes
5. **Collaborate** - Comment on tasks to discuss with team

---

## 🔧 Troubleshooting

### Backend Won't Start
- ✅ Check MongoDB connection string in `.env`
- ✅ Ensure MongoDB Atlas IP whitelist is configured
- ✅ Verify Node.js version (v18+)
- ✅ Run `npm install` to ensure all dependencies are installed

### Emails Not Sending
- ✅ Verify email credentials in `.env`
- ✅ Check if using Gmail App Password (not regular password)
- ✅ Run `npm run test:email` to test configuration
- ✅ Check spam folder for test emails

### Notifications Not Working
- ✅ Ensure HTTPS or localhost (required for notifications)
- ✅ Check browser notification permissions
- ✅ Verify service worker is registered (DevTools → Application)
- ✅ Use supported browser (see list above)

### Real-time Updates Not Syncing
- ✅ Check Socket.IO connection status
- ✅ Verify `VITE_SOCKET_URL` in frontend `.env`
- ✅ Check browser console for connection errors
- ✅ Ensure backend server is running

### PWA Not Installing
- ✅ Must be served over HTTPS (or localhost)
- ✅ Check manifest.json is accessible
- ✅ Verify service worker is registered
- ✅ Use supported browser

### Workspace Deactivated Error
If you see **"Your workspace has been deactivated. Please contact support."**:
- ✅ Your workspace has been disabled by a system administrator
- ✅ You cannot access any features while the workspace is inactive
- ✅ Contact your system administrator to reactivate the workspace
- ✅ System administrators can reactivate workspaces from the Workspace Management panel
- ✅ All your data remains intact and will be accessible once reactivated

---

## 📚 Additional Documentation

### Core Documentation
- [**Landing Page Guide**](./LANDING_PAGE_GUIDE.md) - Complete implementation guide for the landing page
- [**Landing Page Quick Reference**](./LANDING_QUICK_REF.md) - Developer quick reference
- [**Workspace Quick Start Guide**](./WORKSPACE_QUICK_START.md) - Community registration & workspace management
- [**Workspace Activation Guide**](./WORKSPACE_ACTIVATION_GUIDE.md) - Activate/deactivate workspaces & access control
- [System Administrator Access Guide](./SYSTEM_ADMIN_ACCESS.md)
- [Multi-Workspace Architecture](./FINAL_WORKSPACE_SUMMARY.md)
- [Bulk User Import Guide](./BULK_USER_IMPORT_GUIDE.md)

### Feature Guides
- [Dashboard Features Fixed](./DASHBOARD_FEATURES_FIXED.md) - Search, filters, export fixes
- [Analytics Dashboard Improvements](./ANALYTICS_DASHBOARD_IMPROVEMENTS.md) - 11 comprehensive graphs
- [Calendar View Documentation](./CALENDAR_VIEW_DOCUMENTATION.md)
- [Mobile Responsiveness Guide](./MOBILE_RESPONSIVENESS_IMPROVEMENTS.md)
- [Real-time Sync Implementation](./REALTIME_SYNC_IMPLEMENTATION.md)

### Notifications
- [Quick Start Notifications](./QUICK_START_NOTIFICATIONS.md) - 30-second test guide
- [Notifications Fixed README](./NOTIFICATIONS_FIXED_README.md) - What was fixed and how
- [PWA Notification Documentation](./PWA_NOTIFICATION_DOCUMENTATION.md)
- [Notification Testing Guide](./NOTIFICATION_TESTING_GUIDE.md)
- [Notification Troubleshooting](./NOTIFICATION_TROUBLESHOOTING.md)

### Technical Guides
- [Automatic Logout Test Guide](./AUTOMATIC_LOGOUT_TEST_GUIDE.md) - Session management testing
- [Auth Error Fix Guide](./AUTH_ERROR_FIX_GUIDE.md)
- [Workspace Implementation Status](./WORKSPACE_IMPLEMENTATION_STATUS.md)

---

## 🤝 Contributing

This is a complete, production-ready task management system. To contribute:

1. Report bugs via issues
2. Suggest features via issues
3. Fork and submit pull requests
4. Follow existing code style
5. Test thoroughly before submitting

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👨‍💻 Support

For issues, questions, or feature requests:
- Check the documentation files in the repository
- Review troubleshooting section above
- Contact your system administrator

---

## 🎉 Features Summary

✅ **Multi-Workspace Architecture** - CORE and COMMUNITY workspace types with complete isolation  
✅ **Community Registration** - Self-service free workspace creation with instant setup  
✅ **Workspace Management** - System admin control panel with activation/deactivation  
✅ **Enhanced Authentication** - JWT with refresh tokens, improved session management  
✅ **Advanced Authorization** - 6 role-based access levels with feature restrictions  
✅ **Data Isolation** - Complete workspace separation with scoped queries  
✅ **Task Management** - Complete CRUD with comments and real-time updates  
✅ **Team Management** - Teams with leads and members, drag-and-drop reordering  
✅ **User Management** - Bulk import, creation, deletion (CORE workspaces)  
✅ **Real-time Sync** - Socket.IO across all features with auto-reconnect  
✅ **Notifications** - ✅ FIXED PWA push notifications with smart user filtering  
✅ **Email Automation** - Welcome emails, overdue reminders, weekly reports  
✅ **Advanced Reports** - Excel and PDF export with embedded charts  
✅ **Enhanced Analytics** - 11 comprehensive graphs with mobile optimization  
✅ **Audit Logging** - Complete activity trail (CORE workspaces only)  
✅ **PWA Support** - Installable, offline-capable, smart install banner  
✅ **Theming** - Multiple themes and color schemes with smooth transitions  
✅ **Mobile Responsive** - ✅ ENHANCED mobile optimization for all screens  
✅ **Calendar View** - Visual task planning with multiple views  
✅ **Kanban Board** - Drag & drop task management with real-time sync  
✅ **Improved Dashboard** - ✅ FIXED search, filters, export, PWA banner  
✅ **Session Management** - ✅ FIXED automatic logout with proper timer persistence  

---

**Built with ❤️ for modern team collaboration**
