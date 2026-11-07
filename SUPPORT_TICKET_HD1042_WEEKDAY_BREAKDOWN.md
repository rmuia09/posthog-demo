# Practice Ticket HD-1042 — Breakdown Insight by Day of Week

*Practice ticket written from a sample question, not a real customer.*

**Status:** Practice  
**Priority:** Medium  
**Type:** Product Analytics  
**Assigned to:** R. Muia  
**Created:** 2026-11-07

---

## Customer message

Hi,

I want to break down one of our product insights by day of the week — basically see which days (Monday, Tuesday, etc.) have the most events. I checked the Trends UI but I can't find a toggle for this. Is it possible in PostHog?

Thanks

---

## What I checked

**Trends UI:** The default Trends UI does linear time groupings (hour/day/week/month). I could not find a native "group by day of week" option in the UI.

**Storage layer:** PostHog queries events through HogQL (ClickHouse-compatible SQL). SQL Insights lets you run raw HogQL against the `events` table, where `toDayOfWeek(timestamp)` extracts the day number (1 = Monday … 7 = Sunday).

**Time zone:** I didn't test how `toDayOfWeek()` handles time zone boundaries. An event captured near midnight in your local time might land on a different weekday depending on the project's server time zone — worth checking if day boundaries matter for your use case.

---

## Solution

Run in **Product analytics → New insight → SQL**:

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

**No-SQL alternative:** Compute the weekday client-side when capturing and send it as an event property (`day_of_week: "Saturday"`), then filter by that property in Trends. Requires a code change but works in the standard UI going forward.

---

## Reply to customer

Hey,

PostHog doesn't have a day-of-week toggle in the default Trends UI — at least, I couldn't find one — but you can use SQL Insights to group events by day of week:

[SQL query]

If you'd rather stay out of SQL, you can also send `day_of_week` as an event property from your frontend and filter on it in Trends. That needs a small code change though.

Let me know how you want to proceed.

---

## Notes

- Saturday's high count (235 events) in my test data is likely just my own test traffic, since today is Saturday. I didn't investigate it as a spike or campaign.
- I didn't confirm whether your specific project has SQL Insights enabled (plan-dependent).

---

## Related

Repo: https://github.com/rmuia09/posthog-demo  
Query: `sql/insights.sql`
