# Architecture

Data flows from React frontend through FastAPI backend into PostHog, queried with HogQL.

---

## Stack

- Frontend: React + posthog-js
- Backend: FastAPI + posthog-python
- Analytics: HogQL via SQL Insights

---

## Frontend

**React** builds the UI: checkout screen and video player.

**posthog-js** captures browser events:
- `posthog.init()` — sets API key and host
- `posthog.capture()` — sends an event
- `posthog.isFeatureEnabled()` — checks feature flags

Sends checkout submissions, video progress, and navigation events to PostHog. Throttles `onTimeUpdate` so the video player doesn't flood the SDK.

## Backend

**FastAPI** exposes two endpoints:
- `POST /api/v1/checkout` — simulates payment, rate limits at 60 requests/user/minute, captures `payment_submitted`
- `POST /api/v1/tickets/route` — routes support tickets, same rate limit, captures `ticket_routed`

**posthog-python** captures server-side events to the same PostHog project as the frontend. Logs `capture_call_ignored` when rate limit hits.

## Analytics

**HogQL** is PostHog's SQL dialect (ClickHouse-compatible). Query the `events` table directly.

**SQL Insights** is the PostHog UI tool. Open Product analytics → New insight → SQL, paste query, run.

Example — event volume by day of week:

```sql
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
```

## Files

| File | Purpose |
|------|---------|
| `frontend/src/main.jsx` | Initializes posthog-js |
| `frontend/src/components/CheckoutScreen.jsx` | Mock checkout form |
| `frontend/src/components/VideoPlayer.jsx` | Throttled video player with posthog-js |
| `backend/main.py` | FastAPI app with checkout and ticket routing |
| `sql/insights.sql` | HogQL queries for SQL Insights |
