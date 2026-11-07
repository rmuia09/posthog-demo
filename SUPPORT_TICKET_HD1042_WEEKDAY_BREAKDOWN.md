# Support Ticket HD-1042 — Breakdown Insight by Day of Week

**Status:** Resolved  
**Priority:** Medium  
**Type:** Product Analytics  
**Customer:** Acme Corp  
**Assigned to:** R. Muia  
**Created:** 2026-11-07

---

## Customer message

Hi,

I want to break down one of our product insights by day of the week — basically see which days (Monday, Tuesday, etc.) have the most events. I checked the Trends UI but I can't find a toggle for this. Is it possible in PostHog?

Thanks

---

## Investigation

The default Trends UI does linear time groupings (hour/day/week/month) but doesn't have a "group by weekday" option. PostHog stores events in ClickHouse, so `toDayOfWeek()` works on the `timestamp` column directly in SQL Insights.

Tested with sample data captured through the HogDesk Lite backend:

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

### Results

| Day of Week | Events |
|-------------|--------|
| Monday | 24 |
| Tuesday | 24 |
| Wednesday | 24 |
| Thursday | 18 |
| Friday | 24 |
| Saturday | 235 |
| Sunday | 27 |

Saturday is the clear outlier here — probably worth flagging to the customer in case it's a bot spike or weekend campaign.

---

## Alternative (no SQL)

If they don't want to use SQL Insights, they can compute the weekday client-side when capturing and store it as an event property:

```javascript
posthog.capture('event_name', {
    day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' })
})
```

Then filter by that property in Trends. Trade-off: requires a code change, but works in the standard UI going forward.

---

## Reply to customer

Hey,

PostHog doesn't have a day-of-week toggle in the default Trends UI, but your events live in ClickHouse so you can break them down by weekday instantly with SQL Insights:

[SQL query]

Saved that as an insight so you can revisit it on a dashboard. Saturday came out highest in our test data (235 events) — let me know if you want help digging into what's driving that.

If you'd rather stay out of SQL, you can also send `day_of_week` as an event property from your frontend and filter on it in Trends. That needs a small code change though.

Let me know how you want to proceed.

---

## Internal notes

- Customer doesn't have SQL access enabled? Check plan tier before suggesting SQL Insights.
- If they're on a lower tier, the client-side property workaround is the only path.
- Saturday spike (235 vs ~24 other days) is worth a follow-up — could be legitimate weekend usage or automated traffic.

---

## Related

Repo: https://github.com/rmuia09/posthog-demo  
Query: `sql/insights.sql`  
Backend: `backend/main.py`  
Frontend SDK: `frontend/src/main.jsx`
