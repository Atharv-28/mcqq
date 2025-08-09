const express = require('express');
const Joi = require('joi');
const { pool } = require('../config/database');
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
    const cachedQuestions = await pool.query(
      `SELECT questions_data FROM questions_cache 
       WHERE subject = $1 AND sub_category = $2 AND difficulty = $3 
       AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [subject, subCategory, difficulty]
    );

    let questions;

    if (cachedQuestions.rows.length > 0) {
      console.log('📋 Using cached questions');
      questions = cachedQuestions.rows[0].questions_data.slice(0, count);
    } else {
      console.log('🤖 Generating new questions');
      
      // Generate new questions
      questions = await geminiService.generateQuestions(subject, subCategory, difficulty, count);
      
      // Cache the questions
      await pool.query(
        `INSERT INTO questions_cache (subject, sub_category, difficulty, questions_data)
         VALUES ($1, $2, $3, $4)`,
        [subject, subCategory, difficulty, JSON.stringify(questions)]
      );
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

    // Insert quiz result
    const result = await pool.query(
      `INSERT INTO quiz_results 
       (username, subject, sub_category, difficulty, total_questions, 
        correct_answers, score, percentage, time_taken, questions_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, completed_at`,
      [
        username,
        subject,
        subCategory,
        difficulty,
        totalQuestions,
        correctAnswers,
        score,
        percentage,
        timeTaken,
        questionsData ? JSON.stringify(questionsData) : null
      ]
    );

    const quizResult = result.rows[0];

    // Get user's rank
    const rankResult = await pool.query(
      `SELECT COUNT(*) + 1 as rank
       FROM quiz_results 
       WHERE percentage > $1`,
      [percentage]
    );

    const userRank = parseInt(rankResult.rows[0].rank);

    // Get user's best scores
    const userStats = await pool.query(
      `SELECT 
         COUNT(*) as total_quizzes,
         AVG(percentage) as avg_percentage,
         MAX(percentage) as best_percentage,
         AVG(time_taken) as avg_time
       FROM quiz_results 
       WHERE username = $1`,
      [username]
    );

    const stats = userStats.rows[0];

    res.json({
      success: true,
      message: 'Quiz results submitted successfully',
      data: {
        resultId: quizResult.id,
        completedAt: quizResult.completed_at,
        rank: userRank,
        userStats: {
          totalQuizzes: parseInt(stats.total_quizzes),
          averagePercentage: parseFloat(stats.avg_percentage || 0).toFixed(1),
          bestPercentage: parseFloat(stats.best_percentage || 0),
          averageTime: parseInt(stats.avg_time || 0)
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

    const offset = (page - 1) * limit;

    // Build query with optional filters
    let query = `
      SELECT id, subject, sub_category, difficulty, total_questions,
             correct_answers, score, percentage, time_taken, completed_at
      FROM quiz_results 
      WHERE username = $1
    `;
    
    const queryParams = [username];
    let paramIndex = 2;

    if (subject) {
      query += ` AND subject = $${paramIndex}`;
      queryParams.push(subject);
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND difficulty = $${paramIndex}`;
      queryParams.push(difficulty);
      paramIndex++;
    }

    query += ` ORDER BY completed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const results = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM quiz_results WHERE username = $1';
    const countParams = [username];
    
    if (subject) {
      countQuery += ' AND subject = $2';
      countParams.push(subject);
    }
    
    if (difficulty) {
      countQuery += subject ? ' AND difficulty = $3' : ' AND difficulty = $2';
      countParams.push(difficulty);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        quizzes: results.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: offset + limit < totalCount,
          hasPrev: page > 1
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
