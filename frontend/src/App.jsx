import posthog from 'posthog-js'
import { useState } from 'react'
import CheckoutScreen from './components/CheckoutScreen'
import VideoPlayer from './components/VideoPlayer'

export default function App() {
  const [activeView, setActiveView] = useState('checkout')

  posthog.capture('page_viewed', {
    page: 'hogdesk_lite_dashboard',
    view: activeView,
  })

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>HogDesk Lite</h1>
        <p style={styles.subtitle}>
          Engineering Showcase &amp; Support Blueprint &mdash; PostHog TSE Portfolio
        </p>
      </header>

      <nav style={styles.nav}>
        <button
          onClick={() => {
            setActiveView('checkout')
            posthog.capture('nav_clicked', { section: 'checkout' })
          }}
          style={{
            ...styles.navButton,
            ...(activeView === 'checkout' ? styles.activeButton : {}),
          }}
        >
          Checkout Screen
        </button>
        <button
          onClick={() => {
            setActiveView('video')
            posthog.capture('nav_clicked', { section: 'video_player' })
          }}
          style={{
            ...styles.navButton,
            ...(activeView === 'video' ? styles.activeButton : {}),
          }}
        >
          Video Player
        </button>
      </nav>

      <main style={styles.main}>
        {activeView === 'checkout' ? <CheckoutScreen /> : <VideoPlayer />}
      </main>

      <footer style={styles.footer}>
        <p>
          Built with <b>React</b> + <b>posthog-js</b> &middot; Backend:
          <b>FastAPI</b> + <b>posthog-python</b> &middot; Analytics:
          <b>ClickHouse / SQL Insights</b>
        </p>
        <button
          onClick={() => {
            for (let i = 0; i < 100; i++) {
              posthog.capture('rate_limit_test', { i })
            }
            console.log('Fired 100 rapid capture calls')
          }}
          style={{ marginTop: 12, padding: '8px 16px', cursor: 'pointer' }}
        >
          Fire 100 rapid captures (test rate limit)
        </button>
      </footer>
    </div>
  )
}

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: 900,
    margin: '0 auto',
    padding: 24,
    color: '#1a1a1a',
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: '1px solid #e5e5e5',
  },
  title: {
    fontSize: 32,
    margin: 0,
    color: '#0066cc',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  nav: {
    display: 'flex',
    gap: 12,
    marginBottom: 32,
  },
  navButton: {
    padding: '10px 20px',
    border: '1px solid #ccc',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 14,
  },
  activeButton: {
    background: '#0066cc',
    color: '#fff',
    borderColor: '#0066cc',
  },
  main: {
    minHeight: 400,
  },
  footer: {
    marginTop: 48,
    paddingTop: 24,
    borderTop: '1px solid #e5e5e5',
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
}
