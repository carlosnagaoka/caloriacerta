'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { registrarAgua } from '@/app/app/agua/actions'

interface Props {
  userId: string
  date: string
  initialMl: number
  metaMl?: number
}

const BOTOES = [
  { label: '☕ 150ml', ml: 150 },
  { label: '🥤 200ml', ml: 200 },
  { label: '🍶 350ml', ml: 350 },
  { label: '🍾 500ml', ml: 500 },
]

export default function WaterWidget({ userId, date, initialMl, metaMl = 2000 }: Props) {
  const [totalMl, setTotalMl] = useState(initialMl)
  const [pending, startTransition] = useTransition()

  const pct = Math.min(totalMl / metaMl, 1)
  const litros = (totalMl / 1000).toFixed(2).replace('.', ',')
  const meta = (metaMl / 1000).toFixed(1).replace('.', ',')
  const atingiu = totalMl >= metaMl

  // Cores conforme progresso
  const corBarra = atingiu
    ? 'bg-green-500'
    : pct >= 0.5
    ? 'bg-blue-500'
    : pct >= 0.25
    ? 'bg-blue-400'
    : 'bg-blue-300'

  const adicionar = (ml: number) => {
    const novo = Math.max(0, totalMl + ml)
    setTotalMl(novo)
    startTransition(async () => {
      await registrarAgua(userId, date, novo)
    })
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            💧 Água
          </p>
          <p className={`text-xl font-bold mt-0.5 ${atingiu ? 'text-green-600' : 'text-blue-600'}`}>
            {litros} L
            <span className="text-sm font-normal text-gray-400 ml-1">/ {meta} L</span>
          </p>
          {atingiu && (
            <p className="text-xs text-green-600 font-semibold mt-0.5">Meta atingida! 🎉</p>
          )}
        </div>

        {/* Anel de progresso compacto */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
            <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle
              cx="28" cy="28" r="22"
              fill="none"
              stroke={atingiu ? '#22c55e' : '#3b82f6'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct)}`}
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${corBarra}`}
          style={{ width: `${pct * 100}%` }}
          role="progressbar"
          aria-valuenow={totalMl}
          aria-valuemin={0}
          aria-valuemax={metaMl}
          aria-label={`${totalMl} ml de ${metaMl} ml`}
        />
      </div>

      {/* Botões de adição rápida */}
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {BOTOES.map(({ label, ml }) => (
          <button
            key={ml}
            onClick={() => adicionar(ml)}
            disabled={pending}
            className="flex flex-col items-center py-2 px-1 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-50 text-blue-700"
          >
            <span className="text-base leading-none">{label.split(' ')[0]}</span>
            <span className="text-xs font-semibold mt-0.5">{ml}ml</span>
          </button>
        ))}
      </div>

      {/* Botão desfazer */}
      {totalMl > 0 && (
        <button
          onClick={() => adicionar(-200)}
          disabled={pending}
          className="w-full text-xs text-gray-400 hover:text-red-400 transition-colors py-1 disabled:opacity-40"
        >
          ↩ desfazer 200ml
        </button>
      )}
    </div>
  )
}
