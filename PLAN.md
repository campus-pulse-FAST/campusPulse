# CampusPulse — Full Implementation Plan

## Context

CampusPulse is a university MIS project to centralize campus event logistics. The repo is brand new (empty). We're building it with **microservice architecture** using Node.js/Express, PostgreSQL, Knex.js, and Next.js. This plan covers everything: architecture, git strategy, folder structure, database schemas, sprint-by-sprint tasks, and all 20 features.

---

## 1. Microservice Architecture (5 Services + 1 Gateway + 1 Frontend)

| Service | Port | Owns (DB Schema) | Features |
|---|---|---|---|
| **api-gateway** | 3000 | None (proxy + JWT validation) | Route forwarding, auth enforcement |
| **user-service** | 3001 | `users` schema | F10-Role-Based Filtering, F15-User Profile Management, Auth (login/register/JWT) |
| **event-service** | 3002 | `events` schema | F1-Venue Conflict, F2-Capacity, F6-Deadline, F9-Resources, F12-Categorization, F14-Archiving, F16-Duplicate Event, F18-Public/Private, F19-Date Range Search |
| **registration-service** | 3003 | `registrations` schema | F3-Roster Generation, F4-CSV Export, F5-Waitlist FIFO, F8-Participation History, F17-Guest Import, F20-Certificate Eligibility |
| **feedback-service** | 3004 | `feedback` schema | F7-Feedback Analytics |
| **notification-service** | 3005 | `notifications` schema | F11-Internal Alerts, F13-Audit Logging |
| **frontend** | 4000 | None | Next.js App Router + Tailwind CSS |

### Inter-Service Communication

All synchronous REST. No message broker.

```
Browser → Frontend (Next.js :4000) → API Gateway (:3000) → Service (:300X)
                                                          → Service calls Service (internal REST)
```

Key cross-service calls:
- **registration-service** → **event-service**: check capacity/deadline before registering
- **event-service** → **notification-service**: log audit entries on event CRUD
- **registration-service** → **notification-service**: send waitlist promotion alerts
- **api-gateway** → **user-service**: validate JWT on every request

Internal calls use `X-Internal-Service-Key` header (shared secret from env).

---

## 2. Mono-Repo Folder Structure

```
campusPulse/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .gitignore
├── README.md
├── package.json                     # Root: npm workspaces config
│
├── packages/
│   └── shared/                      # Shared utilities (symlinked via workspaces)
│       ├── package.json
│       └── src/
│           ├── middleware/
│           │   ├── authMiddleware.js
│           │   ├── errorHandler.js
│           │   └── requestLogger.js
│           ├── utils/
│           │   ├── apiResponse.js   # { success, data, error, meta }
│           │   ├── httpClient.js    # Axios wrapper for inter-service calls
│           │   ├── validators.js    # Joi shared schemas
│           │   └── constants.js     # Role enums, status enums
│           └── index.js
│
├── services/
│   ├── api-gateway/
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── index.js
│   │       ├── proxy.js             # Route-to-service mapping
│   │       └── config.js
│   │
│   ├── user-service/
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── knexfile.js
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── src/
│   │       ├── index.js
│   │       ├── routes/
│   │       ├── controllers/
│   │       ├── services/            # Business logic
│   │       ├── models/              # Knex query builders
│   │       └── config.js
│   │
│   ├── event-service/               # Same internal structure
│   ├── registration-service/        # Same internal structure
│   ├── feedback-service/            # Same internal structure
│   └── notification-service/        # Same internal structure
│
└── frontend/
    ├── package.json
    ├── Dockerfile
    ├── next.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── public/
    └── src/
        ├── app/                     # Next.js App Router
        │   ├── layout.js
        │   ├── page.js
        │   ├── (auth)/
        │   │   ├── login/page.js
        │   │   └── register/page.js
        │   ├── events/
        │   │   ├── page.js
        │   │   └── [id]/page.js
        │   ├── admin/
        │   ├── profile/
        │   └── registrations/
        ├── components/
        │   ├── ui/                  # Buttons, inputs, modals
        │   ├── layout/              # Navbar, Sidebar, Footer
        │   └── features/            # Feature-specific components
        ├── context/
        │   └── AuthContext.js
        ├── lib/
        │   ├── api.js               # Fetch wrapper → gateway
        │   └── utils.js
        └── styles/
            └── globals.css
```

---

## 3. Git Branching Strategy & Conventions

### Branch Structure

