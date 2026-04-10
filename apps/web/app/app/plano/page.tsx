import { createClient } from '@/lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import PlanoClient from './PlanoClient'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function PlanoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: subscription },
    { count: totalRefeicoes },
    { data: weightLogs },
  ] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('*, plano_nutricional, plano_atividades, notas_nutricionista, plano_gerado_em')
      .eq('id', user.id)
      .single(),
    supabaseAdmin
      .from('subscriptions')
      .select('*, plans(name, slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabaseAdmin
      .from('meals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabaseAdmin
      .from('weight_logs')
      .select('logged_at, weight_kg')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(30),
  ])

  // Dias desde a primeira assinatura
  const diasUsando = subscription?.starts_at
    ? Math.max(
        1,
        Math.ceil(
          (Date.now() - new Date(subscription.starts_at).getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 1

  const diasRestantes = subscription?.ends_at
    ? Math.ceil(
        (new Date(subscription.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : 0

  // Progresso de peso (primeiro peso logado vs mais recente)
  const progressoPeso =
    weightLogs && weightLogs.length >= 2
      ? Math.round(
          (weightLogs[weightLogs.length - 1].weight_kg - weightLogs[0].weight_kg) * 10
        ) / 10
      : null

  return (
    <PlanoClient
      profile={profile}
      subscription={subscription}
      diasUsando={diasUsando}
      diasRestantes={diasRestantes}
      totalRefeicoes={totalRefeicoes || 0}
      progressoPeso={progressoPeso}
      userId={user.id}
      planoNutricional={profile?.plano_nutricional ?? null}
      planoAtividades={profile?.plano_atividades ?? null}
      notasNutricionista={profile?.notas_nutricionista ?? null}
      planoGeradoEm={profile?.plano_gerado_em ?? null}
    />
  )
}
