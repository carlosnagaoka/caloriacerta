import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar dados do usuário
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Buscar assinatura
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plans(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Calcular dias restantes do trial
  const diasRestantes = subscription?.ends_at
    ? Math.ceil((new Date(subscription.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Olá, {profile?.name || 'Usuário'}! 👋
        </h1>

        {subscription?.status === 'trial' && (
          <div className="mt-2 inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            🎉 Teste grátis: {diasRestantes} dias restantes
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Meta diária</p>
          <p className="text-2xl font-bold text-gray-900">
            {profile?.daily_calorie_goal || 2000} kcal
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Índice de Consistência</p>
          <p className="text-2xl font-bold text-green-600">
            {profile?.ic_score || 0}
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Streak atual</p>
          <p className="text-2xl font-bold text-gray-900">
            {profile?.ic_streak_days || 0} dias
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <a
          href="/app/refeicao"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          + Registrar refeição
        </a>

        <form action="/logout" method="post">
          <button
            type="submit"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Sair
          </button>
        </form>
      </div>
    </main>
  )
}