'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { excluirRefeicao } from '@/app/app/refeicao/actions'
import WeightWidget from '@/components/WeightWidget'
import ProjecaoCard from '@/components/ProjecaoCard'
import SmartMessageCard from '@/components/SmartMessageCard'
import CorrectionCard from '@/components/CorrectionCard'
import PatternInsightCard from '@/components/PatternInsightCard'
import type { SmartMessage } from '@/lib/behavior/messageEngine'
import type { PatternInsight } from '@/lib/behavior/patternEngine'
import type { Correction } from '@/lib/behavior/correctionEngine'
import type { ICResult } from '@/lib/behavior/icEngine'
import type { HonestyCheck } from '@/lib/behavior/honestyEngine'

const mealTypeLabel: Record<string, string> = {
  cafe_da_manha: 'Café da Manhã',
  almoco: 'Almoço',
  jantar: 'Jantar',
  lanche: 'Lanche',
  outro: 'Outro',
}

const mealTypeIcon: Record<string, string> = {
  cafe_da_manha: '🌅',
  almoco: '☀️',
  jantar: '🌙',
  lanche: '🍎',
  outro: '🍽️',
}

// ─── Calorie Ring (SVG donut) ─────────────────────────────────────────────────
function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const r = 56
  const circ = 2 * Math.PI * r
  const pct = Math.min(consumed / goal, 1)
  const dash = circ * pct
  const remaining = Math.max(goal - consumed, 0)
  const over = consumed > goal

  return (
    <div className="relative flex items-center justify-center">
      <svg width="152" height="152" className="-rotate-90">
        {/* track */}
        <circle cx="76" cy="76" r={r} fill="none" stroke="#f3f4f6" strokeWidth="12" />
        {/* progress */}
        <circle
          cx="76" cy="76" r={r}
          fill="none"
          stroke={over ? '#ef4444' : '#22c55e'}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{consumed}</span>
        <span className="text-xs text-gray-400">kcal</span>
        <span className={`text-xs font-medium mt-0.5 ${over ? 'text-red-500' : 'text-green-500'}`}>
          {over ? `+${consumed - goal} acima` : `${remaining} restam`}
        </span>
      </div>
    </div>
  )
}

