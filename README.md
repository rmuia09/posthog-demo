# HogDesk Lite — Engineering Showcase & Support Blueprint

HogDesk Lite is a small ticketing router I built to show how I approach PostHog support problems. It captures events through a React frontend and FastAPI backend, then runs SQL Insights against the event data.

---

## Architecture

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | React + `posthog-js` | Mock checkout screen + throttled video player with client-side event tracking |
| Backend | FastAPI + `posthog-python` | Ticket routing API, payload validation, server-side rate limiting |
| Analytics | ClickHouse / SQL Insights | Raw HogQL queries against the `events` table |

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

**Solution:** Use **SQL Insights** to run HogQL against the `events` table. Extract the day number with `toDayOfWeek()`, map to readable labels, and aggregate:
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

**Solution:** Implement client-side throttling so tracking fires at most once every 5 seconds instead of every millisecond. `posthog-js` has a configurable `rate_limiting` option (default: 10 events/sec with a burst allowance), but raising it should not be the first move — the limit protects the user's browser. See `frontend/src/components/VideoPlayer.jsx`:

```javascript
import { useRef } from 'react'
import posthog from 'posthog-js'

export function VideoPlayer({ src, userId }) {
    const lastTracked = useRef(0)

    const handleTimeUpdate = (event) => {
        const now = Date.now()
        if (now - lastTracked.current >= 5000) {
            posthog.capture('video_progress_tracked', {
                user_id: userId,
                playback_position_seconds: Math.floor(event.target.currentTime),
            })
            lastTracked.current = now
        }
    }

    return <video src={src} onTimeUpdate={handleTimeUpdate} controls />
}
```

The backend rate limiter in `backend/main.py` uses the same principle — 60 requests per user per minute, returning 429 when exceeded — and captures `capture_call_ignored` events to document rate limit collisions inside PostHog.

---

### Problem 3: Accidental PII Leaks & GDPR Deletion
**Issue:** PII captured as a person property must be erased for GDPR compliance without corrupting historical aggregate metrics.

**Solution:** Multi-step isolation strategy:
1. **Persons tab:** Search the affected profile. I haven't confirmed you can delete a single property in the UI — deleting the whole person is the documented path.
2. **Delete associated events (optional):** When deleting the person, you can include their events — note this removes them from your counts too.
3. **Confirm scope:** Check whether the PII value exists on historical events, not just the person profile. If it does, you'll need to address those events separately.


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
Open PostHog → **Product analytics → New insight → SQL**, paste queries from `sql/insights.sql`, and run against your project's `events` table.

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
| 2. Video rate limiting | `hogdesk.spec.ts` → "Problem 2" | Video player throttles tracking without breaching client rate limits |
| 3. PII/GDPR | `hogdesk.spec.ts` → "Problem 3" | Ticket containing PII is accepted for later deletion |

```bash
cd frontend
npm install
npm test           # runs Playwright E2E tests
```

**Requirements:** Node 20+ for Playwright, Python 3.11+ for the backend.

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
