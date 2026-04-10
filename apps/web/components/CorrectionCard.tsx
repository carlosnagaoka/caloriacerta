import type { Correction, CorrectionDifficulty } from '@/lib/behavior/correctionEngine'

const DIFFICULTY_STYLES: Record<CorrectionDifficulty, { label: string; class: string }> = {
  facil:   { label: 'Fácil',   class: 'bg-green-100 text-green-700' },
  media:   { label: 'Médio',   class: 'bg-amber-100 text-amber-700' },
  dificil: { label: 'Difícil', class: 'bg-red-100 text-red-600' },
}

export default function CorrectionCard({ correction }: { correction: Correction }) {
  const diff = DIFFICULTY_STYLES[correction.difficulty]

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          {correction.badge}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diff.class}`}>
          {diff.label}
        </span>
      </div>

      <p className="text-base font-bold text-gray-900 leading-snug mb-2">
        {correction.instruction}
      </p>

      <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-2">
        {correction.why}
      </p>
    </div>
  )
}
