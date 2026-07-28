import { MapView } from '@/components/map/MapView'
import { UnitDetailPanel } from '@/components/map/UnitDetailPanel'

export default function MapPage() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapView />
      <UnitDetailPanel />
    </div>
  )
}
