# SADI PRO — Document Intelligence Platform

> **AI-powered B2B Archive Document Intelligence · Records Management · Smart Archive**

SADI PRO turns thousands of scattered files into governed, searchable organizational knowledge — upload, classify, retain, search with citations, and ask AI about any file (including scanned images via Gemini Vision).

<p align="center">
  <img src="https://img.shields.io/badge/Stack-React%20%7C%20Hono%20%7C%20Prisma%20%7C%20PostgreSQL-2563eb?style=flat-square" alt="Stack" />
  <img src="https://img.shields.io/badge/AI-Gemini%20%7C%20OpenAI-7c3aed?style=flat-square" alt="AI" />
  <img src="https://img.shields.io/badge/License-MIT-neutral?style=flat-square" alt="License" />
</p>

---

## Features

| Area | What it does |
|------|--------------|
| **Upload & Store** | Drag & drop, 50 MB limit, dedup (409), content-type allowlist, signed storage on disk |
| **Smart Preview** | Image / PDF / Office (`docx/xlsx/pptx`) / text — `@cyntler/react-doc-viewer` + `@doc-preview/core` |
| **AI Analysis** | Gemini Vision (images) + Gemini/OpenAI (text) — summary, entities, dates, risks, tags, confidence + visible reasoning traces |
| **Ask AI About File** | Per-document chat; image-aware via Gemini Vision |
| **Search** | PostgreSQL `tsvector` full-text with `ts_rank` + `ts_headline` snippets, citations, AI answer |
| **Processing Pipeline** | 14 live stages (`Upload → Virus Scan → Validation → Hash → Dedup → OCR → Text Extraction → Metadata → Classification → Chunking → Embedding → Indexing → AI Analysis → Ready`) — every upload runs end-to-end |
| **Compliance Center** | Records, retention policies (create/edit/delete, auto-apply `expiresAt`), legal hold (place/release), frameworks (live readiness) |
| **Collections & Workflows** | Collections, notifications/activity/trash pages, workflows CRUD |
| **Security** | JWT (7d), bcrypt (12), RBAC stubs, rate limit (400/60s, health exempt), `Content-Disposition: filename*` UTF-8, path-traversal guards |
| **UX** | Toast system, error boundary, lazy code-split, skeleton loaders, a11y `role`/`aria-*`, typewriter AI answers, reasoning traces |

---

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/ibtissamdechouchaa-cpu/sadi-pro-ai.git
cd sadi-pro-ai
npm install

# 2. Configure
cp .env.example .env   # set DATABASE_URL, JWT_SECRET, GEMINI_API_KEY / OPENAI_API_KEY

# 3. Database
npx prisma db push
npm run seed            # optional demo data (3 users, 10 docs)

# 4. Run (two terminals)
npm run dev:server      # API on :3001
npm run dev             # Web on :5173 → proxies /api → :3001

# or Docker
docker compose up -d
```

### Environment

| Variable | Required | Default |
|----------|----------|---------|
| `DATABASE_URL` | yes | — |
| `JWT_SECRET` | yes | — |
| `GEMINI_API_KEY` | no | — (falls back to `OPENAI_API_KEY`, then heuristics) |
| `OPENAI_API_KEY` | no | — |
| `PORT` | no | `3001` |
| `CORS_ORIGIN` | no | `http://localhost:5173` |

---

## Project Structure

```
prisma/           schema + migrations + seed
server/           Hono API (auth, data, AI, fileExtractor, rateLimit)
src/
  components/     UI kit (Card, Button, Modal, Toast, DocumentPreview, ReasoningTrace, …)
  pages/          Dashboard, Documents, Detail, Search, Processing, Collections, Compliance, …
  store/          StoreContext (single source of truth, real API-backed)
  lib/            api, auth, search, billing, fileValidation, i18n, …
docs/             architecture, security, final audit
```

---

## API Highlights

- `POST /api/data/upload` — multipart upload (validated, deduped)
- `POST /api/data/documents` — create metadata, auto-triggers 14-stage pipeline
- `GET  /api/data/documents/search?q=&limit=&offset=` — parameterized full-text search
- `POST /api/data/documents/:id/analyze` / `POST /api/data/documents/:id/process` — AI pipeline
- `POST /api/data/documents/:id/ask` — Vision-aware chat about the file
- `GET  /api/data/preview/:id` / `download/:id` — inline vs attachment, `filename*` encoded
- `GET  /api/health` — `SELECT 1` liveness

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite frontend |
| `npm run dev:server` | Hono API |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run seed` | Seed demo org + users |
| `npx prisma db push` / `migrate dev` | Schema sync |

---

## Developer

**Aymen Rouagha** — Full-stack & AI Platform Engineer

> Crafted SADI PRO as an enterprise-grade document intelligence platform — from ingestion and compliance to grounded AI search with citations and vision-aware chat.

*Stack focus: TypeScript, React, Hono, Prisma, PostgreSQL, Gemini/OpenAI.*

---

## License

MIT
