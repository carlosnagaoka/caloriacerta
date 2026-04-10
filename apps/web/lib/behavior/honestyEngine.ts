/**
 * HonestyEngine — detecta incoerências sem ser agressivo
 *
 * Princípio: nunca acusar. Fazer perguntas leves que abrem reflexão.
 * "Essa refeição parece mais completa. Quer revisar?"
 * — não — "Você está mentindo sobre suas calorias."
 *
 * Detecta três padrões:
 * 1. low_today        — total do dia muito abaixo da média histórica
 * 2. streak_low       — vários dias consecutivos abaixo de 800 kcal
 * 3. zero_calorie_meal — refeição registrada com 0 kcal
 *
 * Retorna null se nenhum padrão suspeito for encontrado.
 */

export type HonestyCheckType =
  | 'low_today'
  | 'streak_low'
  | 'zero_calorie_meal'

export interface HonestyCheck {
  type: HonestyCheckType
  message: string   // pergunta leve, não acusação
  detail?: string
}

interface DailyTotal {
  date: string
  total: number
}

function groupCaloriesByDay(
  meals: { meal_date: string; total_calories: number }[]
): DailyTotal[] {
  const map: Record<string, number> = {}
  for (const m of meals) {
    map[m.meal_date] = (map[m.meal_date] || 0) + (m.total_calories || 0)
  }
  return Object.entries(map)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function checkMealHonesty(
  meals: { meal_date: string; meal_type: string; total_calories: number }[],
  today: string
): HonestyCheck | null {
  if (meals.length < 3) return null

  const byDay = groupCaloriesByDay(meals)

  // ── 1. Refeição com 0 calorias hoje ─────────────────────────────────────
  const todayMealsZero = meals.filter(
    m => m.meal_date === today && (m.total_calories === 0 || m.total_calories === null)
  )
  if (todayMealsZero.length > 0) {
    return {
      type: 'zero_calorie_meal',
      message: 'Uma refeição foi registrada sem calorias.',
      detail: 'Quer revisar os itens para garantir que está completo?',
    }
  }

  // ── 2. Dias consecutivos com total muito baixo (< 700 kcal) ─────────────
  const last7 = byDay.filter(d => d.date < today).slice(-7)
  const lowDays = last7.filter(d => d.total > 0 && d.total < 700)
  if (lowDays.length >= 3) {
    return {
      type: 'streak_low',
      message: `Seus últimos ${lowDays.length} dias registrados ficaram bem abaixo da média.`,
      detail: 'Isso está correto, ou podem estar faltando algumas refeições nesses dias?',
    }
  }

  // ── 3. Hoje muito abaixo da média histórica ──────────────────────────────
  const historicalDays = byDay.filter(d => d.date < today && d.total > 500)
  if (historicalDays.length >= 5) {
    const avg =
      historicalDays.reduce((s, d) => s + d.total, 0) / historicalDays.length
    const todayTotal = byDay.find(d => d.date === today)?.total ?? 0

    // Só verifica se tem pelo menos algum registro hoje
    if (todayTotal > 0 && todayTotal < avg * 0.45 && avg > 1000) {
      return {
        type: 'low_today',
        message: 'Hoje está bem abaixo da sua média habitual.',
        detail: `Sua média é ${Math.round(avg)} kcal. Hoje foram ${Math.round(todayTotal)} kcal. Faltou registrar algo?`,
      }
    }
  }

  return null
}
