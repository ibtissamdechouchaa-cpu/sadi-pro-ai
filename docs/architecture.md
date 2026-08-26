# SADI PRO — Architecture

## Overview

SADI PRO is an AI-powered B2B Document Intelligence + Records Management + Smart Archive Platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS 3 |
| Backend | Hono (Node.js), Prisma ORM |
| Database | PostgreSQL (Prisma Postgres) |
| Auth | JWT (jsonwebtoken) |
| AI | OpenAI GPT-4o-mini |
| Search | PostgreSQL Full-Text Search (tsvector/tsquery) |
| Storage | Local disk (uploads/) |
| State | React Context |
| Routing | React Router 6 |
| Icons | Lucide React |

## Architecture Pattern

**Modular Monolith** — Single deployment with clear module boundaries, ready for future service extraction.

```
src/                          # Frontend (React)
├── lib/                      # Core modules
│   ├── api.ts                # HTTP client with auth
│   ├── auth.tsx              # Authentication context
│   ├── search.ts             # Search client
│   ├── notifications.ts      # Notification service
│   ├── useRealtime.ts        # Real-time polling hooks
│   ├── security.ts           # Security utilities
│   ├── i18n.ts               # Internationalization (AR/FR/EN)
│   └── documentProcessor.ts  # Client-side document utils
├── store/
│   └── StoreContext.tsx       # Global state (API-backed)
├── pages/                    # 11 page components
├── components/               # UI component library
└── types.ts                  # TypeScript types

server/                       # Backend (Hono)
├── index.ts                  # Server entry point
├── lib/
│   ├── prisma.ts             # Prisma client
│   ├── auth.ts               # JWT auth middleware
│   ├── ai.ts                 # OpenAI integration
│   └── rateLimit.ts          # Rate limiting + session tracking
└── routes/
    ├── auth.ts               # Auth routes (signup, login, me)
    └── data.ts               # All data routes (CRUD + AI + search)

prisma/
├── schema.prisma             # Database schema (11 models)
└── seed.ts                   # Demo data seeder
```

## Multi-Tenancy

- Every table has `organizationId`
- Auth middleware extracts `orgId` from JWT token
- Users can only access their organization's data
- Roles: owner, admin, manager, editor, reviewer, viewer, auditor

## Database Schema

11 models: Organization, Profile, Department, Document, ProcessingJob, AuditLog, ActivityEvent, Notification, RetentionPolicy, Collection, Workflow

- UUID primary keys
- Soft deletes (`deletedAt`)
- Audit trail (immutable)

## Authentication Flow

1. User signs up → Organization + Profile created
2. Login → JWT token issued (7-day expiry)
3. Token stored in localStorage (`sadi_token`)
4. All API requests include `Authorization: Bearer <token>`
5. Server middleware verifies token and extracts `userId` + `orgId`

## Document Processing Pipeline

```
Upload → Storage → Metadata Save → AI Analysis → Indexing → Ready
```

1. Client uploads file via FormData to `/api/data/upload`
2. Server saves file to disk, returns file path
3. Document metadata saved to database
4. AI analysis triggered via `/api/data/documents/:id/process`
5. OpenAI generates summary, entities, risks, tags
6. Results stored in document metadata

## Search

- PostgreSQL full-text search with `tsvector`/`tsquery`
- Ranking via `ts_rank()`
- Snippet highlighting via `ts_headline()`
- Fallback to ILIKE for partial matches
- AI-powered answer generation via OpenAI

## Real-time

- HTTP polling every 30 seconds
- `useRealtimeNotifications` — polls for new notifications
- `useRealtimeDocuments` — polls for document changes
- `useRealtimeActivity` — polls for new activity events
- All hooks auto-refresh the store on new data

## Security

- JWT authentication with 7-day expiry
- bcrypt password hashing (10 rounds)
- Rate limiting (200 requests/minute per IP)
- CORS configurable via environment variable
- Input sanitization utilities
- File type validation

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| JWT_SECRET | Yes | Secret for JWT signing |
| PORT | No | Server port (default: 3001) |
| CORS_ORIGIN | No | Allowed origin (default: http://localhost:5173) |
| OPENAI_API_KEY | No | OpenAI API key (enables AI features) |

## Running

```bash
# Development
npm install
npx prisma db push
npm run seed
npm run dev:all

# Docker
docker-compose up -d
```
