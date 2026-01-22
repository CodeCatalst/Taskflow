import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import useNotifications from './hooks/useNotifications';
import Login from './pages/Login';
import Register from './pages/RegisterDisabled';
import CommunityRegister from './pages/CommunityRegister';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Kanban from './pages/Kanban';
import Teams from './pages/Teams';
import UserManagement from './pages/UserManagement';
import CommunityUserManagement from './pages/CommunityUserManagement';
import WorkspaceManagement from './pages/WorkspaceManagement';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';
import ChangeLog from './pages/ChangeLog';
import Notifications from './pages/Notifications';
import Landing from './pages/Landing';
import ScreenshotDemo from './pages/ScreenshotDemo';
import AttendancePage from './pages/AttendancePage';
import HRCalendar from './pages/HRCalendar';
import LeavesPage from './pages/LeavesPage';
import HRDashboard from './pages/HRDashboard';
import EmailCenter from './pages/EmailCenter';

function AppContent() {
  // Initialize notifications
  useNotifications();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<CommunityRegister />} />
      <Route path="/register-community" element={<CommunityRegister />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        }
      />

      <Route
        path="/kanban"
        element={
          <ProtectedRoute>
            <Kanban />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teams"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr', 'team_lead', 'community_admin']}>
            <Teams />
          </ProtectedRoute>
        }
      />

      {/* Unified HR Dashboard */}
      <Route
        path="/hr/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr', 'community_admin']}>
            <HRDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hr/attendance"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr', 'team_lead', 'member']}>
            <AttendancePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hr/calendar"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr', 'team_lead', 'member']}>
            <HRCalendar />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hr/leaves"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr', 'team_lead', 'member']}>
            <LeavesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hr/email-center"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <EmailCenter />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/community-users"
        element={
          <ProtectedRoute allowedRoles={['community_admin']}>
            <CommunityUserManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workspaces"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <WorkspaceManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/changelog"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ChangeLog />
          </ProtectedRoute>
        }
      />

      {/* Screenshot Demo - Public route for capturing marketing screenshots */}
      <Route path="/screenshot-demo" element={<ScreenshotDemo />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <SidebarProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AppContent />
            </BrowserRouter>
          </SidebarProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;