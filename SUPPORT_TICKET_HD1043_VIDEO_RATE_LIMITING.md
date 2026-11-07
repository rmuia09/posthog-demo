# Support Ticket HD-1043 — Video Player Client Rate Limiting

**Status:** Resolved  
**Priority:** High  
**Type:** SDK / Client Instrumentation  
**Customer:** StreamCo  
**Assigned to:** R. Muia  
**Created:** 2026-11-07

---

## Customer message

Hi,

We’re integrating PostHog with a custom web video player and seeing this error in the browser console:

`[Posthog error]: This capture call is ignored due to client rate limiting.`

We’re tracking video progress inside an `onTimeUpdate` loop, which fires many times per second. What is the client-side rate limit, and can we increase or bypass it so we don’t miss telemetry?

Thanks

---

## Investigation

### 1. Reproduced the issue
In HogDesk Lite, the `VideoPlayer` component tracks `video_progress_tracked` on every `onTimeUpdate` frame when left unthrottled. After a few seconds of playback, the browser console shows:

```
[Posthog error]: This capture call is ignored due to client rate limiting.
```

### 2. Evaluated the limit
`posthog-js` includes a built-in client-side rate limit to protect the browser and network pipeline from event floods. The exact threshold is internal to the SDK and **cannot be increased or removed** — it is an immutable safety mechanism.

### 3. Root cause
Calling `posthog.capture()` inside an unthrottled `onTimeUpdate` loop generates far more events than the client pipeline can safely handle. The fix is not to remove the limit, but to optimize the integration so fewer capture calls are made.

---

## Solution

### Client-side throttling

Track progress every 5 seconds instead of every frame:

```javascript
import posthog from 'posthog-js';

export function VideoPlayer({ src, userId }) {
    let lastTracked = 0;

    const handleTimeUpdate = (event) => {
        const currentTime = Math.floor(event.target.currentTime);

        // Throttle: log progress every 5 seconds, not every millisecond
        if (currentTime % 5 === 0 && currentTime !== lastTracked) {
            posthog.capture('video_progress_tracked', {
                user_id: userId,
                playback_position_seconds: currentTime,
            });
            lastTracked = currentTime;
        }
    };

    return <video src={src} onTimeUpdate={handleTimeUpdate} controls />;
}
```

### Result
- Tracking calls drop from ~60/minute (unthrottled) to ~12/minute (5-second intervals)
- No `[Posthog error]: ... rate limiting` messages in console
- Video telemetry still captured at meaningful granularity

---

## What we told the customer

> The rate limit is a safety mechanism in `posthog-js` and can’t be increased or removed. The fix is to throttle on your side — track video progress every few seconds instead of every frame. This keeps you well under the limit while still capturing meaningful playback telemetry.

---

## Internal notes

- Customer was firing capture inside `onTimeUpdate` without any debounce/throttle.
- 5-second interval is a starting point; they can tune based on their UX requirements.
- Backend rate limiting (`/api/v1/checkout`, `/api/v1/tickets/route` in HogDesk Lite) uses the same principle — 60 requests per user per minute, returning 429 when exceeded.

---

## Related

Repo: https://github.com/rmuia09/posthog-demo  
Frontend: `frontend/src/components/VideoPlayer.jsx`  
Backend rate limiting: `backend/main.py`  
Playwright test: `frontend/tests/hogdesk.spec.ts` → "Problem 2"
