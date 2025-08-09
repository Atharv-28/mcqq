const express = require('express');
const geminiService = require('../services/geminiService');

const router = express.Router();

// Get available subjects and categories
router.get('/subjects', (req, res) => {
  try {
    const subjects = geminiService.getSubjectCategories();
    
    res.json({
      success: true,
      data: {
        subjects: Object.keys(subjects).map(subject => ({
          name: subject,
          categories: subjects[subject]
        })),
        totalSubjects: Object.keys(subjects).length,
        totalCategories: Object.values(subjects).reduce((sum, categories) => sum + categories.length, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get categories for a specific subject
router.get('/subjects/:subject/categories', (req, res) => {
  try {
    const { subject } = req.params;
    const subjects = geminiService.getSubjectCategories();
    
    if (!subjects[subject]) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.json({
      success: true,
      data: {
        subject,
        categories: subjects[subject]
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Validate subject and category combination
router.post('/validate', (req, res) => {
  try {
    const { subject, subCategory } = req.body;
    
    if (!subject || !subCategory) {
      return res.status(400).json({
        success: false,
        message: 'Subject and subcategory are required'
      });
    }

    const isValid = geminiService.isValidSubjectCategory(subject, subCategory);
    
    res.json({
      success: true,
      data: {
        isValid,
        subject,
        subCategory
      }
    });
  } catch (error) {
    console.error('Error validating subject/category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate subject/category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generate sample questions (for testing)
router.post('/sample', async (req, res) => {
  try {
    const { subject, subCategory, difficulty, count = 5 } = req.body;
    
    if (!subject || !subCategory || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Subject, subcategory, and difficulty are required'
      });
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: 'Difficulty must be Easy, Medium, or Hard'
      });
    }

    if (!geminiService.isValidSubjectCategory(subject, subCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject or subcategory'
      });
    }

    console.log(`🎯 Generating ${count} sample questions for ${subject} - ${subCategory} (${difficulty})`);
    
    const questions = await geminiService.generateQuestions(subject, subCategory, difficulty, count);
    
    res.json({
      success: true,
      data: {
        questions: questions.map((q, index) => ({
          ...q,
          id: index + 1,
          questionNumber: index + 1
        })),
        meta: {
          subject,
          subCategory,
          difficulty,
          count: questions.length,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error generating sample questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sample questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
