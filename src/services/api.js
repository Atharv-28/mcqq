// API Service for MCQ Quiz Application
// Handles all communication with the backend server

const API_BASE_URL = 'http://localhost:5001/api';

class QuizAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method for making HTTP requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(endpoint);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log('🔗 Making API request:', {
      url,
      method: options.method || 'GET',
      headers: config.headers,
      body: options.body
    });

    try {
      const response = await fetch(url, config);
      console.log('📡 Fetch response status:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        console.error('❌ HTTP error:', response.status, data.message);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log('✅ Request successful:', data);
      return data;
    } catch (error) {
      console.error(`💥 API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // GET request helper
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request helper
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===== QUESTIONS API =====

  // Get all available subjects and categories
  async getSubjects() {
    return this.get('/questions/subjects');
  }

  // Get categories for a specific subject
  async getSubjectCategories(subject) {
    return this.get(`/questions/subjects/${subject}/categories`);
  }

  // Validate subject and category combination
  async validateSubjectCategory(subject, subCategory) {
    return this.post('/questions/validate', { subject, subCategory });
  }

  // Generate quiz questions
  async generateQuestions(subject, subCategory, difficulty, count = 10) {
    console.log('🎯 generateQuestions called with:', {
      subject,
      subCategory,
      difficulty,
      count
    });
    
    // Transform frontend format to backend format
    const subjectMapping = {
      'sports': 'Sports',
      'technology': 'Technology', 
      'politics': 'Politics',
      'science': 'Science',
      'history': 'History',
      'geography': 'Geography',
      'entertainment': 'Entertainment',
      'business': 'Business'
    };
    
    const subcategoryMapping = {
      // Sports
      'f1': 'Formula 1',
      'cricket': 'Cricket',
      'football': 'Football',
      'basketball': 'Basketball',
      'tennis': 'Tennis',
      'olympics': 'Olympics',
      
      // Technology
      'hardware': 'Hardware',
      'software': 'Software', 
      'programming': 'Programming',
      'ai-ml': 'AI & Machine Learning',
      'cybersecurity': 'Cybersecurity',
      'web-dev': 'Web Development',
      
      // Politics
      'world-politics': 'World Politics',
      'us-politics': 'US Politics',
      'indian-politics': 'Indian Politics',
      'european-politics': 'European Politics',
      'political-history': 'Political History',
      'government': 'Government Systems',
      
      // Science
      'physics': 'Physics',
      'chemistry': 'Chemistry',
      'biology': 'Biology',
      'space': 'Astronomy',
      'environment': 'Environmental Science',
      'mathematics': 'Mathematics'
    };
    
    const transformedSubject = subjectMapping[subject] || subject;
    const transformedSubCategory = subcategoryMapping[subCategory] || subCategory;
    
    const requestData = {
      subject: transformedSubject,
      subCategory: transformedSubCategory,
      difficulty,
      count,
    };
    
    console.log('📝 Transformed request data for /questions/sample:', requestData);
    
    // Use sample endpoint for testing (not the quiz/questions endpoint)
    const response = await this.post('/questions/sample', requestData);
    
    // Transform response to match expected format
    if (response.success && response.data && response.data.questions) {
      return {
        success: true,
        questions: response.data.questions
      };
    }
    
    return response;
  }

  // ===== QUIZ API =====

  // Submit quiz results
  async submitQuizResults(quizData) {
    const {
      username,
      subject,
      subCategory,
      difficulty,
      totalQuestions,
      correctAnswers,
      score,
      percentage,
      timeTaken,
      questionsData,
    } = quizData;

    return this.post('/quiz/submit', {
      username,
      subject,
      subCategory,
      difficulty,
      totalQuestions,
      correctAnswers,
      score,
      percentage,
      timeTaken,
      questionsData,
    });
  }

  // Get user's quiz history
  async getUserHistory(username, page = 1, limit = 10) {
    return this.get(`/quiz/history/${username}?page=${page}&limit=${limit}`);
  }

  // ===== LEADERBOARD API =====

  // Get global leaderboard
  async getLeaderboard(filters = {}) {
    const { page = 1, limit = 50, subject, difficulty, timeframe } = filters;
    
    let queryParams = `page=${page}&limit=${limit}`;
    if (subject) queryParams += `&subject=${subject}`;
    if (difficulty) queryParams += `&difficulty=${difficulty}`;
    if (timeframe) queryParams += `&timeframe=${timeframe}`;

    return this.get(`/leaderboard/global?${queryParams}`);
  }

  // Get user's rank
  async getUserRank(username, filters = {}) {
    const { subject, difficulty } = filters;
    
    let queryParams = '';
    if (subject) queryParams += `?subject=${subject}`;
    if (difficulty) queryParams += `${queryParams ? '&' : '?'}difficulty=${difficulty}`;

    return this.get(`/leaderboard/rank/${username}${queryParams}`);
  }

  // Get leaderboard statistics
  async getLeaderboardStats() {
    return this.get('/leaderboard/stats');
  }

  // ===== UTILITY METHODS =====

  // Check if backend is available
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  // Get API status and available endpoints
  async getAPIStatus() {
    try {
      const response = await fetch(this.baseURL.replace('/api', ''));
      return await response.json();
    } catch (error) {
      console.error('Failed to get API status:', error);
      return null;
    }
  }
}

// Create singleton instance
const quizAPI = new QuizAPI();

// Export for use in React components
export default quizAPI;

// Named exports for specific use cases
export {
  QuizAPI,
  API_BASE_URL,
};
