const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Subject categories mapping
const subjectCategories = {
  'Technology': [
    'Programming', 'Web Development', 'Mobile Development', 'AI & Machine Learning',
    'Data Science', 'Cybersecurity', 'Cloud Computing', 'DevOps', 'Blockchain',
    'Internet of Things', 'Software Engineering', 'Database Management'
  ],
  'Science': [
    'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Astronomy',
    'Environmental Science', 'Geology', 'Medicine', 'Genetics', 'Botany'
  ],
  'Sports': [
    'Football', 'Basketball', 'Cricket', 'Tennis', 'Olympics',
    'Formula 1', 'Swimming', 'Athletics', 'Golf', 'Baseball'
  ],
  'History': [
    'World Wars', 'Ancient Civilizations', 'Medieval History', 'Modern History',
    'American History', 'European History', 'Asian History', 'African History'
  ],
  'Geography': [
    'World Capitals', 'Countries & Continents', 'Natural Landmarks', 'Climate',
    'Population & Demographics', 'Physical Geography', 'Political Geography'
  ],
  'Entertainment': [
    'Movies', 'Music', 'TV Shows', 'Books & Literature', 'Gaming',
    'Celebrity Trivia', 'Awards & Festivals', 'Comic Books'
  ],
  'Politics': [
    'World Politics', 'Government Systems', 'Political Leaders', 'Elections',
    'International Relations', 'Political Parties', 'Constitutional Law'
  ],
  'Business': [
    'Economics', 'Finance', 'Marketing', 'Management', 'Entrepreneurship',
    'Stock Market', 'Cryptocurrency', 'Business Strategy'
  ]
};

