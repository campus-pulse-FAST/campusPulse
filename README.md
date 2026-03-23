# CampusPulse

A web-based Management Information System (MIS) for campus event management. Built with microservice architecture.

## Tech Stack

- **Runtime:** [Bun](https://bun.sh) (v1.0+)
- **Backend:** NestJS (TypeScript)
- **Database:** PostgreSQL 16 + TypeORM
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Auth:** Passport.js + JWT
- **Containerization:** Docker Compose

---

## Architecture

```
Browser → Frontend (:4000) → API Gateway (:3000) → Microservices (:3001-3005)
```

| Service | Port | Description |
|---|---|---|
| API Gateway | 3000 | Request routing, JWT validation |
| User Service | 3001 | Auth, profiles, roles |
| Event Service | 3002 | Events, venues, categories, resources |
| Registration Service | 3003 | Registrations, waitlist, roster, attendance |
| Feedback Service | 3004 | Ratings, analytics |
| Notification Service | 3005 | Alerts, audit logs |
| Frontend | 4000 | Next.js web app |

All services share a single PostgreSQL database with **separate schemas** per service for logical isolation.

---

## Prerequisites

Before you start, make sure you have these installed:

1. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (required)
   ```bash
   docker --version
   docker compose version
   ```

2. **[Bun](https://bun.sh)** (v1.0+) — only needed for local dev without Docker
   ```bash
   curl -fsSL https://bun.sh/install | bash
   bun --version
   ```

3. **[Git](https://git-scm.com/)**

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/campus-pulse-FAST/campusPulse.git
cd campusPulse
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

The defaults work out of the box. No changes needed for local development.

---

## Option A: Run Everything with Docker (Recommended)

This is the easiest way — one command starts PostgreSQL, all 6 backend services, and the frontend.

### Step 1: Make sure Docker Desktop is running

Open Docker Desktop and wait until it shows "Running".

### Step 2: Make sure no other PostgreSQL is running

```bash
# macOS — stop homebrew postgres if running
brew services stop postgresql@16

# Check nothing is on port 5433
lsof -ti:5433
```

### Step 3: Start all services

```bash
docker compose up --build
```

This will:
- Pull the PostgreSQL 16 image
- Build Docker images for all 6 services and frontend
- Start everything in the correct order (PostgreSQL first, then services, then frontend)

Wait until you see all services logging "running on port XXXX".

### Step 4: Verify

Open these URLs in your browser or use curl:

```bash
# API Gateway
curl http://localhost:3000/api/health

# All microservices
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health

# Frontend
open http://localhost:4000
```

### Step 5: Stop everything

```bash
# Stop all containers (keeps data)
docker compose down

# Stop and delete all data (fresh start)
docker compose down -v
```

### Running in background (detached mode)

```bash
# Start in background
docker compose up --build -d

# View logs
docker compose logs -f

# View logs for one service
docker compose logs -f user-service

# Restart a single service
docker compose restart event-service
```

---

## Option B: Run Locally with Bun (For Development)

Better for active development — gives you hot reload and faster feedback.

### Step 1: Install dependencies

```bash
bun install
```

### Step 2: Start PostgreSQL via Docker

You still need Docker for the database:

```bash
docker compose up -d postgres
```

Verify it's running:
```bash
PGPASSWORD=campus123 psql -h localhost -p 5433 -U campus -d campuspulse -c "SELECT 1"
```

### Step 3: Start each service (separate terminals)

```bash
# Terminal 1 — API Gateway
cd services/api-gateway && bun run src/main.ts

# Terminal 2 — User Service
cd services/user-service && bun run src/main.ts

# Terminal 3 — Event Service
cd services/event-service && bun run src/main.ts

# Terminal 4 — Registration Service
cd services/registration-service && bun run src/main.ts

# Terminal 5 — Feedback Service
cd services/feedback-service && bun run src/main.ts

# Terminal 6 — Notification Service
cd services/notification-service && bun run src/main.ts

# Terminal 7 — Frontend
cd frontend && bun install && bun run dev
```

Or use the shortcut scripts from the repo root:
```bash
bun run dev:gateway
bun run dev:user
bun run dev:event
bun run dev:registration
bun run dev:feedback
bun run dev:notification
bun run dev:frontend
```

---

## Project Structure

```
campusPulse/
├── docker-compose.yml          # Full stack Docker config
├── package.json                # Root: Bun workspaces
├── tsconfig.base.json          # Shared TypeScript config
│
├── libs/shared/                # @campuspulse/shared library
│   └── src/
│       ├── constants/          # Role & status enums
│       ├── decorators/         # @Roles(), @CurrentUser()
│       ├── guards/             # RolesGuard, ServiceAuthGuard
│       ├── interceptors/       # ResponseInterceptor, LoggingInterceptor
│       ├── filters/            # HttpExceptionFilter
│       ├── dto/                # PaginationDto
│       ├── interfaces/         # ApiResponse, JwtPayload
│       └── utils/              # HttpClientService
│
├── services/
│   ├── api-gateway/            # Port 3000 — Request routing
│   ├── user-service/           # Port 3001 — Auth & profiles
│   ├── event-service/          # Port 3002 — Events & venues
│   ├── registration-service/   # Port 3003 — Registrations & waitlist
│   ├── feedback-service/       # Port 3004 — Ratings & analytics
│   └── notification-service/   # Port 3005 — Alerts & audit logs
│
└── frontend/                   # Port 4000 — Next.js app
```

---

## Database

| Property | Value |
|---|---|
| Engine | PostgreSQL 16 |
| Host | localhost |
| Port | 5433 (Docker mapped) |
| Database | campuspulse |
| User | campus |
| Password | campus123 |

Each microservice owns its own schema:

| Service | Schema |
|---|---|
| user-service | `users` |
| event-service | `events` |
| registration-service | `registrations` |
| feedback-service | `feedback` |
| notification-service | `notifications` |

---

## Git Conventions

### Branches
```
main            ← always deployable, merges from develop at sprint end
  └── develop   ← integration branch, all PRs target this
       └── feature/SPX-description
       └── fix/SPX-description
       └── chore/SPX-description
```

### Commits (Conventional Commits)
```
feat(user-service): add login endpoint
fix(event-service): resolve venue conflict query
chore(root): update docker-compose
docs(root): add setup guide
```

### Workflow
1. Create feature branch from `develop`: `git checkout -b feature/SP1-user-auth`
2. Commit with conventional commit messages
3. Push and create PR to `develop`
4. Merge PR on GitHub
5. At sprint end, merge `develop` → `main`

---

## Troubleshooting

### Port already in use
```bash
# Find what's using the port
lsof -ti:3000

# Kill it
kill $(lsof -ti:3000)
```

### PostgreSQL connection refused
```bash
# Check if Docker container is running
docker ps | grep campuspulse

# Check if port 5433 is accessible
pg_isready -h localhost -p 5433

# Restart the container
docker compose restart postgres
```

### Docker build fails
```bash
# Rebuild from scratch (no cache)
docker compose build --no-cache
docker compose up
```

### Bun install fails
```bash
# Clear cache and retry
rm -rf node_modules bun.lock
bun install
```

### Another PostgreSQL already on port 5432/5433
```bash
# Stop homebrew postgres
brew services stop postgresql@16

# Check what's using the port
lsof -ti:5433

# Our setup uses port 5433 to avoid conflicts
```
