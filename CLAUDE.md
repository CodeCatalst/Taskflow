# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Backend
- Start in development mode: `cd backend && npm run dev`
- Start in production mode: `cd backend && npm start`
- Seed default admin user: `cd backend && npm run seed:admin`
- Test email configuration: `cd backend && npm run test:email`
- Cleanup admin users: `cd backend && npm run cleanup:admins`
- Migrate workspaces: `cd backend && npm run migrate:workspaces`

### Frontend
- Start development server: `cd frontend && npm run dev`
- Build for production: `cd frontend && npm run build`
- Preview production build: `cd frontend && npm run preview`

## Architecture Overview

TaskFlow is an enterprise task management system with a decoupled MERN stack architecture.

### High-Level Structure
- `backend/`: Node.js/Express API serving as the core business logic and data layer.
- `frontend/`: React application built with Vite and TailwindCSS.

### Backend Architecture
- **Database**: MongoDB with Mongoose ODM.
- **Real-time**: Socket.IO for instant synchronization of tasks, users, and teams.
- **Authentication**: JWT-based with access and refresh tokens.
- **Authorization**: Role-Based Access Control (RBAC) with 6 roles: System Admin, Workspace Admin, Community Admin, HR, Team Lead, and Member.
- **Multi-tenancy**: Workspace-based isolation. Data is scoped by `Workspace` to ensure separation between CORE (enterprise) and COMMUNITY (free) tenants.
- **Email System**: A unified template engine using Handlebars and Brevo API for transactional emails (Welcome, Overdue Reminders, Weekly Reports).
- **Scheduling**: `node-cron` used for daily overdue reminders and weekly reports.
- **Audit Trail**: `ChangeLog` system tracking all significant modifications across the platform.

### Frontend Architecture
- **State Management**: React Context for Authentication and Theming.
- **Routing**: `react-router-dom` with `ProtectedRoute` wrappers for RBAC.
- **Data Visualization**: Recharts for advanced analytics (11+ graphs).
- **PWA**: Integrated service workers via `vite-plugin-pwa` for offline support and push notifications.
- **UI/UX**: TailwindCSS for styling, Lucide React for icons, and Framer Motion for animations.

### Key Data Models
- `User`: Profiles, roles, and workspace assignments.
- `Workspace`: Tenant configuration and activation status.
- `Task`: Task lifecycle (Todo -> In Progress -> Review -> Done).
- `Team`: Logical groupings of users within a workspace.
- `ChangeLog`: Audit records for administrative tracking.


### Role Capabilities

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

### Documentation References

- **Landing Page**: `LANDING_PAGE_GUIDE.md`, `LANDING_QUICK_REF.md`
- **Workspaces**: `WORKSPACE_QUICK_START.md`, `WORKSPACE_ACTIVATION_GUIDE.md`, `FINAL_WORKSPACE_SUMMARY.md`
- **Administration**: `SYSTEM_ADMIN_ACCESS.md`, `BULK_USER_IMPORT_GUIDE.md`
- **UI/UX**: `DASHBOARD_FEATURES_FIXED.md`, `ANALYTICS_DASHBOARD_IMPROVEMENTS.md`, `CALENDAR_VIEW_DOCUMENTATION.md`, `MOBILE_RESPONSIVENESS_IMPROVEMENTS.md`
- **Synchronization**: `REALTIME_SYNC_IMPLEMENTATION.md`
- **Notifications**: `QUICK_START_NOTIFICATIONS.md`, `NOTIFICATIONS_FIXED_README.md`, `PWA_NOTIFICATION_DOCUMENTATION.md`, `NOTIFICATION_TESTING_GUIDE.md`, `NOTIFICATION_TROUBLESHOOTING.md`
- **HR & Email**: `UNIFIED_EMAIL_SYSTEM.md`, `API_REFERENCE_HR_MODULE.md`, `HR_EMAIL_SYSTEM_README.md`, `IMPLEMENTATION_SUMMARY.md`
- **Auth & Infrastructure**: `AUTOMATIC_LOGOUT_TEST_GUIDE.md`, `AUTH_ERROR_FIX_GUIDE.md`, `WORKSPACE_IMPLEMENTATION_STATUS.md`

### Repo Tree