class GeminiService {
  constructor() {
    // Only initialize if API key is provided
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        // Updated model name for Gemini 1.5
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        this.hasValidApiKey = true;
      } catch (error) {
        console.warn('⚠️ Failed to initialize Gemini AI:', error.message);
        this.hasValidApiKey = false;
      }
    } else {
      console.log('⚠️ No valid Gemini API key provided, using fallback questions only');
      this.hasValidApiKey = false;
    }
  }

  // Generate quiz questions using Gemini AI
  async generateQuestions(subject, subCategory, difficulty, count = 10) {
    try {
      // Validate inputs
      if (!subjectCategories[subject] || !subjectCategories[subject].includes(subCategory)) {
        throw new Error('Invalid subject or subcategory');
      }

      if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
        throw new Error('Invalid difficulty level');
      }

      // If no valid API key, use fallback immediately
      if (!this.hasValidApiKey) {
        console.log('🔄 Using fallback questions (no valid API key)');
        return this.getFallbackQuestions(subject, subCategory, difficulty, count);
      }

      const prompt = this.createPrompt(subject, subCategory, difficulty, count);
      
      console.log(`🤖 Generating ${count} ${difficulty} questions for ${subject} - ${subCategory}`);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      const questions = this.parseQuestionsResponse(text);
      
      // Validate questions
      if (!questions || questions.length === 0) {
        throw new Error('No questions generated');
      }

      // Ensure we have the right number of questions
      const validQuestions = questions.slice(0, count);
      
      // Validate each question structure
      validQuestions.forEach((q, index) => {
        if (!q.question || !q.options || !q.correctAnswer || !q.explanation) {
          throw new Error(`Invalid question structure at index ${index}`);
        }
        
        if (q.options.length !== 4) {
          throw new Error(`Question ${index + 1} must have exactly 4 options`);
        }
        
        if (!q.options.includes(q.correctAnswer)) {
          throw new Error(`Question ${index + 1} correct answer not found in options`);
        }
      });

      console.log(`✅ Successfully generated ${validQuestions.length} questions`);
      return validQuestions;
      
    } catch (error) {
      console.error('❌ Error generating questions:', error.message);
      
      // Always return fallback questions if Gemini fails
      console.log('🔄 Using fallback questions due to error');
      return this.getFallbackQuestions(subject, subCategory, difficulty, count);
    }
  }

  // Create a detailed prompt for Gemini
  createPrompt(subject, subCategory, difficulty, count) {
    const difficultyInstructions = {
      'Easy': 'basic knowledge that most people would know, simple concepts',
      'Medium': 'intermediate knowledge requiring some specific understanding',
      'Hard': 'advanced knowledge requiring deep understanding or expertise'
    };

    return `Generate exactly ${count} multiple choice questions about ${subCategory} in ${subject}.

REQUIREMENTS:
- Difficulty: ${difficulty} (${difficultyInstructions[difficulty]})
- Each question must have exactly 4 options (A, B, C, D)
- Include diverse, well-researched questions
- Provide clear, detailed explanations for correct answers
- Ensure questions are factual and up-to-date
- Make distractors (wrong options) plausible but clearly incorrect

FORMAT: Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Clear, specific question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "explanation": "Detailed explanation of why this answer is correct and why others are wrong",
    "category": "${subCategory}",
    "difficulty": "${difficulty}"
  }
]

Generate exactly ${count} questions following this format. Ensure the JSON is valid and complete.`;
  }

  // Parse the Gemini response
  parseQuestionsResponse(text) {
    try {
      // Clean the response text
      let cleanText = text.trim();
      
      // Remove any markdown code blocks
      cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      cleanText = cleanText.replace(/```\s*/, '');
      
      // Try to find JSON array in the response
      const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      // Parse JSON
      const questions = JSON.parse(cleanText);
      
      // Ensure it's an array
      return Array.isArray(questions) ? questions : [questions];
      
    } catch (error) {
      console.error('❌ Error parsing questions response:', error);
      console.log('Raw response:', text);
      throw new Error('Failed to parse questions from AI response');
    }
  }

  // Fallback questions in case Gemini API fails
  getFallbackQuestions(subject, subCategory, difficulty, count) {
    const fallbackQuestions = {
      'Technology': {
        'Programming': [
          {
            question: "Which programming language is known as the 'language of the web'?",
            options: ["Python", "JavaScript", "Java", "C++"],
            correctAnswer: "JavaScript",
            explanation: "JavaScript is primarily used for web development and runs in web browsers to create interactive websites.",
            category: "Programming",
            difficulty: difficulty
          },
          {
            question: "What does HTML stand for?",
            options: ["Hypertext Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"],
            correctAnswer: "Hypertext Markup Language",
            explanation: "HTML (Hypertext Markup Language) is the standard markup language for creating web pages and web applications.",
            category: "Programming",
            difficulty: difficulty
          },
          {
            question: "Which of the following is a Python web framework?",
            options: ["Django", "React", "Angular", "Vue"],
            correctAnswer: "Django",
            explanation: "Django is a high-level Python web framework that encourages rapid development and clean, pragmatic design.",
            category: "Programming",
            difficulty: difficulty
          },
          {
            question: "What does CSS stand for?",
            options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"],
            correctAnswer: "Cascading Style Sheets",
            explanation: "CSS (Cascading Style Sheets) is used to describe the presentation of a document written in HTML or XML.",
            category: "Programming",
            difficulty: difficulty
          }
        ],
        'Web Development': [
          {
            question: "Which HTTP method is used to submit data to be processed?",
            options: ["GET", "POST", "PUT", "DELETE"],
            correctAnswer: "POST",
            explanation: "POST method is used to submit data to be processed to a specified resource, often causing a change in state.",
            category: "Web Development",
            difficulty: difficulty
          },
          {
            question: "What is the default port for HTTPS?",
            options: ["80", "443", "8080", "3000"],
            correctAnswer: "443",
            explanation: "HTTPS uses port 443 by default, while HTTP uses port 80.",
            category: "Web Development",
            difficulty: difficulty
          }
        ]
      },
      'Science': {
        'Physics': [
          {
            question: "What is the speed of light in vacuum?",
            options: ["300,000 km/s", "299,792,458 m/s", "186,000 miles/h", "150,000 km/s"],
            correctAnswer: "299,792,458 m/s",
            explanation: "The speed of light in vacuum is exactly 299,792,458 meters per second, a fundamental constant in physics.",
            category: "Physics",
            difficulty: difficulty
          },
          {
            question: "What is the formula for kinetic energy?",
            options: ["KE = mv", "KE = ½mv²", "KE = m²v", "KE = mv²"],
            correctAnswer: "KE = ½mv²",
            explanation: "Kinetic energy equals one-half the mass times the velocity squared (KE = ½mv²).",
            category: "Physics",
            difficulty: difficulty
          }
        ],
        'Chemistry': [
          {
            question: "What is the chemical symbol for gold?",
            options: ["Go", "Gd", "Au", "Ag"],
            correctAnswer: "Au",
            explanation: "Gold's chemical symbol is Au, derived from the Latin word 'aurum' meaning gold.",
            category: "Chemistry",
            difficulty: difficulty
          },
          {
            question: "How many protons does a carbon atom have?",
            options: ["4", "6", "8", "12"],
            correctAnswer: "6",
            explanation: "Carbon has 6 protons in its nucleus, which defines it as element number 6 on the periodic table.",
            category: "Chemistry",
            difficulty: difficulty
          }
        ]
      },
      'Sports': {
        'Football': [
          {
            question: "How many players are on a football field for one team at a time?",
            options: ["10", "11", "12", "9"],
            correctAnswer: "11",
            explanation: "Each football team has 11 players on the field at any given time during play.",
            category: "Football",
            difficulty: difficulty
          },
          {
            question: "Which country won the 2018 FIFA World Cup?",
            options: ["Brazil", "Germany", "France", "Argentina"],
            correctAnswer: "France",
            explanation: "France won the 2018 FIFA World Cup held in Russia, defeating Croatia 4-2 in the final.",
            category: "Football",
            difficulty: difficulty
          }
        ],
        'Basketball': [
          {
            question: "How many points is a three-pointer worth in basketball?",
            options: ["2", "3", "4", "1"],
            correctAnswer: "3",
            explanation: "A three-pointer is worth 3 points when the ball is shot from beyond the three-point line.",
            category: "Basketball",
            difficulty: difficulty
          }
        ]
      },
      'History': {
        'World Wars': [
          {
            question: "In which year did World War II end?",
            options: ["1944", "1945", "1946", "1947"],
            correctAnswer: "1945",
            explanation: "World War II ended in 1945 with the surrender of Japan in September, following Germany's surrender in May.",
            category: "World Wars",
            difficulty: difficulty
          }
        ]
      },
      'Geography': {
        'World Capitals': [
          {
            question: "What is the capital of Australia?",
            options: ["Sydney", "Melbourne", "Canberra", "Perth"],
            correctAnswer: "Canberra",
            explanation: "Canberra is the capital city of Australia, located in the Australian Capital Territory.",
            category: "World Capitals",
            difficulty: difficulty
          }
        ]
      }
    };

    // Get questions for the specified category
    const categoryQuestions = fallbackQuestions[subject]?.[subCategory] || [];
    
    // If no specific questions for this category, use generic ones
    if (categoryQuestions.length === 0) {
      return this.getGenericFallbackQuestions(subject, subCategory, difficulty, count);
    }
    
    // Duplicate and modify questions if we need more
    const questions = [];
    for (let i = 0; i < count; i++) {
      if (categoryQuestions[i % categoryQuestions.length]) {
        const baseQuestion = categoryQuestions[i % categoryQuestions.length];
        questions.push({
          ...baseQuestion,
          id: i + 1,
          question: baseQuestion.question + (i >= categoryQuestions.length ? ` (Question ${i + 1})` : '')
        });
      }
    }

    return questions.slice(0, count);
  }

  // Generic fallback questions for categories without specific questions
  getGenericFallbackQuestions(subject, subCategory, difficulty, count) {
    const genericQuestions = [];
    
    for (let i = 0; i < count; i++) {
      genericQuestions.push({
        question: `Sample ${difficulty} question ${i + 1} about ${subCategory} in ${subject}?`,
        options: [
          `Option A for ${subCategory}`,
          `Option B for ${subCategory}`,
          `Option C for ${subCategory}`,
          `Option D for ${subCategory}`
        ],
        correctAnswer: `Option ${String.fromCharCode(65 + (i % 4))} for ${subCategory}`, // A, B, C, or D
        explanation: `This is a sample explanation for a ${difficulty} level question about ${subCategory} in ${subject}. In a real scenario, this would contain detailed information about why this answer is correct.`,
        category: subCategory,
        difficulty: difficulty,
        id: i + 1
      });
    }
    
    return genericQuestions;
  }

  // Get available subjects and categories
  getSubjectCategories() {
    return subjectCategories;
  }

  // Validate subject and category
  isValidSubjectCategory(subject, subCategory) {
    return subjectCategories[subject] && subjectCategories[subject].includes(subCategory);
  }
}

module.exports = new GeminiService();
