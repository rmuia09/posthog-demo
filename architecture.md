# Architecture

Data flows from a React frontend through a FastAPI backend into PostHog, then gets queried with HogQL.

---

## Frontend — React + posthog-js

**React** builds the UI: a mock checkout screen and an interactive video player.

**posthog-js** is the PostHog JavaScript SDK. It initializes with your project API key and captures events from the browser:

- `posthog.init()` — configures the client with API key and host
- `posthog.capture()` — sends an event to PostHog
- `posthog.isFeatureEnabled()` — checks feature flags

The frontend sends checkout submissions, video progress events, and page navigation events to PostHog. It also enforces client-side throttling on `onTimeUpdate` so the video player doesn't flood the SDK with capture calls.

## Backend — FastAPI + posthog-python

**FastAPI** is the async Python web framework. It exposes two endpoints:

- `POST /api/v1/checkout` — simulates a payment, enforces per-user rate limiting (60 requests/minute), captures `payment_submitted` events
- `POST /api/v1/tickets/route` — routes support tickets by category, enforces the same rate limit, captures `ticket_routed` events

**posthog-python** is the PostHog Python SDK. It captures server-side events to the same PostHog project as the frontend, so checkout and ticket events appear alongside frontend events in PostHog. It also logs `capture_call_ignored` events when the backend rate limit is hit.

## Analytics — HogQL via SQL Insights

**HogQL** is PostHog's SQL dialect (ClickHouse-compatible). You write queries against the `events` table directly.

**SQL Insights** is the PostHog UI tool that runs HogQL queries. You open Product analytics → New insight → SQL, paste a query, and see results as a table or chart.

Example query breaks down event volume by day of week:

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

## Data Flow

1. User interacts with React frontend (checkout, video play)
2. `posthog-js` captures events and sends them to PostHog
3. User submits checkout or ticket through FastAPI backend
4. `posthog-python` captures server-side events to the same PostHog project
5. Both frontend and backend events land in the `events` table
6. Run HogQL queries in SQL Insights to analyze event volume by weekday, hour, category, etc.

## Files

| File | Purpose |
|------|---------|
| `frontend/src/main.jsx` | Initializes posthog-js with API key |
| `frontend/src/components/CheckoutScreen.jsx` | Mock checkout form, posts to backend |
| `frontend/src/components/VideoPlayer.jsx` | Throttled video player with posthog-js capture |
| `backend/main.py` | FastAPI app with checkout and ticket routing endpoints |
| `sql/insights.sql` | HogQL queries for SQL Insights |
