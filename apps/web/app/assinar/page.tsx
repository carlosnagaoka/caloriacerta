'use client'

import { useState } from 'react'
import { criarCheckoutSession } from './actions'
import type { Moeda, Periodo } from '@/lib/stripe'

const PLANOS = {
  basico: {
    nome: 'Básico',
    emoji: '⭐',
    cor: 'border-gray-200',
    corBotao: 'bg-gray-800 hover:bg-gray-900',
    corDestaque: 'text-gray-700',
    recursos: [
      '✅ Registro manual de refeições',
      '✅ Scanner de código de barras',
      '✅ Histórico completo',
      '✅ Dashboard com macros',
      '✅ IC Score + Streak',
      '✅ Onboarding personalizado',
      '❌ Identificação por foto (IA)',
      '❌ Relatórios semanais',
    ],
    precos: {
      jpy: { mensal: '¥490', anual: '¥3.900', economia: '¥1.980' },
      brl: { mensal: 'R$14,90', anual: 'R$119', economia: 'R$59,80' },
    },
  },
  premium: {
    nome: 'Premium',
    emoji: '💎',
    cor: 'border-green-500',
    corBotao: 'bg-green-600 hover:bg-green-700',
    corDestaque: 'text-green-600',
    recursos: [
      '✅ Tudo do Básico',
      '✅ Identificação por foto com IA',
      '✅ Análise ilimitada de fotos',
      '✅ Scanner de produtos japoneses',
      '✅ Relatórios semanais',
      '✅ Exportar dados (CSV)',
      '✅ Suporte prioritário',
      '✅ Novos recursos em primeira mão',
    ],
    precos: {
      jpy: { mensal: '¥980', anual: '¥7.800', economia: '¥3.960' },
      brl: { mensal: 'R$29,90', anual: 'R$239', economia: 'R$119,80' },
    },
  },
}

export default function AssinarPage() {
  const [moeda, setMoeda] = useState<Moeda>('brl')
  const [periodo, setPeriodo] = useState<Periodo>('mensal')
  const [loading, setLoading] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  const handleAssinar = async (plano: 'basico' | 'premium') => {
    setLoading(plano)
    setErro('')
    try {
      const result = await criarCheckoutSession(plano, moeda, periodo)
      if (result.url) {
        window.location.href = result.url
      } else {
        setErro(result.error || 'Erro ao iniciar pagamento. Tente novamente.')
        setLoading(null)
      }
    } catch (err: any) {
      console.error('[Checkout] Client error:', err)
      // Mostra o erro real em vez de mensagem genérica
      const msg = err?.message || err?.toString() || 'Erro desconhecido'
      setErro(`Erro: ${msg}`)
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Escolha seu plano
          </h1>
          <p className="text-gray-500 text-lg">
            Cancele quando quiser. Sem fidelidade.
          </p>
        </div>

        {/* Toggles */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          {/* Moeda */}
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setMoeda('brl')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                moeda === 'brl' ? 'bg-green-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🇧🇷 BRL
            </button>
            <button
              onClick={() => setMoeda('jpy')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                moeda === 'jpy' ? 'bg-green-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🇯🇵 JPY
            </button>
          </div>

          {/* Período */}
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setPeriodo('mensal')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                periodo === 'mensal' ? 'bg-green-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriodo('anual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                periodo === 'anual' ? 'bg-green-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Anual
              <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                -33%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {(Object.entries(PLANOS) as [keyof typeof PLANOS, typeof PLANOS.basico][]).map(([key, plano]) => {
            const preco = plano.precos[moeda]
            const valorExibido = periodo === 'anual' ? preco.anual : preco.mensal

            return (
              <div
                key={key}
                className={`bg-white rounded-2xl border-2 ${plano.cor} p-6 shadow-sm relative`}
              >
                {key === 'premium' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MAIS POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <div className="text-3xl mb-2">{plano.emoji}</div>
                  <h2 className="text-xl font-bold text-gray-900">{plano.nome}</h2>

                  <div className="mt-4">
                    <span className={`text-4xl font-bold ${plano.corDestaque}`}>
                      {valorExibido}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">
                      /{periodo === 'anual' ? 'ano' : 'mês'}
                    </span>
                  </div>

                  {periodo === 'anual' && (
                    <p className="text-green-600 text-sm font-medium mt-1">
                      Você economiza {preco.economia}/ano
                    </p>
                  )}
                  {periodo === 'mensal' && (
                    <p className="text-gray-400 text-xs mt-1">
                      ou {preco.anual}/ano (33% off)
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {plano.recursos.map((r, i) => (
                    <li key={i} className="text-sm text-gray-700">{r}</li>
                  ))}
                </ul>

                <button
                  onClick={() => handleAssinar(key)}
                  disabled={loading === key}
                  className={`w-full py-3.5 rounded-xl text-white font-bold transition-all ${plano.corBotao} disabled:opacity-60`}
                >
                  {loading === key ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Redirecionando...
                    </span>
                  ) : (
                    `Assinar ${plano.nome}`
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Erro */}
        {erro && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
            ⚠️ {erro}
          </div>
        )}

        {/* Garantias */}
        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl mb-1">🔒</div>
            <p className="text-xs text-gray-500">Pagamento seguro via Stripe</p>
          </div>
          <div>
            <div className="text-2xl mb-1">❌</div>
            <p className="text-xs text-gray-500">Cancele quando quiser</p>
          </div>
          <div>
            <div className="text-2xl mb-1">💳</div>
            <p className="text-xs text-gray-500">Cartão de crédito{moeda === 'brl' ? ' ou boleto' : ''}</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Dúvidas? Fale conosco pelo{' '}
          <a href="https://wa.me/819098992686" className="text-green-600 hover:underline">
            WhatsApp
          </a>
        </p>
      </div>
    </main>
  )
}
