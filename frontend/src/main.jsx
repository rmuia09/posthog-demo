import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import posthog from 'posthog-js'

posthog.init(import.meta.env.VITE_POSTHOG_API_KEY || 'phc_demo_key', {
  api_host: 'https://us.i.posthog.com',
  loaded: (ph) => {
    if (ph.isFeatureEnabled('beta-video-player')) {
      console.log('Initializing experimental video player module.')
    }
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
