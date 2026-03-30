# CampusPulse — Progress Log

This document tracks all development progress, decisions, and changes across sprints.

---

## Sprint Summary

| Week | Sprint | Status | PRs | Features |
|---|---|---|---|---|
| 1 | SP0 — Foundation | **COMPLETE** | #1–#7 | Architecture setup, all services running |
| 2 | SP1 — Auth & Users | **BACKEND COMPLETE** | #9–#11 | F10, F15 (frontend pending) |
| 3 | SP2 — Events | NOT STARTED | — | F1, F2, F6, F12, F18, F19 |
| 4 | SP3 — Regs + Feedback + Notifications | NOT STARTED | — | F2, F3, F5, F6, F7, F8, F11, F13, F17 |
| 5 | SP4 — Advanced Features | NOT STARTED | — | F4, F9, F14, F16, F20 |
| 6 | SP5 — Polish + Ship | NOT STARTED | — | Tests, dashboard, docs, demo |

---

## Feature Checklist (20 Features)

| # | Feature | Sprint | Status |
|---|---|---|---|
| F1 | Venue Conflict Checker | SP2 | Pending |
| F2 | Capacity Threshold Control | SP2 + SP3 | Pending |
| F3 | Automated Roster Generation | SP3 | Pending |
| F4 | Attendance CSV Export | SP4 | Pending |
| F5 | Waitlist Logic (FIFO) | SP3 | Pending |
| F6 | Deadline Enforcement | SP2 + SP3 | Pending |
| F7 | Feedback Analytics | SP3 | Pending |
| F8 | Student Participation History | SP3 | Pending |
| F9 | Resource Allocation | SP4 | Pending |
| F10 | Role-Based Content Filtering | SP1 | **Backend Done** |
| F11 | Internal Alert System | SP3 | Pending |
| F12 | Event Categorization Engine | SP2 | Pending |
| F13 | Audit Logging | SP3 | Pending |
| F14 | Automated Archiving | SP4 | Pending |
| F15 | User Profile Management | SP1 | **Backend Done** |
| F16 | Duplicate Event Utility | SP4 | Pending |
| F17 | Guest List Import | SP3 | Pending |
| F18 | Public/Private Toggles | SP2 | Pending |
| F19 | Date Range Search | SP2 | Pending |
| F20 | Certificate Eligibility Check | SP4 | Pending |

---

## Week 1 / SP0 — Foundation (COMPLETE)

**Goal:** Set up the entire microservice architecture so that from Week 2 onwards, the team can focus purely on features.

**Date:** March 23, 2026

### What was built

- Monorepo with Bun workspaces (`libs/*`, `services/*`, `frontend`)
- `@campuspulse/shared` library with guards, interceptors, filters, decorators, DTOs, enums
- 6 NestJS service skeletons (gateway + 5 microservices) with health check endpoints
- Docker Compose config with PostgreSQL 16 + all services
- Next.js 15 frontend with Tailwind CSS, landing page, and navbar
- Comprehensive README with setup guide

### Pull Requests

