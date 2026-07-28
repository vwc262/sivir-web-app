import { Suspense } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuthStore } from '@/shared'

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
    </div>
  )
}

export default function DashboardLayout() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/" replace />

  return (
    <div className="flex h-full flex-col md:flex-row">
      <Sidebar />
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  )
}
