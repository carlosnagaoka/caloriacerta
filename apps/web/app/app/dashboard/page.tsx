import { createClient } from '@/lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

// Admin client ignora RLS — necessário pois meals são salvas com service role
const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>
}) {
  // Auth ainda via cliente do usuário (para verificar sessão)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const selectedDate = params.data || new Date().toISOString().split('T')[0]

  // Busca dados com admin (ignora RLS)
  const [{ data: profile }, { data: subscription }, { data: meals }] = await Promise.all([
    supabaseAdmin.from('users').select('*').eq('id', user.id).single(),
    supabaseAdmin
      .from('subscriptions')
      .select('*, plans(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabaseAdmin
      .from('meals')
      .select('*, meal_items(item_name, weight_grams, total_calories, carbs_grams, protein_grams, fat_grams)')
      .eq('user_id', user.id)
      .eq('meal_date', selectedDate)
      .order('meal_time', { ascending: true }),
  ])

  // Só redireciona pro onboarding se conta nova sem refeições
  const contaNova = profile?.onboarding_completo === false && (!meals || meals.length === 0)
  if (contaNova) {
    redirect('/onboarding')
  }

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
