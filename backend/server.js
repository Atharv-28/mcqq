const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB, createTables } = require('./config/database');
// const authRoutes = require('./routes/auth'); // Removed - no authentication needed
const quizRoutes = require('./routes/quiz');
const leaderboardRoutes = require('./routes/leaderboard');
const questionRoutes = require('./routes/questions');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// CORS configuration - Allow all origins for development
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false // Set to false when using wildcard origin
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MCQ Quiz API is running!', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'Database connection disabled for testing',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/questions/subjects',
      'GET /api/questions/subjects/:subject/categories',
      'POST /api/questions/validate',
      'POST /api/questions/sample',
      'POST /api/quiz/questions',
      'POST /api/quiz/submit',
      'GET /api/quiz/history/:username',
      'GET /api/leaderboard/global',
      'GET /api/leaderboard/rank/:username',
      'GET /api/leaderboard/stats'
    ]
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes - All enabled with database connection
app.use('/api/quiz', quizRoutes);           // Quiz operations
app.use('/api/leaderboard', leaderboardRoutes); // Leaderboard and stats
app.use('/api/questions', questionRoutes);     // Question management

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Create tables if they don't exist
    await createTables();
    console.log('✅ Database tables created/verified');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API endpoint: http://localhost:${PORT}`);
      console.log(`🌐 CORS: Allowing all origins (*)`);
      console.log(`� Database: Connected to PostgreSQL`);
      console.log(`🔥 Ready for full functionality!`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

startServer();