```
main                                 # Protected. Always deployable.
  └── develop                        # Integration branch. All features merge here.
       ├── feature/SP0-repo-scaffold
       ├── feature/SP0-docker-setup
       ├── feature/SP0-shared-package
       ├── feature/SP1-user-auth
       ├── feature/SP1-auth-middleware
       ├── feature/SP1-frontend-auth
       ├── feature/SP2-event-crud
       ├── feature/SP2-venue-conflict
       ├── feature/SP2-event-categories
       ├── feature/SP2-frontend-events
       ├── feature/SP3-registration-system
       ├── feature/SP3-waitlist-logic
       ├── feature/SP3-roster-generation
       ├── feature/SP3-guest-import
       ├── feature/SP3-frontend-registrations
       ├── feature/SP4-feedback-system
       ├── feature/SP4-feedback-analytics
       ├── feature/SP4-notification-service
       ├── feature/SP4-audit-logging
       ├── feature/SP4-frontend-feedback-notifs
       ├── feature/SP5-resource-allocation
       ├── feature/SP5-csv-export
       ├── feature/SP5-auto-archiving
       ├── feature/SP5-duplicate-event
       ├── feature/SP5-certificate-eligibility
       ├── feature/SP5-frontend-admin-panel
       ├── feature/SP6-integration-tests
       ├── feature/SP6-frontend-polish
       ├── feature/SP6-admin-dashboard
       ├── feature/SP6-seed-data
       ├── fix/SPX-<description>     # Bug fixes
       ├── chore/SPX-<description>   # Tooling, config
       └── docs/SPX-<description>    # Documentation
```

### Branch Rules

| Branch | Who merges | How |
|---|---|---|
| `main` | Lead only | Merge from `develop` at sprint end via PR |
| `develop` | Any team member | Merge from `feature/*` via PR with review |
| `feature/*` | Author | Create from `develop`, PR back to `develop` |

### Commit Convention (Conventional Commits)

```
<type>(<scope>): <short description>

Types:    feat | fix | chore | docs | refactor | test | style
Scopes:   user-service | event-service | registration-service |
          feedback-service | notification-service | gateway |
          frontend | shared | root
```

**Examples:**
```
feat(user-service): add registration and login endpoints
feat(event-service): implement venue conflict checker
fix(registration-service): fix FIFO ordering in waitlist promotion
chore(root): configure docker-compose for all services
docs(root): add API endpoint documentation
refactor(shared): extract common validation schemas
test(event-service): add venue conflict integration tests
```

### PR Conventions

**Title:** Same as conventional commit format
**Body template:**
```
## What
<Brief description>

## Feature(s)
F1, F2, etc. (from the 20-feature list)

## How to test
<Steps to verify>

## Checklist
- [ ] Migrations run cleanly
- [ ] .env.example updated (if new env vars)
- [ ] No console.log left in code
```

### Workflow for each task:

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/SP1-user-auth

# 3. Work, commit with conventional commits
git add services/user-service/...
git commit -m "feat(user-service): add user registration endpoint"

# 4. Push and create PR to develop
git push -u origin feature/SP1-user-auth
# Create PR: feature/SP1-user-auth → develop

# 5. After review, merge PR (squash or merge commit)

# 6. At sprint end, merge develop → main
git checkout main
git merge develop
git push origin main
```

---

## 4. Database Schema Design

**Strategy:** Single PostgreSQL instance, **separate schemas per service**. Each service's `knexfile.js` sets `searchPath` to its own schema. No cross-schema joins — data is fetched via REST.

### Schema: `users` (owned by user-service)

```sql
CREATE SCHEMA IF NOT EXISTS users;

-- users.users
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL
name            VARCHAR(255) NOT NULL
role            VARCHAR(20) NOT NULL DEFAULT 'student'  -- 'student' | 'admin' | 'organizer'
department      VARCHAR(255)
semester        VARCHAR(50)
phone           VARCHAR(20)
avatar_url      TEXT
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

### Schema: `events` (owned by event-service)

```sql
CREATE SCHEMA IF NOT EXISTS events;

-- events.categories
id              SERIAL PRIMARY KEY
name            VARCHAR(100) UNIQUE NOT NULL
description     TEXT
color_hex       VARCHAR(7)

-- events.venues
id              SERIAL PRIMARY KEY
name            VARCHAR(255) NOT NULL
location        TEXT
capacity        INTEGER NOT NULL
amenities       JSONB DEFAULT '[]'

-- events.events
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
title           VARCHAR(255) NOT NULL
description     TEXT
organizer_id    UUID NOT NULL          -- references user-service user
category_id     INTEGER REFERENCES events.categories(id)
venue_id        INTEGER REFERENCES events.venues(id)
start_time      TIMESTAMPTZ NOT NULL
end_time        TIMESTAMPTZ NOT NULL
capacity        INTEGER NOT NULL
status          VARCHAR(20) DEFAULT 'draft'  -- 'draft' | 'published' | 'archived' | 'cancelled'
is_public       BOOLEAN DEFAULT true
registration_deadline TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()

-- events.resources
id              SERIAL PRIMARY KEY
name            VARCHAR(255) NOT NULL
type            VARCHAR(100)           -- 'projector' | 'sound_system' | 'whiteboard' etc.
total_quantity  INTEGER NOT NULL DEFAULT 1
available_quantity INTEGER NOT NULL DEFAULT 1

-- events.event_resources
id              SERIAL PRIMARY KEY
event_id        UUID REFERENCES events.events(id) ON DELETE CASCADE
resource_id     INTEGER REFERENCES events.resources(id)
quantity_reserved INTEGER NOT NULL DEFAULT 1
```

