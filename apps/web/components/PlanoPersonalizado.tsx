'use client'

import { useState, useEffect } from 'react'
import { gerarPlanoIA, salvarNotasNutricionista } from '@/app/app/plano/actions'
import type { PlanoNutricional, PlanoAtividades } from '@/app/app/plano/actions'

// Extrai nomes únicos de alimentos de todos os dias do plano
function extrairAlimentos(plano: PlanoNutricional): string[] {
  const seen = new Set<string>()
  plano.dias.forEach(dia =>
    dia.refeicoes.forEach(ref =>
      ref.itens.forEach(item => {
        // Remove quantidades entre parênteses: "Arroz integral (150g)" → "Arroz integral"
        const nome = item
          .replace(/\s*\(.*?\)/g, '')
          .replace(/^\d+\s*(g|ml|un|col|xíc|fatia|porção)?\s*/i, '')
          .trim()
        if (nome.length > 2) seen.add(nome)
      })
    )
  )
  return Array.from(seen).sort()
}

const DIAS_SEMANA = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']
const DIAS_CURTO = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const TIPO_CONFIG: Record<string, { cor: string; icon: string }> = {
  'Força':       { cor: 'bg-blue-100 text-blue-700',   icon: '💪' },
  'Cardio':      { cor: 'bg-orange-100 text-orange-700', icon: '🏃' },
  'Caminhada':   { cor: 'bg-green-100 text-green-700',  icon: '🚶' },
  'Yoga':        { cor: 'bg-purple-100 text-purple-700', icon: '🧘' },
  'Yoga/Alongamento': { cor: 'bg-purple-100 text-purple-700', icon: '🧘' },
  'Descanso':    { cor: 'bg-gray-100 text-gray-500',    icon: '😴' },
}

function getTipoConfig(tipo: string) {
  return TIPO_CONFIG[tipo] || { cor: 'bg-gray-100 text-gray-600', icon: '🏋️' }
}

// ─── Cardápio ──────────────────────────────────────────────────────────────

