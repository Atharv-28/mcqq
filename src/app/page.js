'use client';

import Link from "next/link";
import { Button, Box, Container, Typography, Card, CardContent, AppBar, Toolbar } from '@mui/material';
import { PlayArrow, Leaderboard } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import styles from "./page.module.css";

// Create a theme that matches our design
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans)',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '50px',
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '16px',
          padding: '12px 32px',
          minWidth: '180px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
  },
});

export default function Home() {
  return (
    <ThemeProvider theme={theme}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>MCQ Challenge Platform</h1>
          <nav className={styles.nav}>
            <Link href="/rankings" className={styles.navLink}>Rankings</Link>
          </nav>
        </header>

        <main className={styles.main}>
          <div className={styles.hero}>
            <h2 className={styles.heroTitle}>Welcome to MCQ Challenge</h2>
            <p className={styles.heroDescription}>
              Test your knowledge across various subjects with our intelligent quiz platform. 
              Choose your field, select difficulty level, and challenge yourself with 
              AI-generated questions tailored to your expertise.
            </p>
            
            <div className={styles.features}>
              <div className={styles.feature}>
                <h3>🎯 Multiple Subjects</h3>
                <p>Sports, Tech, Politics and more</p>
              </div>
              <div className={styles.feature}>
                <h3>📊 Difficulty Levels</h3>
                <p>Easy, Medium, and Hard questions</p>
              </div>
              <div className={styles.feature}>
                <h3>🏆 Global Rankings</h3>
                <p>Compete with players worldwide</p>
              </div>
            </div>

            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', mt: 4 }}>
              <Button
                href="/start"
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                sx={{
                  background: '#fff',
                  color: '#667eea',
                  '&:hover': {
                    background: '#f8fafc',
                  },
                }}
              >
                Start Quiz Challenge
              </Button>
              <Button
                href="/rankings"
                variant="outlined"
                size="large"
                startIcon={<Leaderboard />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                View Leaderboard
              </Button>
            </Box>
          </div>
        </main>

        <footer className={styles.footer}>
          <p>&copy; 2025 MCQ Challenge Platform. Test your knowledge, challenge yourself!</p>
          <p>- Developed by Atharv Tambekar</p>
        </footer>
      </div>
    </ThemeProvider>
  );
}
