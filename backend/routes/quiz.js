const express = require('express');
const Joi = require('joi');
const storage = require('../config/storage');
const geminiService = require('../services/geminiService');

const router = express.Router();

// Validation schemas
const quizRequestSchema = Joi.object({
  subject: Joi.string().required(),
  subCategory: Joi.string().required(),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').required(),
  count: Joi.number().integer().min(5).max(20).default(10)
});

const submitQuizSchema = Joi.object({
  username: Joi.string().required(),
  subject: Joi.string().required(),
  subCategory: Joi.string().required(),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').required(),
  totalQuestions: Joi.number().integer().required(),
  correctAnswers: Joi.number().integer().min(0).required(),
  score: Joi.number().integer().min(0).required(),
  percentage: Joi.number().min(0).max(100).required(),
  timeTaken: Joi.number().integer().min(0).optional(),
  questionsData: Joi.array().items(Joi.object()).optional()
});

// Get quiz questions
router.post('/questions', async (req, res) => {
  try {
    const { error, value } = quizRequestSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { subject, subCategory, difficulty, count } = value;

    // Validate subject and category
    if (!geminiService.isValidSubjectCategory(subject, subCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject or subcategory'
      });
    }

    // Check cache first
    const cachedQuestions = storage.getCachedQuestions(subject, subCategory, difficulty);

    let questions;

    if (cachedQuestions) {
      console.log('📋 Using cached questions');
      questions = cachedQuestions.slice(0, count);
    } else {
      console.log('🤖 Generating new questions');
      
      // Generate new questions
      questions = await geminiService.generateQuestions(subject, subCategory, difficulty, count);
      
      // Cache the questions
      storage.setCachedQuestions(subject, subCategory, difficulty, questions);
    }

    // Add unique IDs to questions
    const questionsWithIds = questions.map((q, index) => ({
      ...q,
      id: index + 1,
      questionNumber: index + 1
    }));

    res.json({
      success: true,
      data: {
        questions: questionsWithIds,
        meta: {
          subject,
          subCategory,
          difficulty,
          totalQuestions: questionsWithIds.length,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error generating quiz questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quiz questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Submit quiz results
router.post('/submit', async (req, res) => {
  try {
    const { error, value } = submitQuizSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

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
      questionsData
    } = value;

    // Store quiz result in memory
    const quizResult = storage.addQuizResult({
      username,
      subject,
      subCategory: subCategory,
      difficulty,
      totalQuestions,
      correctAnswers,
      score,
      percentage,
      timeTaken,
      questionsData
    });

    // Get user's rank
    const userRank = storage.getUserRank(username) || 1;

    // Get user's statistics
    const userResults = storage.getQuizResults({ username });
    const totalQuizzes = userResults.length;
    const avgPercentage = userResults.reduce((sum, r) => sum + r.percentage, 0) / totalQuizzes;
    const bestPercentage = Math.max(...userResults.map(r => r.percentage));
    const avgTime = userResults.reduce((sum, r) => sum + (r.timeTaken || 0), 0) / totalQuizzes;

    res.json({
      success: true,
      message: 'Quiz results submitted successfully',
      data: {
        resultId: quizResult.id,
        completedAt: quizResult.completedAt,
        rank: userRank,
        userStats: {
          totalQuizzes,
          averagePercentage: avgPercentage.toFixed(1),
          bestPercentage: bestPercentage,
          averageTime: Math.round(avgTime)
        }
      }
    });

  } catch (error) {
    console.error('Error submitting quiz results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's quiz history
router.get('/history/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10, subject, difficulty } = req.query;

    // Get user's quiz history from in-memory storage
    const historyData = storage.getUserHistory(username, parseInt(page), parseInt(limit));
    
    // Apply additional filters if provided
    let filteredResults = historyData.results;
    
    if (subject) {
      filteredResults = filteredResults.filter(r => 
        r.subject.toLowerCase() === subject.toLowerCase()
      );
    }
    
    if (difficulty) {
      filteredResults = filteredResults.filter(r => 
        r.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }

    res.json({
      success: true,
      data: {
        quizzes: filteredResults,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredResults.length / parseInt(limit)),
          totalCount: filteredResults.length,
          hasNext: parseInt(page) * parseInt(limit) < filteredResults.length,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching quiz history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
