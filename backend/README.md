# MCQ Quiz Backend API

A robust Node.js/Express.js backend for the MCQ Quiz application with PostgreSQL database and Google Gemini AI integration.

## Features

- **Authentication System**: Guest and registered user support
- **Dynamic Question Generation**: Powered by Google Gemini AI
- **PostgreSQL Database**: Scalable data storage
- **Leaderboard System**: Global rankings and statistics
- **Question Caching**: Optimized performance
- **Rate Limiting**: Security and abuse prevention
- **CORS Support**: Frontend integration
- **Input Validation**: Joi schema validation
- **Error Handling**: Comprehensive error management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **AI Integration**: Google Gemini AI
- **Authentication**: JWT
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Google Gemini AI API key

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=mcq_quiz
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   # Gemini AI
   GEMINI_API_KEY=your_gemini_api_key
   
   # JWT Secret
   JWT_SECRET=your_super_secret_key
   ```

3. **Create PostgreSQL database**:
   ```sql
   CREATE DATABASE mcq_quiz;
   ```

4. **Start the server**:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /guest-login` - Create guest account
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /verify` - Verify JWT token

### Quiz Routes (`/api/quiz`)

- `POST /questions` - Generate quiz questions
- `POST /submit` - Submit quiz results
- `GET /history/:username` - Get user's quiz history

### Leaderboard Routes (`/api/leaderboard`)

- `GET /global` - Get global leaderboard
- `GET /rank/:username` - Get user's rank
- `GET /stats` - Get platform statistics

### Questions Routes (`/api/questions`)

- `GET /subjects` - Get available subjects and categories
- `GET /subjects/:subject/categories` - Get categories for subject
- `POST /validate` - Validate subject/category combination
- `POST /sample` - Generate sample questions

## Database Schema

### Users Table
```sql
users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Quiz Results Table
```sql
quiz_results (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  username VARCHAR(50) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  sub_category VARCHAR(100) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  total_questions INTEGER DEFAULT 10,
  correct_answers INTEGER NOT NULL,
  score INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  time_taken INTEGER,
  questions_data JSONB,
  completed_at TIMESTAMP,
  created_at TIMESTAMP
)
```

### Questions Cache Table
```sql
questions_cache (
  id UUID PRIMARY KEY,
  subject VARCHAR(100) NOT NULL,
  sub_category VARCHAR(100) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  questions_data JSONB NOT NULL,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
)
```

## Available Subjects and Categories

### Technology
- Programming, Web Development, Mobile Development
- AI & Machine Learning, Data Science, Cybersecurity
- Cloud Computing, DevOps, Blockchain, IoT

### Science
- Physics, Chemistry, Biology, Mathematics
- Astronomy, Environmental Science, Medicine

### Sports
- Football, Basketball, Cricket, Tennis
- Olympics, Formula 1, Swimming, Golf

### History
- World Wars, Ancient Civilizations, Medieval History
- American History, European History, Asian History

### Geography
- World Capitals, Countries & Continents
- Natural Landmarks, Climate, Physical Geography

### Entertainment
- Movies, Music, TV Shows, Books & Literature
- Gaming, Celebrity Trivia, Awards & Festivals

### Politics
- World Politics, Government Systems, Political Leaders
- Elections, International Relations

### Business
- Economics, Finance, Marketing, Management
- Entrepreneurship, Stock Market, Cryptocurrency

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable origins
- **Helmet**: Security headers
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Joi schema validation
- **SQL Injection Prevention**: Parameterized queries

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## Development

### Scripts

- `npm run dev` - Start with nodemon (auto-restart)
- `npm start` - Start production server
- `npm test` - Run tests (when implemented)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `mcq_quiz` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | Required |
| `GEMINI_API_KEY` | Google Gemini AI API key | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## Production Deployment

1. **Environment Setup**:
   - Set `NODE_ENV=production`
   - Use strong JWT secret
   - Configure production database
   - Set up SSL/TLS

2. **Database Migration**:
   - Run database creation scripts
   - Set up backup strategy

3. **Monitoring**:
   - Implement logging
   - Set up health checks
   - Monitor API performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (when test suite is available)
5. Submit a pull request

## License

MIT License - see LICENSE file for details
