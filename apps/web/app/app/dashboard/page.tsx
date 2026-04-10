import { createClient } from '@/lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { computeBehaviorState } from '@/lib/behavior/behavioralEngine'
import { generateSmartMessage } from '@/lib/behavior/messageEngine'

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
  // Se não vier data na URL, usa hoje em UTC (o client envia a data local via URL quando navega)
  // A data padrão é só o fallback inicial — o DashboardClient já redireciona com ?data=YYYY-MM-DD local
  const selectedDate = params.data || new Date().toISOString().split('T')[0]

  // Busca dados com admin (ignora RLS)
  const [
    { data: profile },
    { data: subscription },
    { data: meals },
    { data: weightLogs },
    { data: recentMeals },
  ] = await Promise.all([
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
      .select('*, meal_items(item_name, weight_grams, total_calories)')
      .eq('user_id', user.id)
      .eq('meal_date', selectedDate)
      .order('meal_time', { ascending: true }),
    supabaseAdmin
      .from('weight_logs')
      .select('logged_at, weight_kg')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(30),
    // Últimos 30 dias de datas com registro — para BehavioralEngine
    supabaseAdmin
      .from('meals')
      .select('meal_date')
      .eq('user_id', user.id)
      .order('meal_date', { ascending: false })
      .limit(60),
  ])

  // Só redireciona pro onboarding se conta nova sem refeições
  const contaNova = profile?.onboarding_completo === false && (!meals || meals.length === 0)
  if (contaNova) {
    redirect('/onboarding')
  }

  const diasRestantes = subscription?.ends_at
    ? Math.ceil((new Date(subscription.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  // ── BehavioralEngine — roda server-side, zero round-trip ────────────────
  // "today" = selectedDate quando o usuário abriu o dashboard sem parâmetros
  // (o DashboardClient envia ?data=YYYY-MM-DD local, mas no first load usamos UTC)
  const recentMealDates = (recentMeals ?? []).map((m: any) => m.meal_date as string)
  const behaviorState = computeBehaviorState(
    recentMealDates,
    profile?.ic_streak_days ?? 0,
    selectedDate
  )
  const smartMessage = generateSmartMessage(behaviorState, user.id)

  return (
    <DashboardClient
      profile={profile}
      subscription={subscription}
      diasRestantes={diasRestantes}
      meals={meals || []}
      selectedDate={selectedDate}
      weightLogs={weightLogs || []}
      smartMessage={smartMessage}
      behaviorConsistencyPct={behaviorState.consistencyPct}
    />
  )
}
