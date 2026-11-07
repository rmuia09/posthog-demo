# Support Ticket: HD-1042 — Breakdown Product Insight by Weekday

**Ticket ID:** HD-1042  
**Status:** Resolved  
**Priority:** Medium  
**Category:** Product Analytics / Insights  
**Channel:** Email  
**Customer:** Acme Corp (Enterprise)  
**Engineer:** Richard Muia (TSE Candidate)  
**Date:** 2026-11-07

---

## Customer Problem

A customer wants to break down a product insight by the day of the week to identify which specific days (e.g., Monday, Tuesday, etc.) capture the highest volume of user events.

They have reviewed the standard Trends UI and cannot find a zero-code configuration toggle to group events by day of week. They are asking whether this is possible in PostHog and, if so, how to achieve it.

---

## Investigation

### 1. Reviewed the Trends UI
The default Trends UI supports linear time series groupings (hour, day, week, month) but does not expose a native "group by day of week" toggle. Selecting "Day" breaks down by calendar date, not by weekday name.

### 2. Evaluated PostHog's Storage Layer
PostHog stores captured events in ClickHouse, a columnar OLAP database optimized for analytical queries. The `events` table includes a standard `timestamp` column, and ClickHouse provides date/time functions such as `toDayOfWeek()` that extract temporal components directly from that field.

### 3. Tested via SQL Insights
SQL Insights allows raw ClickHouse queries against the `events` table. We validated the approach in **HogDesk Lite**, a technical portfolio showcase mirroring PostHog's stack (React + `posthog-js`, FastAPI + `posthog-python`, ClickHouse / SQL Insights).

### 4. Generated Test Events
Using the HogDesk Lite backend API, we captured checkout and ticket events over several days:

```bash
POST /api/v1/checkout   -> event: payment_submitted
POST /api/v1/tickets/route -> event: ticket_routed
```

These events were ingested into PostHog and visible in **Live Events**.

---

## Solution

### Primary: SQL Insights

Navigate to **Product analytics → New insight → SQL** and run:

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

**What this query does:**
- `toDayOfWeek(timestamp)` extracts the day number (1 = Monday … 7 = Sunday) from the standard `timestamp` field
- `CASE` maps numeric days to human-readable labels
- `count(*)` aggregates event volume per weekday
- `WHERE timestamp >= now() - INTERVAL 30 DAY` scopes to the last 30 days
- `GROUP BY day_of_week` aggregates; `ORDER BY day_of_week ASC` keeps the week in order

**Result from HogDesk Lite test data:**

| Day of Week | Total Event Count |
|-------------|-------------------|
| 1. Monday | 24 |
| 2. Tuesday | 24 |
| 3. Wednesday | 24 |
| 4. Thursday | 18 |
| 5. Friday | 24 |
| 6. Saturday | 235 |
| 7. Sunday | 27 |

**Insight:** Saturday captured the highest volume (235 events), clearly surfacing a weekday pattern that the standard Trends UI could not show without SQL.

---

## Alternative: Zero-Code Client-Side Workaround

If the customer cannot use SQL Insights, compute the weekday client-side during payload construction and send it as a static event property:

```javascript
posthog.capture('event_name', {
    day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' })
});
```

Then filter by `day_of_week` in the standard Trends UI. This requires an instrumentation change but avoids SQL entirely.

---

## Recommendation to Customer

1. **Use SQL Insights** for ad-hoc weekday breakdowns without code changes.
2. **Save the insight to a dashboard** so the team can revisit it without re-running the query.
3. **Consider client-side `day_of_week` property injection** if they need this breakdown frequently in the standard Trends UI.

---

## References

- **Project repo:** https://github.com/rmuia09/posthog-demo
- **SQL query file:** `sql/insights.sql`
- **Backend API:** `backend/main.py` (FastAPI + `posthog-python`)
- **Frontend SDK:** `frontend/src/main.jsx` (`posthog-js` init)
- **Event capture examples:** `frontend/src/components/CheckoutScreen.jsx`, `VideoPlayer.jsx`

---

## Closing Note to Customer

> "PostHog doesn't expose a day-of-week toggle in the default Trends UI, but because your events are stored in ClickHouse, you can break them down by weekday instantly using SQL Insights. The query below groups event volume by day name over the last 30 days — Saturday came out highest in our test dataset. Let us know if you'd like help saving this to a dashboard or setting up the client-side property workaround."
