import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import teamRoutes from './routes/teams.js';
import taskRoutes from './routes/tasks.js';
import commentRoutes from './routes/comments.js';
import notificationRoutes from './routes/notifications.js';
import changelogRoutes from './routes/changelog.js';
import workspaceRoutes from './routes/workspaces.js';
// HR Module routes
import attendanceRoutes from './routes/attendance.js';
import leavesRoutes from './routes/leaves.js';
import leaveTypesRoutes from './routes/leaveTypes.js';
import holidaysRoutes from './routes/holidays.js';
import hrCalendarRoutes from './routes/hrCalendar.js';
import emailTemplatesRoutes from './routes/emailTemplates.js';

// Import middleware
import { authenticate } from './middleware/auth.js';
import workspaceContext from './middleware/workspaceContext.js';

// Import scheduler
import { initializeScheduler } from './utils/scheduler.js';

// Load environment variables (ensure we read backend/.env even if CWD is project root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with proper CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://taskflow-nine-phi.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

// Connect to MongoDB
connectDB();

// Initialize scheduler for automated tasks
initializeScheduler();

// Trust proxy - required to get real client IP behind reverse proxies (Render, Vercel, Nginx, etc.)
app.set('trust proxy', true);

// Middleware - Enhanced CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://taskflow-nine-phi.vercel.app'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow in production, log for monitoring
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Make io accessible to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {

  // Join user to their own room (for personal notifications)
  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('disconnect', () => {
  });
});

// API Routes
// Auth routes (public, no workspace context needed for login/register)
app.use('/api/auth', authRoutes);

// Protected routes with workspace context
// Apply authentication and workspace context to all protected routes
app.use('/api/users', authenticate, workspaceContext, userRoutes);
app.use('/api/teams', authenticate, workspaceContext, teamRoutes);
app.use('/api/tasks', authenticate, workspaceContext, taskRoutes);
app.use('/api/comments', authenticate, workspaceContext, commentRoutes);
app.use('/api/notifications', authenticate, workspaceContext, notificationRoutes);
app.use('/api/changelog', authenticate, workspaceContext, changelogRoutes);
app.use('/api/workspaces', workspaceRoutes); // Workspace routes handle their own auth/context
// HR Module routes with workspace context
app.use('/api/hr/attendance', authenticate, workspaceContext, attendanceRoutes);
app.use('/api/hr/leaves', authenticate, workspaceContext, leavesRoutes);
app.use('/api/hr/leave-types', authenticate, workspaceContext, leaveTypesRoutes);
app.use('/api/hr/holidays', authenticate, workspaceContext, holidaysRoutes);
app.use('/api/hr/calendar', authenticate, workspaceContext, hrCalendarRoutes);
app.use('/api/hr/email-templates', authenticate, workspaceContext, emailTemplatesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CTMS Backend is running' });
});

// Email configuration test endpoint
app.get('/api/test-email-config', (req, res) => {
  const config = {
    EMAIL_HOST: process.env.EMAIL_HOST || 'NOT SET',
    EMAIL_PORT: process.env.EMAIL_PORT || 'NOT SET',
    EMAIL_SECURE: process.env.EMAIL_SECURE || 'NOT SET',
    EMAIL_USER: process.env.EMAIL_USER || 'NOT SET',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
  
  const allSet = config.EMAIL_HOST !== 'NOT SET' && 
                 config.EMAIL_USER !== 'NOT SET' && 
                 config.EMAIL_PASSWORD !== 'NOT SET';
  
  res.json({
    success: allSet,
    configured: allSet,
    message: allSet 
      ? 'Email service is properly configured' 
      : 'Email configuration is incomplete - check environment variables',
    config: config,
    missing: Object.keys(config).filter(key => config[key] === 'NOT SET')
  });
});

// Test email sending (actually send a test email)
app.post('/api/test-email-send', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email address is required in request body' 
      });
    }

    // Import email service dynamically
    const { sendCredentialEmail } = await import('./utils/emailService.js');
    
    
    // Try to send email synchronously with timeout
    const result = await Promise.race([
      sendCredentialEmail('Test User', email, 'TestPassword123'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout (30s)')), 30000)
      )
    ]);
    
    
    res.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully!' : 'Failed to send test email',
      details: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email test failed',
      error: error.message,
      details: {
        code: error.code,
        command: error.command
      }
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘   ðŸš€ CTMS Backend Server Running      â•‘
â•‘   ðŸ“¡ Port: ${PORT}                      â•‘
â•‘   ðŸŒ Environment: ${process.env.NODE_ENV || 'development'}     â•‘
â•‘   ðŸ”Œ Socket.IO: Enabled                â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  `);
});

export default app;
