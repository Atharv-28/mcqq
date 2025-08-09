import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
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
              <p>Mathematics, Science, History, and more</p>
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

          <div className={styles.ctas}>
            <Link href="/setup" className={styles.primary}>
              Start Quiz Challenge
            </Link>
            <Link href="/rankings" className={styles.secondary}>
              View Leaderboard
            </Link>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2025 MCQ Challenge Platform. Test your knowledge, challenge yourself!</p>
        <p>-- Developed by Atharv Tambekar</p>
      </footer>
    </div>
  );
}
