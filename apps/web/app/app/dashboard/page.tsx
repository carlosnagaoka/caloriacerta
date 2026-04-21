import { createClient } from '@/lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { computeBehaviorState } from '@/lib/behavior/behavioralEngine'
import { generateSmartMessage } from '@/lib/behavior/messageEngine'
import { detectPrimaryPattern } from '@/lib/behavior/patternEngine'
import { getWeeklyCorrection } from '@/lib/behavior/correctionEngine'
import { computeICScore } from '@/lib/behavior/icEngine'
import { checkMealHonesty } from '@/lib/behavior/honestyEngine'

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

  // Busca dados com admin (ignora RLS) — todos com maybeSingle para evitar crash em 0 rows
  const [
    { data: profile },
    { data: subscription },
    { data: meals },
    { data: weightLogs },
    { data: recentMeals },
    { data: mealHistory },
    { data: waterLog },
    { data: fastingSession },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*').eq('id', user.id).maybeSingle(),
    supabaseAdmin
      .from('subscriptions')
      .select('*, plans(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from('meals')
      .select('*, meal_items(item_name, weight_grams, total_calories, protein_grams, carbs_grams, fat_grams)')
      .eq('user_id', user.id)
      .eq('meal_date', selectedDate)
      .order('meal_time', { ascending: true }),
    supabaseAdmin
      .from('weight_logs')
      .select('logged_at, weight_kg')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(30),
    supabaseAdmin
      .from('meals')
      .select('meal_date')
      .eq('user_id', user.id)
      .order('meal_date', { ascending: false })
      .limit(60),
    supabaseAdmin
      .from('meals')
      .select('meal_date, meal_type, total_calories')
      .eq('user_id', user.id)
      .order('meal_date', { ascending: false })
      .limit(90),
    supabaseAdmin
      .from('water_logs')
      .select('total_ml')
      .eq('user_id', user.id)
      .eq('log_date', selectedDate)
      .maybeSingle(),
    supabaseAdmin
      .from('fasting_sessions')
      .select('id, plan, target_hours, started_at')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // Só redireciona pro onboarding se conta nova sem refeições
  const contaNova = profile?.onboarding_completo === false && (!meals || meals.length === 0)
  if (contaNova) {
    redirect('/onboarding')
  }

  const diasRestantes = subscription?.ends_at
    ? Math.ceil((new Date(subscription.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  const recentMealDates = (recentMeals ?? []).map((m: any) => m.meal_date as string)
  const mealRecords = (mealHistory ?? []) as { meal_date: string; meal_type: string; total_calories: number }[]

  // ── Engines com fallback — nunca deixar o dashboard quebrar por engine ─────
  let behaviorState: any
  let smartMessage: any
  let patternInsight: any
  let correction: any
  let icResult: any
  let honestyCheck: any

  try {
    behaviorState = computeBehaviorState(recentMealDates, profile?.ic_streak_days ?? 0, selectedDate)
  } catch (e) {
    console.error('[Dashboard] behaviorState error:', e)
    behaviorState = { consistencyPct: 0 }
  }

  try {
    smartMessage = generateSmartMessage(behaviorState, user.id)
  } catch (e) {
    console.error('[Dashboard] smartMessage error:', e)
    smartMessage = { title: '', body: '', emoji: '📊', type: 'neutral' }
  }

  try {
    patternInsight = detectPrimaryPattern(mealRecords, selectedDate)
  } catch (e) {
    console.error('[Dashboard] patternInsight error:', e)
    patternInsight = { type: 'none', message: '' }
  }

  try {
    correction = getWeeklyCorrection(patternInsight?.type ?? 'none', user.id)
  } catch (e) {
    console.error('[Dashboard] correction error:', e)
    correction = null
  }

  try {
    icResult = computeICScore(mealRecords, profile?.daily_calorie_goal ?? 2000, selectedDate)
  } catch (e) {
    console.error('[Dashboard] icResult error:', e)
    icResult = { score: 0, trend: 'stable', streakDays: 0 }
  }

  try {
    honestyCheck = checkMealHonesty(mealRecords, selectedDate)
  } catch (e) {
    console.error('[Dashboard] honestyCheck error:', e)
    honestyCheck = null
  }

  // Atualiza IC no perfil silenciosamente (fire-and-forget)
  if (icResult?.score !== undefined && icResult.score !== profile?.ic_score) {
    supabaseAdmin
      .from('users')
      .update({ ic_score: icResult.score })
      .eq('id', user.id)
      .then(() => {})
  }

  return (
    <DashboardClient
      profile={profile}
      subscription={subscription}
      diasRestantes={diasRestantes}
      meals={meals || []}
      selectedDate={selectedDate}
      weightLogs={weightLogs || []}
      smartMessage={smartMessage}
      behaviorConsistencyPct={behaviorState?.consistencyPct ?? 0}
      patternInsight={patternInsight}
      correction={correction}
      icResult={icResult}
      honestyCheck={honestyCheck}
      temPlano={!!(profile?.plano_nutricional)}
      waterMl={waterLog?.total_ml ?? 0}
      fastingSession={fastingSession ? {
        id: fastingSession.id,
        plan: fastingSession.plan,
        targetHours: fastingSession.target_hours,
        startedAt: fastingSession.started_at,
      } : null}
    />
  )
}
