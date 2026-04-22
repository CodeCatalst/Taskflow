import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { sanitizeRequestInputs } from './utils/requestSanitizer.js';

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
import emailNotificationPreferencesRoutes from './routes/emailNotificationPreferences.js';
import scheduledEmailCampaignsRoutes from './routes/scheduledEmailCampaigns.js';
import automationTriggersRoutes from './routes/automationTriggers.js';

// Import middleware
import { authenticate } from './middleware/auth.js';
import workspaceContext from './middleware/workspaceContext.js';

// Import scheduler
import { initializeScheduler } from './utils/scheduler.js';

// Load environment variables (ensure we read backend/.env even if CWD is project root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
const isProduction = process.env.NODE_ENV === 'production';

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

const parseTrustProxySetting = (value) => {
  if (value === undefined || value === null || value === '') {
    return isProduction ? 1 : false;
  }

  if (value === 'true') return 1;
  if (value === 'false') return false;

  const parsedNumber = Number(value);
  if (Number.isInteger(parsedNumber) && parsedNumber >= 0) {
    return parsedNumber;
  }

  return value;
};

const trustProxySetting = parseTrustProxySetting(process.env.TRUST_PROXY);

// Only trust a specific proxy hop count (or explicit subnet config), never an unrestricted boolean.
app.set('trust proxy', trustProxySetting);

// Security middleware - Helmet for HTTP security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: true,
}));

// Rate limiting configuration
// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs (login, register, password reset)
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Apply general rate limiting to all routes
app.use('/api', generalLimiter);

// Apply stricter rate limiting to auth routes
app.use('/api/auth', authLimiter);

// Special rate limiting for workspace creation to prevent abuse
const workspaceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 workspaces per hour per IP
  message: { message: 'Too many workspace requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/workspaces', workspaceLimiter);

// Request size limiting - prevent large payload attacks
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

// Middleware - Strict CORS configuration for production security
app.use(cors({
  origin: function(origin, callback) {
    // Always-allowed origins for the application
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'https://taskflow-nine-phi.vercel.app'
    ];

    // Add frontend URL from environment variable if set
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
      allowedOrigins.push(frontendUrl);
    }

    // Add Vercel deployment URL if available
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl && !allowedOrigins.includes(`https://${vercelUrl}`)) {
      allowedOrigins.push(`https://${vercelUrl}`);
    }

    // Allow requests with no origin (like mobile apps or curl requests) only in development
    if (!origin) {
      return callback(null, true);
    }

    // Strict origin check - only allow explicitly configured origins
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      return callback(new Error('Not allowed by CORS policy'));
    }

    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Workspace-Id'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeRequestInputs);

// Make io accessible to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {

  // Join user and workspace rooms for scoped real-time events.
  socket.on('join', ({ userId, workspaceId }) => {
    if (userId) {
      socket.join(userId.toString());
    }
    if (workspaceId) {
      socket.join(`workspace:${workspaceId.toString()}`);
    }
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
app.use('/api/user/email-preferences', authenticate, workspaceContext, emailNotificationPreferencesRoutes);
app.use('/api/hr/scheduled-campaigns', authenticate, workspaceContext, scheduledEmailCampaignsRoutes);
app.use('/api/automation', automationTriggersRoutes);

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
const BASE_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_FALLBACKS = 10;
let listenErrorHandler = null;
let listeningHandler = null;

const startServer = (port, fallbackCount = 0) => {
  if (listenErrorHandler) {
    httpServer.off('error', listenErrorHandler);
  }
  if (listeningHandler) {
    httpServer.off('listening', listeningHandler);
  }

  listenErrorHandler = (error) => {
    const isDev = (process.env.NODE_ENV || 'development') !== 'production';
    const canFallback = fallbackCount < MAX_PORT_FALLBACKS;

    if (error.code === 'EADDRINUSE' && isDev && canFallback) {
      const nextPort = port + 1;
      process.stderr.write(`Port ${port} is in use. Retrying on ${nextPort}...\n`);
      startServer(nextPort, fallbackCount + 1);
      return;
    }

    throw error;
  };

  listeningHandler = () => {
    const activePort = httpServer.address()?.port || port;
    // Server started successfully on port ${activePort}
  };

  httpServer.once('error', listenErrorHandler);
  httpServer.once('listening', listeningHandler);
  httpServer.listen(port);
};

startServer(BASE_PORT);

export default app;
