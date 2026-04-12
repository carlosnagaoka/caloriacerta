import { createClient } from '@/lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import PerfilClient from './PerfilClient'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: subscription },
    { count: totalRefeicoes },
    { data: weightLogs },
  ] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabaseAdmin
      .from('subscriptions')
      .select('*, plans(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from('meals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabaseAdmin
      .from('weight_logs')
      .select('weight_kg, logged_at')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(1),
  ])

  const pesoAtual = weightLogs?.[0]?.weight_kg ?? profile?.weight_kg ?? null

  return (
    <PerfilClient
      profile={profile}
      email={user.email || ''}
      subscription={subscription}
      totalRefeicoes={totalRefeicoes || 0}
      pesoAtual={pesoAtual}
    />
  )
}
