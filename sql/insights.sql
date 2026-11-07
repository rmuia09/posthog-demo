-- ============================================================================
-- HogDesk Lite — SQL Insights (ClickHouse / PostHog Data Layer)
-- ============================================================================
-- These queries run directly against the `events` table in PostHog's
-- ClickHouse warehouse via SQL Insights.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Problem 1: Weekday Insight Breakdown
-- ----------------------------------------------------------------------------
-- Breaks down event volume by day of the week using toDayOfWeek().
-- Maps numeric day (1-7) to human-readable labels and aggregates counts.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Bonus: Top events by name over the last 30 days
-- ----------------------------------------------------------------------------
SELECT
    event,
    count(*) AS total_count
FROM events
WHERE timestamp >= now() - INTERVAL 30 DAY
GROUP BY event
ORDER BY total_count DESC
LIMIT 20

-- ----------------------------------------------------------------------------
-- Bonus: Events per hour of day (peak traffic identification)
-- ----------------------------------------------------------------------------
SELECT
    toHour(timestamp) AS hour_of_day,
    count(*) AS total_event_count
FROM events
WHERE timestamp >= now() - INTERVAL 7 DAY
GROUP BY hour_of_day
ORDER BY hour_of_day ASC

-- ----------------------------------------------------------------------------
-- Bonus: Rate-limited capture collisions by user (last 7 days)
-- ----------------------------------------------------------------------------
SELECT
    user_id,
    count(*) AS rate_limited_calls
FROM events
WHERE event = 'capture_call_ignored'
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY user_id
ORDER BY rate_limited_calls DESC
LIMIT 10

-- ----------------------------------------------------------------------------
-- Bonus: PII property audit — find profiles containing email-like patterns
-- ----------------------------------------------------------------------------
SELECT
    person_id,
    properties
FROM person
WHERE match(properties, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
LIMIT 50