### Schema: `registrations` (owned by registration-service)

```sql
CREATE SCHEMA IF NOT EXISTS registrations;

-- registrations.registrations
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
event_id        UUID NOT NULL          -- references event-service event
user_id         UUID NOT NULL          -- references user-service user
status          VARCHAR(20) DEFAULT 'confirmed'  -- 'confirmed' | 'waitlisted' | 'cancelled'
waitlist_position INTEGER
registered_at   TIMESTAMPTZ DEFAULT NOW()
UNIQUE(event_id, user_id)

-- registrations.attendance
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
registration_id UUID REFERENCES registrations.registrations(id) ON DELETE CASCADE
checked_in_at   TIMESTAMPTZ DEFAULT NOW()
checked_in_by   UUID                   -- admin who checked in

-- registrations.guest_lists
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
event_id        UUID NOT NULL
guest_name      VARCHAR(255) NOT NULL
guest_email     VARCHAR(255)
invited_by_user_id UUID NOT NULL
created_at      TIMESTAMPTZ DEFAULT NOW()
```

### Schema: `feedback` (owned by feedback-service)

```sql
CREATE SCHEMA IF NOT EXISTS feedback;

-- feedback.feedback
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
event_id        UUID NOT NULL
user_id         UUID NOT NULL
rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5)
comment         TEXT
submitted_at    TIMESTAMPTZ DEFAULT NOW()
UNIQUE(event_id, user_id)

-- feedback.feedback_analytics (materialized/computed)
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
event_id        UUID UNIQUE NOT NULL
avg_rating      DECIMAL(3,2)
total_responses INTEGER DEFAULT 0
rating_distribution JSONB DEFAULT '{}'  -- {"1": 5, "2": 3, "3": 10, ...}
computed_at     TIMESTAMPTZ DEFAULT NOW()
```

### Schema: `notifications` (owned by notification-service)

```sql
CREATE SCHEMA IF NOT EXISTS notifications;

-- notifications.notifications
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL
title           VARCHAR(255) NOT NULL
body            TEXT
type            VARCHAR(20) DEFAULT 'info'  -- 'info' | 'warning' | 'action'
is_read         BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT NOW()

-- notifications.audit_logs
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
actor_id        UUID NOT NULL
action          VARCHAR(100) NOT NULL      -- 'EVENT_CREATED' | 'EVENT_DELETED' | 'USER_ROLE_CHANGED' etc.
entity_type     VARCHAR(50) NOT NULL       -- 'event' | 'user' | 'registration'
entity_id       UUID
old_value       JSONB
new_value       JSONB
ip_address      VARCHAR(45)
created_at      TIMESTAMPTZ DEFAULT NOW()
```

### Knex Configuration Pattern (each service)

```js
// services/event-service/knexfile.js
module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: 'campuspulse',
      user: process.env.DB_USER || 'campus',
      password: process.env.DB_PASSWORD || 'campus123',
    },
    searchPath: ['events'],
    migrations: { directory: './migrations' },
    seeds: { directory: './seeds' },
  }
};
```

Each service's **first migration** creates its own schema: `CREATE SCHEMA IF NOT EXISTS <name>;`

---

## 5. Shared Package (packages/shared)

### apiResponse.js — Standardized responses

```js
// Every endpoint returns this shape:
{
  success: true | false,
  data: { ... } | null,
  error: { code: 'VENUE_CONFLICT', message: '...' } | null,
  meta: { page: 1, limit: 20, total: 150 } | null
}
```

### errorHandler.js — Central error middleware

```
ValidationError  → 400
AuthError        → 401
ForbiddenError   → 403
NotFoundError    → 404
ConflictError    → 409  (venue conflicts, duplicate registration)
InternalError    → 500
```

### authMiddleware.js — Two layers

1. **Gateway-level:** Validates JWT, attaches decoded user to `X-User-Id` and `X-User-Role` headers
2. **Service-level:** Reads those headers → populates `req.user`. Provides `requireRole('admin')` guard

