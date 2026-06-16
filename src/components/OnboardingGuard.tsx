'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { loading, needsOnboarding } = useEstablecimiento()

  useEffect(() => {
    if (!loading && needsOnboarding) {
      router.replace('/onboarding')
    }
  }, [loading, needsOnboarding, router])

  if (loading || needsOnboarding) return null

  return <>{children}</>
}
