# CampusPulse

A web-based Management Information System (MIS) for campus event management. Built with microservice architecture.

## Tech Stack

- **Runtime:** Bun
- **Backend:** NestJS (TypeScript)
- **Database:** PostgreSQL + TypeORM
- **Frontend:** Next.js (App Router) + Tailwind CSS
- **Auth:** Passport.js + JWT
- **Containerization:** Docker Compose

## Architecture

| Service | Port | Description |
|---|---|---|
| API Gateway | 3000 | Request routing + JWT validation |
| User Service | 3001 | Auth, profiles, roles |
| Event Service | 3002 | Events, venues, categories, resources |
| Registration Service | 3003 | Registrations, waitlist, roster, attendance |
| Feedback Service | 3004 | Ratings, analytics |
| Notification Service | 3005 | Alerts, audit logs |
| Frontend | 4000 | Next.js web app |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [Docker](https://docker.com) & Docker Compose
- PostgreSQL 16 (or use Docker)

### Setup

```bash
git clone <repo-url>
cd campusPulse
cp .env.example .env
bun install
docker-compose up
```

## Git Conventions

- **Branches:** `feature/SPX-description`, `fix/SPX-description`, `chore/SPX-description`
- **Commits:** Conventional commits — `feat(scope): description`
- **Flow:** `feature/*` → PR → `develop` → PR → `main`
