import Topbar from '@/components/Topbar'
export default function Page() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Configuración" />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🚧</div>
          <h2 className="text-xl font-semibold text-carbon mb-2">Configuración</h2>
          <p className="text-sm text-gris mb-6">Perfil, establecimiento, usuarios y ajustes</p>
          <p className="text-xs text-gris bg-ambar-s border border-ambar px-4 py-2 rounded-xl inline-block">
            Módulo en construcción — próximamente disponible
          </p>
        </div>
      </div>
    </div>
  )
}
