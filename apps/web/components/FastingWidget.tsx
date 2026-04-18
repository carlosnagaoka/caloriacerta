'use client'

import { useState, useEffect, useCallback } from 'react'
import { iniciarJejum, encerrarJejum } from '@/app/app/jejum/actions'

interface ActiveSession {
  id: string
  plan: string
  targetHours: number
  startedAt: string
}

interface Props {
  userId: string
  activeSession: ActiveSession | null
}

const PLANOS = [
  { key: '16:8', label: '16:8', hours: 16, desc: 'Mais popular', color: 'bg-violet-50 border-violet-200 text-violet-700' },
  { key: '18:6', label: '18:6', hours: 18, desc: 'Avançado',     color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { key: '20:4', label: '20:4', hours: 20, desc: 'Intenso',      color: 'bg-blue-50 border-blue-200 text-blue-700' },
]

function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FastingWidget({ userId, activeSession: initialSession }: Props) {
  const [session, setSession] = useState<ActiveSession | null>(initialSession)
  const [planoSelecionado, setPlanoSelecionado] = useState('16:8')
  const [elapsed, setElapsed] = useState(0)        // ms decorridos
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)

  // Cronômetro — atualiza a cada segundo quando há sessão ativa
  useEffect(() => {
    if (!session) return
    const tick = () => {
      const ms = Date.now() - new Date(session.startedAt).getTime()
      setElapsed(ms)
      if (ms >= session.targetHours * 3600 * 1000 && !completed) {
        setCompleted(true)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session, completed])

  const handleIniciar = async () => {
    setLoading(true)
    const plano = PLANOS.find(p => p.key === planoSelecionado)!
    const result = await iniciarJejum(userId, plano.key, plano.hours)
    if (result.success) {
      setSession({
        id: result.sessionId!,
        plan: plano.key,
        targetHours: plano.hours,
        startedAt: new Date().toISOString(),
      })
      setCompleted(false)
      setElapsed(0)
    }
    setLoading(false)
  }

  const handleEncerrar = async (ok: boolean) => {
    if (!session) return
    setLoading(true)
    await encerrarJejum(session.id, ok)
    setSession(null)
    setElapsed(0)
    setCompleted(false)
    setLoading(false)
  }

  // ── Sem sessão ativa: seletor de plano ──────────────────────────────────
  if (!session) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          ⏱ Jejum intermitente
        </p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {PLANOS.map(p => (
            <button
              key={p.key}
              onClick={() => setPlanoSelecionado(p.key)}
              className={`border-2 rounded-xl py-3 px-2 text-center transition-all ${
                planoSelecionado === p.key
                  ? p.color + ' border-current scale-105 shadow-sm'
                  : 'bg-gray-50 border-gray-100 text-gray-500'
              }`}
            >
              <p className="text-lg font-bold leading-none">{p.label}</p>
              <p className="text-xs mt-1 opacity-75">{p.desc}</p>
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mb-3">
          {(() => {
            const p = PLANOS.find(x => x.key === planoSelecionado)!
            const janela = 24 - p.hours
            return `Jeium de ${p.hours}h → janela de alimentação: ${janela}h`
          })()}
        </p>

        <button
          onClick={handleIniciar}
          disabled={loading}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60"
        >
          {loading ? 'Iniciando...' : '▶ Iniciar jejum'}
        </button>
      </div>
    )
  }

  // ── Sessão ativa: cronômetro ─────────────────────────────────────────────
  const targetMs = session.targetHours * 3600 * 1000
  const pct = Math.min(elapsed / targetMs, 1)
  const remaining = Math.max(targetMs - elapsed, 0)
  const r = 54
  const circ = 2 * Math.PI * r

  const corAnel = completed ? '#22c55e' : pct > 0.75 ? '#7c3aed' : '#8b5cf6'

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          ⏱ Jejum {session.plan}
        </p>
        {completed && (
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            ✓ Meta atingida!
          </span>
        )}
      </div>

      {/* Anel + tempo */}
      <div className="flex items-center gap-5 my-3">
        <div className="relative flex-shrink-0">
          <svg width="124" height="124" className="-rotate-90" aria-hidden="true">
            <circle cx="62" cy="62" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
            <circle
              cx="62" cy="62" r={r}
              fill="none"
              stroke={corAnel}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct)}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-gray-400 font-medium">decorrido</span>
            <span className="text-lg font-bold text-gray-900 tabular-nums leading-tight">
              {formatDuration(elapsed)}
            </span>
            <span className="text-xs text-gray-400">{Math.round(pct * 100)}%</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs text-gray-400">Meta</p>
            <p className="text-xl font-bold text-violet-600">{session.targetHours}h</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Faltam</p>
            <p className={`text-xl font-bold ${completed ? 'text-green-600' : 'text-gray-800'}`}>
              {completed ? '00:00:00' : formatDuration(remaining)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Início</p>
            <p className="text-sm font-semibold text-gray-600">
              {new Date(session.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-2">
        {completed ? (
          <button
            onClick={() => handleEncerrar(true)}
            disabled={loading}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60"
          >
            {loading ? '...' : '🎉 Concluir jejum'}
          </button>
        ) : (
          <button
            onClick={() => handleEncerrar(false)}
            disabled={loading}
            className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-all active:scale-95 border border-red-200 disabled:opacity-60"
          >
            {loading ? '...' : '⏹ Encerrar'}
          </button>
        )}
      </div>

      {!completed && (
        <p className="text-center text-xs text-gray-400 mt-2">
          Janela de alimentação: {session.targetHours}h de jejum → abre às{' '}
          {new Date(new Date(session.startedAt).getTime() + targetMs)
            .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  )
}
