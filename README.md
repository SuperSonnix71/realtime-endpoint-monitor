<p align="center">
  <img src="apps/frontend/public/favicon.svg" width="80" height="80" alt="Monitor System">
</p>

<h1 align="center">Realtime Endpoint Monitoring</h1>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg" alt="Node">
  <img src="https://img.shields.io/badge/license-Private-red.svg" alt="License">
  <img src="https://img.shields.io/badge/docker-ready-2496ED.svg?logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/PostgreSQL-database-336791?logo=postgresql&logoColor=white" alt="PostgreSQL">
</p>

<p align="center">
  Most monitoring tools only check if your API is up. This one checks if it actually works.<br/>
  Send real requests with real payloads, headers, and files to catch broken logic, not just downtime.
</p>

---

You know that feeling when your monitoring dashboard is all green, but users are telling you things are broken? That's because most tools just ping your endpoints and call it a day. If the server responds, it's "up." But an API can return 200 while the actual logic behind it is completely falling apart. Maybe a database connection went stale, a downstream service is failing silently, an auth flow started rejecting valid tokens, or a multi-step workflow is stuck halfway through.

This tool doesn't just check if your API is alive. It sends the actual requests your application would send. You configure real HTTP methods, headers, JSON payloads, even file uploads for each endpoint. The system runs those requests on a schedule and validates the full response. So when a POST that should create a record starts failing, or a complex chain of API calls breaks at step 3, you find out right away. Not because a ping failed, but because the real operation failed.

### How it differs

| Traditional uptime monitors          | This tool                                      |
| ------------------------------------ | ---------------------------------------------- |
| Pings the URL, checks for 200        | Sends the actual request your app would send    |
| Only verifies the server is up       | Verifies the full request/response cycle works  |
| No payload, no headers, no auth      | Supports custom methods, headers, bodies, files |
| "API is up" while logic is broken    | Catches broken logic even when the server is up |

## Key features

- **Full request simulation** with configurable method, headers, JSON payloads, and file uploads per endpoint
- **Scheduled checks** with configurable intervals and timeouts
- **Latency and uptime metrics** including P50, P95, P99, uptime percentage, and mean time to recovery
- **Webhook alerts** to Microsoft Teams or any compatible service, with per-webhook enable/disable
- **Live dashboard** with SSE-powered real-time feed, latency charts, and downtime-by-monitor breakdown
- **Alert management** where you can acknowledge individually or in bulk, and toggle between new-only and full log views
- **User management** with JWT auth, password reset, and rename
- **Dark mode** with system-aware theme switching

## Tech stack

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Backend  | Node.js, Fastify, Prisma, PostgreSQL, Zod   |
| Frontend | Next.js 16, React 19, Tailwind CSS, Recharts |
| Infra    | Docker, Docker Compose, Turbo (monorepo)     |

## Quick start (Docker)

The fastest way to get everything running.

### Prerequisites

- Docker and Docker Compose
- A running PostgreSQL instance

### Steps

```bash
git clone <repo-url> && cd monitor-system

# Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL, ADMIN_PASSWORD, JWT_SECRET at minimum

# Build and start
docker compose up -d --build
```

Frontend: **http://localhost:7071** | Backend API: **http://localhost:7070**

## Local development

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL running locally

### Steps

```bash
git clone <repo-url> && cd monitor-system

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL, ADMIN_PASSWORD, JWT_SECRET

# Generate Prisma client and run migrations
cd apps/backend
npx prisma generate
npx prisma migrate deploy
cd ../..

# Start both apps in dev mode
pnpm dev
```

Frontend: **http://localhost:3001** | Backend: **http://localhost:3000**

## Environment variables

| Variable              | Required | Default               | Description                                      |
| --------------------- | -------- | --------------------- | ------------------------------------------------ |
| `DATABASE_URL`        | Yes      |                       | PostgreSQL connection string                     |
| `ADMIN_PASSWORD`      | Yes      |                       | Initial admin password                           |
| `JWT_SECRET`          | Yes      |                       | Secret for JWT signing (min 16 chars)            |
| `ADMIN_USER`          | No       | `admin`               | Initial admin username                           |
| `PORT`                | No       | `3000`                | Backend listen port                              |
| `NEXT_PUBLIC_API_URL` | No       | `http://localhost:7070`| Backend URL the frontend calls                   |
| `TEAMS_WEBHOOK_URL`   | No       |                       | Seed webhook URL (imported on first run)         |
| `ALERT_RETRY_COUNT`   | No       | `3`                   | Retries per webhook delivery attempt             |
| `DISPATCH_DELAY_MS`   | No       | `1500`                | Delay between check dispatches                   |
| `ENDPOINT_REFRESH_MS` | No       | `30000`               | How often the scheduler reloads endpoints        |
| `MAX_CONCURRENCY`     | No       | `1`                   | Parallel health check workers                    |
| `DEFAULT_TIMEOUT_MS`  | No       | `30000`               | Default request timeout per check                |
| `RETENTION_DAYS`      | No       | `30`                  | Days to retain check history                     |
| `LOG_LEVEL`           | No       | `info`                | Pino log level                                   |

## Usage

1. **Log in** with the admin credentials you set in `.env`
2. **Add endpoints** via the settings gear icon. Configure the URL, method, headers, payload, check interval, and alert thresholds
3. **Configure webhooks** in settings to receive alerts via Teams or any webhook service
4. **Watch the dashboard** for real-time latency, uptime, and a live check feed
5. **Manage alerts** by acknowledging them individually or in bulk, and toggle between viewing only new alerts or the full log

## License

Private
