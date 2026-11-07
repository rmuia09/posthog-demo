# Answer: Weekday Insight Breakdown

Yes. Use SQL Insights (Product analytics → New insight → SQL) with HogQL against the events table:

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

Trends UI has no day-of-week toggle.

Alternative: compute day_of_week client-side and send as an event property, then filter in Trends.

Repo: https://github.com/rmuia09/posthog-demo
Query: sql/insights.sql
