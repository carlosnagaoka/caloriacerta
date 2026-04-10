import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import OnboardingWizard from './OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, onboarding_completo')
    .eq('id', user.id)
    .single()

  // Se já completou onboarding, vai pro dashboard
  if (profile?.onboarding_completo) {
    redirect('/app/dashboard')
  }

  return (
    <OnboardingWizard
      userId={user.id}
      initialName={profile?.name || ''}
    />
  )
}
