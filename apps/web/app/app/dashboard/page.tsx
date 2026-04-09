import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const selectedDate = params.data || new Date().toISOString().split('T')[0]

  const [{ data: profile }, { data: subscription }, { data: meals }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase
      .from('subscriptions')
      .select('*, plans(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('meals')
      .select('*, meal_items(item_name, weight_grams, total_calories)')
      .eq('user_id', user.id)
      .eq('meal_date', selectedDate)
      .order('meal_time', { ascending: true }),
  ])

  const diasRestantes = subscription?.ends_at
    ? Math.ceil((new Date(subscription.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <DashboardClient
      profile={profile}
      subscription={subscription}
      diasRestantes={diasRestantes}
      meals={meals || []}
      selectedDate={selectedDate}
    />
  )
}
