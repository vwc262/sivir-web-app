import { VisibilityCard } from '@/components/settings/VisibilityCard'
import { OperatorCard } from '@/components/settings/OperatorCard'
import { SecurityCard } from '@/components/settings/SecurityCard'
import { AlertsCard } from '@/components/settings/AlertsCard'
import { MapProviderCard } from '@/components/settings/MapProviderCard'
import { APP_VERSION } from '@/shared'

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <h1 className="mb-5 text-lg font-semibold">Configuración</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <VisibilityCard />
          <SecurityCard />
          <OperatorCard />
          <AlertsCard />
          <div className="md:col-span-2">
            <MapProviderCard />
          </div>
        </div>
        <footer className="py-8 text-center text-xs text-text-muted">{APP_VERSION}</footer>
      </div>
    </div>
  )
}
