import { Suspense } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { AlertToast } from '@/components/alerts/AlertToast'
import { useHubConnection, useSession } from '@/shared'

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
    </div>
  )
}

export default function DashboardLayout() {
  const session = useSession()

  // Única conexión con el hub de toda la aplicación: montarla en dos sitios
  // duplicaría cada alerta.
  useHubConnection()

  if (!session) return <Navigate to="/" replace />

  return (
    <div className="flex h-full flex-col md:flex-row">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="relative min-h-0 flex-1 overflow-hidden">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <BottomNav />
      <AlertToast />
    </div>
  )
}
