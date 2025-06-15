import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import DebugApp from './debug'
import './index.css'

// Use DebugApp for testing
const USE_DEBUG = window.location.search.includes('debug');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {USE_DEBUG ? <DebugApp /> : <App />}
  </React.StrictMode>,
)