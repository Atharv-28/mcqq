// In-memory storage replacement for database
// This provides a simple storage system without requiring PostgreSQL

class InMemoryStorage {
  constructor() {
    this.quizResults = [];
    this.questionsCache = new Map();
    this.users = new Map();
  }

  // Quiz Results Storage
  addQuizResult(result) {
    const resultWithId = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...result,
      completedAt: new Date().toISOString()
    };
    this.quizResults.push(resultWithId);
    return resultWithId;
  }

  getQuizResults(filters = {}) {
    let results = [...this.quizResults];
    
    // Apply filters
    if (filters.username) {
      results = results.filter(r => r.username.toLowerCase() === filters.username.toLowerCase());
    }
    
    if (filters.subject) {
      results = results.filter(r => r.subject.toLowerCase() === filters.subject.toLowerCase());
    }
    
    if (filters.difficulty) {
      results = results.filter(r => r.difficulty.toLowerCase() === filters.difficulty.toLowerCase());
    }
    
    // Sort by percentage (highest first), then by completion date (most recent first)
    results.sort((a, b) => {
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      return new Date(b.completedAt) - new Date(a.completedAt);
    });
    
    return results;
  }

  getLeaderboard(filters = {}) {
    const results = this.getQuizResults(filters);
    const limit = filters.limit || 100;
    return results.slice(0, limit);
  }

  getUserRank(username, filters = {}) {
    const results = this.getQuizResults(filters);
    const userIndex = results.findIndex(r => r.username.toLowerCase() === username.toLowerCase());
    return userIndex !== -1 ? userIndex + 1 : null;
  }

  getUserHistory(username, page = 1, limit = 10) {
    const results = this.getQuizResults({ username });
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      results: results.slice(startIndex, endIndex),
      totalCount: results.length,
      page,
      limit,
      totalPages: Math.ceil(results.length / limit)
    };
  }

  // Questions Cache Storage
  getCachedQuestions(subject, subCategory, difficulty) {
    const key = `${subject}-${subCategory}-${difficulty}`;
    const cached = this.questionsCache.get(key);
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.questions;
    }
    
    return null;
  }

  setCachedQuestions(subject, subCategory, difficulty, questions) {
    const key = `${subject}-${subCategory}-${difficulty}`;
    const expiresAt = Date.now() + (60 * 60 * 1000); // Cache for 1 hour
    
    this.questionsCache.set(key, {
      questions,
      expiresAt,
      createdAt: Date.now()
    });
  }

  // User Storage (if needed)
  addUser(user) {
    const userWithId = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...user,
      createdAt: new Date().toISOString()
    };
    this.users.set(user.username.toLowerCase(), userWithId);
    return userWithId;
  }

  getUser(username) {
    return this.users.get(username.toLowerCase());
  }

  // Statistics
  getStats() {
    return {
      totalQuizzes: this.quizResults.length,
      totalUsers: new Set(this.quizResults.map(r => r.username.toLowerCase())).size,
      cachedQuestions: this.questionsCache.size,
      subjects: [...new Set(this.quizResults.map(r => r.subject))],
      difficulties: [...new Set(this.quizResults.map(r => r.difficulty))]
    };
  }

  // Clear all data (useful for testing)
  clearAll() {
    this.quizResults = [];
    this.questionsCache.clear();
    this.users.clear();
  }

  // Seed with some sample data for testing
  seedSampleData() {
    const sampleResults = [
      {
        username: 'john_doe',
        subject: 'Technology',
        subCategory: 'Programming',
        difficulty: 'Medium',
        totalQuestions: 10,
        correctAnswers: 8,
        score: 80,
        percentage: 80,
        timeTaken: 300
      },
      {
        username: 'jane_smith',
        subject: 'Technology',
        subCategory: 'AI & Machine Learning',
        difficulty: 'Hard',
        totalQuestions: 10,
        correctAnswers: 9,
        score: 90,
        percentage: 90,
        timeTaken: 450
      },
      {
        username: 'bob_wilson',
        subject: 'Sports',
        subCategory: 'Football',
        difficulty: 'Easy',
        totalQuestions: 10,
        correctAnswers: 7,
        score: 70,
        percentage: 70,
        timeTaken: 200
      },
      {
        username: 'alice_johnson',
        subject: 'Science',
        subCategory: 'Physics',
        difficulty: 'Medium',
        totalQuestions: 10,
        correctAnswers: 9,
        score: 90,
        percentage: 90,
        timeTaken: 380
      },
      {
        username: 'charlie_brown',
        subject: 'Technology',
        subCategory: 'Web Development',
        difficulty: 'Easy',
        totalQuestions: 10,
        correctAnswers: 6,
        score: 60,
        percentage: 60,
        timeTaken: 250
      }
    ];

    sampleResults.forEach(result => this.addQuizResult(result));
    console.log('✅ Seeded storage with sample data');
  }
}

// Create a singleton instance
const storage = new InMemoryStorage();

// Seed with sample data on initialization
storage.seedSampleData();

module.exports = storage;
