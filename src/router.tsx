import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import DashboardLayout from './pages/dashboard/_layout'

// El callback de Keycloak es lazy: en modo dev ni siquiera se descarga.
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const MapPage = lazy(() => import('./pages/dashboard/MapPage'))
const ChatPage = lazy(() => import('./pages/dashboard/ChatPage'))
const CamerasPage = lazy(() => import('./pages/dashboard/CamerasPage'))
const TelemetryPage = lazy(() => import('./pages/dashboard/TelemetryPage'))
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'))

export const router = createBrowserRouter([
  { path: '/', element: <Login /> },
  {
    path: '/auth/callback',
    element: (
      <Suspense fallback={null}>
        <AuthCallback />
      </Suspense>
    ),
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard/map" replace /> },
      { path: 'map', element: <MapPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'cameras', element: <CamerasPage /> },
      { path: 'telemetry', element: <TelemetryPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
