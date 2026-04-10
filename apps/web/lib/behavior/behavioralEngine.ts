/**
 * BehavioralEngine — núcleo do sistema de inteligência comportamental
 *
 * Determina o estado atual do usuário com base no seu histórico de registros.
 * Puramente determinístico: if/else com dados reais, sem IA.
 * Deve rodar server-side, junto com o fetch do dashboard — zero round-trip extra.
 */

export type BehaviorStatus =
  | 'active'        // registrou hoje
  | 'returning'     // registrou hoje, mas estava ausente 3+ dias antes
  | 'inconsistent'  // não registrou hoje, mas registrou ontem
  | 'absent_short'  // 2-3 dias sem registrar
  | 'absent_long'   // 4+ dias sem registrar

export interface BehaviorState {
  status: BehaviorStatus
  hasLoggedToday: boolean
  daysSinceLastMeal: number   // 0 = logou hoje, 1 = logou ontem, etc.
  streakDays: number
  isStreakMilestone: boolean
  milestoneLabel: string | null
  totalLoggedDays: number     // dentro dos últimos 14 dias
  consistencyPct: number      // % dos últimos 14 dias com registro
}

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90]

const MILESTONE_LABELS: Record<number, string> = {
  3:  '3 dias seguidos',
  7:  '7 dias seguidos',
  14: '2 semanas',
  21: '3 semanas',
  30: '30 dias',
  60: '2 meses',
  90: '3 meses',
}

/**
 * @param recentMealDates - datas de refeições dos últimos 30 dias, em qualquer ordem
 * @param streakDays      - ic_streak_days do perfil
 * @param today           - data de hoje no formato YYYY-MM-DD (local do dispositivo)
 */
export function computeBehaviorState(
  recentMealDates: string[],
  streakDays: number,
  today: string
): BehaviorState {
  // Datas únicas, ordenadas do mais recente para o mais antigo
  const uniqueDates = [...new Set(recentMealDates)].sort().reverse()

  const hasLoggedToday = uniqueDates.includes(today)

  // Dias desde o último registro
  const lastDate = uniqueDates[0] ?? null
  let daysSinceLastMeal = 0

  if (!lastDate) {
    daysSinceLastMeal = 999
  } else {
    const ms = new Date(`${today}T12:00:00`).getTime() - new Date(`${lastDate}T12:00:00`).getTime()
    daysSinceLastMeal = Math.max(0, Math.round(ms / 86400000))
  }

  // ── Determinar status ────────────────────────────────────────────────────
  let status: BehaviorStatus

  if (hasLoggedToday) {
    // Verifica se estava ausente antes de hoje (retorno após ausência)
    const datesBeforeToday = uniqueDates.filter(d => d < today)
    const lastBeforeToday = datesBeforeToday[0] ?? null

    if (lastBeforeToday) {
      const gapMs =
        new Date(`${today}T12:00:00`).getTime() -
        new Date(`${lastBeforeToday}T12:00:00`).getTime()
      const gapDays = Math.round(gapMs / 86400000)
      status = gapDays >= 3 ? 'returning' : 'active'
    } else {
      status = 'active' // primeiro registro, sempre acolhedor
    }
  } else {
    if (daysSinceLastMeal <= 1) {
      status = 'inconsistent'  // só ontem
    } else if (daysSinceLastMeal <= 3) {
      status = 'absent_short'  // 2-3 dias
    } else {
      status = 'absent_long'   // 4+ dias
    }
  }

  // ── Consistência dos últimos 14 dias ────────────────────────────────────
  const cutoff = new Date(`${today}T12:00:00`)
  cutoff.setDate(cutoff.getDate() - 13) // 14 dias no total
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const last14 = uniqueDates.filter(d => d >= cutoffStr)
  const totalLoggedDays = last14.length
  const consistencyPct = Math.round((totalLoggedDays / 14) * 100)

  // ── Milestone de streak ─────────────────────────────────────────────────
  const isStreakMilestone = hasLoggedToday && STREAK_MILESTONES.includes(streakDays)
  const milestoneLabel = isStreakMilestone ? (MILESTONE_LABELS[streakDays] ?? null) : null

  return {
    status,
    hasLoggedToday,
    daysSinceLastMeal,
    streakDays,
    isStreakMilestone,
    milestoneLabel,
    totalLoggedDays,
    consistencyPct,
  }
}
