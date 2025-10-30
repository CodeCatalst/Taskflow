# TaskFlow - Complete Project Structure

## 📁 Project Overview

```
TaskFlow/
├── backend/                      # Node.js + Express Backend
│   ├── config/
│   │   └── db.js                # MongoDB connection configuration
│   │
│   ├── models/                  # Mongoose Data Models
│   │   ├── User.js              # User schema with bcrypt hashing
│   │   ├── Team.js              # Team schema with HR and Lead
│   │   ├── Task.js              # Task schema with status tracking
│   │   ├── Comment.js           # Comment schema for task discussions
│   │   └── Notification.js      # Notification schema for real-time alerts
│   │
│   ├── middleware/              # Express Middleware
│   │   ├── auth.js              # JWT verification middleware
│   │   └── roleCheck.js         # Role-based access control
│   │
│   ├── routes/                  # API Route Handlers
│   │   ├── auth.js              # Authentication routes (register, login, refresh)
│   │   ├── users.js             # User management routes
│   │   ├── teams.js             # Team management routes
│   │   ├── tasks.js             # Task CRUD routes with filters
│   │   ├── comments.js          # Comment routes for tasks
│   │   └── notifications.js     # Notification routes
│   │
│   ├── utils/
│   │   └── jwt.js               # JWT token generation and verification
│   │
│   ├── server.js                # Main Express server with Socket.IO
│   ├── package.json             # Backend dependencies
│   └── .env                     # Environment variables
│
├── frontend/                    # React + Vite Frontend
│   ├── public/                  # Static assets
│   │   └── vite.svg
│   │
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js         # Axios instance with interceptors
│   │   │
│   │   ├── components/          # Reusable React Components
│   │   │   └── Navbar.jsx       # Navigation bar with notifications
│   │   │
│   │   ├── context/             # React Context Providers
│   │   │   └── AuthContext.jsx  # Authentication & Socket.IO context
│   │   │
│   │   ├── pages/               # Main Application Pages
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── Register.jsx     # Registration page
│   │   │   ├── Dashboard.jsx    # Dashboard with statistics
│   │   │   ├── Tasks.jsx        # Task management page
│   │   │   └── Teams.jsx        # Team management page
│   │   │
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx  # Route protection wrapper
│   │   │
│   │   ├── App.jsx              # Main App component with routing
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Global styles with Tailwind
│   │
│   ├── index.html               # HTML entry point
│   ├── vite.config.js           # Vite configuration
│   ├── tailwind.config.js       # TailwindCSS configuration
│   ├── postcss.config.js        # PostCSS configuration
│   ├── package.json             # Frontend dependencies
│   └── .env                     # Frontend environment variables
│
├── README.md                    # Main project documentation
├── MONGODB_SETUP.md             # MongoDB Atlas setup guide
├── PROJECT_STRUCTURE.md         # This file
├── setup.sh                     # Automated setup script
└── test-api.sh                  # API testing script
```

## 🔧 Key Files Explained

### Backend Core Files

**server.js**
- Main Express server initialization
- Socket.IO configuration
- Middleware setup (CORS, body-parser)
- Route registration
- Error handling

**config/db.js**
- MongoDB connection using Mongoose
- Connection error handling
- Environment-based configuration

### Backend Models

**User.js**
- Fields: full_name, email, password_hash, role, team_id
- Pre-save hook for password hashing
- Password comparison method
- Roles: admin, hr, team_lead, member

**Team.js**
- Fields: name, hr_id, lead_id, members[]
- References to User model
- Team member management

**Task.js**
- Fields: title, description, status, priority, assigned_to, team_id
- Status: todo, in_progress, review, done, archived
- Priority: low, medium, high, urgent
- Progress tracking (0-100%)

**Comment.js**
- Fields: task_id, author_id, content
- References to Task and User models
- Timestamp tracking

**Notification.js**
- Fields: user_id, type, payload, read_at
- Types: task_assigned, comment_added, status_changed, task_due
- Read status tracking

### Backend Routes

**auth.js** (Public routes)
- POST /register - Register new user
- POST /login - User login
- POST /refresh - Refresh access token
- POST /logout - User logout

**users.js** (Protected routes)
- GET /me - Get current user
- PATCH /me - Update profile
- GET / - Get all users (Admin/HR)
- PATCH /:id/role - Update user role (Admin/HR)

**teams.js** (Protected routes)
- POST / - Create team (Admin/HR)
- GET / - Get teams
- GET /:id - Get single team
- PATCH /:id - Update team (Admin/HR)
- POST /:id/members - Add member (Admin/HR)
- DELETE /:id/members/:userId - Remove member (Admin/HR)

**tasks.js** (Protected routes)
- POST / - Create task
- GET / - Get tasks with filters
- GET /:id - Get single task
- PATCH /:id - Update task
- DELETE /:id - Delete task (Admin/HR/Lead)

**comments.js** (Protected routes)
- GET /:taskId/comments - Get task comments
- POST /:taskId/comments - Add comment

**notifications.js** (Protected routes)
- GET / - Get user notifications
- PATCH /mark-read - Mark as read

### Frontend Core Files

**main.jsx**
- React app initialization
- Root component mounting

**App.jsx**
- React Router configuration
- Route definitions with protection
- AuthProvider wrapper

**index.css**
- TailwindCSS imports
- Global styles
- Custom utility classes

