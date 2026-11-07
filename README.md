# HogDesk Lite — Engineering Showcase & Support Blueprint

A lightweight, fully instrumented transactional ticketing router demonstrating a hybrid engineering-and-support mindset, built as a technical portfolio showcase for the **Technical Support Engineer** role at **PostHog**.

Mirrors PostHog's core tech stack (**Python, JavaScript/React, SQL**) and reproduces, investigates, and resolves real-world customer problems handled by the global support team.

---

## Architecture

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | React + `posthog-js` | Mock checkout screen + throttled video player with client-side event tracking |
| Backend | FastAPI + `posthog-python` | Ticket routing API, payload validation, server-side rate limiting |
| Analytics | ClickHouse / SQL Insights | Raw SQL queries against the `events` table |

---

## Project Structure

```
hogdesk-lite/
├── backend/
│   ├── main.py          # FastAPI app: checkout + ticket routing + rate limiting
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── main.jsx          # App entry + posthog-js init
│   │   ├── App.jsx           # Shell + navigation
│   │   └── components/
│   │       ├── CheckoutScreen.jsx  # Mock checkout with /api/v1/checkout calls
│   │       └── VideoPlayer.jsx     # Throttled video tracking (5s intervals)
│   └── public/
├── sql/
│   └── insights.sql        # ClickHouse SQL Insights queries
└── README.md
```

---

## Customer Problems & Solutions

### Problem 1: Weekday Insight Breakdown
**Issue:** Customer wants to break down product insights by day of week; no zero-code toggle in the Trends UI.

**Solution:** Use **SQL Insights** to query ClickHouse directly. Extract the day number with `toDayOfWeek()`, map to readable labels, and aggregate:
```sql
SELECT
    CASE toDayOfWeek(timestamp)
        WHEN 1 THEN '1. Monday'
        WHEN 2 THEN '2. Tuesday'
        WHEN 3 THEN '3. Wednesday'
        WHEN 4 THEN '4. Thursday'
        WHEN 5 THEN '5. Friday'
        WHEN 6 THEN '6. Saturday'
        WHEN 7 THEN '7. Sunday'
    END AS day_of_week,
    count(*) AS total_event_count
FROM events
WHERE timestamp >= now() - INTERVAL 30 DAY
GROUP BY day_of_week
ORDER BY day_of_week ASC
```
Alternative: compute weekday client-side during payload construction and inject as a static event property (`day_of_week: "Monday"`).

See: `sql/insights.sql`

---

### Problem 2: Video Player Client Rate Limiting
**Issue:** Browser console shows `[Posthog error]: This capture call is ignored due to client rate limiting.` when tracking inside an unthrottled `onTimeUpdate` loop.

**Solution:** Implement client-side throttling so tracking fires every 5 seconds instead of every millisecond. See `frontend/src/components/VideoPlayer.jsx`:

```javascript
const handleTimeUpdate = (event) => {
    const currentTime = Math.floor(event.target.currentTime);
    if (currentTime % 5 === 0 && currentTime !== lastTracked) {
        posthog.capture('video_progress_tracked', {
            user_id: userId,
            playback_position_seconds: currentTime,
        });
    }
};
```

The rate limit is an immutable SDK safety mechanism — the fix is optimizing the integration, not removing the limit.

---

### Problem 3: Accidental PII Leaks & GDPR Deletion
**Issue:** PII captured as a person property must be erased for GDPR compliance without corrupting historical aggregate metrics.

**Solution:** Multi-step isolation strategy:
1. **Dashboard:** Persons tab → search profile → delete/overwrite sensitive properties.
2. **API:** Targeted payload update via PostHog's API to purge values.
3. **Historical Purge:** Data Management → Deletion Requests → deletion condition targeting leaked values.

Server-side validation example in `backend/main.py` captures `capture_call_ignored` events when rate limits collide, documenting the collision cleanly inside PostHog.

---

## Alignment with PostHog Principles

- **Dual-Language Proficiency:** Async JavaScript/React UI → structured Python/FastAPI handler loops.
- **Engineering-First Support Mindset:** Resolves root causes via client-side optimization rather than suggesting removal of system rate limits.
- **Clear Communication:** Translates ClickHouse aggregation, API limits, and database immutability into step-by-step documentation.

---

## Getting Started

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API available at `http://localhost:8000`. Health check: `GET /api/v1/health`.

Endpoints:
- `POST /api/v1/checkout` — simulated payment with rate limiting
- `POST /api/v1/tickets/route` — ticket routing by category
- `GET /api/v1/health` — service health

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build
```

Configure `posthog-js` in `src/main.jsx` with your PostHog API key and host.

### SQL Insights
Open PostHog → **Tools → SQL Insights**, paste queries from `sql/insights.sql`, and run against your project's `events` table.

---

## Testing

### Backend — BDD with `behave` (Python)

Covers checkout, rate limiting, ticket routing, and PII capture:

```bash
cd backend
source .venv/bin/activate   # or: .venv/Scripts/activate on Windows
behave
```

All 7 scenarios pass against the running FastAPI server at `http://localhost:8000`.

### Frontend + Backend API — E2E with Playwright (Node)

Covers all 3 customer problems end-to-end:

| Problem | Test | What it verifies |
|---------|------|------------------|
| 1. Weekday breakdown | `hogdesk.spec.ts` → "Problem 1" | Checkout + ticket events are captured via API |
| 2. Video rate limiting | `hogdesk.spec.ts` → "Problem 2" | Video player throttles tracking (no rate-limit console errors) |
| 3. PII/GDPR | `hogdesk.spec.ts` → "Problem 3" | Ticket containing PII is accepted for later deletion |

```bash
cd frontend
npm install        # requires Node 20+ for Playwright
npm test           # runs Playwright E2E tests
```

**Note:** Playwright requires **Node 20+**. Your system has Node 16 — upgrade Node (via nvm, n, or official installer) before running `npm test`. The backend `behave` tests work on the current Python 3.14 setup.

---

## Continuous Integration

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR:

| Job | What it runs | Requirements |
|-----|-------------|--------------|
| `backend` | `behave` BDD tests against FastAPI | Python 3.11 + `requirements.txt` |
| `frontend` | Playwright E2E tests | Node 20 + Chromium browsers |

**Secrets:** Add `POSTHOG_API_KEY` in your GitHub repository Settings → Secrets and variables → Actions. The frontend tests use it to initialize `posthog-js`.

**Locally — Run Everything at Once:**

```bash
# From project root (starts backend + frontend, runs Playwright, cleans up)
chmod +x test-local.sh
bash test-local.sh

# Or via npm
cd frontend
npm run test:local
```

**Requirements:** Node 20+ for Playwright, Python 3.11+ for the backend.


---

## License


MIT — built as a portfolio demonstration for the PostHog TSE role.