// ─── Macro Bar ────────────────────────────────────────────────────────────────
function MacroBar({ label, value, max, color, unit = 'g' }: {
  label: string; value: number; max: number; color: string; unit?: string
}) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className="text-xs font-bold text-gray-700">{value}{unit}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardClient({
  profile,
  subscription,
  diasRestantes,
  meals,
  selectedDate,
  weightLogs,
  smartMessage,
  behaviorConsistencyPct,
}: {
  profile: any
  subscription: any
  diasRestantes: number
  meals: any[]
  selectedDate: string
  weightLogs: { logged_at: string; weight_kg: number }[]
  smartMessage: SmartMessage
  behaviorConsistencyPct: number
  patternInsight: PatternInsight
  correction: Correction
  icResult: ICResult
  honestyCheck: HonestyCheck | null
}) {
  const router = useRouter()
  // Data local do dispositivo (corrige fuso Japão UTC+9)
  const nowLocal = new Date()
  const today = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null)

  // Usa IC calculado pelo engine (mais preciso que o armazenado no perfil)
  const icScore = icResult.score

  const handleDelete = async (mealId: string) => {
    if (!confirm('Excluir esta refeição?')) return
    setDeletingId(mealId)
    await excluirRefeicao(mealId)
    router.refresh()
    setDeletingId(null)
  }

  const totalHoje = meals.reduce((sum, m) => sum + (m.total_calories || 0), 0)
  const meta = profile?.daily_calorie_goal || 2000

  // Macros estimate (if stored; else estimate from calories: 50% carb, 25% prot, 25% fat)
  const totalCarbs = meals.reduce((s, m) =>
    s + (m.meal_items || []).reduce((si: number, i: any) => si + (i.carbs_grams || Math.round((i.total_calories * 0.5) / 4)), 0), 0)
  const totalProt = meals.reduce((s, m) =>
    s + (m.meal_items || []).reduce((si: number, i: any) => si + (i.protein_grams || Math.round((i.total_calories * 0.25) / 4)), 0), 0)
  const totalFat = meals.reduce((s, m) =>
    s + (m.meal_items || []).reduce((si: number, i: any) => si + (i.fat_grams || Math.round((i.total_calories * 0.25) / 9)), 0), 0)

  // Macro targets (rough split)
  const carbMeta = Math.round((meta * 0.5) / 4)
  const protMeta = Math.round((meta * 0.25) / 4)
  const fatMeta = Math.round((meta * 0.25) / 9)

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
        weekday: 'long', day: '2-digit', month: '2-digit',
      })

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-5 pt-6 pb-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{saudacao},</p>
            <h1 className="text-xl font-bold text-gray-900">{profile?.name || 'Usuário'} 👋</h1>
          </div>
          <div className="flex items-center gap-3">
            {subscription?.status === 'trial' && diasRestantes > 0 && (
              <a href="/app/plano" className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium hover:bg-amber-200 transition-colors">
                Trial: {diasRestantes}d restantes
              </a>
            )}
            {subscription?.status === 'ativo' && (
              <a href="/app/plano" className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-colors">
                {subscription?.plans?.name || 'Premium'} ✓
              </a>
            )}
            <form action="/logout" method="post">
              <button type="submit" className="p-2 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {/* ── Banner trial expirando ─────────────────────────────────────────── */}
        {subscription?.status === 'trial' && diasRestantes <= 3 && diasRestantes > 0 && (
          <a href="/assinar" className="block bg-amber-500 text-white rounded-2xl px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">⚡ Seu trial vence em {diasRestantes} dia{diasRestantes > 1 ? 's' : ''}!</p>
                <p className="text-xs opacity-90 mt-0.5">Assine agora e não perca seu histórico</p>
              </div>
              <span className="bg-white text-amber-600 font-bold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
                Ver planos →
              </span>
            </div>
          </a>
        )}
        {subscription?.status === 'trial' && diasRestantes <= 0 && (
          <a href="/assinar" className="block bg-red-500 text-white rounded-2xl px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">🔒 Seu período gratuito expirou</p>
                <p className="text-xs opacity-90 mt-0.5">Assine para continuar usando o CaloriaCerta</p>
              </div>
              <span className="bg-white text-red-600 font-bold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
                Assinar →
              </span>
            </div>
          </a>
        )}

        {/* ── Date nav ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
          <button onClick={goToPrevDay} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 text-lg font-bold">
            ‹
          </button>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={e => handleDateChange(e.target.value)}
              className="text-sm border-none outline-none text-gray-700 bg-transparent"
            />
            <span className="text-sm font-semibold text-gray-700 capitalize hidden sm:block">{dateLabel}</span>
          </div>
          <button
            onClick={goToNextDay}
            disabled={isToday}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 text-lg font-bold disabled:opacity-30"
          >
            ›
          </button>
        </div>
        {!isToday && (
          <button onClick={() => handleDateChange(today)} className="text-xs text-green-600 hover:underline -mt-3 ml-1">
            Ir para hoje
          </button>
        )}

        {/* ── Smart Message (coração emocional do dashboard) ───────────────────
             Só aparece ao ver o dia de hoje — não faz sentido em datas passadas */}
        {isToday && (
          <SmartMessageCard
            message={smartMessage}
            consistencyPct={behaviorConsistencyPct}
          />
        )}

        {/* ── Calorie ring + macros ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-6">
            <CalorieRing consumed={totalHoje} goal={meta} />
            <div className="flex-1 space-y-3">
              <div className="text-center mb-3">
                <span className="text-xs text-gray-400">Meta: <strong className="text-gray-700">{meta} kcal</strong></span>
              </div>
              <MacroBar label="Carbs" value={totalCarbs} max={carbMeta} color="bg-amber-400" />
              <MacroBar label="Proteína" value={totalProt} max={protMeta} color="bg-blue-400" />
              <MacroBar label="Gordura" value={totalFat} max={fatMeta} color="bg-pink-400" />
            </div>
          </div>
        </div>

        {/* ── Missão da semana (CorrectionCard) ───────────────────────────────
             Abaixo do anel: uma correção, específica, acionável */}
        {isToday && <CorrectionCard correction={correction} />}

        {/* ── IC + Streak (reformulado) ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            {/* IC com interpretação */}
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Índice IC</p>
              <p className="text-3xl font-bold text-green-600">{icScore}</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">{icResult.label}</p>
            </div>
            {/* Streak */}
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Streak 🔥</p>
              <p className="text-3xl font-bold text-gray-900">
                {profile?.ic_streak_days || 0}
                <span className="text-base font-normal text-gray-400">d</span>
              </p>
            </div>
          </div>
          {/* Frase contextual do IC */}
          <p className="text-xs text-gray-400 text-center mt-3 pt-3 border-t border-gray-50 leading-relaxed">
            {icResult.labelDetail}
          </p>
        </div>

        {/* ── Padrão detectado (PatternInsightCard) ───────────────────────────
             Abaixo do IC: um padrão, positivo ou problemático */}
        {isToday && <PatternInsightCard pattern={patternInsight} />}

        {/* ── Peso diário (A) ─────────────────────────────────────────────────── */}
        {isToday && (
          <WeightWidget
            userId={profile?.id}
            pesoInicial={profile?.weight_kg || 70}
            pesoMeta={profile?.peso_alvo_kg ?? null}
            pesos={weightLogs}
            today={today}
          />
        )}

        {/* ── Projeção de peso (B + C) ────────────────────────────────────────── */}
        <ProjecaoCard profile={profile} pesos={weightLogs} />

        {/* ── Honesty nudge ────────────────────────────────────────────────────
             Pergunta leve, nunca acusação. Aparece apenas quando há incoerência */}
        {isToday && honestyCheck && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <span className="text-2xl flex-shrink-0">🤔</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">{honestyCheck.message}</p>
              {honestyCheck.detail && (
                <p className="text-xs text-amber-600 mt-1">{honestyCheck.detail}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Refeições ───────────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3 capitalize">
            Refeições — {dateLabel}
          </h2>

          {meals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <div className="text-4xl mb-3">🍽️</div>
              <p className="text-gray-500 font-medium">Nenhuma refeição registrada</p>
              <p className="text-gray-400 text-sm mt-1">Toque em + para adicionar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map((meal: any) => {
                const isExpanded = expandedMeal === meal.id
                return (
                  <div
                    key={meal.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    {/* Foto de capa */}
                    {meal.photo_path && (
                      <div className="relative">
                        <img
                          src={meal.photo_path}
                          alt="Foto da refeição"
                          className="w-full h-40 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-3 left-4 text-white">
                          <span className="text-lg font-bold">
                            {mealTypeIcon[meal.meal_type] || '🍽️'} {mealTypeLabel[meal.meal_type] || meal.meal_type}
                          </span>
                          <span className="ml-2 text-xs opacity-80">{meal.meal_time?.slice(0, 5)}</span>
                        </div>
                        <div className="absolute bottom-3 right-4 bg-white/90 text-green-700 font-bold text-sm px-2 py-0.5 rounded-full">
                          {meal.total_calories} kcal
                        </div>
                      </div>
                    )}

                    {/* Row sem foto */}
                    {!meal.photo_path && (
                      <div className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{mealTypeIcon[meal.meal_type] || '🍽️'}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{mealTypeLabel[meal.meal_type] || meal.meal_type}</p>
                            <p className="text-xs text-gray-400">{meal.meal_time?.slice(0, 5)}</p>
                          </div>
                        </div>
                        <span className="font-bold text-green-600">{meal.total_calories} kcal</span>
                      </div>
                    )}

                    {/* Expand / itens */}
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                      >
                        {isExpanded ? '▴ Ocultar' : '▾ Ver itens'} ({meal.meal_items?.length || 0})
                      </button>

                      {isExpanded && meal.meal_items && meal.meal_items.length > 0 && (
                        <ul className="mt-2 space-y-1.5 border-t border-gray-50 pt-2">
                          {meal.meal_items.map((item: any, i: number) => (
                            <li key={i} className="flex justify-between text-sm">
                              <span className="text-gray-700">{item.item_name} <span className="text-gray-400">({item.weight_grams}g)</span></span>
                              <span className="text-gray-500 font-medium">{item.total_calories} kcal</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => handleDelete(meal.id)}
                          disabled={deletingId === meal.id}
                          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
                        >
                          {deletingId === meal.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      <a
        href="/app/refeicao"
        className="fixed bottom-6 right-6 w-16 h-16 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-green-700 transition-colors z-50"
        title="Registrar refeição"
      >
        +
      </a>
    </main>
  )
}
