# Walker Creek Farms — Cabin Booker Demo

A cabin booking website and admin platform for Walker Creek Farms & Cabins. This demo runs without Stripe or email — use `DEMO_MODE=true` for fake checkout.

## Prerequisites

- Node.js 20+
- pnpm 9 (`corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- PostgreSQL (local or [Supabase](https://supabase.com) free tier)

## Local setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-west-2.pooler.supabase.com:6543/postgres
DEMO_MODE=true
PORT=8080
ADMIN_PASSWORD=walkercreek2024
```

Get `DATABASE_URL` from **Supabase → Project Settings → Database → Connect**.

### 3. Create tables and seed demo data

```bash
pnpm demo:db
```

Seeds 3 cabins, FAQs, food items, gift certificates, blog posts, and sample bookings.

### 4. Run locally

```bash
# Terminal 1 — API (port 8080)
pnpm demo:api

# Terminal 2 — frontend (port 24478)
pnpm demo:web
```

- **Site:** http://localhost:24478  
- **Admin:** http://localhost:24478/admin/login (password: `walkercreek2024`)

### 5. Verify API

```bash
curl http://localhost:8080/api/rentals
```

Should return JSON with 3 cabins.

---

## Deploy to Netlify (frontend)

Netlify hosts the **static frontend only**. Cabins and admin data come from the **API** (hosted separately). You need both.

### Step 1 — Deploy the API (Render, free)

1. Push your code to GitHub.
2. Go to [render.com](https://render.com) → **New → Blueprint** (or Web Service from repo).
3. Connect your repo — Render picks up `render.yaml`.
4. Set **`DATABASE_URL`** to your Supabase connection string (same as in `.env`).
5. Deploy and copy the service URL, e.g. `https://walker-creek-api.onrender.com`.
6. Test:

   ```bash
   curl https://YOUR-API.onrender.com/api/rentals
   ```

   Should return JSON with cabins. (First request on free tier may take ~30s while the service wakes up.)

Your database is already seeded if you ran `pnpm demo:db` against the same Supabase project.

### Step 2 — Deploy frontend on Netlify

#### Option A — Git (recommended)

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**
2. Select your repo and branch (e.g. `demo`)
3. Leave build settings blank — `netlify.toml` handles everything
4. **Site configuration → Environment variables** → add:
   - `API_URL` = `https://YOUR-API.onrender.com` (no trailing slash)
5. Deploy

#### Option B — Manual drop

```bash
API_URL=https://YOUR-API.onrender.com bash scripts/netlify-build.sh
```

Drag **`artifacts/walker-creek/dist/public`** to [Netlify Drop](https://app.netlify.com/drop).

### Step 3 — Verify production

- Open your Netlify URL — cabins, FAQs, and food should load.
- Admin: `https://your-site.netlify.app/admin/login`

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | API | Postgres connection string (Supabase recommended) |
| `DEMO_MODE` | API | `true` — fake checkout, no Stripe |
| `PORT` | API | `8080` locally; Render sets this automatically |
| `ADMIN_PASSWORD` | API | Admin login password (default: `walkercreek2024`) |
| `SESSION_SECRET` | API | Random string for admin sessions |
| `API_URL` | Netlify build | Render API URL for `/api/*` proxy |

Do **not** set `NODE_ENV=production` in Netlify — it skips devDependencies and breaks the Vite build.

---

## Project structure

| Path | Description |
|------|-------------|
| `artifacts/walker-creek/` | React frontend (Vite) |
| `artifacts/api-server/` | Express API |
| `lib/db/` | Drizzle schema + seed script |
| `scripts/netlify-build.sh` | Netlify build + API proxy |
| `render.yaml` | Render API deployment |
| `netlify.toml` | Netlify frontend deployment |

---

## Demo booking flow

1. Pick a cabin → select dates → enter guest info  
2. Redirects to `/demo-checkout` (demo card UI)  
3. Click **Pay with demo card** → booking confirmed  

No real payment processor is connected when `DEMO_MODE=true`.

---

## Troubleshooting

**Empty site / no cabins**

- API must be running (local) or deployed (production)
- Netlify needs `API_URL` set before build
- Test: `curl https://YOUR-API.onrender.com/api/rentals`

**`pnpm demo:db` fails with DATABASE_URL error**

- Create `.env` in the repo root with a valid `DATABASE_URL`
- Or: `export DATABASE_URL="..." && pnpm demo:db`

**Netlify build fails**

- Use Node 20 (set in `netlify.toml`)
- Do not set `NODE_ENV=production` in Netlify env vars
- Repo uses pnpm 9 — Netlify auto-detects from `pnpm-lock.yaml`

**Admin login loops back to sign-in**

- Ensure `API_URL` is set in Netlify and `/api/*` is proxied (rebuild after setting)
- Set `ADMIN_PASSWORD` on Render if you changed it from the default
- Redeploy **both** Render (API) and Netlify (frontend) after auth fixes
- Clear site cookies for your Netlify domain and try again
