'use client'

import type { SmartMessage, MessageTone } from '@/lib/behavior/messageEngine'

// ── Configuração visual por tom ──────────────────────────────────────────────

const TONE_STYLES: Record<
  MessageTone,
  {
    bg: string
    border: string
    titleColor: string
    subtitleColor: string
    ctaClass: string
    pill: string
    pillText: string
  }
> = {
  encouraging: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    border: 'border-green-200',
    titleColor: 'text-green-900',
    subtitleColor: 'text-green-700',
    ctaClass: 'bg-green-600 hover:bg-green-700 text-white',
    pill: 'bg-green-100 text-green-600',
    pillText: 'em ritmo',
  },
  welcoming: {
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    titleColor: 'text-blue-900',
    subtitleColor: 'text-blue-700',
    ctaClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    pill: 'bg-blue-100 text-blue-600',
    pillText: 'bem-vindo de volta',
  },
  firm: {
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
    border: 'border-amber-200',
    titleColor: 'text-amber-900',
    subtitleColor: 'text-amber-700',
    ctaClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    pill: 'bg-amber-100 text-amber-600',
    pillText: 'atenção',
  },
  confronting: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    border: 'border-red-200',
    titleColor: 'text-red-900',
    subtitleColor: 'text-red-700',
    ctaClass: 'bg-red-500 hover:bg-red-600 text-white',
    pill: 'bg-red-100 text-red-500',
    pillText: 'ausente',
  },
  celebrating: {
    bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
    border: 'border-purple-200',
    titleColor: 'text-purple-900',
    subtitleColor: 'text-purple-700',
    ctaClass: 'bg-purple-600 hover:bg-purple-700 text-white',
    pill: 'bg-purple-100 text-purple-600',
    pillText: 'conquista',
  },
}

interface Props {
  message: SmartMessage
  consistencyPct?: number  // % dos últimos 14 dias com registro
}

export default function SmartMessageCard({ message, consistencyPct }: Props) {
  const s = TONE_STYLES[message.tone]

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${s.bg} ${s.border}`}>
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <span className="text-2xl flex-shrink-0 mt-0.5" aria-hidden>
          {message.icon}
        </span>

        <div className="flex-1 min-w-0">
          {/* Pill de estado */}
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5 ${s.pill}`}>
            {s.pillText}
          </span>

          {/* Título */}
          <p className={`font-bold text-base leading-snug ${s.titleColor}`}>
            {message.title}
          </p>

          {/* Subtítulo */}
          {message.subtitle && (
            <p className={`text-sm mt-1 leading-relaxed ${s.subtitleColor}`}>
              {message.subtitle}
            </p>
          )}

          {/* Consistência (só para estados ativos/encorajadores) */}
          {consistencyPct !== undefined &&
            (message.tone === 'encouraging' || message.tone === 'celebrating') && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="h-1.5 bg-green-500 rounded-full transition-all duration-700"
                    style={{ width: `${consistencyPct}%` }}
                  />
                </div>
                <span className="text-xs text-green-600 font-medium flex-shrink-0">
                  {consistencyPct}% (14d)
                </span>
              </div>
            )}

          {/* CTA */}
          {message.cta && message.ctaHref && (
            <a
              href={message.ctaHref}
              className={`inline-block mt-3 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${s.ctaClass}`}
            >
              {message.cta}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
