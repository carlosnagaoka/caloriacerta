import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import MealForm from '@/components/MealForm'

export default async function RefeicaoPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="p-8 max-w-2xl mx-auto bg-white min-h-screen text-gray-900">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Registrar Refeição</h1>
        <p className="text-gray-600">Adicione os alimentos e a foto do seu prato</p>
      </header>

      <MealForm userId={user.id} />
    </main>
  )
}