| PR | Branch | Description |
|---|---|---|
| [#1](https://github.com/campus-pulse-FAST/campusPulse/pull/1) | `feature/SP0-repo-scaffold` | Monorepo structure, Bun workspaces, service package.json files |
| [#2](https://github.com/campus-pulse-FAST/campusPulse/pull/2) | `feature/SP0-shared-lib` | `@campuspulse/shared` — guards, interceptors, filters, DTOs, enums |
| [#3](https://github.com/campus-pulse-FAST/campusPulse/pull/3) | `feature/SP0-service-skeletons` | All 6 NestJS services with health checks + TypeORM configs |
| [#4](https://github.com/campus-pulse-FAST/campusPulse/pull/4) | `feature/SP0-docker-setup` | Docker Compose + Dockerfiles for all services |
| [#5](https://github.com/campus-pulse-FAST/campusPulse/pull/5) | `feature/SP0-frontend-skeleton` | Next.js 15 frontend with Tailwind, landing page, navbar |
| [#6](https://github.com/campus-pulse-FAST/campusPulse/pull/6) | `fix/SP0-runtime-fixes` | Bun compatibility fixes, port 5433, json2csv version fix |
| [#7](https://github.com/campus-pulse-FAST/campusPulse/pull/7) | `fix/SP0-docker-bun-runtime` | Next.js 15 upgrade, Dockerfiles use Bun runtime, root scripts, README |

### Decisions made

| Decision | Choice | Why |
|---|---|---|
| Runtime | Bun | Native TS support, fast installs, no build step needed |
| Backend framework | NestJS | Modules, DI, guards, decorators — enterprise-grade |
| ORM | TypeORM | First-class NestJS integration |
| DB strategy | Single Postgres, separate schemas | Less Docker overhead, logical isolation |
| Docker Postgres port | 5433 (not 5432) | Avoids conflicts with other local Postgres instances |
| Shared lib approach | Bun workspaces + `export type` | Bun requires `export type` for interface re-exports |
| Service start method | `bun run src/main.ts` directly | Avoids tsc compilation issues, Bun handles TS natively |
| Next.js version | 15 (latest) | Supports `next.config.ts`, React 19, latest features |

### Issues encountered & resolved

1. **`json2csv@^6.0.0` doesn't exist** — Fixed to `^5.0.0`
2. **Bun `export type` requirement** — Barrel exports in `index.ts` needed `export type` for interfaces
3. **Port 5432 conflict** — Another Docker Postgres was running; mapped our container to 5433
4. **`nest start` tsc compilation fails** — Switched to `bun run src/main.ts` which handles TS natively
5. **Next.js 14 doesn't support `next.config.ts`** — Upgraded to Next.js 15

### Verified

All 7 services confirmed running with health checks:

```
api-gateway          http://localhost:3000/api/health  ✅
user-service         http://localhost:3001/health      ✅
event-service        http://localhost:3002/health      ✅
registration-service http://localhost:3003/health      ✅
feedback-service     http://localhost:3004/health      ✅
notification-service http://localhost:3005/health      ✅
frontend             http://localhost:4000             ✅
```

---

## Week 2 / SP1 — Auth & Users (BACKEND COMPLETE)

**Goal:** Users can register, log in, view/edit profiles. JWT auth protects all routes. Role-based access works.

**Date:** March 29–30, 2026

**Features:** F10 (Role-Based Filtering), F15 (User Profile Management)

### What was built

- **User Entity** — TypeORM entity with UUID PK, bcrypt hashed password, role enum (student/organizer/admin), profile fields
- **Auth Endpoints** — register (bcrypt + JWT), login (credential validation + JWT), refresh token
- **Passport JWT Strategy** — validates Bearer tokens from Authorization header
- **API Gateway Auth Middleware** — validates JWT on protected routes, injects `X-User-Id`/`X-User-Email`/`X-User-Role` headers, passes through public routes
- **User Profile CRUD** — GET/PUT /users/me for own profile, admin-only endpoints for user list and role changes
- **Role-Based Access** — students get 403 on admin endpoints, admins can change roles

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login with credentials |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| GET | `/api/users/me` | Authenticated | Get own profile |
| PUT | `/api/users/me` | Authenticated | Update own profile |
| GET | `/api/users/:id` | Admin only | Get any user |
| PATCH | `/api/users/:id/role` | Admin only | Change user role (F10) |
| GET | `/api/users` | Admin only | List users (paginated) |

### Pull Requests

| PR | Branch | Description |
|---|---|---|
| [#9](https://github.com/campus-pulse-FAST/campusPulse/pull/9) | `feature/SP1-user-auth` | User entity, register/login/refresh endpoints, bcrypt, Passport JWT |
| [#10](https://github.com/campus-pulse-FAST/campusPulse/pull/10) | `feature/SP1-auth-middleware` | Gateway JWT middleware, service proxying, public route bypass |
| [#11](https://github.com/campus-pulse-FAST/campusPulse/pull/11) | `feature/SP1-user-profile` | User CRUD, role-based access, ServiceAuthGuard |

### Pending

| Branch | Owner | Description |
|---|---|---|
| `feature/SP1-frontend-auth` | Friend | Login, register, profile pages, AuthContext, navbar |

### Issues encountered & resolved

1. **Express 5 export issue with Bun** — `import { Request, Response } from 'express'` fails in Bun. Fixed by using `any` types and removing direct express imports.
2. **RolesGuard Reflector dependency** — `@UseGuards(RolesGuard)` failed because NestJS couldn't inject `Reflector`. Fixed by doing role checks manually in controller methods instead.
3. **Gateway wildcard route** — `@All('*path')` didn't match requests in NestJS v10. Fixed by using a NestJS middleware (`ProxyMiddleware`) instead.
4. **Middleware blocking public routes** — Middleware ran before checking if route was public. Fixed by using `req.originalUrl` for path matching.
5. **GET requests failing through proxy** — Axios was sending `Content-Type: application/json` on GET requests. Fixed by only setting Content-Type for POST/PUT/PATCH.

### Verified E2E

```
POST /api/auth/register  → creates user + returns JWT     ✅
POST /api/auth/login     → validates + returns JWT         ✅
GET  /api/users/me       → returns own profile             ✅
PUT  /api/users/me       → updates name, phone             ✅
GET  /api/users          → student gets 403                ✅
GET  /api/users          → admin gets paginated list       ✅
```

---

## Week 3 / SP2 — Events (NOT STARTED)

**Goal:** Full event lifecycle. Venue conflict detection. Category filtering. Date search. Public/private.

**Features:** F1, F2, F6, F12, F18, F19

---

## Week 4 / SP3 — Registrations + Feedback + Notifications (NOT STARTED)

**Goal:** Three services built in parallel. Registration + waitlist, feedback + analytics, notifications + audit.

**Features:** F2, F3, F5, F6, F7, F8, F11, F13, F17

---

## Week 5 / SP4 — Advanced Features (NOT STARTED)

**Goal:** Resources, CSV export, auto-archiving, event duplication, certificate eligibility.

**Features:** F4, F9, F14, F16, F20

---

## Week 6 / SP5 — Polish + Ship (NOT STARTED)

**Goal:** Integration tests, admin dashboard, UI polish, seed data, API docs, demo prep.

---

## Team

| Role | Name | Focus |
|---|---|---|
| Project Lead | TBD | Full Stack, DB Design, Architecture |
| Backend Dev | TBD | API Logic, Auth, Business Rules |
| Frontend Dev | TBD | UI/UX, React State, Pages |