### Frontend Context

**AuthContext.jsx**
- User authentication state
- Login/Register/Logout functions
- Socket.IO initialization
- Token management
- Auto-refresh token handling

### Frontend Pages

**Login.jsx**
- Email/password login form
- Error handling
- Redirect to dashboard on success

**Register.jsx**
- User registration form
- Role selection
- Password confirmation
- Validation

**Dashboard.jsx**
- Task statistics cards
- Recent tasks list
- Quick action buttons
- Role-based content

**Tasks.jsx**
- Task board with cards
- Create task modal
- Task detail modal with comments
- Real-time updates via Socket.IO
- Filters by status and priority
- Task assignment (role-based)

**Teams.jsx**
- Team cards grid
- Create team modal (Admin/HR)
- Add member modal
- Remove member functionality
- Team member list

### Frontend Components

**Navbar.jsx**
- User information display
- Role badge
- Notification bell with dropdown
- Real-time notification count
- Logout button

## 🔄 Data Flow

### Authentication Flow
```
1. User enters credentials → Login.jsx
2. Axios POST to /api/auth/login
3. Backend validates credentials
4. JWT tokens generated
5. Tokens stored in localStorage
6. User data stored in AuthContext
7. Socket.IO connection established
8. Redirect to Dashboard
```

### Task Creation Flow
```
1. User clicks "Create Task" → Tasks.jsx
2. Modal opens with form
3. User fills task details
4. Axios POST to /api/tasks
5. Backend validates permissions
6. Task saved to MongoDB
7. Socket.IO emits 'task:created'
8. All connected clients receive update
9. Task list refreshes automatically
10. Notification created for assignee
```

### Real-time Update Flow
```
1. User A updates task status
2. Backend processes update
3. Socket.IO emits 'task:updated'
4. User B's socket receives event
5. Task list updates automatically
6. Notification badge increments
```

## 🎨 UI Components Hierarchy

```
App
├── AuthProvider
│   ├── BrowserRouter
│   │   ├── Routes
│   │   │   ├── Login (public)
│   │   │   ├── Register (public)
│   │   │   └── ProtectedRoute
│   │   │       ├── Dashboard
│   │   │       │   ├── Navbar
│   │   │       │   ├── Stats Cards
│   │   │       │   └── Task List
│   │   │       ├── Tasks
│   │   │       │   ├── Navbar
│   │   │       │   ├── Filters
│   │   │       │   ├── Task Cards
│   │   │       │   ├── Create Modal
│   │   │       │   └── Detail Modal
│   │   │       └── Teams
│   │   │           ├── Navbar
│   │   │           ├── Team Cards
│   │   │           ├── Create Modal
│   │   │           └── Add Member Modal
```

## 🔐 Security Implementation

### Password Security
- Bcrypt hashing (10 salt rounds)
- Pre-save hook in User model
- Password never returned in API responses

### JWT Tokens
- Access Token: 15 minutes expiry
- Refresh Token: 7 days expiry
- Bearer token in Authorization header
- Auto-refresh on expiry

### Role-Based Access
- Middleware checks on protected routes
- Frontend UI adapts to user role
- Backend enforces permissions

### Socket.IO Security
- User-specific rooms
- Authentication required
- Event validation

## 📊 Database Schema

### Collections

1. **users**
   - _id (ObjectId)
   - full_name (String)
   - email (String, unique)
   - password_hash (String)
   - role (String: admin|hr|team_lead|member)
   - team_id (ObjectId, ref: teams)
   - created_at (Date)
   - updated_at (Date)

2. **teams**
   - _id (ObjectId)
   - name (String)
   - hr_id (ObjectId, ref: users)
   - lead_id (ObjectId, ref: users)
   - members (Array of ObjectId, ref: users)
   - created_at (Date)

3. **tasks**
   - _id (ObjectId)
   - title (String)
   - description (String)
   - status (String)
   - priority (String)
   - created_by (ObjectId, ref: users)
   - assigned_to (ObjectId, ref: users)
   - team_id (ObjectId, ref: teams)
   - due_date (Date)
   - progress (Number, 0-100)
   - created_at (Date)
   - updated_at (Date)

4. **comments**
   - _id (ObjectId)
   - task_id (ObjectId, ref: tasks)
   - author_id (ObjectId, ref: users)
   - content (String)
   - created_at (Date)

5. **notifications**
   - _id (ObjectId)
   - user_id (ObjectId, ref: users)
   - type (String)
   - payload (Object)
   - read_at (Date, nullable)
   - created_at (Date)

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Update MongoDB connection string
- [ ] Set production environment variables
- [ ] Configure CORS for production domain
- [ ] Set secure JWT secrets
- [ ] Enable rate limiting
- [ ] Add error logging (e.g., Sentry)

### Backend (Railway/Render)
- [ ] Set NODE_ENV=production
- [ ] Configure build command
- [ ] Set environment variables
- [ ] Configure health check endpoint
- [ ] Enable auto-deploy from GitHub

### Frontend (Vercel)
- [ ] Set VITE_API_URL to production backend
- [ ] Set VITE_SOCKET_URL to production backend
- [ ] Configure build settings
- [ ] Set environment variables
- [ ] Enable auto-deploy from GitHub

---

**This structure supports a scalable, maintainable, and production-ready task management system.**
