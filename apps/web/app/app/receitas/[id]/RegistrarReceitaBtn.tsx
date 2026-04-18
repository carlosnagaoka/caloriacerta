'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  receitaId: string
  titulo: string
  caloriasTotal: number
  proteina: number
  carbs: number
  gordura: number
}

const TIPOS_REFEICAO = [
  { key: 'almoco',        label: '☀️ Almoço' },
  { key: 'jantar',        label: '🌙 Jantar' },
  { key: 'cafe_da_manha', label: '🌅 Café da manhã' },
  { key: 'lanche',        label: '🍎 Lanche' },
]

export default function RegistrarReceitaBtn({
  receitaId, titulo, caloriasTotal, proteina, carbs, gordura,
}: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const handleRegistrar = async (tipoRefeicao: string) => {
    setLoading(true)
    setAberto(false)
    try {
      const res = await fetch('/api/receitas/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, tipoRefeicao, caloriasTotal, proteina, carbs, gordura }),
      })
      if (res.ok) {
        setSucesso(true)
        setTimeout(() => router.push('/app/dashboard'), 1500)
      }
    } catch {
      // erro silencioso — botão volta ao estado normal
    }
    setLoading(false)
  }

  if (sucesso) {
    return (
      <div className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl text-center shadow-lg">
        ✓ Refeição registrada! Redirecionando...
      </div>
    )
  }

  return (
    <>
      {/* Modal de seleção de tipo */}
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setAberto(false)}>
          <div
            className="w-full bg-white rounded-t-2xl p-5 shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900 mb-1">Registrar como...</h3>
            <p className="text-xs text-gray-400 mb-4">{caloriasTotal} kcal por porção</p>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_REFEICAO.map(tipo => (
                <button
                  key={tipo.key}
                  onClick={() => handleRegistrar(tipo.key)}
                  className="py-3 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl text-sm font-semibold text-gray-800 transition-all active:scale-95"
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setAberto(true)}
        disabled={loading}
        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg shadow-green-200 active:scale-95 transition-all disabled:opacity-60"
      >
        {loading ? 'Registrando...' : '+ Registrar como refeição'}
      </button>
    </>
  )
}
