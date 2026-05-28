# GameGloom

A game tracking and discovery platform. Track your backlog, discover new titles, write reviews, and share lists.

**Live:** [gamegloom.com](https://gamegloom.com)

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwindcss)

## Features

- **Discovery** - trending, anticipated, highly rated, and latest releases; browse by genre and theme
- **Personal library** - track games as Want to Play, Playing, or Played
- **Custom lists** - organize and share your collection publicly
- **Game details** - full IGDB data including DLCs, expansions, remakes, screenshots, and trailers
- **Reviews** - write and read user reviews with ratings
- **Platform sync** - import your library from Steam or PlayStation
- **Search** - real-time search across thousands of games
- **User profiles** - activity feed, stats, and avatar

## Tech Stack

### Frontend
- **React 18** + **Vite** + **Tailwind CSS 4**
- **Zustand** - state management
- **React Router 7** - navigation
- **Framer Motion** - animations

### Backend
- **FastAPI** - Python web framework
- **PostgreSQL** (Neon) - database
- **SQLAlchemy** + **Alembic** - ORM and migrations
- **IGDB API** - game data
- **Resend** - transactional email
- **Cloudinary** - avatar storage

### Deployment
- **Vercel** - frontend
- **Render** - backend

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.12+
- PostgreSQL
- [IGDB API credentials](https://api-docs.igdb.com/)

### Environment variables

Copy `.env.example` to `.env` and fill in the values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/gamegloom

IGDB_CLIENT_ID=your_client_id
IGDB_ACCESS_TOKEN=your_access_token
IGDB_WEBHOOK_SECRET=your_webhook_secret

RESEND_API_KEY=re_your_key
FROM_EMAIL=onboarding@resend.dev
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Backend

```bash
cd src
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```

API available at `http://localhost:8000`

### Frontend

```bash
cd src/frontend
npm install
npm run dev
```

App available at `http://localhost:5173`

## Project Structure

```
src/
├── backend/
│   ├── alembic/          # Database migrations
│   └── app/api/v1/       # Routes, models, schemas, services
├── frontend/
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Page components
│       ├── store/        # Zustand stores
│       └── utils/        # Utilities
├── scripts/              # Scheduler and data management
├── main.py               # FastAPI entry point
└── requirements.txt
```

## Acknowledgments

Game data provided by [IGDB](https://www.igdb.com/). Icons from [Lucide](https://lucide.dev/).
