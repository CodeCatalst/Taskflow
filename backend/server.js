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
      console.warn('⚠️ CORS blocked request from origin:', origin);
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
  console.log('✅ Client connected:', socket.id);

  // Join user to their own room (for personal notifications)
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

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
    
    console.log('🧪 Testing email send to:', email);
    
    // Try to send email synchronously with timeout
    const result = await Promise.race([
      sendCredentialEmail('Test User', email, 'TestPassword123'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout (30s)')), 30000)
      )
    ]);
    
    console.log('🧪 Email test result:', result);
    
    res.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully!' : 'Failed to send test email',
      details: result
    });
  } catch (error) {
    console.error('🧪 Email test error:', error);
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
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 CTMS Backend Server Running      ║
║   📡 Port: ${PORT}                      ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}     ║
║   🔌 Socket.IO: Enabled                ║
╚════════════════════════════════════════╝
  `);
});

export default app;
