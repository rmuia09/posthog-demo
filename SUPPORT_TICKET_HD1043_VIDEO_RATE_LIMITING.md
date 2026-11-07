# Practice Ticket HD-1043 — Video Player Client Rate Limiting

*Practice ticket written from a sample question, not a real customer.*

**Status:** Practice  
**Priority:** High  
**Type:** SDK / Client Instrumentation  
**Assigned to:** R. Muia  
**Created:** 2026-11-07

---

## Customer message

Hi,

We’re integrating PostHog with a custom web video player and seeing this error in the browser console:

`[Posthog error]: This capture call is ignored due to client rate limiting.`

We’re tracking video progress inside an `onTimeUpdate` loop. What is the client-side rate limit, and can we increase or bypass it so we don’t miss telemetry?

Thanks

---

## What I checked

**Rate limit config:** `posthog-js` has a `rate_limiting` option. It defaults to 10 events per second with a burst allowance of 10× that (100 events). It is configurable — you can raise it in `posthog.init()`. So the limit *can* be changed, but raising it is usually the wrong first move because it exists to protect the user's browser and network from event floods.

**onTimeUpdate frequency:** `onTimeUpdate` typically fires around 4 times per second (≈240 events/minute for one video). A single video playing normally would not necessarily hit a 10-per-second limit on its own. If the customer is actually seeing the error, something else is likely firing capture calls too — I'd ask them to share console logs and check for other capture sites before telling them to raise the limit.

**What I did not do:** I did not reproduce the error myself, because a single video's `onTimeUpdate` at ~4Hz shouldn't breach a 10/sec limit. I also did not measure the exact burst window behavior of the SDK.

---

## Solution

### Recommended: throttle client-side

Track progress every few seconds instead of every frame. Use `useRef` so the throttle survives React re-renders:

```javascript
import { useRef } from 'react'
import posthog from 'posthog-js'

export function VideoPlayer({ src, userId }) {
    const lastTracked = useRef(0)

    const handleTimeUpdate = (event) => {
        const now = Date.now()

        // Time-based throttle: capture if at least 5 seconds have passed
        // since the last event. This survives seeks and re-renders better
        // than a modulo check on playback position.
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
```

This keeps call volume well under the default 10/sec limit while still capturing meaningful playback milestones, and it handles seeks gracefully since it's based on wall-clock time rather than playback position.

### Alternative: raise the limit

If throttling genuinely isn't enough, you can increase the limit in `posthog.init()`:

```javascript
posthog.init('YOUR_API_KEY', {
    rate_limiting: {
        events_per_second: 20,
        events_burst_limit: 200,
    },
})
```

I set both values explicitly because `rate_limiting` is an object, not a number. Only do this after confirming you actually need more than 10 events/sec, and understand you're opting out of a safety guardrail.

---

## Reply to customer

Hey,

The rate limit in posthog-js defaults to 10 capture calls per second (with a burst of 10x that). It's configurable, but I'd suggest throttling on your side first rather than raising it — the limit exists to protect your users' browsers from event floods.

Since `onTimeUpdate` only fires about 4 times per second, a single video shouldn't normally hit the limit. If you're seeing the error, something else is probably firing capture calls too. Can you share what else is tracking on that page?

In the meantime, here's a throttled version of your video player that logs progress at most once every 5 seconds:

[code]

Let me know if that helps or if you want to discuss raising the limit.

---

## Notes

- I did not reproduce the error locally because one video at ~4Hz shouldn't breach 10/sec.
- Backend rate limiting in HogDesk Lite (`/api/v1/checkout`, `/api/v1/tickets/route`) uses the same principle — 60 requests per user per minute, returning 429 when exceeded.

---

## Related

Repo: https://github.com/rmuia09/posthog-demo  
Frontend: `frontend/src/components/VideoPlayer.jsx`
