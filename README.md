# 🎮 GameGloom

A modern game tracking and discovery platform. Track your gaming backlog, discover new games, write reviews, and get personalized recommendations.

![GameGloom](https://img.shields.io/badge/GameGloom-Game%20Tracker-C8AA6E?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwindcss)

## Features

### Home & Discovery
- **Hero Section** with dynamic video backgrounds
- **Featured Games** — Anticipated, Highly Rated, Latest Releases
- **Browse by Genre & Theme** — RPG, Action, Horror, Sci-Fi, and more
- **Game of the Year** showcase
- **Trending Games** carousel

### Personal Library
- Track games as **Want to Play**, **Playing**, or **Played**
- Create **Custom Lists** to organize your collection
- **Filter & Sort** by genre, platform, rating, game mode, and more
- Grid and list view options

### Game Details
- Comprehensive game information from IGDB
- Screenshots, trailers, and artwork galleries
- **DLCs, Expansions, Remakes** — all related content
- **Similar Games** recommendations
- **User Reviews** with ratings

### User Profiles
- Personalized profile with avatar and bio
- **Activity Feed** — track your gaming journey
- **Game Progress Stats** — visualize your collection
- **AI-Powered Recommendations** based on your taste

### Search
- Fast search across thousands of games
- Real-time results powered by IGDB

## Tech Stack

### Frontend
- **React 18** — UI framework
- **Vite** — Build tool
- **Tailwind CSS 4** — Styling
- **Framer Motion** — Animations
- **Zustand** — State management
- **React Router 7** — Navigation

### Backend
- **FastAPI** — Python web framework
- **PostgreSQL** — Database
- **Alembic** — Database migrations
- **IGDB API** — Game data source
- **Sentence Transformers** — ML-powered recommendations
- **JWT** — Authentication

### Deployment
- **Vercel** — Frontend hosting
- **AWS EC2** — Backend hosting
- **GitHub Actions** — CI/CD pipeline

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL
- IGDB API credentials ([Get them here](https://api-docs.igdb.com/))

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gamegloom.git
cd gamegloom/src
```

2. Create a `.env` file in the project root:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gamegloom

# IGDB API
IGDB_CLIENT_ID=your_client_id
IGDB_ACCESS_TOKEN=your_access_token
```

### Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
cd backend
alembic upgrade head
cd ..

# Start the server
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── backend/
│   ├── alembic/          # Database migrations
│   └── app/
│       └── api/
│           └── v1/       # API routes (games, auth, reviews, etc.)
├── frontend/
│   ├── public/           # Static assets
│   └── src/
│       ├── components/   # React components
│       ├── pages/        # Page components
│       ├── store/        # Zustand stores
│       ├── context/      # React context (Auth)
│       ├── hooks/        # Custom hooks
│       └── utils/        # Utility functions
├── scripts/              # Data management & scheduler scripts
├── main.py               # FastAPI entry point
└── requirements.txt      # Python dependencies
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/games` | List games with filters |
| `GET /api/v1/games/{id}` | Get game details |
| `POST /api/v1/auth/register` | User registration |
| `POST /api/v1/auth/login` | User login |
| `GET /api/v1/user-games` | Get user's game collection |
| `POST /api/v1/user-games` | Add game to collection |
| `GET /api/v1/reviews/{game_id}` | Get game reviews |
| `POST /api/v1/reviews` | Create a review |
| `GET /api/v1/recommendations` | Get personalized recommendations |
| `GET /api/v1/user-lists` | Get user's custom lists |

## Design

GameGloom features a dark, elegant design with:
- **Gold accent color** (#C8AA6E) for premium feel
- **Gradient text** on headings
- **Smooth animations** throughout
- **Responsive design** for all devices

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Game data provided by [IGDB](https://www.igdb.com/)
- Icons from [Lucide](https://lucide.dev/) and [Font Awesome](https://fontawesome.com/)

---

<p align="center">
  Made with ❤️ for gamers
</p>
