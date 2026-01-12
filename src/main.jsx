import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ReactGA from 'react-ga4'
import App from './App.jsx'
import DashboardWrapper from './components/dashboard/DashboardWrapper.jsx'
import './index.css'

// Initialize Google Analytics
ReactGA.initialize('G-HD3MDDDJDJ')

// Component to track page views
const AnalyticsTracker = ({ children }) => {
  const location = useLocation()
  
  React.useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname })
  }, [location])
  
  return children
}

console.log('Main.jsx loading')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AnalyticsTracker>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/dashboard" element={<DashboardWrapper />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnalyticsTracker>
    </BrowserRouter>
  </React.StrictMode>,
)