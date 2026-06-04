# TaskHolder Notes

A full-stack task management and notes portal built with FastAPI and React.

---

## Overview

TaskHolder Notes is a clean, modern web application that lets you manage your tasks and notes in one place. It features JWT authentication, priority-based task tracking, pinnable notes, and a dashboard with live stats — all backed by a PostgreSQL database on Neon.

---

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — API framework
- [SQLAlchemy 2.0](https://docs.sqlalchemy.org/) — Async ORM
- [asyncpg](https://magicstack.github.io/asyncpg/) — PostgreSQL async driver
- [python-jose](https://python-jose.readthedocs.io/) — JWT tokens
- [passlib + bcrypt](https://passlib.readthedocs.io/) — Password hashing
- [Pydantic v2](https://docs.pydantic.dev/) — Data validation
- [Neon](https://neon.tech/) — Serverless PostgreSQL

**Frontend**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Framer Motion](https://www.framer.com/motion/) — Animations
- [React Router v6](https://reactrouter.com/) — Routing
- [Axios](https://axios-http.com/) — API calls
- [React Hook Form](https://react-hook-form.com/) — Form handling
- [Lucide React](https://lucide.dev/) — Icons
- [React Hot Toast](https://react-hot-toast.com/) — Notifications

---

## Features

- **Authentication** — Register and login with JWT-based auth, protected routes
- **Tasks** — Create, edit, delete tasks with:
  - Status: `To Do` / `In Progress` / `Done`
  - Priority: `Low` / `Medium` / `High`
  - Due date and category/tag
  - Filter by status and priority
- **Notes** — Create, edit, delete notes with:
  - Pin/unpin notes to the top
  - Category tagging
  - Link a note to a task
- **Dashboard** — Overview with stats (total tasks, in-progress, completed, notes count) and recent tasks list
- **Animations** — Smooth page transitions and card animations via Framer Motion

---

## Project Structure

```
taskholder-notes/
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── deps.py         # get_current_user dependency
│   │   │   └── jwt.py          # token creation & verification
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── task.py
│   │   │   └── note.py
│   │   ├── routes/
│   │   │   ├── auth.py         # /api/auth/register, /login, /me
│   │   │   ├── tasks.py        # /api/tasks CRUD + stats
│   │   │   └── notes.py        # /api/notes CRUD
│   │   ├── schemas/            # Pydantic request/response models
│   │   ├── config.py           # Settings from .env
│   │   ├── database.py         # Async engine, session, Base
│   │   └── main.py             # FastAPI app entry point
│   ├── .env
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api/                # Axios API functions
    │   ├── components/
    │   │   ├── common/         # ProtectedRoute
    │   │   ├── layout/         # Sidebar, Header
    │   │   ├── tasks/          # TaskCard, TaskModal
    │   │   └── notes/          # NoteCard, NoteModal
    │   ├── context/
    │   │   └── AuthContext.jsx # Global auth state
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Tasks.jsx
    │   │   └── Notes.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env
    └── package.json
```

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Neon](https://neon.tech/) PostgreSQL database (free tier works)

### 1. Clone and enter the project

```bash
git clone <your-repo-url>
cd taskholder-notes
```

### 2. Configure the backend environment

Open `backend/.env` and fill in your values:

```env
DATABASE_URL=postgresql+asyncpg://neondb_owner:YOUR_PASSWORD@ep-your-host-pooler.us-east-1.aws.neon.tech/neondb?ssl=require
SECRET_KEY=your-long-random-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

> **Where to find your Neon connection string:**  
> Neon dashboard → your project → Connection Details → select **Pooled connection** → copy the connection string.  
> Replace the `postgresql://` prefix with `postgresql+asyncpg://`.

To generate a strong secret key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Running the Project

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload
```

The API will be available at:
- Base URL: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/api/docs`

> Database tables are created automatically on first startup — no migration step needed.

---

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create a new account | No |
| POST | `/api/auth/login` | Login and get JWT token | No |
| GET | `/api/auth/me` | Get current user info | Yes |
| GET | `/api/tasks` | List tasks (filterable) | Yes |
| POST | `/api/tasks` | Create a task | Yes |
| PUT | `/api/tasks/{id}` | Update a task | Yes |
| DELETE | `/api/tasks/{id}` | Delete a task | Yes |
| GET | `/api/tasks/stats` | Get task statistics | Yes |
| GET | `/api/notes` | List notes (filterable) | Yes |
| POST | `/api/notes` | Create a note | Yes |
| PUT | `/api/notes/{id}` | Update a note | Yes |
| DELETE | `/api/notes/{id}` | Delete a note | Yes |

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL async connection string |
| `SECRET_KEY` | Random secret for signing JWT tokens |
| `ALGORITHM` | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime in minutes (default: `1440` = 24h) |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (default: `http://localhost:8000/api`) |

---

## Planned Features

- [ ] Google / GitHub OAuth (social login)
- [ ] Dark mode
- [ ] Task reminders / due date notifications
- [ ] Drag-and-drop Kanban board
- [ ] Note rich text editor
- [ ] Mobile responsive sidebar


# Character	Encoded
@	%40
#	%23
%	%25
:	%3A
/	%2F