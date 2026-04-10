import type { PatternInsight } from '@/lib/behavior/patternEngine'

const PATTERN_ICON: Record<string, string> = {
  snacking:          '🍫',
  late_overeating:   '🌙',
  weekend_excess:    '📅',
  breakfast_skipper: '🌅',
  calorie_spikes:    '📊',
  under_logging:     '📝',
  breakfast_anchor:  '☀️',
  consistent_logger: '🏆',
  balanced:          '⚖️',
  insufficient_data: '🔍',
}

export default function PatternInsightCard({ pattern }: { pattern: PatternInsight }) {
  const icon = PATTERN_ICON[pattern.type] ?? '🔎'
  const isPositive = pattern.positive
  const isInsufficient = pattern.type === 'insufficient_data'

  return (
    <div
      className={`rounded-2xl p-4 shadow-sm border ${
        isInsufficient
          ? 'bg-gray-50 border-gray-100'
          : isPositive
          ? 'bg-gradient-to-br from-teal-50 to-green-50 border-teal-100'
          : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5" aria-hidden>{icon}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-xs font-bold uppercase tracking-wide ${
                isInsufficient ? 'text-gray-400' : isPositive ? 'text-teal-600' : 'text-orange-600'
              }`}
            >
              {isInsufficient ? 'análise em curso' : isPositive ? 'padrão positivo' : 'padrão detectado'}
            </span>
          </div>

          <p
            className={`font-bold text-sm leading-snug ${
              isInsufficient ? 'text-gray-600' : isPositive ? 'text-teal-900' : 'text-orange-900'
            }`}
          >
            {pattern.headline}
          </p>

          <p
            className={`text-xs mt-1 leading-relaxed ${
              isInsufficient ? 'text-gray-500' : isPositive ? 'text-teal-700' : 'text-orange-700'
            }`}
          >
            {pattern.detail}
          </p>

          {!isInsufficient && (
            <p className="text-xs mt-2 text-gray-400">
              Baseado em {pattern.dataPoints} dia{pattern.dataPoints !== 1 ? 's' : ''} de dados
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
