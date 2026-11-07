# HogDesk Lite

Ticketing router for PostHog support problems. React frontend, FastAPI backend, HogQL queries.

## Stack

- Frontend: React + posthog-js
- Backend: FastAPI + posthog-python
- Analytics: HogQL via SQL Insights

## Structure

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

## Problem 1: Weekday Breakdown

Trends UI has no day-of-week toggle.

Run HogQL in SQL Insights:

SELECT CASE toDayOfWeek(timestamp)
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

Or compute day_of_week client-side and send as an event property.

File: sql/insights.sql

## Problem 2: Video Player Rate Limiting

posthog-js drops capture calls inside onTimeUpdate loops.

rate_limiting defaults to 10 events/sec. Throttle client-side instead of raising the limit:

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

Backend enforces 60 requests per user per minute and logs capture_call_ignored events.

File: frontend/src/components/VideoPlayer.jsx

## Problem 3: PII in a Person Property

PII captured as a person property. GDPR requires removal.

1. Delete the person in the Persons tab. Include events if needed — this removes them from counts.
2. Check if the PII value exists on historical events, not just the profile.

File: backend/main.py

## Run Locally

Backend:

cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

Frontend:

cd frontend
npm install
npm run dev

Set POSTHOG_API_KEY in backend/.env and VITE_POSTHOG_API_KEY in frontend/.env.

## Tests

Backend:

cd backend
source .venv/bin/activate
behave

Frontend:

cd frontend
npm install
npm test

Playwright requires Node 20+.

## CI

.github/workflows/ci.yml runs on push/PR:

- backend: behave tests (Python 3.11)
- frontend: Playwright tests (Node 20)

Secret: POSTHOG_API_KEY in GitHub Settings → Secrets → Actions.

## License

MIT — portfolio for PostHog TSE role.
