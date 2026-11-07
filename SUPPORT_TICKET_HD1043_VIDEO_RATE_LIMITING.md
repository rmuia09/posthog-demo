# Ticket HD-1043 — Video Player Rate Limiting

Practice ticket. Not a real customer.

Issue: Browser console shows [Posthog error]: This capture call is ignored due to client rate limiting. when tracking video progress inside onTimeUpdate.

Checked:
- posthog-js has a rate_limiting option. Default: 10 events/sec with burst allowance. Configurable via posthog.init().
- onTimeUpdate firing rate: not measured. Browser-dependent. A single video may not hit 10/sec on its own.
- Reproduction: not done. Added a test button that fires 100 rapid capture calls (http://localhost:5173), but did not click it to check for the error.

Solution: Throttle client-side.

import { useRef } from 'react'
import posthog from 'posthog-js'

export function VideoPlayer({ src, userId }) {
    const lastTracked = useRef(0)
    const handleTimeUpdate = (event) => {
        const now = Date.now()
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

This keeps calls well under 10/sec and handles seeks since it uses wall-clock time, not playback position.

Alternative: raise the limit in posthog.init():

posthog.init('YOUR_API_KEY', {
    rate_limiting: {
        events_per_second: 20,
        events_burst_limit: 200,
    },
})

rate_limiting is an object, not a number. Set both values explicitly. Only raise the limit after confirming throttling isn't enough — it's a safety guardrail.

To reproduce manually: Run frontend (npm run dev), open browser console, click "Fire 100 rapid captures", watch for [Posthog error]: This capture call is ignored due to client rate limiting.

Repo: https://github.com/rmuia09/posthog-demo
Frontend: frontend/src/components/VideoPlayer.jsx
