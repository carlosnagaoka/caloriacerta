'use client'

import { useEffect, useState } from 'react'
import { registrarTrigger } from '@/app/app/refeicao/actions'

interface MealTriggerModalProps {
  mealId: string
  totalCalories: number
  onClose: () => void
}

const TRIGGERS = [
  { id: 'fome_real',      label: 'Fome de verdade',  icon: '🍽️',  desc: 'Estômago pedindo' },
  { id: 'fome_moderada',  label: 'Um pouco de fome', icon: '😋',  desc: 'Leve vontade de comer' },
  { id: 'ansiedade',      label: 'Ansiedade',        icon: '😰',  desc: 'Tensão, preocupação' },
  { id: 'habito',         label: 'Hábito',           icon: '🔄',  desc: 'Hora de comer, automático' },
  { id: 'social',         label: 'Social',           icon: '👥',  desc: 'Todos estavam comendo' },
  { id: 'recompensa',     label: 'Recompensa',       icon: '🎉',  desc: 'Mereci, quero celebrar' },
  { id: 'nao_sei',        label: 'Não sei',          icon: '🤷',  desc: 'Sem motivo claro' },
] as const

const AUTO_SKIP_SECONDS = 10

export default function MealTriggerModal({ mealId, totalCalories, onClose }: MealTriggerModalProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [countdown, setCountdown] = useState(AUTO_SKIP_SECONDS)

  // Contagem regressiva — pula automaticamente
  useEffect(() => {
    if (selected !== null) return // pausa se selecionado
    if (countdown <= 0) { onClose(); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, selected, onClose])

  const handleSelect = async (triggerId: string) => {
    setSelected(triggerId)
    setSaving(true)
    await registrarTrigger(mealId, triggerId)
    setSaving(false)
    // Fecha após breve confirmação
    setTimeout(onClose, 600)
  }

  const handleSkip = () => {
    registrarTrigger(mealId, 'pulado') // registra que pulou — ainda é dado útil
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-2xl px-5 pt-6 pb-8 shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Refeição salva · {totalCalories} kcal ✓
            </p>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">
              O que te fez comer agora?
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Isso ajuda a identificar padrões reais no seu comportamento.
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 text-sm mt-1 flex-shrink-0 ml-4"
          >
            Pular
            {selected === null && (
              <span className="ml-1 text-gray-300">({countdown})</span>
            )}
          </button>
        </div>

        {/* Grid de opções */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {TRIGGERS.map((t) => {
            const isSelected = selected === t.id
            return (
              <button
                key={t.id}
                type="button"
                disabled={saving}
                onClick={() => handleSelect(t.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-300'
                    : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50'
                } disabled:opacity-60`}
              >
                <span className="text-2xl leading-none">{t.icon}</span>
                <div>
                  <p className={`text-sm font-semibold leading-tight ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>
                    {t.label}
                  </p>
                  <p className="text-xs text-gray-400 leading-tight mt-0.5">{t.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Barra de progresso do countdown */}
        {selected === null && (
          <div className="mt-5 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-300 rounded-full transition-all duration-1000"
              style={{ width: `${(countdown / AUTO_SKIP_SECONDS) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
