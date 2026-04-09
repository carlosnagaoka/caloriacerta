'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { excluirRefeicao } from '@/app/app/refeicao/actions'

const mealTypeLabel: Record<string, string> = {
  cafe_da_manha: 'Café da Manhã',
  almoco: 'Almoço',
  jantar: 'Jantar',
  lanche: 'Lanche',
  outro: 'Outro',
}

export default function DashboardClient({
  profile,
  subscription,
  diasRestantes,
  meals,
  selectedDate,
}: {
  profile: any
  subscription: any
  diasRestantes: number
  meals: any[]
  selectedDate: string
}) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (mealId: string) => {
    if (!confirm('Excluir esta refeição?')) return
    setDeletingId(mealId)
    await excluirRefeicao(mealId)
    router.refresh()
    setDeletingId(null)
  }

  const totalHoje = meals.reduce((sum, m) => sum + (m.total_calories || 0), 0)
  const meta = profile?.daily_calorie_goal || 2000

  const handleDateChange = (date: string) => {
    router.push(`/app/dashboard?data=${date}`)
  }

  const goToPrevDay = () => {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    handleDateChange(d.toISOString().split('T')[0])
  }

  const goToNextDay = () => {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    handleDateChange(d.toISOString().split('T')[0])
  }

  const isToday = selectedDate === today

  const dateLabel = isToday
    ? 'Hoje'
    : new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
      })

  return (
    <main className='p-8 max-w-4xl mx-auto'>
      <header className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>
          Olá, {profile?.name || 'Usuário'}!
        </h1>
        {subscription?.status === 'trial' && (
          <div className='mt-2 inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm'>
            Teste grátis: {diasRestantes} dias restantes
          </div>
        )}
      </header>

      {/* Seletor de data */}
      <div className='flex items-center gap-3 mb-6'>
        <button
          onClick={goToPrevDay}
          className='p-2 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600'
        >
          ‹
        </button>
        <div className='flex items-center gap-2'>
          <input
            type='date'
            value={selectedDate}
            max={today}
            onChange={(e) => handleDateChange(e.target.value)}
            className='px-3 py-1.5 border border-gray-300 rounded-md text-sm'
          />
          <span className='text-sm font-medium text-gray-700 capitalize'>{dateLabel}</span>
        </div>
        <button
          onClick={goToNextDay}
          disabled={isToday}
          className='p-2 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600 disabled:opacity-30'
        >
          ›
        </button>
        {!isToday && (
          <button
            onClick={() => handleDateChange(today)}
            className='text-sm text-green-600 hover:underline ml-2'
          >
            Ir para hoje
          </button>
        )}
      </div>

      {/* Cards de resumo */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <div className='p-6 bg-white border border-gray-200 rounded-lg shadow-sm'>
          <p className='text-sm text-gray-500'>Consumido {isToday ? 'hoje' : 'no dia'}</p>
          <p className='text-2xl font-bold text-gray-900'>{totalHoje} kcal</p>
          <p className='text-xs text-gray-400 mt-1'>Meta: {meta} kcal</p>
          <div className='mt-2 w-full bg-gray-100 rounded-full h-2'>
            <div
              className='bg-green-500 h-2 rounded-full transition-all'
              style={{ width: `${Math.min((totalHoje / meta) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className='p-6 bg-white border border-gray-200 rounded-lg shadow-sm'>
          <p className='text-sm text-gray-500'>Índice de Consistência</p>
          <p className='text-2xl font-bold text-green-600'>{profile?.ic_score || 0}</p>
        </div>

        <div className='p-6 bg-white border border-gray-200 rounded-lg shadow-sm'>
          <p className='text-sm text-gray-500'>Streak atual</p>
          <p className='text-2xl font-bold text-gray-900'>{profile?.ic_streak_days || 0} dias</p>
        </div>
      </div>

      {/* Refeições do dia */}
      <div className='mb-8'>
        <h2 className='text-lg font-semibold text-gray-800 mb-4'>
          Refeições — {dateLabel}
        </h2>

        {meals.length === 0 ? (
          <div className='p-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center text-gray-500'>
            Nenhuma refeição registrada neste dia.
          </div>
        ) : (
          <div className='space-y-3'>
            {meals.map((meal: any) => (
              <div key={meal.id} className='bg-white border border-gray-200 rounded-lg p-4'>
                <div className='flex gap-4'>
                  {meal.photo_path && (
                    <img
                      src={meal.photo_path}
                      alt='Foto da refeição'
                      className='w-24 h-24 object-cover rounded-lg flex-shrink-0'
                    />
                  )}
                  <div className='flex-1'>
                    <div className='flex justify-between items-start'>
                      <div>
                        <span className='font-medium text-gray-900'>
                          {mealTypeLabel[meal.meal_type] || meal.meal_type}
                        </span>
                        <span className='ml-2 text-sm text-gray-400'>{meal.meal_time?.slice(0, 5)}</span>
                      </div>
                      <div className='flex items-center gap-3'>
                        <span className='font-bold text-green-600'>{meal.total_calories} kcal</span>
                        <button
                          onClick={() => handleDelete(meal.id)}
                          disabled={deletingId === meal.id}
                          className='text-red-400 hover:text-red-600 text-sm disabled:opacity-50'
                          title='Excluir refeição'
                        >
                          {deletingId === meal.id ? '...' : 'Excluir'}
                        </button>
                      </div>
                    </div>

                    {meal.meal_items && meal.meal_items.length > 0 && (
                      <ul className='mt-2 space-y-1'>
                        {meal.meal_items.map((item: any, i: number) => (
                          <li key={i} className='text-sm text-gray-600 flex justify-between'>
                            <span>{item.item_name} ({item.weight_grams}g)</span>
                            <span className='text-gray-400'>{item.total_calories} kcal</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ações */}
      <div className='flex gap-4'>
        <a
          href='/app/refeicao'
          className='inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700'
        >
          + Registrar refeição
        </a>
        <form action='/logout' method='post'>
          <button
            type='submit'
            className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'
          >
            Sair
          </button>
        </form>
      </div>
    </main>
  )
}
