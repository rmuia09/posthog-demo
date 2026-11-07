import { useState, useEffect } from 'react'
import posthog from 'posthog-js'

const BACKEND_URL = 'http://localhost:8000'

export default function VideoPlayer({ src, userId }) {
  const [position, setPosition] = useState(0)
  const [trackedPositions, setTrackedPositions] = useState(new Set())
  const [isPlaying, setIsPlaying] = useState(false)
  const [lastTracked, setLastTracked] = useState(0)

  const videoRef = null

  const handleTimeUpdate = (event) => {
    const currentTime = Math.floor(event.target.currentTime)
    setPosition(currentTime)

    // Throttle tracking: log progress every 5 seconds rather than every millisecond
    // This prevents the "[Posthog error]: This capture call is ignored due to client rate limiting."
    if (currentTime % 5 === 0 && currentTime !== lastTracked) {
      setTrackedPositions((prev) => new Set([...prev, currentTime]))
      setLastTracked(currentTime)

      posthog.capture('video_progress_tracked', {
        user_id: userId || 'anonymous',
        playback_position_seconds: currentTime,
        source: 'video_player_module',
      })
    }
  }

  const handlePlay = () => {
    setIsPlaying(true)
    posthog.capture('video_played', {
      user_id: userId || 'anonymous',
      source: 'video_player_module',
    })
  }

  const handlePause = () => {
    setIsPlaying(false)
    posthog.capture('video_paused', {
      user_id: userId || 'anonymous',
      source: 'video_player_module',
    })
  }

  const handleEnded = () => {
    posthog.capture('video_completed', {
      user_id: userId || 'anonymous',
      source: 'video_player_module',
    })
  }

  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>Interactive Video Module</h2>
      <p style={styles.description}>
        Demonstrates client-side throttling of tracking calls to avoid PostHog
        JS SDK rate limiting inside an <code>onTimeUpdate</code> loop.
      </p>

      <div style={styles.playerContainer}>
        <video
          src={src || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          controls
          style={styles.video}
        />
        <div style={styles.overlay}>
          <div style={styles.statusRow}>
            <span style={styles.label}>Position:</span>
            <span style={styles.value}>{position}s</span>
          </div>
          <div style={styles.statusRow}>
            <span style={styles.label}>Tracked events:</span>
            <span style={styles.value}>{trackedPositions.size}</span>
          </div>
          <div style={styles.statusRow}>
            <span style={styles.label}>State:</span>
            <span style={styles.value}>{isPlaying ? 'Playing' : 'Paused'}</span>
          </div>
        </div>
      </div>

      <p style={styles.note}>
        Tracking fires every 5 seconds (not per frame), keeping the call volume
        well under the posthog-js client rate limit.
      </p>
    </section>
  )
}

const styles = {
  section: {
    marginBottom: 40,
    padding: 24,
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    background: '#fafafa',
  },
  h2: {
    marginTop: 0,
    fontSize: 20,
    color: '#0066cc',
  },
  description: {
    color: '#555',
    marginBottom: 16,
    fontSize: 14,
  },
  playerContainer: {
    position: 'relative',
    maxWidth: 720,
    marginBottom: 12,
  },
  video: {
    width: '100%',
    height: 'auto',
    borderRadius: 6,
    background: '#000',
  },
  overlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    background: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    padding: 10,
    borderRadius: 6,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    opacity: 0.8,
  },
  value: {
    fontWeight: 700,
  },
  note: {
    color: '#666',
    fontSize: 13,
  },
}
