'use client'

import { useState } from 'react'
import { registrarPeso } from '@/app/app/peso/actions'

interface WeightLog {
  logged_at: string
  weight_kg: number
}

interface Props {
  userId: string
  pesoInicial: number
  pesoMeta: number | null
  pesos: WeightLog[]
  today: string
}

export default function WeightWidget({ userId, pesoInicial, pesoMeta, pesos, today }: Props) {
  const pesoHoje = pesos.find(p => p.logged_at === today)?.weight_kg ?? null
  const pesoMaisRecente = pesos[0]?.weight_kg ?? pesoInicial

  const [valor, setValor] = useState(
    pesoHoje != null ? pesoHoje.toString() : pesoMaisRecente.toFixed(1)
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(pesoHoje != null)

  const handleSave = async () => {
    const kg = parseFloat(valor)
    if (!kg || kg < 20 || kg > 300) return
    setSaving(true)
    await registrarPeso(userId, kg, today)
    setSaving(false)
    setSaved(true)
  }

  // Sparkline: últimos 7 registros em ordem cronológica
  const spark7 = [...pesos].reverse().slice(-7)
  const sparkPath = (() => {
    if (spark7.length < 2) return null
    const W = 100
    const H = 32
    const weights = spark7.map(p => Number(p.weight_kg))
    const min = Math.min(...weights) - 0.3
    const max = Math.max(...weights) + 0.3
    const range = max - min || 1

    const pts = spark7.map((p, i) => {
      const x = (i / (spark7.length - 1)) * W
      const y = H - ((Number(p.weight_kg) - min) / range) * H
      return [x, y] as [number, number]
    })

    // Smooth bezier via control points
    let d = `M ${pts[0][0]},${pts[0][1]}`
    for (let i = 1; i < pts.length; i++) {
      const cp1x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) / 2
      const cp1y = pts[i - 1][1]
      const cp2x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) / 2
      const cp2y = pts[i][1]
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pts[i][0]},${pts[i][1]}`
    }
    return { d, pts }
  })()

  // Variação nos últimos dias disponíveis
  const delta =
    spark7.length >= 2
      ? Math.round((spark7[spark7.length - 1].weight_kg - spark7[0].weight_kg) * 10) / 10
      : null

  const pesoAtualKg = pesoHoje ?? pesoMaisRecente
  const faltamKg =
    pesoMeta != null ? Math.max(0, Math.round((pesoAtualKg - pesoMeta) * 10) / 10) : null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Peso</p>
          {delta !== null && (
            <p
              className={`text-xs font-semibold mt-0.5 ${
                delta < 0 ? 'text-green-500' : delta > 0 ? 'text-red-400' : 'text-gray-400'
              }`}
            >
              {delta < 0 ? '↓' : delta > 0 ? '↑' : '→'} {Math.abs(delta)} kg ({spark7.length - 1}d)
            </p>
          )}
          {faltamKg !== null && faltamKg > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              Faltam <strong className="text-gray-600">{faltamKg} kg</strong> para a meta
            </p>
          )}
          {faltamKg === 0 && (
            <p className="text-xs text-green-600 font-semibold mt-0.5">Meta atingida!</p>
          )}
        </div>

        {sparkPath && (
          <svg width="100" height="32" viewBox="0 0 100 32" className="opacity-60 mt-1">
            <path
              d={sparkPath.d}
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Ponto mais recente */}
            <circle
              cx={sparkPath.pts[sparkPath.pts.length - 1][0]}
              cy={sparkPath.pts[sparkPath.pts.length - 1][1]}
              r="3"
              fill="#16a34a"
            />
          </svg>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          value={valor}
          onChange={e => {
            setValor(e.target.value)
            setSaved(false)
          }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          step="0.1"
          min="20"
          max="300"
          className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-center text-gray-900 font-bold text-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <span className="text-sm text-gray-400 font-medium">kg</span>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
            saved
              ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
              : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
          }`}
        >
          {saving ? 'Salvando...' : saved ? '✓ Registrado hoje' : 'Registrar peso'}
        </button>
      </div>
    </div>
  )
}
