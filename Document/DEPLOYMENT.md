# 🚀 Schedula – Deployment Guide (Render + Neon PostgreSQL)

This guide covers deploying the Schedula NestJS backend to **Render** (free tier) with a **Neon PostgreSQL** hosted database.

---

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Hosting | [Render](https://render.com) | Free tier, auto-deploy from GitHub |
| Database | [Neon PostgreSQL](https://neon.tech) | Free serverless PostgreSQL, no credit card needed |
| Runtime | Node.js 20 | LTS, supported on Render free tier |

---

## Step 1 — Set Up Neon PostgreSQL (Free Hosted DB)

1. Go to [neon.tech](https://neon.tech) and sign up (free, no credit card).
2. Click **New Project** → Name it `schedula`.
3. Choose a region close to you (e.g., `AWS us-east-1`).
4. After creation, go to **Dashboard → Connection Details**.
5. Under **Connection string**, copy the full URL:
   ```
   postgresql://username:password@ep-xxxx.region.aws.neon.tech/schedula?sslmode=require
   ```
   **Save this URL** — you will need it in Step 3.

---

## Step 2 — Deploy on Render

### 2.1 Create a New Web Service

1. Go to [render.com](https://render.com) → Sign up / Log in.
2. Click **New** → **Web Service**.
3. Connect your **GitHub account** and select the `schedula-vikasdr` repository.
4. Configure the service:

   | Setting | Value |
   |---|---|
   | **Name** | `schedula-api` |
   | **Branch** | `main` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm run start:prod` |
   | **Plan** | `Free` |

5. Click **Create Web Service**.

---

## Step 3 — Configure Environment Variables on Render

After the service is created, go to **Environment** tab and add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(paste the Neon connection string from Step 1)* |
| `JWT_SECRET` | *(any strong random string — e.g., generate one at [randomkeygen.com](https://randomkeygen.com))* |
| `PORT` | `3000` |

> **⚠️ Never commit real secrets to Git.** Add them only via the Render dashboard.

---

## Step 4 — Run Database Migrations on Neon

After the first successful deploy on Render, go to **Shell** tab in Render dashboard and run:

```bash
npm run migration:run:prod
```

This applies all migration files against Neon PostgreSQL and creates the required tables.

Alternatively, run migrations locally with Neon connection string:

```bash
DATABASE_URL="postgresql://..." npm run migration:run
```

---

## Step 5 — Verify Deployed APIs

Your public URL will be: `https://schedula-api.onrender.com`

Test these endpoints with Postman / Hoppscotch / Thunder Client after deployment:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check — should return `Hello World!` |
| `POST` | `/auth/register` | Register doctor or patient |
| `POST` | `/auth/login` | Login and receive JWT token |
| `POST` | `/doctor/profile` | Create doctor profile |
| `POST` | `/patient/profile` | Create patient profile |
| `POST` | `/doctor/availability/override` | Add custom availability |
| `GET` | `/doctor/availability/date` | Query slots for a date |
| `POST` | `/appointments/book` | Book appointment |
| `GET` | `/appointments/patient` | Get patient's appointments |
| `GET` | `/appointments/doctor` | Get doctor's appointments |
| `PATCH` | `/appointments/:id/cancel` | Cancel appointment |
| `PATCH` | `/appointments/:id/reschedule` | Reschedule appointment |

---

## Step 6 — Update Postman Collection for Production URL

Open [postman_collection.json](../postman_collection.json) and update the `baseUrl` variable to your Render URL:

```json
{
  "key": "baseUrl",
  "value": "https://schedula-api.onrender.com"
}
```

Or in VS Code Postman Extension / Postman Desktop, edit the collection variable `baseUrl`.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ In production | Full Neon PostgreSQL connection string |
| `JWT_SECRET` | ✅ Always | Secret for signing JWT tokens |
| `NODE_ENV` | ✅ In production | Set to `production` |
| `PORT` | Optional | Defaults to `3000` |
| `DB_TYPE` | Local only | Set to `postgres` for local PG, omit for SQLite |
| `DB_HOST` | Local only | PostgreSQL host (alternative to DATABASE_URL) |
| `DB_PORT` | Local only | PostgreSQL port (default: `5432`) |
| `DB_NAME` | Local only | Database name |
| `DB_USER` | Local only | Database user |
| `DB_PASS` | Local only | Database password |

---

## Local Development

No configuration needed. Just run:

```bash
npm run start:dev
```

The server automatically uses **SQLite** (`schedula.sqlite`) locally — no PostgreSQL or Docker required.

---

## Common Deployment Issues & Fixes

| Issue | Fix |
|---|---|
| Build fails with TypeScript error | Ensure all `@types/*` packages are in `dependencies`, not just `devDependencies` |
| `SSL SYSCALL error` | Ensure `ssl: { rejectUnauthorized: false }` is set (already done in `app.module.ts`) |
| `Port already in use` | Render sets `PORT` env var automatically; don't hardcode it |
| `Cannot find module` | Run `npm install` in build command before `npm run build` |
| CORS error from frontend | `enableCors({ origin: '*' })` already configured in `main.ts` |
| 503 on free tier | Render free tier sleeps after 15 min inactivity; first request takes ~30s to wake up |