### httpClient.js — Inter-service calls

```js
// Factory: createServiceClient('event-service')
// Reads URLs from env: EVENT_SERVICE_URL=http://event-service:3002
// Attaches X-Internal-Service-Key header
// 5s timeout, 1 retry on 5xx
```

### requestLogger.js — Morgan-based logging

```
[service-name] METHOD /path STATUS response_time_ms
```

---

## 6. Sprint-by-Sprint Implementation Plan

---

### SPRINT 0 — Foundation (Week 1–2)

**Goal:** `docker-compose up` boots everything. Gateway proxies health checks. Frontend shows a landing page.

#### Branches & Tasks:

**Branch: `feature/SP0-repo-scaffold`**
- [ ] Initialize root `package.json` with npm workspaces
- [ ] Create `.gitignore` (node_modules, .env, dist, .next, pgdata)
- [ ] Create `.env.example` with all required env vars
- [ ] Create folder structure for all services (empty skeletons)
- [ ] Create `README.md` with project overview

**Branch: `feature/SP0-shared-package`**
- [ ] Create `packages/shared/package.json`
- [ ] Implement `apiResponse.js` — success() and error() helpers
- [ ] Implement `errorHandler.js` — Express error middleware
- [ ] Implement `requestLogger.js` — Morgan setup
- [ ] Implement `constants.js` — Role and status enums
- [ ] Implement `httpClient.js` — Axios factory for inter-service calls
- [ ] Create `packages/shared/src/index.js` — export everything

**Branch: `feature/SP0-docker-setup`**
- [ ] Create `docker-compose.yml` (postgres, all services, frontend)
- [ ] Create `docker-compose.dev.yml` (volume mounts, nodemon)
- [ ] Create `Dockerfile` for each service (Node 20 Alpine)
- [ ] Create `Dockerfile` for frontend (Next.js)
- [ ] Verify `docker-compose up` boots all containers

**Branch: `feature/SP0-api-gateway`**
- [ ] Create gateway Express app with `http-proxy-middleware`
- [ ] Define route table: `/api/users/*` → user-service, `/api/events/*` → event-service, etc.
- [ ] Add health check endpoint: `GET /health`
- [ ] Add request logging via shared middleware

**Branch: `feature/SP0-service-skeletons`**
- [ ] For each of the 5 services: Express app, health check, knexfile.js, first migration (create schema)
- [ ] Verify each service responds to `GET /health`
- [ ] Verify gateway proxies to each service

**Branch: `feature/SP0-frontend-skeleton`**
- [ ] `npx create-next-app` with App Router
- [ ] Configure Tailwind CSS
- [ ] Create root layout with placeholder Navbar
- [ ] Create landing page
- [ ] Create `lib/api.js` fetch wrapper pointing to gateway at `:3000`

**Merge:** All SP0 branches → `develop`. Then `develop` → `main` (Sprint 0 release).

---

### SPRINT 1 — Auth & User Management (Week 3–4)

**Goal:** Users can register, log in, view/edit profiles. JWT auth protects all routes. Role-based access works.

**Features:** F10 (Role-Based Filtering), F15 (User Profile Management)

#### Branches & Tasks:

**Branch: `feature/SP1-user-auth`**
- [ ] Migration: `users.users` table
- [ ] `POST /auth/register` — validate input, hash password (bcrypt), create user, return JWT
- [ ] `POST /auth/login` — verify credentials, return access token + refresh token
- [ ] `POST /auth/refresh` — issue new access token from refresh token
- [ ] `POST /auth/logout` — invalidate refresh token

**Branch: `feature/SP1-user-profile`**
- [ ] `GET /users/me` — return current user profile
- [ ] `PUT /users/me` — update name, department, semester, phone
- [ ] `GET /users/:id` — admin only, get any user
- [ ] `PATCH /users/:id/role` — admin only, change user role (F10)
- [ ] `GET /users` — admin only, list all users with pagination

**Branch: `feature/SP1-auth-middleware`**
- [ ] Implement `authMiddleware.js` in shared package — JWT verify, decode, populate req.user
- [ ] Implement `requireRole(...roles)` middleware guard
- [ ] Integrate auth middleware into gateway — validate JWT, set X-User-Id/X-User-Role headers
- [ ] Define public routes list (login, register, health) that skip auth

**Branch: `feature/SP1-frontend-auth`**
- [ ] Create `AuthContext.js` — store token, user info, login/logout/register methods
- [ ] Create login page with form
- [ ] Create register page with form (name, email, password, department, semester)
- [ ] Create protected route wrapper component
- [ ] Update Navbar — show login/register when logged out, profile/logout when logged in
- [ ] Create profile page — view and edit form (F15)
- [ ] Dynamic nav based on role — admin sees "Admin Panel" link (F10)

