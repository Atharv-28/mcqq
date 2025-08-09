const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

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

    const offset = (page - 1) * limit;

    // Build query with optional filters
    let query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY percentage DESC, completed_at ASC) as rank,
        username,
        subject,
        sub_category,
        difficulty,
        total_questions,
        correct_answers,
        score,
        percentage,
        time_taken,
        completed_at
      FROM quiz_results
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Apply filters
    if (subject && subject !== 'all') {
      query += ` AND subject = $${paramIndex}`;
      queryParams.push(subject);
      paramIndex++;
    }

    if (difficulty && difficulty !== 'all') {
      query += ` AND difficulty = $${paramIndex}`;
      queryParams.push(difficulty);
      paramIndex++;
    }

    // Apply timeframe filter
    if (timeframe === 'week') {
      query += ` AND completed_at >= NOW() - INTERVAL '7 days'`;
    } else if (timeframe === 'month') {
      query += ` AND completed_at >= NOW() - INTERVAL '30 days'`;
    }

    // Complete the query
    query += ` ORDER BY percentage DESC, completed_at ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const results = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM quiz_results WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (subject && subject !== 'all') {
      countQuery += ` AND subject = $${countParamIndex}`;
      countParams.push(subject);
      countParamIndex++;
    }

    if (difficulty && difficulty !== 'all') {
      countQuery += ` AND difficulty = $${countParamIndex}`;
      countParams.push(difficulty);
      countParamIndex++;
    }

    if (timeframe === 'week') {
      countQuery += ` AND completed_at >= NOW() - INTERVAL '7 days'`;
    } else if (timeframe === 'month') {
      countQuery += ` AND completed_at >= NOW() - INTERVAL '30 days'`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        leaderboard: results.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: offset + limit < totalCount,
          hasPrev: page > 1
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

    // Get user's best score
    let userQuery = `
      SELECT percentage, completed_at
      FROM quiz_results 
      WHERE username = $1
    `;
    
    const userParams = [username];
    let userParamIndex = 2;

    if (subject && subject !== 'all') {
      userQuery += ` AND subject = $${userParamIndex}`;
      userParams.push(subject);
      userParamIndex++;
    }

    if (difficulty && difficulty !== 'all') {
      userQuery += ` AND difficulty = $${userParamIndex}`;
      userParams.push(difficulty);
      userParamIndex++;
    }

    userQuery += ` ORDER BY percentage DESC, completed_at ASC LIMIT 1`;

    const userResult = await pool.query(userQuery, userParams);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No quiz results found for this user'
      });
    }

    const userBestScore = userResult.rows[0];

    // Get user's rank
    let rankQuery = `
      SELECT COUNT(*) + 1 as rank
      FROM (
        SELECT DISTINCT username, MAX(percentage) as best_percentage
        FROM quiz_results
        WHERE 1=1
    `;

    const rankParams = [];
    let rankParamIndex = 1;

    if (subject && subject !== 'all') {
      rankQuery += ` AND subject = $${rankParamIndex}`;
      rankParams.push(subject);
      rankParamIndex++;
    }

    if (difficulty && difficulty !== 'all') {
      rankQuery += ` AND difficulty = $${rankParamIndex}`;
      rankParams.push(difficulty);
      rankParamIndex++;
    }

    rankQuery += `
        GROUP BY username
        HAVING MAX(percentage) > $${rankParamIndex}
      ) as better_users
    `;
    rankParams.push(userBestScore.percentage);

    const rankResult = await pool.query(rankQuery, rankParams);
    const rank = parseInt(rankResult.rows[0].rank);

    // Get total users count
    let totalUsersQuery = `
      SELECT COUNT(DISTINCT username) as total_users
      FROM quiz_results
      WHERE 1=1
    `;

    const totalUsersParams = [];
    let totalUsersParamIndex = 1;

    if (subject && subject !== 'all') {
      totalUsersQuery += ` AND subject = $${totalUsersParamIndex}`;
      totalUsersParams.push(subject);
      totalUsersParamIndex++;
    }

    if (difficulty && difficulty !== 'all') {
      totalUsersQuery += ` AND difficulty = $${totalUsersParamIndex}`;
      totalUsersParams.push(difficulty);
      totalUsersParamIndex++;
    }

    const totalUsersResult = await pool.query(totalUsersQuery, totalUsersParams);
    const totalUsers = parseInt(totalUsersResult.rows[0].total_users);

    res.json({
      success: true,
      data: {
        username,
        rank,
        totalUsers,
        bestScore: userBestScore.percentage,
        completedAt: userBestScore.completed_at,
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
    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_quizzes,
        COUNT(DISTINCT username) as total_users,
        AVG(percentage) as avg_percentage,
        MAX(percentage) as highest_score,
        MIN(percentage) as lowest_score,
        AVG(time_taken) as avg_time_taken
      FROM quiz_results
    `;

    const statsResult = await pool.query(statsQuery);
    const overallStats = statsResult.rows[0];

    // Get subject distribution
    const subjectStatsQuery = `
      SELECT 
        subject,
        COUNT(*) as quiz_count,
        AVG(percentage) as avg_percentage,
        COUNT(DISTINCT username) as unique_users
      FROM quiz_results
      GROUP BY subject
      ORDER BY quiz_count DESC
    `;

    const subjectStatsResult = await pool.query(subjectStatsQuery);

    // Get difficulty distribution
    const difficultyStatsQuery = `
      SELECT 
        difficulty,
        COUNT(*) as quiz_count,
        AVG(percentage) as avg_percentage
      FROM quiz_results
      GROUP BY difficulty
      ORDER BY 
        CASE difficulty 
          WHEN 'Easy' THEN 1 
          WHEN 'Medium' THEN 2 
          WHEN 'Hard' THEN 3 
        END
    `;

    const difficultyStatsResult = await pool.query(difficultyStatsQuery);

    // Get recent activity (last 7 days)
    const recentActivityQuery = `
      SELECT 
        DATE(completed_at) as date,
        COUNT(*) as quiz_count
      FROM quiz_results
      WHERE completed_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(completed_at)
      ORDER BY date DESC
    `;

    const recentActivityResult = await pool.query(recentActivityQuery);

    res.json({
      success: true,
      data: {
        overall: {
          totalQuizzes: parseInt(overallStats.total_quizzes),
          totalUsers: parseInt(overallStats.total_users),
          averagePercentage: parseFloat(overallStats.avg_percentage || 0).toFixed(1),
          highestScore: parseFloat(overallStats.highest_score || 0),
          lowestScore: parseFloat(overallStats.lowest_score || 0),
          averageTime: parseInt(overallStats.avg_time_taken || 0)
        },
        bySubject: subjectStatsResult.rows.map(row => ({
          subject: row.subject,
          quizCount: parseInt(row.quiz_count),
          averagePercentage: parseFloat(row.avg_percentage).toFixed(1),
          uniqueUsers: parseInt(row.unique_users)
        })),
        byDifficulty: difficultyStatsResult.rows.map(row => ({
          difficulty: row.difficulty,
          quizCount: parseInt(row.quiz_count),
          averagePercentage: parseFloat(row.avg_percentage).toFixed(1)
        })),
        recentActivity: recentActivityResult.rows.map(row => ({
          date: row.date,
          quizCount: parseInt(row.quiz_count)
        }))
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

module.exports = router;
