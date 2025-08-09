'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { ArrowBack, PlayArrow, Leaderboard } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import styles from './page.module.css';

// Create a custom theme for the MCQ platform
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: 'transparent',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans)',
    h4: {
      fontWeight: 800,
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.6)',
            },
            '& input': {
              color: 'white',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 600,
          },
          '& .MuiFormHelperText-root': {
            color: '#ff6b6b',
            fontWeight: 500,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          color: 'white',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: '2px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.4)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.6)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '50px',
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '16px',
          padding: '12px 32px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      },
    },
  },
});

export default function Setup() {
  const [formData, setFormData] = useState({
    username: '',
    subject: '',
    subCategory: '',
    difficulty: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const subjects = {
    sports: {
      label: 'Sports',
      subcategories: [
        { value: 'f1', label: 'Formula 1' },
        { value: 'cricket', label: 'Cricket' },
        { value: 'football', label: 'Football' },
        { value: 'basketball', label: 'Basketball' },
        { value: 'tennis', label: 'Tennis' },
        { value: 'olympics', label: 'Olympics' }
      ]
    },
    technology: {
      label: 'Technology',
      subcategories: [
        { value: 'hardware', label: 'Hardware' },
        { value: 'software', label: 'Software' },
        { value: 'programming', label: 'Programming' },
        { value: 'ai-ml', label: 'AI & Machine Learning' },
        { value: 'cybersecurity', label: 'Cybersecurity' },
        { value: 'web-dev', label: 'Web Development' }
      ]
    },
    politics: {
      label: 'Politics',
      subcategories: [
        { value: 'world-politics', label: 'World Politics' },
        { value: 'us-politics', label: 'US Politics' },
        { value: 'indian-politics', label: 'Indian Politics' },
        { value: 'european-politics', label: 'European Politics' },
        { value: 'political-history', label: 'Political History' },
        { value: 'government', label: 'Government Systems' }
      ]
    },
    science: {
      label: 'Science',
      subcategories: [
        { value: 'physics', label: 'Physics' },
        { value: 'chemistry', label: 'Chemistry' },
        { value: 'biology', label: 'Biology' },
        { value: 'space', label: 'Space & Astronomy' },
        { value: 'environment', label: 'Environmental Science' },
        { value: 'medical', label: 'Medical Science' }
      ]
    },
    history: {
      label: 'History',
      subcategories: [
        { value: 'world-war', label: 'World Wars' },
        { value: 'ancient', label: 'Ancient History' },
        { value: 'medieval', label: 'Medieval Period' },
        { value: 'modern', label: 'Modern History' },
        { value: 'indian-history', label: 'Indian History' },
        { value: 'american-history', label: 'American History' }
      ]
    },
    geography: {
      label: 'Geography',
      subcategories: [
        { value: 'world-capitals', label: 'World Capitals' },
        { value: 'countries', label: 'Countries & Flags' },
        { value: 'mountains', label: 'Mountains & Rivers' },
        { value: 'climate', label: 'Climate & Weather' },
        { value: 'continents', label: 'Continents' },
        { value: 'landmarks', label: 'Famous Landmarks' }
      ]
    },
    entertainment: {
      label: 'Entertainment',
      subcategories: [
        { value: 'movies', label: 'Movies' },
        { value: 'music', label: 'Music' },
        { value: 'tv-shows', label: 'TV Shows' },
        { value: 'celebrities', label: 'Celebrities' },
        { value: 'gaming', label: 'Gaming' },
        { value: 'books', label: 'Books & Literature' }
      ]
    },
    general: {
      label: 'General Knowledge',
      subcategories: [
        { value: 'current-affairs', label: 'Current Affairs' },
        { value: 'business', label: 'Business & Economy' },
        { value: 'inventions', label: 'Inventions & Discoveries' },
        { value: 'awards', label: 'Awards & Honors' },
        { value: 'culture', label: 'Culture & Traditions' },
        { value: 'mixed', label: 'Mixed Topics' }
      ]
    }
  };

  const difficulties = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Reset subcategory when subject changes
      if (name === 'subject') {
        newData.subCategory = '';
      }
      
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 2) {
      newErrors.username = 'Username must be at least 2 characters';
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }

    if (!formData.subCategory) {
      newErrors.subCategory = 'Please select a subcategory';
    }

    if (!formData.difficulty) {
      newErrors.difficulty = 'Please select a difficulty level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setLoading(true);
      
      // Simulate loading for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store form data in localStorage for now (later we'll use proper state management)
      localStorage.setItem('quizSetup', JSON.stringify({
        username: formData.username.trim(),
        subject: formData.subject,
        subCategory: formData.subCategory,
        difficulty: formData.difficulty,
        timestamp: new Date().toISOString()
      }));
      
      // Navigate to quiz page
      router.push('/quiz');
    }
  };

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
              Quiz Start - Setup Your Challenge
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: { xs: 900, lg: 1400, xl: 1600 } }}>
            <Grid container spacing={6} alignItems="center" justifyContent="center">
              <Grid item xs={12} lg={5}>
                <Box sx={{ textAlign: 'center', color: 'white', mb: { xs: 4, lg: 0 } }}>
                  <Typography variant="h3" component="h2" sx={{ 
                    fontWeight: 800, 
                    mb: 2,
                    background: 'linear-gradient(45deg, #fff, #e0e7ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Ready for the Challenge?
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 3, lineHeight: 1.5, px: { xs: 2, lg: 0 } }}>
                    Set up your quiz preferences and let's test your knowledge with AI-generated questions!
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Card sx={{ minWidth: 120, textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>10</Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Questions</Typography>
                      </CardContent>
                    </Card>
                    <Card sx={{ minWidth: 120, textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>30s</Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Per Question</Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} lg={7}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Paper 
                    elevation={3}
                    sx={{ 
                      p: { xs: 3, sm: 4, lg: 6 }, 
                      borderRadius: 3,
                      width: '100%',
                      maxWidth: { xs: 450, sm: 500, lg: 750, xl: 850 },
                    }}
                  >
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        error={!!errors.username}
                        helperText={errors.username}
                        placeholder="Enter your username"
                        inputProps={{ maxLength: 20 }}
                        required
                      />

                      <FormControl fullWidth error={!!errors.subject}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>Subject</InputLabel>
                        <Select
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          label="Subject"
                          required
                        >
                          {Object.entries(subjects).map(([key, subject]) => (
                            <MenuItem key={key} value={key}>
                              {subject.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.subject && (
                          <Typography variant="caption" sx={{ color: '#ff6b6b', mt: 1, fontWeight: 500 }}>
                            {errors.subject}
                          </Typography>
                        )}
                      </FormControl>

                      <FormControl fullWidth error={!!errors.subCategory} disabled={!formData.subject}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
                          {formData.subject ? `${subjects[formData.subject]?.label} Category` : 'Select Subject First'}
                        </InputLabel>
                        <Select
                          name="subCategory"
                          value={formData.subCategory}
                          onChange={handleInputChange}
                          label={formData.subject ? `${subjects[formData.subject]?.label} Category` : 'Select Subject First'}
                          required
                        >
                          {formData.subject && subjects[formData.subject]?.subcategories.map(subcat => (
                            <MenuItem key={subcat.value} value={subcat.value}>
                              {subcat.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.subCategory && (
                          <Typography variant="caption" sx={{ color: '#ff6b6b', mt: 1, fontWeight: 500 }}>
                            {errors.subCategory}
                          </Typography>
                        )}
                      </FormControl>

                      <FormControl fullWidth error={!!errors.difficulty}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>Difficulty Level</InputLabel>
                        <Select
                          name="difficulty"
                          value={formData.difficulty}
                          onChange={handleInputChange}
                          label="Difficulty Level"
                          required
                        >
                          {difficulties.map(difficulty => (
                            <MenuItem key={difficulty.value} value={difficulty.value}>
                              {difficulty.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.difficulty && (
                          <Typography variant="caption" sx={{ color: '#ff6b6b', mt: 1, fontWeight: 500 }}>
                            {errors.difficulty}
                          </Typography>
                        )}
                      </FormControl>

                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                        sx={{
                          mt: 2,
                          py: 1.5,
                          background: 'linear-gradient(45deg, #667eea, #764ba2)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #5a67d8, #6b46c1)',
                          },
                        }}
                      >
                        {loading ? 'Preparing Quiz...' : 'Start Quiz Challenge'}
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Container>

        <Box sx={{ 
          textAlign: 'center', 
          py: 2, 
          background: 'rgba(0, 0, 0, 0.1)', 
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            &copy; 2025 MCQ Challenge Platform
          </Typography>
        </Box>
      </div>
    </ThemeProvider>
  );
}
