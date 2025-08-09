'use client';

import { useState, useEffect } from 'react';
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
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { 
  EmojiEvents, 
  Refresh, 
  Home, 
  Leaderboard,
  CheckCircle,
  Cancel,
  Timer
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
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
  },
});

export default function Results() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const resultsData = localStorage.getItem('quizResults');
      if (resultsData) {
        setResults(JSON.parse(resultsData));
        setLoading(false);
      } else {
        // Redirect to start if no results found
        router.push('/start');
      }
    }
  }, [mounted, router]);

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 90) return { message: "Outstanding! 🎉", color: "#10b981", icon: "🏆" };
    if (percentage >= 80) return { message: "Excellent! 🌟", color: "#059669", icon: "⭐" };
    if (percentage >= 70) return { message: "Great Job! 👏", color: "#0891b2", icon: "👏" };
    if (percentage >= 60) return { message: "Good Work! 👍", color: "#0284c7", icon: "👍" };
    if (percentage >= 50) return { message: "Not Bad! 🤔", color: "#f59e0b", icon: "🤔" };
    return { message: "Keep Practicing! 💪", color: "#ef4444", icon: "💪" };
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  };

  const formatTime = (seconds) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const saveScore = async () => {
    // Here we would save to backend/database
    // For now, we'll just simulate the save
    console.log('Saving score to database...', results);
    // TODO: Implement backend API call
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

  if (!results) {
    return null; // Will redirect
  }

  const performance = getPerformanceMessage(results.percentage);
  const grade = getGrade(results.percentage);
  const totalTime = results.answers.reduce((sum, answer) => sum + answer.timeSpent, 0);
  const averageTime = Math.round(totalTime / results.answers.length);

  return (
    <ThemeProvider theme={theme}>
      <div className={styles.page}>
        <Container maxWidth="xl" sx={{ py: 4, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%' }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 800, 
                  mb: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                Quiz Results {performance.icon}
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                {results.username}, here's how you performed!
              </Typography>
            </Box>

            {/* First Row: Score Card and Stats Card */}
            <Grid container spacing={4} sx={{ mb: 4, justifyContent: 'center', alignItems: 'stretch' }}>
              {/* Main Score Card */}
              <Grid item xs={12} md={8} sx={{ display: 'flex' }}>
                <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                    <CircularProgress
                      variant="determinate"
                      value={100}
                      size={120}
                      thickness={4}
                      sx={{ color: 'rgba(0, 0, 0, 0.1)' }}
                    />
                    <CircularProgress
                      variant="determinate"
                      value={results.percentage}
                      size={120}
                      thickness={4}
                      sx={{ 
                        color: performance.color,
                        position: 'absolute',
                        left: 0,
                        strokeLinecap: 'round'
                      }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                      }}
                    >
                      <Typography variant="h4" component="div" sx={{ fontWeight: 800 }}>
                        {results.percentage}%
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: performance.color }}>
                        {grade}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography 
                    variant="h5" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 700,
                      color: performance.color 
                    }}
                  >
                    {performance.message}
                  </Typography>

                  <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
                    You scored {results.score} out of {results.totalQuestions} questions correctly
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      component={Link}
                      href="/start"
                      variant="contained"
                      startIcon={<Refresh />}
                      sx={{
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      }}
                    >
                      Take Another Quiz
                    </Button>
                    <Button
                      component={Link}
                      href="/rankings"
                      variant="outlined"
                      startIcon={<Leaderboard />}
                    >
                      View Rankings
                    </Button>
                    <Button
                      component={Link}
                      href="/"
                      variant="outlined"
                      startIcon={<Home />}
                    >
                      Home
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              {/* Stats Card */}
              <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
                <Card sx={{ p: 4, borderRadius: 3, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmojiEvents sx={{ color: 'primary.main' }} />
                    Quiz Stats
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Subject</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {results.subject.charAt(0).toUpperCase() + results.subject.slice(1)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Category</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {results.subCategory}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Difficulty</Typography>
                    <Chip 
                      label={results.difficulty.charAt(0).toUpperCase() + results.difficulty.slice(1)}
                      size="small"
                      color={results.difficulty === 'hard' ? 'error' : results.difficulty === 'medium' ? 'warning' : 'success'}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Total Time</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Timer fontSize="small" />
                      {formatTime(totalTime)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Average Time per Question</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatTime(averageTime)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">Completed</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {new Date(results.completedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            </Grid>

            {/* Second Row: Question Review - Full Width */}
            <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
              {/* Question Review */}
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Paper sx={{ p: 5, borderRadius: 3, maxWidth: '100%', width: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                    Question Review
                  </Typography>
                  
                  <List sx={{ maxWidth: '100%' }}>
                    {results.answers.map((answer, index) => (
                      <ListItem 
                        key={answer.questionId}
                        sx={{ 
                          border: '1px solid rgba(0,0,0,0.1)', 
                          borderRadius: 2, 
                          mb: 2,
                          p: 3,
                          backgroundColor: answer.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          {answer.isCorrect ? (
                            <CheckCircle sx={{ color: 'success.main' }} />
                          ) : (
                            <Cancel sx={{ color: 'error.main' }} />
                          )}
                        </Box>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                Question {index + 1}
                              </Typography>
                              <Chip 
                                label={answer.isCorrect ? 'Correct' : 'Wrong'}
                                size="small"
                                color={answer.isCorrect ? 'success' : 'error'}
                              />
                              <Typography variant="body2" color="text.secondary">
                                Time: {formatTime(answer.timeSpent)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            answer.isCorrect ? 
                              "Great job! You got this one right." :
                              "Don't worry, keep practicing!"
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </div>
    </ThemeProvider>
  );
}
