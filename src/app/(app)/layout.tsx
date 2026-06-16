import Sidebar from '@/components/Sidebar'
import OnboardingGuard from '@/components/OnboardingGuard'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-tierra">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <OnboardingGuard>
          {children}
        </OnboardingGuard>
      </main>
    </div>
  )
}