**Merge:** All SP1 branches → `develop`. Then `develop` → `main`.

---

### SPRINT 2 — Event CRUD & Core Event Features (Week 5–6)

**Goal:** Full event lifecycle. Venue conflict detection. Category filtering. Date search. Public/private visibility.

**Features:** F1 (Venue Conflict), F2 (Capacity), F6 (Deadline), F12 (Categorization), F18 (Public/Private), F19 (Date Range Search)

#### Branches & Tasks:

**Branch: `feature/SP2-event-crud`**
- [ ] Migrations: `events.events`, `events.categories`, `events.venues` tables
- [ ] Seed data: 5 default categories, 5 default venues
- [ ] `POST /events` — create event (admin/organizer only)
- [ ] `GET /events` — list events with pagination, filters (category, status, date range F19, is_public F18)
- [ ] `GET /events/:id` — get single event with category and venue details
- [ ] `PUT /events/:id` — update event (owner/admin only)
- [ ] `DELETE /events/:id` — soft delete → set status='cancelled' (admin only)
- [ ] Role-based filtering: students see only `published` + `is_public=true`, admins see all (F10, F18)

**Branch: `feature/SP2-venue-conflict`**
- [ ] `GET /venues` — list all venues
- [ ] `POST /venues` — create venue (admin only)
- [ ] Venue Conflict Checker (F1): on event create/update, query for overlapping `(venue_id, start_time, end_time)`. Return 409 if conflict.
- [ ] `GET /venues/:id/availability?date=YYYY-MM-DD` — show time slots for a venue on a date

**Branch: `feature/SP2-event-categories`**
- [ ] `GET /categories` — list all categories
- [ ] `POST /categories` — create category (admin only)
- [ ] `PUT /categories/:id` — update category
- [ ] Event Categorization Engine (F12): filter events by category_id
- [ ] Capacity stored on event, checked during registration (F2 — enforcement in Sprint 3)
- [ ] Deadline stored as `registration_deadline` on event (F6 — enforcement in Sprint 3)

**Branch: `feature/SP2-frontend-events`**
- [ ] Event catalog page — card grid with filters (category, date range, search text)
- [ ] Event detail page — full info, venue, capacity bar, registration deadline countdown
- [ ] Create event form (admin/organizer) — with venue selector, conflict warning
- [ ] Edit event page
- [ ] Venue management page (admin) — list, create, view availability
- [ ] Category management (admin) — list, create

**Merge:** All SP2 branches → `develop`. Then `develop` → `main`.

---

### SPRINT 3 — Registrations & Waitlist (Week 7–8)

**Goal:** Students can register for events. Waitlist works. Rosters generated. Guest import functional.

**Features:** F2 (Capacity enforcement), F3 (Roster), F5 (Waitlist), F6 (Deadline enforcement), F8 (Participation History), F17 (Guest Import)

#### Branches & Tasks:

**Branch: `feature/SP3-registration-system`**
- [ ] Migration: `registrations.registrations` table
- [ ] `POST /registrations` — register for event. Calls event-service to check:
  - Capacity not full (F2) → if full, go to waitlist
  - Deadline not passed (F6) → reject if past deadline
  - User not already registered → reject duplicate
- [ ] `DELETE /registrations/:id` — cancel registration. If user was confirmed, promote next waitlisted.
- [ ] `GET /registrations/me` — current user's registrations with event details (F8 — participation history)
- [ ] `GET /registrations?event_id=X` — list registrations for an event (admin/organizer)

**Branch: `feature/SP3-waitlist-logic`**
- [ ] Waitlist Logic (F5): when capacity full, set `status='waitlisted'`, assign `waitlist_position` (MAX + 1)
- [ ] On cancellation of confirmed user: find lowest `waitlist_position`, promote to `confirmed`, send notification
- [ ] `GET /events/:eventId/waitlist` — view waitlist with positions (admin/organizer)
- [ ] Handle edge case: concurrent registrations (use DB transaction + row locking)

**Branch: `feature/SP3-roster-generation`**
- [ ] Automated Roster (F3): `GET /events/:eventId/roster` — returns all confirmed registrations with user info
  - Calls user-service to enrich with user name, email, department
  - Returns structured JSON array
- [ ] Participation History (F8): `GET /users/:userId/history` — all past registrations with event details
  - Calls event-service to enrich with event title, date, status

**Branch: `feature/SP3-guest-import`**
- [ ] Guest List Import (F17): `POST /events/:eventId/guests/import`
  - Accepts CSV file upload (multer)
  - Parse with `csv-parse`
  - Insert rows into `guest_lists` table
  - Return count of imported guests
