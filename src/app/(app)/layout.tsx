import Sidebar from '@/components/Sidebar'
import OnboardingGuard from '@/components/OnboardingGuard'
import ToasterProvider from '@/components/ToasterProvider'
import { EstablecimientoProvider } from '@/context/EstablecimientoProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-tierra">
      <ToasterProvider />
      <EstablecimientoProvider>
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <OnboardingGuard>
            {children}
          </OnboardingGuard>
        </main>
      </EstablecimientoProvider>
    </div>
  )
}
