import { MapView } from '@/components/map/MapView'
import { CasaDetailPanel, CasasSinUbicar } from '@/components/map/CasaDetailPanel'
import { useInventario } from '@/shared'

export default function MapPage() {
  const { casas } = useInventario()
  // Las casas sin coordenadas no se pueden dibujar; se avisa en vez de que el
  // operador crea que no existen.
  const sinUbicar = casas.filter((c) => c.lat === null || c.lng === null).length

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapView />
      <CasaDetailPanel />
      <CasasSinUbicar total={sinUbicar} />
    </div>
  )
}
