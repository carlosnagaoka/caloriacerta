'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { criarPerfilCompleto } from './actions'
import { useRouter } from 'next/navigation'

export default function CadastroPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    sex: 'prefiro_nao_informar',
    age: '',
    weight: '',
    daily_calorie_goal: '2000',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDebugInfo('')

    console.log('[Browser] Iniciando cadastro...')

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    console.log('[Browser] Auth result:', { userId: authData.user?.id, error: authError })

    if (authError || !authData.user) {
      setError(authError?.message || 'Erro ao criar conta no autenticador')
      setLoading(false)
      return
    }

    // 2. Chamar server action
    console.log('[Browser] Chamando server action...')
    const result = await criarPerfilCompleto({
      userId: authData.user.id,
      name: formData.name,
      email: formData.email,
      sex: formData.sex,
      age: formData.age ? parseInt(formData.age) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      dailyCalorieGoal: parseInt(formData.daily_calorie_goal),
    })

    console.log('[Browser] Server action result:', result)

    if (!result.success) {
      setError(result.error || 'Erro desconhecido ao completar cadastro')
      setDebugInfo(`UserID: ${authData.user.id}`)
      setLoading(false)
      return
    }

    // 3. Sucesso!
    console.log('[Browser] Cadastro completo!')
    router.push('/app/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Crie sua conta
        </h1>
        <p className="text-center text-green-600 text-sm mb-6">
          🎉 10 dias grátis para testar todos os recursos!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              minLength={6}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Sexo</label>
              <select
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
                <option value="prefiro_nao_informar">Prefiro não informar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Idade</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                min="10"
                max="120"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Meta calorias/dia</label>
              <input
                type="number"
                value={formData.daily_calorie_goal}
                onChange={(e) => setFormData({ ...formData, daily_calorie_goal: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                min="800"
                max="5000"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700 text-sm font-medium">{error}</p>
              {debugInfo && (
                <p className="text-red-500 text-xs mt-1 font-mono">{debugInfo}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Começar meus 10 dias grátis'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Já tem conta?{' '}
          <a href="/login" className="text-green-600 hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </main>
  )
}
