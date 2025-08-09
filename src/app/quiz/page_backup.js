'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { ArrowBack, Timer, QuestionMark, Error as ErrorIcon } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import quizAPI from '../../services/api';
import styles from './page.module.css';

// Custom theme for quiz page
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
      main: '#f59e0b',
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
  },
});

export default function Quiz() {
  const [quizSetup, setQuizSetup] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const router = useRouter();

  // Ensure component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load quiz setup and fetch questions from API
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const setupData = localStorage.getItem('quizSetup');
      if (setupData) {
        const parsed = JSON.parse(setupData);
        setQuizSetup(parsed);
        fetchQuestions(parsed);
      } else {
        // Redirect to setup if no data found
        router.push('/start');
      }
    }
  }, [mounted, router]);

  // Fetch questions from backend
  const fetchQuestions = async (setup) => {
    try {
      setQuestionsLoading(true);
      setError(null);
      
      const response = await quizAPI.generateQuestions(
        setup.subject,
        setup.subCategory,
        setup.difficulty,
        10
      );
      
      if (response.success && response.questions) {
        setQuestions(response.questions);
      } else {
        throw new Error(response.message || 'Failed to fetch questions');
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.message || 'Failed to load questions. Please try again.');
    } finally {
      setQuestionsLoading(false);
      setLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (quizStarted && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (quizStarted && timeLeft === 0) {
      // Auto-submit when time runs out
      handleNextQuestion();
    }
  }, [timeLeft, quizStarted]);

  const startQuiz = () => {
    setQuizStarted(true);
    setTimeLeft(30);
    setStartTime(Date.now());
  };

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    // Save the answer
    const newAnswer = {
      questionId: questions[currentQuestionIndex].id,
      question: questions[currentQuestionIndex].question,
      selectedAnswer: selectedAnswer,
      correctAnswer: questions[currentQuestionIndex].correctAnswer,
      isCorrect: selectedAnswer === questions[currentQuestionIndex].correctAnswer,
      timeSpent: 30 - timeLeft,
      options: questions[currentQuestionIndex].options
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    // Move to next question or finish quiz
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeLeft(30);
    } else {
      // Quiz completed, navigate to results
      finishQuiz(updatedAnswers);
    }
  };

  const finishQuiz = async (finalAnswers) => {
    const score = finalAnswers.filter(answer => answer.isCorrect).length;
    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const timeTaken = Math.round((Date.now() - startTime) / 1000); // in seconds

    const quizData = {
      username: quizSetup.username,
      subject: quizSetup.subject,
      subCategory: quizSetup.subCategory,
      difficulty: quizSetup.difficulty,
      totalQuestions,
      correctAnswers: score,
      score,
      percentage,
      timeTaken,
      questionsData: finalAnswers,
      completedAt: Date.now()
    };

    try {
      // Submit results to backend
      await quizAPI.submitQuizResults(quizData);
      
      // Store results in localStorage for results page
      if (typeof window !== 'undefined') {
        localStorage.setItem('quizResults', JSON.stringify(quizData));
      }
    } catch (err) {
      console.error('Error submitting quiz results:', err);
      // Still store locally even if backend fails
      if (typeof window !== 'undefined') {
        localStorage.setItem('quizResults', JSON.stringify(quizData));
      }
    }

    // Navigate to results page
    router.push('/results');
  };

  const retryFetchQuestions = () => {
    if (quizSetup) {
      fetchQuestions(quizSetup);
    }
  };

  const formatTime = (seconds) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
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
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
            <Typography variant="h6">
              {questionsLoading ? 'Loading quiz questions...' : 'Preparing your quiz...'}
            </Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <div className={styles.page}>
          <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
            <Paper sx={{ p: 6, borderRadius: 3 }}>
              <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
              <Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 700 }}>
                Oops! Something went wrong
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                {error}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={retryFetchQuestions}
                  sx={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  }}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/start')}
                >
                  Back to Setup
                </Button>
              </Box>
            </Paper>
          </Container>
        </div>
      </ThemeProvider>
    );
  }

  if (!quizSetup || questions.length === 0) {
    return null; // Will redirect to setup
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <ThemeProvider theme={theme}>
      <div className={styles.page}>
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Toolbar>
            <IconButton
              onClick={() => router.push('/start')}
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
              {quizSetup.subject.charAt(0).toUpperCase() + quizSetup.subject.slice(1)} Quiz - {quizSetup.difficulty.charAt(0).toUpperCase() + quizSetup.difficulty.slice(1)}
            </Typography>
            <Chip 
              label={`${currentQuestionIndex + 1}/${questions.length}`}
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 600
              }}
            />
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          {!quizStarted ? (
            // Quiz start screen
            <Box sx={{ textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
              <Paper sx={{ p: 6, borderRadius: 3 }}>
                <QuestionMark sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 700 }}>
                  Ready to Start?
                </Typography>
                <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
                  Hey {quizSetup.username}! Your quiz is ready.
                </Typography>
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Subject:</strong> {quizSetup.subject.charAt(0).toUpperCase() + quizSetup.subject.slice(1)}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Category:</strong> {quizSetup.subCategory}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Difficulty:</strong> {quizSetup.difficulty.charAt(0).toUpperCase() + quizSetup.difficulty.slice(1)}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Questions:</strong> {questions.length}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Time per question:</strong> 30 seconds
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
                  <Typography variant="body2">
                    <strong>Instructions:</strong><br />
                    • You have 30 seconds per question<br />
                    • Click on your answer choice to select it<br />
                    • Click "Next Question" to proceed<br />
                    • You cannot go back to previous questions
                  </Typography>
                </Alert>

                <Button
                  variant="contained"
                  size="large"
                  onClick={startQuiz}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '18px',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  }}
                >
                  Start Quiz
                </Button>
              </Paper>
            </Box>
          ) : (
            // Quiz questions
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              {/* Progress and Timer */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timer sx={{ color: timeLeft <= 10 ? '#f59e0b' : 'white' }} />
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: timeLeft <= 10 ? '#f59e0b' : 'white',
                        fontWeight: 700,
                        minWidth: '50px'
                      }}
                    >
                      {formatTime(timeLeft)}
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'white',
                      borderRadius: 4
                    }
                  }} 
                />
              </Box>

              {/* Question Card */}
              <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ mb: 4, fontWeight: 600, lineHeight: 1.4 }}>
                  {currentQuestion.question}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswer === index ? "contained" : "outlined"}
                      onClick={() => handleAnswerSelect(index)}
                      sx={{
                        p: 2,
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        fontSize: '16px',
                        borderRadius: 2,
                        border: selectedAnswer === index ? 'none' : '2px solid rgba(102, 126, 234, 0.3)',
                        backgroundColor: selectedAnswer === index ? 'primary.main' : 'transparent',
                        color: selectedAnswer === index ? 'white' : 'text.primary',
                        '&:hover': {
                          backgroundColor: selectedAnswer === index ? 'primary.dark' : 'rgba(102, 126, 234, 0.1)',
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: selectedAnswer === index ? 'rgba(255, 255, 255, 0.2)' : 'primary.main',
                            color: selectedAnswer === index ? 'white' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            mr: 2,
                            flexShrink: 0
                          }}
                        >
                          {String.fromCharCode(65 + index)}
                        </Box>
                        {option}
                      </Box>
                    </Button>
                  ))}
                </Box>
              </Paper>

              {/* Next Button */}
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleNextQuestion}
                  disabled={selectedAnswer === null}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '16px',
                    background: selectedAnswer !== null 
                      ? 'linear-gradient(45deg, #667eea, #764ba2)' 
                      : 'rgba(0, 0, 0, 0.12)',
                  }}
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </Button>
              </Box>
            </Box>
          )}
        </Container>
      </div>
    </ThemeProvider>
  );
}
