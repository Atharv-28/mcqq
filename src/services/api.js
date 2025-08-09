// API Service for MCQ Quiz Application
const API_BASE_URL = 'http://localhost:5001/api';

class QuizAPI {
  async request(url, options = {}) {
    const config = {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    };

    try {
      const res = await fetch(url, config);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API request failed: ${url}`, err);
      throw err;
    }
  }

  get(url) {
    return this.request(url, { method: 'GET' });
  }

  post(url, data) {
    return this.request(url, { method: 'POST', body: JSON.stringify(data) });
  }

  // ===== QUESTIONS API =====
  getSubjects() {
    return this.get(`${API_BASE_URL}/questions/subjects`);
  }

  getSubjectCategories(subject) {
    return this.get(`${API_BASE_URL}/questions/subjects/${subject}/categories`);
  }

  validateSubjectCategory(subject, subCategory) {
    return this.post(`${API_BASE_URL}/questions/validate`, { subject, subCategory });
  }

  generateQuestions(subject, subCategory, difficulty, count = 10) {
    const subjectMapping = {
      sports: 'Sports',
      technology: 'Technology',
      politics: 'Politics',
      science: 'Science',
      history: 'History',
      geography: 'Geography',
      entertainment: 'Entertainment',
      business: 'Business',
      // Map general knowledge to Business for most subcategories
      general: 'Business',
    };

    const subcategoryMapping = {
      // Sports
      f1: 'Formula 1',
      cricket: 'Cricket',
      football: 'Football',
      basketball: 'Basketball',
      tennis: 'Tennis',
      olympics: 'Olympics',
      swimming: 'Swimming',
      athletics: 'Athletics',
      golf: 'Golf',
      baseball: 'Baseball',
      
      // Technology
      hardware: 'Hardware',
      software: 'Software',
      programming: 'Programming',
      'ai-ml': 'AI & Machine Learning',
      cybersecurity: 'Cybersecurity',
      'web-dev': 'Web Development',
      'mobile-dev': 'Mobile Development',
      'data-science': 'Data Science',
      'cloud-computing': 'Cloud Computing',
      devops: 'DevOps',
      blockchain: 'Blockchain',
      iot: 'Internet of Things',
      'software-engineering': 'Software Engineering',
      'database-management': 'Database Management',
      
      // Politics
      'world-politics': 'World Politics',
      'us-politics': 'US Politics',
      'indian-politics': 'Indian Politics',
      'european-politics': 'European Politics',
      'political-history': 'Political History',
      government: 'Government Systems',
      'political-leaders': 'Political Leaders',
      elections: 'Elections',
      'international-relations': 'International Relations',
      'political-parties': 'Political Parties',
      'constitutional-law': 'Constitutional Law',
      
      // Science
      physics: 'Physics',
      chemistry: 'Chemistry',
      biology: 'Biology',
      space: 'Astronomy',
      environment: 'Environmental Science',
      medical: 'Medicine',
      mathematics: 'Mathematics',
      geology: 'Geology',
      genetics: 'Genetics',
      botany: 'Botany',
      
      // History
      'world-war': 'World Wars',
      ancient: 'Ancient Civilizations',
      medieval: 'Medieval History',
      modern: 'Modern History',
      'indian-history': 'Asian History',
      'american-history': 'American History',
      'european-history': 'European History',
      'african-history': 'African History',
      
      // Geography
      'world-capitals': 'World Capitals',
      countries: 'Countries & Continents',
      mountains: 'Natural Landmarks',
      climate: 'Climate',
      continents: 'Countries & Continents',
      landmarks: 'Natural Landmarks',
      'physical-geography': 'Physical Geography',
      'political-geography': 'Political Geography',
      'population-demographics': 'Population & Demographics',
      
      // Entertainment
      movies: 'Movies',
      music: 'Music',
      'tv-shows': 'TV Shows',
      celebrities: 'Celebrity Trivia',
      gaming: 'Gaming',
      books: 'Books & Literature',
      'awards-festivals': 'Awards & Festivals',
      'comic-books': 'Comic Books',
      
      // Business/General Knowledge (mapped to Business categories)
      'current-affairs': 'Economics',
      business: 'Business Strategy',
      'business-economy': 'Economics',
      inventions: 'Economics', // Could be mapped to Technology or Business
      awards: 'Economics',
      culture: 'Economics',
      mixed: 'Economics',
      economics: 'Economics',
      finance: 'Finance',
      marketing: 'Marketing',
      management: 'Management',
      entrepreneurship: 'Entrepreneurship',
      'stock-market': 'Stock Market',
      cryptocurrency: 'Cryptocurrency',
    };

    // Special handling for general knowledge subcategories that might fit better in other subjects
    let mappedSubject = subjectMapping[subject] || subject;
    let mappedSubCategory = subcategoryMapping[subCategory] || subCategory;
    
    // Special cases for general knowledge
    if (subject === 'general') {
      if (subCategory === 'inventions') {
        mappedSubject = 'Technology';
        mappedSubCategory = 'Programming'; // or another tech category
      } else if (subCategory === 'culture') {
        mappedSubject = 'Entertainment';
        mappedSubCategory = 'Books & Literature';
      } else if (subCategory === 'awards') {
        mappedSubject = 'Entertainment';
        mappedSubCategory = 'Awards & Festivals';
      }
    }

    const payload = {
      subject: mappedSubject,
      subCategory: mappedSubCategory,
      difficulty,
      count,
    };

    // ✅ full URL directly to /questions/sample
    console.log(`Generating ${count} questions for ${payload.subject} - ${payload.subCategory} (${payload.difficulty})`);
    console.log('API call to:', `${API_BASE_URL}/questions/sample`);
    console.log('Payload:', payload);
    
    return this.post(`${API_BASE_URL}/questions/sample`, payload);
  }

  // ===== QUIZ API =====
  submitQuizResults(quizData) {
    return this.post(`${API_BASE_URL}/quiz/submit`, quizData);
  }

  getUserHistory(username, page = 1, limit = 10) {
    return this.get(`${API_BASE_URL}/quiz/history/${username}?page=${page}&limit=${limit}`);
  }

  // ===== LEADERBOARD API =====
  getLeaderboard({ page = 1, limit = 50, subject, difficulty, timeframe } = {}) {
    let query = `?page=${page}&limit=${limit}`;
    if (subject) query += `&subject=${subject}`;
    if (difficulty) query += `&difficulty=${difficulty}`;
    if (timeframe) query += `&timeframe=${timeframe}`;
    return this.get(`${API_BASE_URL}/leaderboard/global${query}`);
  }

  getUserRank(username, { subject, difficulty } = {}) {
    let query = '';
    if (subject) query += `?subject=${subject}`;
    if (difficulty) query += query ? `&difficulty=${difficulty}` : `?difficulty=${difficulty}`;
    return this.get(`${API_BASE_URL}/leaderboard/rank/${username}${query}`);
  }

  getLeaderboardStats() {
    return this.get(`${API_BASE_URL}/leaderboard/stats`);
  }

  // ===== UTILITY =====
  checkHealth() {
    return fetch('http://localhost:5001/health')
      .then(res => res.ok)
      .catch(() => false);
  }

  getAPIStatus() {
    return fetch('http://localhost:5001')
      .then(res => res.json())
      .catch(() => null);
  }
}

const quizAPI = new QuizAPI();
export default quizAPI;
export { QuizAPI, API_BASE_URL };