function Cardapio({ plano }: { plano: PlanoNutricional }) {
  const [diaIdx, setDiaIdx] = useState(0)
  const dia = plano.dias[diaIdx]

  return (
    <div>
      {/* Intro do nutricionista */}
      <div className="bg-green-50 rounded-xl px-4 py-3 mb-4 border-l-4 border-green-400">
        <p className="text-sm text-green-800 leading-relaxed">{plano.intro}</p>
      </div>

      {/* Seletor de dia */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4">
        {plano.dias.map((d, i) => (
          <button
            key={i}
            onClick={() => setDiaIdx(i)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              diaIdx === i
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {DIAS_CURTO[i] || d.nome.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Refeições do dia */}
      {dia && (
        <div className="space-y-3">
          {dia.refeicoes.map((ref, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  {ref.nome}
                </span>
                <span className="text-xs font-semibold text-green-600">
                  ~{ref.kcal_aprox} kcal
                </span>
              </div>
              <ul className="space-y-1">
                {ref.itens.map((item, j) => (
                  <li key={j} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-gray-400 flex-shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex justify-end pt-1">
            <span className="text-xs text-gray-400">
              Total do dia:{' '}
              <strong className="text-gray-700">{dia.total_kcal} kcal</strong>
            </span>
          </div>
        </div>
      )}

      {/* Dicas */}
      {plano.dicas?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Dicas práticas
          </p>
          <ul className="space-y-2">
            {plano.dicas.map((d, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-green-500 flex-shrink-0">✓</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Plano de Atividades ───────────────────────────────────────────────────

function Atividades({ plano }: { plano: PlanoAtividades }) {
  return (
    <div>
      {/* Intro */}
      <div className="bg-blue-50 rounded-xl px-4 py-3 mb-4 border-l-4 border-blue-400">
        <p className="text-sm text-blue-800 leading-relaxed">{plano.intro}</p>
      </div>

      {/* Grade semanal */}
      <div className="space-y-2">
        {plano.dias.map((d, i) => {
          const cfg = getTipoConfig(d.tipo)
          return (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-8 flex-shrink-0 text-center">
                <span className="text-xs text-gray-400 font-medium">
                  {DIAS_CURTO[i] || d.dia}
                </span>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cor}`}>
                    {cfg.icon} {d.tipo}
                  </span>
                  {d.duracao && (
                    <span className="text-xs text-gray-400">{d.duracao}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{d.descricao}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dicas */}
      {plano.dicas?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Para lembrar
          </p>
          <ul className="space-y-2">
            {plano.dicas.map((d, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-blue-400 flex-shrink-0">→</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────

interface Props {
  userId: string
  nomeUsuario: string
  planoNutricional: PlanoNutricional | null
  planoAtividades: PlanoAtividades | null
  notasNutricionista: string | null
  planoGeradoEm: string | null
}

export default function PlanoPersonalizado({
  userId,
  nomeUsuario,
  planoNutricional: planoNutricionalInicial,
  planoAtividades: planoAtividadesInicial,
  notasNutricionista: notasIniciais,
  planoGeradoEm,
}: Props) {
  const [aba, setAba] = useState<'cardapio' | 'atividades'>('cardapio')
  const [temNutricionista, setTemNutricionista] = useState(
    !!(notasIniciais && notasIniciais.trim().length > 0)
  )
  const [notas, setNotas] = useState(notasIniciais || '')
  const [salvandoNotas, setSalvandoNotas] = useState(false)

  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState('')
  const [cardapio, setCardapio] = useState<PlanoNutricional | null>(planoNutricionalInicial)
  const [atividades, setAtividades] = useState<PlanoAtividades | null>(planoAtividadesInicial)

  // ── Exclusões de alimentos ──────────────────────────────────────────────
  const STORAGE_KEY = `cc_exclusoes_${userId}`
  const [exclusoes, setExclusoes] = useState<Set<string>>(new Set())
  const [mostrarExclusoes, setMostrarExclusoes] = useState(false)

  // Carrega exclusões salvas do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setExclusoes(new Set(JSON.parse(saved)))
    } catch {}
  }, [STORAGE_KEY])

  const toggleExclusao = (nome: string) => {
    setExclusoes(prev => {
      const next = new Set(prev)
      next.has(nome) ? next.delete(nome) : next.add(nome)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next))) } catch {}
      return next
    })
  }

  const limparExclusoes = () => {
    setExclusoes(new Set())
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const alimentosDoPlano = cardapio ? extrairAlimentos(cardapio) : []

  const temPlano = !!(cardapio && atividades)

  const handleGerar = async (comExclusoes = true) => {
    setGerando(true)
    setErro('')
    const excluidos = comExclusoes && exclusoes.size > 0 ? Array.from(exclusoes) : undefined
    const result = await gerarPlanoIA(userId, temNutricionista ? notas : undefined, excluidos)
    if (result.error) {
      setErro(result.error)
    } else {
      setCardapio(result.cardapio || null)
      setAtividades(result.atividades || null)
      // Fecha o painel de exclusões após regenerar
      setMostrarExclusoes(false)
    }
    setGerando(false)
  }

  const handleSalvarNotas = async () => {
    setSalvandoNotas(true)
    await salvarNotasNutricionista(userId, notas)
    setSalvandoNotas(false)
  }

  const dataGeracao = planoGeradoEm
    ? new Date(planoGeradoEm).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null

  return (
    <div className="space-y-4">

      {/* ── Toggle: tenho nutricionista ────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <button
          onClick={() => setTemNutricionista(v => !v)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">👨‍⚕️</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Tenho nutricionista</p>
              <p className="text-xs text-gray-400">
                {temNutricionista
                  ? 'O plano vai seguir as orientações do seu nutricionista'
                  : 'Ativar para inserir as orientações do seu nutricionista'}
              </p>
            </div>
          </div>
          <div className={`relative w-11 h-6 rounded-full transition-colors ${temNutricionista ? 'bg-green-500' : 'bg-gray-200'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${temNutricionista ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </button>

        {temNutricionista && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2 leading-relaxed">
              Cole aqui as orientações que seu nutricionista passou — pode ser qualquer formato: restrições, metas de proteína, horários, alimentos proibidos. O sistema vai criar o plano respeitando tudo isso.
            </p>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={5}
              placeholder="Ex: Evitar glúten. Proteína mínima 120g/dia. Sem carboidratos simples à noite. Jantar até 19h. 1.800 kcal/dia."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-green-300"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSalvarNotas}
                disabled={salvandoNotas}
                className="text-xs text-green-600 font-semibold hover:underline disabled:opacity-50"
              >
                {salvandoNotas ? 'Salvando...' : 'Salvar anotações'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Estado inicial: sem plano ──────────────────────────────────── */}
      {!temPlano && !gerando && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="text-4xl mb-3">🥗</div>
          <h3 className="font-bold text-gray-900 mb-1">Seu plano personalizado</h3>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            {temNutricionista
              ? 'Vamos transformar as orientações do seu nutricionista em um cardápio semanal prático e um plano de exercícios.'
              : `A IA vai criar um cardápio semanal e um plano de atividades especialmente para você, ${nomeUsuario} — com alimentos que você encontra no Japão e no Brasil.`}
          </p>
          <button
            onClick={() => handleGerar(true)}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
          >
            {temNutricionista ? 'Criar plano com orientações do nutricionista' : 'Criar meu plano personalizado'}
          </button>
        </div>
      )}

      {/* ── Gerando... ────────────────────────────────────────────────── */}
      {gerando && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
          <p className="font-semibold text-gray-800 mb-1">Criando seu plano...</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Analisando seu perfil e montando um cardápio realista para o seu dia a dia no Japão. Isso leva cerca de 15 segundos.
          </p>
        </div>
      )}

      {/* ── Erro ─────────────────────────────────────────────────────── */}
      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* ── Plano gerado ─────────────────────────────────────────────── */}
      {temPlano && !gerando && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header com abas */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setAba('cardapio')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                aba === 'cardapio'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              🥗 Cardápio
            </button>
            <button
              onClick={() => setAba('atividades')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                aba === 'atividades'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              💪 Exercícios
            </button>
          </div>

          <div className="p-4">
            {aba === 'cardapio' && cardapio && <Cardapio plano={cardapio} />}
            {aba === 'atividades' && atividades && <Atividades plano={atividades} />}
          </div>

          {/* Footer: data de geração */}
          {dataGeracao && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-300">Gerado em {dataGeracao}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Exclusões: "Não gosto / Não encontro" ────────────────────────── */}
      {temPlano && !gerando && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setMostrarExclusoes(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🚫</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">Não gosto / Não encontro</p>
                <p className="text-xs text-gray-400">
                  {exclusoes.size > 0
                    ? `${exclusoes.size} alimento${exclusoes.size > 1 ? 's' : ''} excluído${exclusoes.size > 1 ? 's' : ''} do próximo plano`
                    : 'Marque o que quer evitar — o novo plano vai substituir'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {exclusoes.size > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {exclusoes.size}
                </span>
              )}
              <span className="text-gray-300 text-sm">{mostrarExclusoes ? '▴' : '▾'}</span>
            </div>
          </button>

          {mostrarExclusoes && (
            <div className="px-4 pb-4 border-t border-gray-50">
              <p className="text-xs text-gray-400 mt-3 mb-3 leading-relaxed">
                Toque nos alimentos que <strong>não gosta</strong> ou <strong>não consegue comprar</strong>.
                O plano gerado vai substituir por opções equivalentes.
              </p>

              {/* Chips de alimentos */}
              <div className="flex flex-wrap gap-2 mb-4">
                {alimentosDoPlano.map(nome => {
                  const excluido = exclusoes.has(nome)
                  return (
                    <button
                      key={nome}
                      onClick={() => toggleExclusao(nome)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        excluido
                          ? 'bg-red-50 border-red-300 text-red-600 line-through opacity-75'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-500'
                      }`}
                    >
                      {excluido && <span className="mr-1 no-underline not-italic">✕</span>}
                      {nome}
                    </button>
                  )
                })}
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-3 border-t border-gray-50">
                {exclusoes.size > 0 && (
                  <button
                    onClick={limparExclusoes}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium px-3 py-2 rounded-xl border border-gray-200"
                  >
                    Limpar seleção
                  </button>
                )}
                <button
                  onClick={() => handleGerar(true)}
                  disabled={gerando}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                    exclusoes.size > 0
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {exclusoes.size > 0
                    ? `↺ Novo plano sem ${exclusoes.size} item${exclusoes.size > 1 ? 'ns' : ''}`
                    : '↺ Regenerar plano'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
