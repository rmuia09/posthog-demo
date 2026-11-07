# HogDesk Lite

Ticketing router for PostHog support problems. React frontend, FastAPI backend, HogQL queries.

---

## Stack

- Frontend: React + `posthog-js`
- Backend: FastAPI + `posthog-python`
- Analytics: HogQL via SQL Insights

---

## Structure

```
backend/
  main.py          # FastAPI app
  requirements.txt
frontend/
  src/
    main.jsx       # posthog-js init
    App.jsx        # Shell
    components/
      CheckoutScreen.jsx
      VideoPlayer.jsx
sql/
  insights.sql     # HogQL queries
tests/
  behave/          # Python BDD tests
  hogdesk.spec.ts  # Playwright E2E tests
```

---

## Problem 1: Weekday Insight Breakdown

**Issue:** Trends UI has no day-of-week toggle.

**Solution:** Run HogQL in SQL Insights:

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

Alternative: compute `day_of_week` client-side and send as an event property.

File: `sql/insights.sql`

---

## Problem 2: Video Player Rate Limiting

**Issue:** `posthog-js` drops capture calls inside `onTimeUpdate` loops.

**Solution:** Throttle client-side. `posthog-js` has `rate_limiting` (default 10 events/sec). Raise it only after throttling fails.

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

Backend enforces 60 requests per user per minute and logs `capture_call_ignored` events.

File: `frontend/src/components/VideoPlayer.jsx`

---

## Problem 3: PII in a Person Property

**Issue:** PII captured as a person property. GDPR requires removal.

**Solution:**

1. Delete the person in the Persons tab. Include events if needed — this removes them from counts.
2. Check if the PII value exists on historical events, not just the profile. I haven't confirmed single-property deletion in the UI.
3. If PII is on historical events and you can't delete it without losing counts, escalate.

File: `backend/main.py`

---

## Run Locally

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Set `POSTHOG_API_KEY` in `backend/.env` and `VITE_POSTHOG_API_KEY` in `frontend/.env`.

---

## Tests

Backend:

```bash
cd backend
source .venv/bin/activate
behave
```

Frontend:

```bash
cd frontend
npm install
npm test
```

Playwright requires Node 20+.

---

## CI

`.github/workflows/ci.yml` runs on push/PR:

- `backend`: `behave` tests (Python 3.11)
- `frontend`: Playwright tests (Node 20)

Secret: `POSTHOG_API_KEY` in GitHub Settings → Secrets → Actions.

---

## Local Test Runner

```bash
chmod +x test-local.sh
bash test-local.sh
```

Starts backend and frontend, runs Playwright, cleans up.

---

## License

MIT — portfolio for PostHog TSE role.
