# Ticket HD-1042 — Weekday Breakdown

Practice ticket. Not a real customer.

Issue: Customer wants event volume by day of week. Trends UI has no toggle for this.

Checked:
- Trends UI: linear time groupings only (hour/day/week/month). No weekday toggle found.
- Storage: PostHog queries events through HogQL. SQL Insights runs raw HogQL against events. toDayOfWeek(timestamp) extracts day number (1 = Monday ... 7 = Sunday).

Solution:

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

No-SQL alternative: send day_of_week as an event property from the frontend and filter in Trends. Requires code change.

Repo: https://github.com/rmuia09/posthog-demo
Query: sql/insights.sql