- [ ] `GET /events/:eventId/guests` — list imported guests

**Branch: `feature/SP3-frontend-registrations`**
- [ ] "Join Event" button on event detail — shows capacity status, deadline countdown
- [ ] Button states: "Join" / "Waitlisted (Position #X)" / "Registered ✓" / "Full" / "Closed"
- [ ] "My Registrations" page — upcoming + past events (F8)
- [ ] Roster view for admin/organizer — table of registered students
- [ ] Guest import form — CSV file upload with preview

**Merge:** All SP3 branches → `develop`. Then `develop` → `main`.

---

### SPRINT 4 — Feedback & Notifications (Week 9–10)

**Goal:** Students submit feedback. Analytics computed. In-app notifications. Audit trail for admin actions.

**Features:** F7 (Feedback Analytics), F11 (Internal Alerts), F13 (Audit Logging)

#### Branches & Tasks:

**Branch: `feature/SP4-feedback-system`**
- [ ] Migrations: `feedback.feedback`, `feedback.feedback_analytics` tables
- [ ] `POST /feedback` — submit feedback (one per user per event, event must be completed)
  - On submit, recompute analytics for that event
- [ ] `GET /events/:eventId/feedback` — list all feedback for event (admin/organizer)
- [ ] `GET /feedback/me` — current user's submitted feedback

**Branch: `feature/SP4-feedback-analytics`**
- [ ] Feedback Analytics (F7): `GET /events/:eventId/feedback/analytics`
  - Returns: avg_rating, total_responses, rating_distribution {1: N, 2: N, ...}
- [ ] `GET /feedback/analytics/summary` — admin dashboard data
  - Top-rated events, lowest-rated, overall averages
  - Events with most feedback responses
- [ ] Recompute analytics on each new feedback submission

**Branch: `feature/SP4-notification-service`**
- [ ] Migrations: `notifications.notifications`, `notifications.audit_logs` tables
- [ ] Internal Alert System (F11):
  - `POST /notifications` — create notification (internal, called by other services)
  - `GET /notifications/me` — current user's notifications
  - `PATCH /notifications/:id/read` — mark as read
  - `PATCH /notifications/read-all` — mark all as read
  - `GET /notifications/me/unread-count` — for badge in navbar

**Branch: `feature/SP4-audit-logging`**
- [ ] Audit Logging (F13):
  - `POST /audit-logs` — create log entry (internal)
  - `GET /audit-logs` — admin only, list with filters (action, entity_type, actor_id, date range)
- [ ] Integrate audit calls into other services:
  - event-service: log EVENT_CREATED, EVENT_UPDATED, EVENT_DELETED, EVENT_ARCHIVED
  - user-service: log USER_ROLE_CHANGED
  - registration-service: log REGISTRATION_CANCELLED_BY_ADMIN

**Branch: `feature/SP4-frontend-feedback-notifs`**
- [ ] Feedback form on event detail page (only shows for completed events user attended)
- [ ] Star rating component (1-5)
- [ ] Feedback analytics view for admin — bar chart of rating distribution, avg score
- [ ] Notification bell icon in navbar with unread count badge
- [ ] Notification dropdown/page — list with mark-as-read
- [ ] Audit log viewer (admin) — searchable table with filters

**Merge:** All SP4 branches → `develop`. Then `develop` → `main`.

---

### SPRINT 5 — Resources, Export & Advanced Features (Week 11–12)

**Goal:** Equipment tracking, CSV exports, auto-archiving, event duplication, certificate eligibility.

**Features:** F4 (CSV Export), F9 (Resource Allocation), F14 (Auto Archiving), F16 (Duplicate Event), F20 (Certificate Eligibility)

#### Branches & Tasks:

**Branch: `feature/SP5-resource-allocation`**
- [ ] Migrations: `events.resources`, `events.event_resources` tables
- [ ] Resource Allocation (F9):
  - `GET /resources` — list all resources with availability
  - `POST /resources` — create resource (admin)
  - `PUT /resources/:id` — update resource
  - `POST /events/:eventId/resources` — allocate resource to event (decrement available_quantity)
  - `DELETE /events/:eventId/resources/:resourceId` — deallocate (increment available_quantity)
  - Reject allocation if `available_quantity < requested`

**Branch: `feature/SP5-csv-export`**
- [ ] Attendance CSV Export (F4):
  - Migration: `registrations.attendance` table
  - `POST /events/:eventId/attendance/:registrationId/check-in` — mark attendance
  - `GET /events/:eventId/attendance/export` — generate CSV (using `json2csv`)
  - CSV columns: Name, Email, Department, Registration Date, Check-in Time, Status

