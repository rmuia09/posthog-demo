import { useState } from 'react'
import posthog from 'posthog-js'

const BACKEND_URL = 'http://localhost:8000'

export default function CheckoutScreen() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('user_' + Math.floor(Math.random() * 10000))

  const handleCheckout = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          currency: 'KES',
          amount: 1500,
          environment: 'production',
        }),
      })

      const data = await response.json()

      posthog.capture('checkout_completed', {
        user_id: userId,
        status: data.status,
        source: 'frontend_checkout_screen',
      })

      setStatus(data)
    } catch (error) {
      posthog.capture('checkout_failed', {
        user_id: userId,
        error: error.message,
        source: 'frontend_checkout_screen',
      })
      setStatus({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>Mock Client Checkout Screen</h2>
      <p style={styles.description}>
        Simulates a transactional checkout flow with PostHog event tracking and
        server-side rate-limit validation.
      </p>

      <form onSubmit={handleCheckout} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Currency</label>
          <select value="KES" style={styles.input}>
            <option value="KES">KES</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Amount</label>
          <input type="number" value="1500" readOnly style={styles.input} />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.submitButton, ...(loading && styles.disabledButton) }}
        >
          {loading ? 'Processing...' : 'Submit Payment'}
        </button>
      </form>

      {status && (
        <div style={styles.result}>
          <strong>Response:</strong> {JSON.stringify(status, null, 2)}
        </div>
      )}
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxWidth: 400,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#333',
  },
  input: {
    padding: '8px 10px',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: 14,
  },
  submitButton: {
    padding: '10px 16px',
    background: '#0066cc',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    cursor: 'pointer',
    fontWeight: 600,
  },
  disabledButton: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  result: {
    marginTop: 16,
    padding: 12,
    background: '#eef',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 12,
    whiteSpace: 'pre-wrap',
  },
}
