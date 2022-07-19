import { Routes, Route, Navigate } from 'react-router-dom'
import App from './App'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/app" element={<App />} />
      <Route path="/app/log" element={<App isShowingLog />} />
    </Routes>
  )
}
