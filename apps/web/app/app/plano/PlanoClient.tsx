'use client'

import { useState } from 'react'
import { criarPortalSession } from './actions'

const RECURSOS = [
  {
    icon: '📸',
    titulo: 'A IA identifica o que você comeu',
    descricao:
      'Tire uma foto do prato. A IA reconhece os alimentos e estima as calorias automaticamente — sem você precisar saber nada de nutrição.',
  },
  {
    icon: '🏷️',
    titulo: 'Código de barras de produtos japoneses e brasileiros',
    descricao:
      'Escaneie qualquer embalagem. O sistema busca a tabela nutricional do produto e preenche tudo para você.',
  },
  {
    icon: '🤖',
    titulo: 'Estimativa de calorias para receitas caseiras',
    descricao:
      'Fez um pudim de banana, uma moqueca, um onigiri? Digite o nome e a IA estima as calorias por 100g — mesmo que o prato não exista em nenhuma tabela.',
  },
  {
    icon: '🎯',
    titulo: 'Meta calórica calculada para você',
    descricao:
      'Usamos seu peso, altura, idade, nível de atividade e objetivo para calcular exatamente quantas calorias você precisa por dia. Não é um número genérico.',
  },
  {
    icon: '📈',
    titulo: 'Projeção de quando você vai chegar na meta',
    descricao:
      'O sistema projeta semana a semana, com curva não-linear — porque o corpo adapta o metabolismo conforme você emagrece. A data que mostramos é realista.',
  },
  {
    icon: '🧠',
    titulo: 'O sistema aprende com o seu metabolismo',
    descricao:
      'Após 7 dias de registros de peso e refeições, o algoritmo recalcula o seu gasto calórico real. Não depende mais de fórmulas genéricas — usa os seus dados.',
  },
]

function StatusBadge({ status, diasRestantes }: { status: string; diasRestantes: number }) {
  if (status === 'ativo') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        Ativa
      </span>
    )
  }
  if (status === 'trial' && diasRestantes > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
        Trial — {diasRestantes} dias restantes
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
      Expirada
    </span>
  )
}

export default function PlanoClient({
  profile,
  subscription,
  diasUsando,
  diasRestantes,
  totalRefeicoes,
  progressoPeso,
  userId,
}: {
  profile: any
  subscription: any
  diasUsando: number
  diasRestantes: number
  totalRefeicoes: number
  progressoPeso: number | null
  userId: string
}) {
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [portalError, setPortalError] = useState('')

  const planSlug: string = subscription?.plans?.slug || 'basico'
  const planName: string = subscription?.plans?.name || 'Básico'
  const isPremium = planSlug === 'premium'
  const isAtivo = subscription?.status === 'ativo'
  const isTrial = subscription?.status === 'trial'

  const renovacaoLabel = subscription?.ends_at
    ? new Date(subscription.ends_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null

  const handleGerenciar = async () => {
    setLoadingPortal(true)
    setPortalError('')
    const result = await criarPortalSession(userId)
    if (result.url) {
      window.location.href = result.url
    } else {
      setPortalError(result.error || 'Erro ao abrir portal.')
      setLoadingPortal(false)
    }
  }

  // Frase motivacional personalizada
  const fraseJornada = (() => {
    if (totalRefeicoes === 0) return 'Você está começando agora. Cada registro conta.'
    if (diasUsando <= 7) return `${totalRefeicoes} refeições em ${diasUsando} dias. Ótimo começo.`
    if (progressoPeso !== null && progressoPeso < 0)
      return `${totalRefeicoes} refeições registradas. ${Math.abs(progressoPeso)} kg a menos. Está funcionando.`
    return `${totalRefeicoes} refeições registradas em ${diasUsando} dias de uso.`
  })()

  return (
    <main className="bg-gray-50 min-h-screen pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-6 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <a href="/app/dashboard" className="text-gray-400 hover:text-gray-600 p-1 -ml-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Minha Jornada</h1>
            <p className="text-sm text-gray-400">{profile?.name || 'Usuário'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">

        {/* ── Sua jornada em números ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Sua jornada
          </p>
          <p className="text-base text-gray-700 font-medium mb-4">{fraseJornada}</p>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{diasUsando}</p>
              <p className="text-xs text-gray-400 mt-0.5">dias de uso</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalRefeicoes}</p>
              <p className="text-xs text-gray-400 mt-0.5">refeições</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {profile?.ic_streak_days || 0}
                <span className="text-base font-normal text-gray-400">d</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">streak atual</p>
            </div>
          </div>

          {progressoPeso !== null && progressoPeso < 0 && (
            <div className="mt-4 bg-green-50 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-sm font-semibold text-green-700">
                  {Math.abs(progressoPeso)} kg perdidos desde o início
                </p>
                <p className="text-xs text-green-600">Continue assim — você está no caminho certo.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── O que você tem acesso ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            O que o CaloriaCerta faz por você
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Tudo disponível no seu plano {planName}
          </p>

          <div className="space-y-4">
            {RECURSOS.map((r, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{r.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{r.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.descricao}</p>
                </div>
              </div>
            ))}
          </div>

          {!isPremium && isAtivo && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">
                Com o <strong>Plano Premium</strong> você terá, em breve:
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>↗ Análise semanal de tendências</li>
                <li>↗ Relatórios para compartilhar com nutricionista</li>
                <li>↗ Metas por macronutrientes (carbs, proteína, gordura)</li>
              </ul>
              <a
                href="/assinar"
                className="mt-3 inline-block text-xs text-green-600 font-semibold hover:underline"
              >
                Ver Plano Premium →
              </a>
            </div>
          )}
        </div>

        {/* ── Sua assinatura ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Sua assinatura
          </p>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-gray-900 text-lg">{planName}</p>
              {renovacaoLabel && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {isAtivo ? 'Renova em' : isTrial ? 'Trial até' : 'Expirou em'}{' '}
                  {renovacaoLabel}
                </p>
              )}
            </div>
            <StatusBadge status={subscription?.status || 'trial'} diasRestantes={diasRestantes} />
          </div>

          {/* CTA para usuários em trial ou expirado */}
          {(isTrial || !isAtivo) && (
            <a
              href="/assinar"
              className="block w-full py-3 bg-green-600 text-white text-center rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors mb-3"
            >
              {isTrial ? `Assinar agora — ${diasRestantes} dias restantes de trial` : 'Reativar assinatura'}
            </a>
          )}

          {/* Portal Stripe para assinantes ativos */}
          {isAtivo && (
            <>
              <button
                onClick={handleGerenciar}
                disabled={loadingPortal}
                className="w-full py-3 border border-gray-200 text-gray-600 text-sm rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loadingPortal ? 'Abrindo portal...' : 'Gerenciar assinatura (cancelar, trocar cartão)'}
              </button>
              {portalError && (
                <p className="text-xs text-red-500 mt-2 text-center">{portalError}</p>
              )}
            </>
          )}
        </div>

        {/* ── Suporte ────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Precisa de ajuda?
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Estamos disponíveis para dúvidas, sugestões ou qualquer problema.
            Respondo pessoalmente.
          </p>
          <a
            href="mailto:suporte@caloriacerta.app"
            className="mt-3 inline-flex items-center gap-2 text-sm text-green-600 font-semibold hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            suporte@caloriacerta.app
          </a>
        </div>

      </div>
    </main>
  )
}