**Branch: `feature/SP5-auto-archiving`**
- [ ] Automated Event Archiving (F14):
  - `node-cron` job inside event-service
  - Runs daily: events with `end_time < NOW() - 7 days` AND `status = 'published'` → set `status = 'archived'`
  - Log archiving action to audit service
- [ ] Duplicate Event Utility (F16):
  - `POST /events/:id/duplicate` — deep-copy event
  - New title: "Original Title (Copy)"
  - Clears: registrations, dates set to null, status='draft'
  - Keeps: venue, category, capacity, resources, description

**Branch: `feature/SP5-certificate-eligibility`**
- [ ] Certificate Eligibility Check (F20):
  - `GET /registrations/:registrationId/certificate-eligible`
  - Checks: registration confirmed + attendance recorded + feedback submitted + event completed
  - Returns: `{ eligible: true/false, reasons: [...] }`
- [ ] `GET /events/:eventId/certificate-eligible-students` — list all eligible students for an event

**Branch: `feature/SP5-frontend-admin-panel`**
- [ ] Resource management page — CRUD table, allocation form on event detail
- [ ] Attendance check-in page — list of registered students with check-in button
- [ ] CSV export button on roster page — downloads file
- [ ] Duplicate event button on event detail
- [ ] Certificate eligibility indicator on student participation history
- [ ] Archive badge on past events

**Merge:** All SP5 branches → `develop`. Then `develop` → `main`.

---

### SPRINT 6 — Testing, Polish & Dashboard (Week 13–14)

**Goal:** Integration tests pass. UI polished. Admin dashboard with analytics. Seed data loaded.

#### Branches & Tasks:

**Branch: `feature/SP6-integration-tests`**
- [ ] Test key flows with `supertest` + `jest`:
  - Register → Login → Create Event → Register for Event → Submit Feedback
  - Register for full event → gets waitlisted → someone cancels → promoted
  - Venue conflict detection
  - Capacity enforcement
  - Deadline enforcement
  - Role-based access control

**Branch: `feature/SP6-admin-dashboard`**
- [ ] Admin dashboard summary endpoint: `GET /admin/dashboard`
  - Calls event-service: total events, events this month, active vs archived
  - Calls registration-service: total registrations, registrations this month
  - Calls feedback-service: overall average rating, top 5 rated events
  - Calls notification-service: recent audit log entries
- [ ] Frontend: dashboard with summary cards + charts

**Branch: `feature/SP6-frontend-polish`**
- [ ] Loading skeletons/spinners on all pages
- [ ] Error states with retry buttons
- [ ] Empty states ("No events found", "No registrations yet")
- [ ] Toast notifications for success/error actions
- [ ] Responsive design audit — mobile, tablet, desktop
- [ ] Form validation with inline error messages

**Branch: `feature/SP6-seed-data`**
- [ ] Seed scripts for each service:
  - 5 venues, 10 categories
  - 50 events (mix of draft, published, archived, cancelled)
  - 200 users (190 students, 5 organizers, 5 admins)
  - 500 registrations (mix of confirmed, waitlisted, cancelled)
  - 150 feedback entries
  - 100 notifications
  - 50 audit log entries
  - 10 resources with allocations
- [ ] Root script: `npm run seed:all` runs all service seeds in order

**Merge:** All SP6 branches → `develop`. Then `develop` → `main`.

---

### SPRINT 7 — Documentation & Final QA (Week 15–16)

#### Branches & Tasks:

**Branch: `docs/SP7-api-documentation`**
- [ ] API docs per service (markdown or Swagger):
  - All endpoints with method, path, auth required, request/response examples
- [ ] Architecture diagram (Mermaid in README)
- [ ] Setup guide: step-by-step from clone to running

**Branch: `fix/SP7-final-bugfixes`**
- [ ] Fix any bugs found during QA
- [ ] Performance check: ensure queries are indexed
- [ ] Security check: no exposed secrets, SQL injection prevention, XSS prevention

**Branch: `chore/SP7-demo-prep`**
- [ ] Demo script covering all 20 features
- [ ] Presentation slides (if needed)
- [ ] Final seed data refresh

**Final merge:** `develop` → `main` (v1.0.0 tag)

---

