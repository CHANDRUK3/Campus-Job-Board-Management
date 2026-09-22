const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import models
const User = require('./models/user');
const Company = require('./models/company');
const OptStatus = require('./models/OptStatus');
const Notification = require('./models/Notification');
const StudentProfile = require('./models/StudentProfile');

// Import routes
const authRoutes = require('./routes/Auth.js');
const companyRoutes = require('./routes/companies');
const driveRoutes = require('./routes/drives');
const optStatusRoutes = require('./routes/optStatusRoutes');
const notificationsRoutes = require('./routes/notifications');
const studentProfileRoutes = require('./routes/studentProfileRoutes');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const { startDeadlineReminderJob } = require('./jobs/deadlineReminderJob');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const isProduction = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Be generous during local dev to avoid blocking manual testing
  max: isProduction ? 300 : 5000,
  message: {
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply limiter to API routes (keep healthcheck unrestricted)
app.use('/api', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  abortOnLimit: true,
  responseOnLimit: 'File size limit has been reached'
}));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/jobboard')
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Campus Job Board API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/drives', driveRoutes);
app.use('/api/optstatus', optStatusRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/profile', studentProfileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// Start background jobs
try {
  startDeadlineReminderJob(10); // every 10 minutes
} catch (err) {
  console.error('Failed to start deadline reminder job:', err.message || err);
}
