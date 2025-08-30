'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import { 
  EmojiEvents, 
  Home, 
  PlayArrow,
  ArrowBack,
  TrendingUp,
  Schedule,
  Person,
  Star,
  WorkspacePremium
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import quizAPI from '../../services/api';
import styles from './page.module.css';

// Custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    success: {
      main: '#10b981',
    },
    warning: {
      main: '#f59e0b',
    },
    error: {
      main: '#ef4444',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans)',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});

export default function Rankings() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [userRank, setUserRank] = useState(null);
  const [userResults, setUserResults] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadLeaderboardData();
    }
  }, [mounted, tabValue, loadLeaderboardData]);

  // Helper function to get subject filter for API
  const getSubjectFilter = (tabIndex) => {
    switch (tabIndex) {
      case 1: return 'Technology';
      case 2: return 'Sports';
      case 3: return 'Science';
      default: return null; // All subjects
    }
  };

  // Fallback function to load from localStorage (in case API is down)
  const loadLocalStorageData = async () => {
    let allUserResults = [];
    if (typeof window !== 'undefined') {
      // Try to get all quiz history first
      const historyData = localStorage.getItem('quizHistory');
      if (historyData) {
        allUserResults = JSON.parse(historyData);
      } else {
        // Fallback to single result if no history exists
        const resultsData = localStorage.getItem('quizResults');
        if (resultsData) {
          allUserResults = [JSON.parse(resultsData)];
          setUserResults(JSON.parse(resultsData));
        }
      }
    }

    // Convert localStorage data to leaderboard format
    let leaderboardData = [];
    if (allUserResults.length > 0) {
      leaderboardData = allUserResults.map(result => ({
        username: result.username,
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage: result.percentage,
        subject: result.subject,
        subCategory: result.subCategory,
        difficulty: result.difficulty,
        completedAt: result.completedAt || Date.now(),
        avatar: null
      }));
      
      // Sort by percentage (highest first)
      leaderboardData.sort((a, b) => b.percentage - a.percentage);
    }

    setLeaderboard(leaderboardData);
    
    // Calculate user's best rank
    if (allUserResults.length > 0) {
      // Find the best performance (highest percentage)
      const bestResult = allUserResults.reduce((best, current) => 
        current.percentage > best.percentage ? current : best
      );
      
      const userBestIndex = leaderboardData.findIndex(entry => 
        entry.username === bestResult.username && entry.percentage === bestResult.percentage
      );
      setUserRank(userBestIndex + 1);
    }
  };

  const loadLeaderboardData = useCallback(async () => {
    setLoading(true); // Make sure loading is set when fetching new data
    try {
      // Get current user's username from localStorage
      let currentUsername = null;
      if (typeof window !== 'undefined') {
        const resultsData = localStorage.getItem('quizResults');
        if (resultsData) {
          const userResults = JSON.parse(resultsData);
          currentUsername = userResults.username;
          setUserResults(userResults);
        }
      }

      // Get the current subject filter
      const subjectFilter = getSubjectFilter(tabValue);
      console.log('Fetching leaderboard for subject:', subjectFilter);

      // Fetch leaderboard from backend API
      const leaderboardResponse = await quizAPI.getLeaderboard({
        limit: 100, // Get top 100 entries
        subject: subjectFilter,
      });

      console.log('Leaderboard response:', leaderboardResponse);

      if (leaderboardResponse.success && leaderboardResponse.data) {
        setLeaderboard(leaderboardResponse.data);

        // Get user's rank if we have their username
        if (currentUsername) {
          try {
            const rankResponse = await quizAPI.getUserRank(currentUsername, {
              subject: subjectFilter,
            });
            
            if (rankResponse.success && rankResponse.data) {
              setUserRank(rankResponse.data.rank);
            }
          } catch (error) {
            console.error('Error fetching user rank:', error);
            // If getUserRank fails, calculate rank from leaderboard data
            const userIndex = leaderboardResponse.data.findIndex(
              entry => entry.username === currentUsername
            );
            if (userIndex !== -1) {
              setUserRank(userIndex + 1);
            }
          }
        }
      } else {
        console.warn('No leaderboard data received from API');
        setLeaderboard([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      
      // Fallback to localStorage data if API fails
      console.log('Falling back to localStorage data...');
      await loadLocalStorageData();
      
      setLoading(false);
    }
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    console.log('Tab changed to:', newValue, 'Subject:', getSubjectFilter(newValue));
    setTabValue(newValue);
    // Data will reload automatically due to useEffect dependency on tabValue
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 1:
        return <EmojiEvents sx={{ color: '#ffd700', fontSize: 28 }} />; // Gold
      case 2:
        return <WorkspacePremium sx={{ color: '#c0c0c0', fontSize: 28 }} />; // Silver
      case 3:
        return <Star sx={{ color: '#cd7f32', fontSize: 28 }} />; // Bronze
      default:
        return <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', minWidth: 32 }}>#{position}</Typography>;
    }
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: "A+", color: "#10b981" };
    if (percentage >= 80) return { grade: "A", color: "#059669" };
    if (percentage >= 70) return { grade: "B", color: "#0891b2" };
    if (percentage >= 60) return { grade: "C", color: "#0284c7" };
    if (percentage >= 50) return { grade: "D", color: "#f59e0b" };
    return { grade: "F", color: "#ef4444" };
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const generateAvatar = (username) => {
    const colors = ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const colorIndex = username.length % colors.length;
    return {
      backgroundColor: colors[colorIndex],
      color: 'white'
    };
  };

  const filteredLeaderboard = () => {
    // Since filtering is now done on the API side when fetching data,
    // we just return the leaderboard as-is
    return leaderboard;
  };

  if (!mounted || loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <CircularProgress size={60} sx={{ color: 'white' }} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <div className={styles.page}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <IconButton
              onClick={() => router.push('/')}
              sx={{ 
                color: 'white',
                mr: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" component="h1" sx={{ flexGrow: 1, color: 'white', fontWeight: 700 }}>
              Global Rankings & Leaderboard
            </Typography>
            <Button
              component={Link}
              href="/start"
              variant="contained"
              startIcon={<PlayArrow />}
              sx={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              Take Quiz
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
          <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant="h3" 
                component="h2" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 800, 
                  mb: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                🏆 Leaderboard
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                See how you rank against quiz champions worldwide!
              </Typography>
            </Box>

            {/* User's Current Rank Card */}
            {userRank && userResults && (
              <Card sx={{ mb: 4, background: 'white' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingUp sx={{ color: 'primary.main', fontSize: 32 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Your Best Performance
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Ranked #{userRank} with {userResults.percentage}% in {userResults.subject}. 
                        {leaderboard.length > 1 && ` You have ${leaderboard.filter(entry => entry.username === userResults.username).length} quiz attempts.`}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Filter Tabs */}
            <Paper sx={{ mb: 4 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 600,
                    textTransform: 'none',
                  },
                }}
              >
                <Tab label="All Subjects" />
                <Tab label="Technology" />
                <Tab label="Sports" />
                <Tab label="Science" />
              </Tabs>
            </Paper>

            {/* Top 3 Podium */}
            {filteredLeaderboard().length > 0 ? (
              <Grid container spacing={4} sx={{ mb: 4, justifyContent: 'center', alignItems: 'stretch' }}>
                {filteredLeaderboard().slice(0, 3).map((entry, index) => {
                  const grade = getGrade(entry.percentage);
                  return (
                    <Grid item xs={12} md={4} key={entry.id} sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Card 
                        sx={{ 
                          textAlign: 'center',
                          p: 3,
                          width: '100%',
                          maxWidth: 350,
                          background: index === 0 
                            ? 'linear-gradient(45deg, #ffd700, #ffed4a)' 
                            : index === 1 
                            ? 'linear-gradient(45deg, #c0c0c0, #e5e7eb)'
                            : 'linear-gradient(45deg, #cd7f32, #d97706)',
                          color: index === 1 ? 'black' : 'white',
                          transform: index === 0 ? 'scale(1.05)' : 'scale(1)',
                          boxShadow: index === 0 ? '0 8px 25px rgba(255, 215, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                        }}
                      >
                        <Box sx={{ mb: 2 }}>
                          {getPositionIcon(index + 1)}
                        </Box>
                        <Avatar 
                          sx={{ 
                            width: 64, 
                            height: 64, 
                            mx: 'auto', 
                            mb: 2,
                            ...generateAvatar(entry.username),
                            fontSize: '24px',
                            fontWeight: 700
                          }}
                        >
                          {entry.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                          {entry.username}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                          {entry.percentage}%
                        </Typography>
                        <Chip 
                          label={grade.grade}
                          sx={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'inherit',
                            fontWeight: 700
                          }}
                        />
                        <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                          {entry.subject} • {entry.difficulty}
                        </Typography>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', mb: 4 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  No quiz results yet!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Take your first quiz to see how you rank against other players.
                </Typography>
                <Button
                  component={Link}
                  href="/start"
                  variant="contained"
                  startIcon={<PlayArrow />}
                  sx={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  }}
                >
                  Take Your First Quiz
                </Button>
              </Paper>
            )}

            {/* Full Leaderboard */}
            {filteredLeaderboard().length > 0 ? (
              <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEvents sx={{ color: 'primary.main' }} />
                  Complete Rankings
                </Typography>
                
                <List>
                  {filteredLeaderboard().map((entry, index) => {
                    const grade = getGrade(entry.percentage);
                    return (
                      <React.Fragment key={entry.id}>
                        <ListItem
                          sx={{
                            py: 2,
                            px: 3,
                            borderRadius: 2,
                            mb: 1,
                            backgroundColor: index < 3 ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
                            border: index < 3 ? '1px solid rgba(102, 126, 234, 0.1)' : 'none',
                          }}
                        >
                          <ListItemAvatar>
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, minWidth: 50 }}>
                              {getPositionIcon(index + 1)}
                            </Box>
                          </ListItemAvatar>
                          
                          <Avatar 
                            sx={{ 
                              ...generateAvatar(entry.username),
                              mr: 2,
                              fontWeight: 600
                            }}
                          >
                            {entry.username.charAt(0).toUpperCase()}
                          </Avatar>
                          
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {entry.username}
                                </Typography>
                                <Chip 
                                  label={`${entry.percentage}%`}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: grade.color,
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                />
                                <Chip 
                                  label={grade.grade}
                                  size="small"
                                  variant="outlined"
                                  sx={{ borderColor: grade.color, color: grade.color }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                                <Typography variant="body2" color="text.secondary">
                                  {entry.subject} • {entry.subCategory}
                                </Typography>
                                <Chip 
                                  label={entry.difficulty}
                                  size="small"
                                  color={entry.difficulty === 'Hard' ? 'error' : entry.difficulty === 'Medium' ? 'warning' : 'success'}
                                  variant="outlined"
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Schedule fontSize="small" color="disabled" />
                                  <Typography variant="body2" color="text.secondary">
                                    {formatTimeAgo(entry.completedAt)}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < filteredLeaderboard().length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              </Paper>
            ) : null}

            {/* Call to Action */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Ready to climb the leaderboard?
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  component={Link}
                  href="/start"
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  sx={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  }}
                >
                  Take a Quiz
                </Button>
                <Button
                  component={Link}
                  href="/"
                  variant="outlined"
                  size="large"
                  startIcon={<Home />}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Home
                </Button>
              </Box>
            </Box>
          </Box>
        </Container>
      </div>
    </ThemeProvider>
  );
}
