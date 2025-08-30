const express = require('express');
const router = express.Router();
const storage = require('../config/storage');

// Get global leaderboard
router.get('/global', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      subject, 
      difficulty,
      timeframe = 'all' // all, week, month
    } = req.query;

    const filters = { limit: parseInt(limit) };
    
    if (subject && subject !== 'all') {
      filters.subject = subject;
    }
    
    if (difficulty && difficulty !== 'all') {
      filters.difficulty = difficulty;
    }

    // For timeframe, we'll implement basic filtering
    let leaderboardData = storage.getLeaderboard(filters);
    
    // Apply timeframe filter if needed
    if (timeframe === 'week' || timeframe === 'month') {
      const daysAgo = timeframe === 'week' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      
      leaderboardData = leaderboardData.filter(result => 
        new Date(result.completedAt) >= cutoffDate
      );
    }

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedData = leaderboardData.slice(offset, offset + parseInt(limit));
    
    // Add rank numbers
    const rankedData = paginatedData.map((result, index) => ({
      ...result,
      rank: offset + index + 1
    }));

    const totalCount = leaderboardData.length;

    res.json({
      success: true,
      data: {
        leaderboard: rankedData,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: offset + parseInt(limit) < totalCount,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          subject: subject || 'all',
          difficulty: difficulty || 'all',
          timeframe
        }
      }
    });

  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's rank
router.get('/rank/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { subject, difficulty } = req.query;
    
    const filters = {};
    if (subject && subject !== 'all') {
      filters.subject = subject;
    }
    if (difficulty && difficulty !== 'all') {
      filters.difficulty = difficulty;
    }
    
    // Get user's results with filters
    const userResults = storage.getQuizResults({ username, ...filters });
    
    if (userResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No quiz results found for this user'
      });
    }
    
    // Get user's best score
    const userBestScore = userResults[0]; // Already sorted by percentage DESC
    
    // Get user's rank
    const rank = storage.getUserRank(username, filters);
    
    // Get total users count for this filter
    const allResults = storage.getQuizResults(filters);
    const uniqueUsers = [...new Set(allResults.map(r => r.username.toLowerCase()))];
    const totalUsers = uniqueUsers.length;

    res.json({
      success: true,
      data: {
        username,
        rank,
        totalUsers,
        bestScore: userBestScore.percentage,
        completedAt: userBestScore.completedAt,
        percentile: totalUsers > 0 ? Math.round(((totalUsers - rank + 1) / totalUsers) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user rank',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get leaderboard statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = storage.getStats();
    const allResults = storage.getQuizResults();
    
    // Calculate overall statistics
    let totalScore = 0;
    let totalTime = 0;
    let highestScore = 0;
    let lowestScore = 100;
    
    allResults.forEach(result => {
      totalScore += result.percentage;
      totalTime += result.timeTaken || 0;
      highestScore = Math.max(highestScore, result.percentage);
      lowestScore = Math.min(lowestScore, result.percentage);
    });
    
    const averagePercentage = allResults.length > 0 ? totalScore / allResults.length : 0;
    const averageTime = allResults.length > 0 ? Math.round(totalTime / allResults.length) : 0;
    
    // Get subject distribution
    const subjectStats = {};
    allResults.forEach(result => {
      if (!subjectStats[result.subject]) {
        subjectStats[result.subject] = {
          quizCount: 0,
          totalPercentage: 0,
          users: new Set()
        };
      }
      subjectStats[result.subject].quizCount++;
      subjectStats[result.subject].totalPercentage += result.percentage;
      subjectStats[result.subject].users.add(result.username.toLowerCase());
    });
    
    const bySubject = Object.entries(subjectStats).map(([subject, data]) => ({
      subject,
      quizCount: data.quizCount,
      averagePercentage: (data.totalPercentage / data.quizCount).toFixed(1),
      uniqueUsers: data.users.size
    })).sort((a, b) => b.quizCount - a.quizCount);
    
    // Get difficulty distribution
    const difficultyStats = {};
    allResults.forEach(result => {
      if (!difficultyStats[result.difficulty]) {
        difficultyStats[result.difficulty] = {
          quizCount: 0,
          totalPercentage: 0
        };
      }
      difficultyStats[result.difficulty].quizCount++;
      difficultyStats[result.difficulty].totalPercentage += result.percentage;
    });
    
    const byDifficulty = ['Easy', 'Medium', 'Hard'].map(difficulty => {
      const data = difficultyStats[difficulty];
      return data ? {
        difficulty,
        quizCount: data.quizCount,
        averagePercentage: (data.totalPercentage / data.quizCount).toFixed(1)
      } : {
        difficulty,
        quizCount: 0,
        averagePercentage: '0.0'
      };
    });
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentResults = allResults.filter(result => 
      new Date(result.completedAt) >= sevenDaysAgo
    );
    
    const recentActivity = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayResults = recentResults.filter(result => 
        result.completedAt.split('T')[0] === dateStr
      );
      
      recentActivity.push({
        date: dateStr,
        quizCount: dayResults.length
      });
    }

    res.json({
      success: true,
      data: {
        overall: {
          totalQuizzes: stats.totalQuizzes,
          totalUsers: stats.totalUsers,
          averagePercentage: averagePercentage.toFixed(1),
          highestScore: highestScore,
          lowestScore: allResults.length > 0 ? lowestScore : 0,
          averageTime: averageTime
        },
        bySubject,
        byDifficulty,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get leaderboard with optional subject filtering (simple endpoint)
router.get('/', async (req, res) => {
  try {
    const { limit = 100, subject } = req.query;
    
    const filters = { limit: parseInt(limit) };
    if (subject) {
      filters.subject = subject;
    }
    
    const leaderboardData = storage.getLeaderboard(filters);
    
    res.json({
      success: true,
      data: leaderboardData
    });
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard data'
    });
  }
});

module.exports = router;
