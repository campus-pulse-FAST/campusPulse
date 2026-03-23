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

1. **[Bun](https://bun.sh)** (v1.0+)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   bun --version  # verify
   ```

2. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**
   ```bash
   docker --version   # verify
   docker-compose --version
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

The defaults in `.env.example` work out of the box for local development. No changes needed.

### 3. Install dependencies

```bash
bun install
```

This installs dependencies for all workspaces (shared lib, all services, frontend) in one command.

### 4. Start PostgreSQL via Docker

**Important:** Make sure no other PostgreSQL instance is running on your machine before starting.

```bash
# Stop local PostgreSQL if running (macOS)
brew services stop postgresql@16 2>/dev/null

# Start the Docker PostgreSQL container
docker-compose up -d postgres
```

This starts PostgreSQL 16 on **port 5433** (mapped from container's 5432 to avoid conflicts).

Verify it's running:
```bash
PGPASSWORD=campus123 psql -h localhost -p 5433 -U campus -d campuspulse -c "SELECT 1"
```

### 5. Run the services

Each service can be started individually with Bun:

```bash
# Terminal 1 - API Gateway
cd services/api-gateway && bun run src/main.ts

# Terminal 2 - User Service
cd services/user-service && bun run src/main.ts

# Terminal 3 - Event Service
cd services/event-service && bun run src/main.ts

# Terminal 4 - Registration Service
cd services/registration-service && bun run src/main.ts

# Terminal 5 - Feedback Service
cd services/feedback-service && bun run src/main.ts

# Terminal 6 - Notification Service
cd services/notification-service && bun run src/main.ts

# Terminal 7 - Frontend
cd frontend && bun install && bun run dev
```

Or use the root scripts:
```bash
bun run dev:gateway
bun run dev:user
bun run dev:event
bun run dev:registration
bun run dev:feedback
bun run dev:notification
bun run dev:frontend
```

### 6. Verify everything works

Test health checks for each service:

```bash
# Gateway
curl http://localhost:3000/api/health

# Microservices
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
```

Each should return:
```json
{
  "service": "<service-name>",
  "status": "ok",
  "timestamp": "2026-03-23T..."
}
```

---

## Project Structure

```
campusPulse/
├── docker-compose.yml          # PostgreSQL + all services
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
│   ├── api-gateway/            # Port 3000 - Request routing
│   ├── user-service/           # Port 3001 - Auth & profiles
│   ├── event-service/          # Port 3002 - Events & venues
│   ├── registration-service/   # Port 3003 - Registrations & waitlist
│   ├── feedback-service/       # Port 3004 - Ratings & analytics
│   └── notification-service/   # Port 3005 - Alerts & audit logs
│
└── frontend/                   # Port 4000 - Next.js app
```

---

## Database

- **Engine:** PostgreSQL 16
- **Host:** localhost
- **Port:** 5433 (Docker mapped)
- **Database:** campuspulse
- **User:** campus
- **Password:** campus123

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
main        ← always deployable
  └── develop     ← integration branch
       └── feature/SPX-description
       └── fix/SPX-description
       └── chore/SPX-description
```

### Commits (Conventional Commits)
```
feat(user-service): add login endpoint
fix(event-service): resolve venue conflict query
chore(root): update docker-compose
```

### Workflow
1. Create feature branch from `develop`
2. Commit with conventional commit messages
3. Push and create PR to `develop`
4. Merge PR
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
docker-compose restart postgres
```

### Bun install fails
```bash
# Clear cache and retry
rm -rf node_modules bun.lock
bun install
```

### Another PostgreSQL on port 5432
Our setup uses port **5433** to avoid conflicts. If you have no other PostgreSQL running, you can change the port back to 5432 in:
- `docker-compose.yml` (postgres ports)
- Each service's `src/config/typeorm.config.ts` (default port)