├── .orchids/
│   └── orchids.json
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auditLogger.js
│   │   ├── auth.js
│   │   ├── roleCheck.js
│   │   ├── workspaceContext.js
│   │   └── workspaceGuard.js
│   ├── models/
│   │   ├── Attendance.js
│   │   ├── ChangeLog.js
│   │   ├── Comment.js
│   │   ├── EmailTemplate.js
│   │   ├── Holiday.js
│   │   ├── LeaveBalance.js
│   │   ├── LeaveRequest.js
│   │   ├── LeaveType.js
│   │   ├── Notification.js
│   │   ├── Recipient.js
│   │   ├── RevokedToken.js
│   │   ├── SecurityThrottleState.js
│   │   ├── Task.js
│   │   ├── Team.js
│   │   ├── User.js
│   │   └── Workspace.js
│   ├── routes/
│   │   ├── attendance.js
│   │   ├── auth.js
│   │   ├── changelog.js
│   │   ├── comments.js
│   │   ├── emailTemplates.js
│   │   ├── holidays.js
│   │   ├── hrCalendar.js
│   │   ├── leaves.js
│   │   ├── leaveTypes.js
│   │   ├── notifications.js
│   │   ├── tasks.js
│   │   ├── teams.js
│   │   ├── users.js
│   │   └── workspaces.js
│   ├── scripts/
│   │   ├── assign-admins-to-core.js
│   │   ├── assign-tasks-to-workspace.js
│   │   ├── check-leave-types.js
│   │   ├── check-task-workspaces.js
│   │   ├── check-teams.js
│   │   ├── check-workspace-assignments.js
│   │   ├── check-workspace-status.js
│   │   ├── checkCommunityUsers.js
│   │   ├── checkUserRole.js
│   │   ├── checkUserWorkspace.js
│   │   ├── cleanup-old-workspaces.js
│   │   ├── cleanupAdminUsers.js
│   │   ├── create-core-workspace.js
│   │   ├── create-multi-workspace-test-user.js
│   │   ├── fix-team-membership.js
│   │   ├── fix-workspace-context.js
│   │   ├── makeSuperAdmin.js
│   │   ├── migrate-multiple-teams.js
│   │   ├── migrate-to-multi-workspace.js
│   │   ├── migrateToWorkspaces.js
│   │   ├── quick-check.js
│   │   ├── remove-duplicate-team-members.js
│   │   ├── seed-leave-types.js
│   │   ├── seedAdmin.js
│   │   ├── seedEmailTemplates.js
│   │   ├── seedHRModule.js
│   │   ├── test-hr-team-removal.js
│   │   ├── test-remove-member.js
│   │   ├── testEmail.js
│   │   ├── testHRModule.js
│   │   ├── testUserCreationEmail.js
│   │   └── verify-teams-migration.js
│   ├── services/
│   │   ├── brevoEmailService.js
│   │   ├── hrActionService.js
│   │   └── hrEventService.js
│   ├── test-data/
│   │   └── bulk-import-sample.json
│   ├── utils/
│   │   ├── authz.js
│   │   ├── changeLogService.js
│   │   ├── emailService.js
│   │   ├── getClientIP.js
│   │   ├── imageValidation.js
│   │   ├── jwt.js
│   │   ├── reportGenerator.js
│   │   ├── requestSanitizer.js
│   │   ├── requestValidation.js
│   │   ├── scheduler.js
│   │   ├── security.js
│   │   ├── socketEvents.js
│   │   └── templateVariableRegistry.js
│   ├── .env.example
│   ├── .gitignore
│   ├── BREVO_SETUP_INSTRUCTIONS.md
│   ├── check-users.js
│   ├── fix-user-workspaces.js
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js
│   ├── test-automation.js
│   ├── test-brevo-email.js
│   ├── test-bulk-import.js
│   ├── test-check-leaves.js
│   ├── test-email-connection.js
│   ├── test-email-production.js
│   ├── test-email.js
│   ├── test-leave-approval.js
│   ├── test-render-email.js
│   ├── test-routes.js
│   ├── vercel.json
│   └── workspaces.js
├── frontend/
│   ├── dev-dist/
│   │   ├── registerSW.js
│   │   ├── sw.js
│   │   ├── sw.js.map
│   │   ├── workbox-a959eb95.js
│   │   └── workbox-a959eb95.js.map
│   ├── dist/
│   │   ├── assets/
│   │   │   ├── chart-vendor-Bvp7Egfc.js
│   │   │   ├── html2canvas.esm-CBrSDip1.js
│   │   │   ├── index-D4-TAe6Q.css
│   │   │   ├── index-foalpYOA.js
│   │   │   ├── index.es-DzjBkDYg.js
│   │   │   ├── purify.es-B6FQ9oRL.js
│   │   │   ├── react-vendor-DDicXdh7.js
│   │   │   └── workbox-window.prod.es5-B9K5rw8f.js
│   │   ├── icons/
│   │   │   ├── apple-touch-icon-180x180.png
│   │   │   ├── cc-logo.png
│   │   │   ├── cc-logo.svg
│   │   │   ├── maskable-icon-512x512.png
│   │   │   ├── pwa-192x192.png
│   │   │   ├── pwa-512x512.png
│   │   │   ├── pwa-64x64.png
│   │   │   └── README.md
│   │   ├── browserconfig.xml
│   │   ├── CC logo.png
│   │   ├── check-auth.js
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   ├── logo.ico
│   │   ├── logo.png
│   │   ├── manifest.json
│   │   ├── manifest.webmanifest
│   │   ├── notification-debug.js
│   │   ├── notification-test.html
│   │   ├── pwa-test.html
│   │   ├── sw-custom.js
│   │   ├── sw.js
│   │   └── workbox-28240d0c.js
│   ├── public/
│   │   ├── icons/
│   │   │   ├── apple-touch-icon-180x180.png
│   │   │   ├── cc-logo.png
│   │   │   ├── cc-logo.svg
│   │   │   ├── maskable-icon-512x512.png
│   │   │   ├── pwa-192x192.png
│   │   │   ├── pwa-512x512.png
│   │   │   ├── pwa-64x64.png
│   │   │   └── README.md
│   │   ├── browserconfig.xml
│   │   ├── CC logo.png
│   │   ├── check-auth.js
│   │   ├── favicon.ico
│   │   ├── logo.ico
│   │   ├── logo.png
│   │   ├── manifest.json
│   │   ├── notification-debug.js
│   │   ├── notification-test.html
│   │   ├── pwa-test.html
│   │   └── sw-custom.js
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   ├── components/
│   │   │   ├── landing/
│   │   │   │   ├── ConversionFooter.jsx
│   │   │   │   ├── HeroSection.jsx
│   │   │   │   ├── LandingNav.jsx
│   │   │   │   ├── Philosophy.jsx
│   │   │   │   ├── PricingComparison.jsx
│   │   │   │   ├── ProductExperience.jsx
│   │   │   │   └── TrustArchitecture.jsx
│   │   │   ├── layouts/
│   │   │   │   ├── index.js
│   │   │   │   ├── ResponsiveCard.jsx
│   │   │   │   ├── ResponsiveGrid.jsx
│   │   │   │   ├── ResponsiveModal.jsx
│   │   │   │   └── ResponsivePageLayout.jsx
│   │   │   ├── modals/
│   │   │   │   └── ConfirmModal.jsx
│   │   │   ├── AuthDebug.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── NotificationPrompt.jsx
│   │   │   ├── NotificationSettings.jsx
│   │   │   ├── SessionSettings.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── WorkspaceSelector.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── SidebarContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── WorkspaceContext.jsx
│   │   ├── hooks/
│   │   │   ├── useConfirmModal.js
│   │   │   ├── useNotifications.js
│   │   │   └── useRealtimeSync.js
│   │   ├── pages/
│   │   │   ├── Analytics.jsx
│   │   │   ├── AttendancePage.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── ChangeLog.jsx
│   │   │   ├── CommunityRegister.jsx
│   │   │   ├── CommunityUserManagement.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EmailCenter.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── HRCalendar.jsx
│   │   │   ├── HRDashboard.jsx
│   │   │   ├── Kanban.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LeavesPage.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── RegisterDisabled.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── ScreenshotDemo.jsx
│   │   │   ├── Settings_NEW.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── TasksResponsive.jsx
│   │   │   ├── Teams.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   ├── VerifyEmail.jsx
│   │   │   └── WorkspaceManagement.jsx
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── utils/
│   │   │   ├── cn.js
│   │   │   ├── comprehensiveReportGenerator.js
│   │   │   ├── landingUtils.js
│   │   │   ├── mockDataGenerator.js
│   │   │   ├── notificationService.js
│   │   │   └── reportGenerator.js
│   │   ├── animations.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── mobile-responsive.css
│   ├── .gitignore
│   ├── fix-encoding.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── vite.config.js
├── UI/
│   ├── analytics_&_reports/
│   │   ├── code.html
│   │   └── screen.png
│   ├── calendar_view/
│   │   ├── code.html
│   │   └── screen.png
│   ├── kanban_board/
│   │   ├── code.html
│   │   └── screen.png
│   ├── login_screen/
│   │   ├── code.html
│   │   └── screen.png
│   ├── main_dashboard/
│   │   ├── code.html
│   │   └── screen.png
│   ├── settings_screen/
│   │   ├── code.html
│   │   └── screen.png
│   ├── task_detail_panel/
│   │   ├── code.html
│   │   └── screen.png
│   ├── task_list_view/
│   │   ├── code.html
│   │   └── screen.png
│   └── user_&_team_management/
│       ├── code.html
│       └── screen.png
├── .gitignore
├── Email Drafts.docx
├── EMAIL_VARIABLES_REFERENCE.md
├── fix-theme-colors.ps1
├── package-lock.json
├── README.md
├── remove-console-logs.ps1
└── render.yaml