## 7. Docker Compose Configuration

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: campuspulse
      POSTGRES_USER: campus
      POSTGRES_PASSWORD: campus123

  api-gateway:
    build: ./services/api-gateway
    ports: ["3000:3000"]
    environment:
      - USER_SERVICE_URL=http://user-service:3001
      - EVENT_SERVICE_URL=http://event-service:3002
      - REGISTRATION_SERVICE_URL=http://registration-service:3003
      - FEEDBACK_SERVICE_URL=http://feedback-service:3004
      - NOTIFICATION_SERVICE_URL=http://notification-service:3005
      - JWT_SECRET=your-jwt-secret-here
      - INTERNAL_SERVICE_KEY=your-internal-key-here
    depends_on: [user-service, event-service, registration-service, feedback-service, notification-service]

  user-service:
    build: ./services/user-service
    ports: ["3001:3001"]
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=campus
      - DB_PASSWORD=campus123
      - DB_NAME=campuspulse
      - JWT_SECRET=your-jwt-secret-here
      - INTERNAL_SERVICE_KEY=your-internal-key-here
    depends_on: [postgres]

  event-service:
    build: ./services/event-service
    ports: ["3002:3002"]
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=campus
      - DB_PASSWORD=campus123
      - DB_NAME=campuspulse
      - NOTIFICATION_SERVICE_URL=http://notification-service:3005
      - INTERNAL_SERVICE_KEY=your-internal-key-here
    depends_on: [postgres]

  registration-service:
    build: ./services/registration-service
    ports: ["3003:3003"]
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=campus
      - DB_PASSWORD=campus123
      - DB_NAME=campuspulse
      - EVENT_SERVICE_URL=http://event-service:3002
      - USER_SERVICE_URL=http://user-service:3001
      - NOTIFICATION_SERVICE_URL=http://notification-service:3005
      - INTERNAL_SERVICE_KEY=your-internal-key-here
    depends_on: [postgres]

  feedback-service:
    build: ./services/feedback-service
    ports: ["3004:3004"]
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=campus
      - DB_PASSWORD=campus123
      - DB_NAME=campuspulse
      - INTERNAL_SERVICE_KEY=your-internal-key-here
    depends_on: [postgres]

  notification-service:
    build: ./services/notification-service
    ports: ["3005:3005"]
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=campus
      - DB_PASSWORD=campus123
      - DB_NAME=campuspulse
      - INTERNAL_SERVICE_KEY=your-internal-key-here
    depends_on: [postgres]

  frontend:
    build: ./frontend
    ports: ["4000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3000
    depends_on: [api-gateway]

volumes:
  pgdata:
```

---

## 8. Environment Variables (.env.example)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=campus
DB_PASSWORD=campus123
DB_NAME=campuspulse

# Auth
JWT_SECRET=change-this-to-a-random-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Inter-service
INTERNAL_SERVICE_KEY=change-this-to-a-random-key

# Service URLs (for local dev without Docker)
USER_SERVICE_URL=http://localhost:3001
EVENT_SERVICE_URL=http://localhost:3002
REGISTRATION_SERVICE_URL=http://localhost:3003
FEEDBACK_SERVICE_URL=http://localhost:3004
NOTIFICATION_SERVICE_URL=http://localhost:3005
API_GATEWAY_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 9. Verification Plan

After each sprint, verify:

1. **Docker:** `docker-compose up` — all services healthy
2. **Migrations:** `npm run migrate:all` — no errors
3. **Health checks:** `curl http://localhost:3000/api/<service>/health` for each service
4. **API tests:** Run with Postman collection or `npm test` in each service
5. **Frontend:** Navigate all pages, test all user flows
6. **Git:** `develop` branch is clean, all PRs merged, no conflicts

---

## 10. Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| DB strategy | Single Postgres, separate schemas | Less Docker overhead, logical isolation |
| Auth | JWT (access + refresh) | Stateless, fits microservices |
| Inter-service comm | Synchronous REST | Simple, debuggable, sufficient scale |
| Monorepo tooling | npm workspaces | Zero extra tooling |
| ORM | Knex.js (query builder) | Project requirement, SQL control + migrations |
| Frontend state | React Context | Only auth is global; rest is server-fetched |
| CSV export | json2csv library | Lightweight |
| Cron jobs | node-cron in event-service | No separate container needed |
| API Gateway | Express + http-proxy-middleware | Simple, full control |

---

## Implementation Order Summary

```
Sprint 0: Foundation     → Repo, Docker, shared package, skeletons
Sprint 1: Auth           → Users, JWT, roles, profiles (F10, F15)
Sprint 2: Events         → CRUD, venues, conflicts, categories (F1, F2, F6, F12, F18, F19)
Sprint 3: Registrations  → Join, waitlist, rosters, guest import (F3, F5, F8, F17)
Sprint 4: Feedback       → Ratings, analytics, notifications, audit (F7, F11, F13)
Sprint 5: Advanced       → Resources, CSV, archiving, duplication, certs (F4, F9, F14, F16, F20)
Sprint 6: Polish         → Tests, dashboard, UI polish, seed data
Sprint 7: Ship           → Docs, final QA, demo prep
```
