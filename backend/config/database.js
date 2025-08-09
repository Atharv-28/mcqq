const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mcq_quiz',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // how long to wait when connecting
});

// Test database connection
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('🔗 Connected to PostgreSQL database');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

// Create database tables
const createTables = async () => {
  const client = await pool.connect();
  
  try {
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Quiz results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(50) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        sub_category VARCHAR(100) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        total_questions INTEGER NOT NULL DEFAULT 10,
        correct_answers INTEGER NOT NULL,
        score INTEGER NOT NULL,
        percentage DECIMAL(5,2) NOT NULL,
        time_taken INTEGER, -- in seconds
        questions_data JSONB, -- store questions and answers
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Questions cache table (for storing generated questions)
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions_cache (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        subject VARCHAR(100) NOT NULL,
        sub_category VARCHAR(100) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        questions_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour')
      )
    `);

    // User sessions table (for tracking active quizzes)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) NOT NULL,
        quiz_data JSONB NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 minutes')
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_quiz_results_username ON quiz_results(username);
      CREATE INDEX IF NOT EXISTS idx_quiz_results_subject ON quiz_results(subject);
      CREATE INDEX IF NOT EXISTS idx_quiz_results_percentage ON quiz_results(percentage DESC);
      CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON quiz_results(completed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_questions_cache_lookup ON questions_cache(subject, sub_category, difficulty);
      CREATE INDEX IF NOT EXISTS idx_questions_cache_expires ON questions_cache(expires_at);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
    `);

    // Create a function to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger for users table
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Database tables and indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating database tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Clean up expired records
const cleanupExpiredRecords = async () => {
  const client = await pool.connect();
  
  try {
    // Clean expired questions cache
    await client.query('DELETE FROM questions_cache WHERE expires_at < NOW()');
    
    // Clean expired user sessions
    await client.query('DELETE FROM user_sessions WHERE expires_at < NOW()');
    
    console.log('🧹 Cleaned up expired records');
  } catch (error) {
    console.error('❌ Error cleaning up expired records:', error);
  } finally {
    client.release();
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredRecords, 60 * 60 * 1000);

module.exports = {
  pool,
  connectDB,
  createTables,
  cleanupExpiredRecords
};
