/**
 * ICEngine — Índice de Consistência (IC), fórmula determinística 0-100
 *
 * O IC não é um número de motivação. É uma métrica real que mede três
 * dimensões independentes do comportamento alimentar do usuário.
 *
 * Fórmula:
 *   IC = consistência (40%) + qualidade_registro (30%) + aderência_meta (30%)
 *
 * 1. Consistência (0-40 pts)
 *    Quantos dos últimos 14 dias foram registrados.
 *    14/14 = 40pts | 10/14 = ~28pts | 5/14 = ~14pts
 *
 * 2. Qualidade do registro (0-30 pts)
 *    Média de completude por dia registrado:
 *    - Tem café da manhã?          25%
 *    - Tem almoço?                 25%
 *    - Tem jantar?                 25%
 *    - Mais de 2 itens por dia?    25%
 *
 * 3. Aderência à meta calórica (0-30 pts)
 *    Desvio médio entre consumido e meta nos dias registrados:
 *    |consumido - meta| / meta
 *    <10% = 30pts | 10-20% = 20pts | 20-35% = 10pts | >35% = 0pts
 *
 * Interpretação:
 *   0-30:  "Começando"
 *   31-50: "Em desenvolvimento"
 *   51-70: "Consistente"
 *   71-85: "Confiável"
 *   86-100:"Excelente padrão"
 */

import type { MealRecord } from './patternEngine'

export interface ICResult {
  score: number           // 0-100 inteiro
  label: string           // "Consistente", "Confiável", etc.
  labelDetail: string     // frase contextual
  breakdown: {
    consistencia: number  // 0-40
    qualidade: number     // 0-30
    aderencia: number     // 0-30
  }
}

function getLabel(score: number): { label: string; labelDetail: string } {
  if (score >= 86) {
    return {
      label: 'Excelente padrão',
      labelDetail: 'Seu padrão está acima da média. Isso é construído com repetição, não sorte.',
    }
  }
  if (score >= 71) {
    return {
      label: 'Confiável',
      labelDetail: 'Seu IC está subindo. Seu padrão está ficando mais previsível — e previsível é poderoso.',
    }
  }
  if (score >= 51) {
    return {
      label: 'Consistente',
      labelDetail: 'Você está no caminho certo. Consistência moderada já gera resultados.',
    }
  }
  if (score >= 31) {
    return {
      label: 'Em desenvolvimento',
      labelDetail: 'Seu IC caiu porque houve menos registro, não necessariamente pior alimentação.',
    }
  }
  return {
    label: 'Começando',
    labelDetail: 'Seu corpo responde ao que você repete. Registros diários são o primeiro passo.',
  }
}

export function computeICScore(
  meals: MealRecord[],
  dailyCalorieGoal: number,
  today: string
): ICResult {
  // ── Janela de 14 dias ────────────────────────────────────────────────────
  const cutoff = new Date(today + 'T12:00:00')
  cutoff.setDate(cutoff.getDate() - 13)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const filtered = meals.filter(m => m.meal_date >= cutoffStr && m.meal_date <= today)

  // Agrupar por dia
  const byDay: Record<string, { types: Set<string>; totalCal: number; itemCount: number }> = {}
  for (const meal of filtered) {
    if (!byDay[meal.meal_date]) {
      byDay[meal.meal_date] = { types: new Set(), totalCal: 0, itemCount: 0 }
    }
    byDay[meal.meal_date].types.add(meal.meal_type)
    byDay[meal.meal_date].totalCal += meal.total_calories || 0
    byDay[meal.meal_date].itemCount += 1
  }

  const loggedDays = Object.values(byDay)
  const n = loggedDays.length

  // ── 1. Consistência (0-40) ───────────────────────────────────────────────
  const consistencia = Math.round((n / 14) * 40)

  // ── 2. Qualidade do registro (0-30) ─────────────────────────────────────
  let qualidade = 0
  if (n > 0) {
    const qualScores = loggedDays.map(day => {
      let q = 0
      if (day.types.has('cafe_da_manha')) q += 25
      if (day.types.has('almoco')) q += 25
      if (day.types.has('jantar')) q += 25
      if (day.itemCount >= 2) q += 25
      return q / 100 // 0-1
    })
    const avgQual = qualScores.reduce((a, b) => a + b, 0) / qualScores.length
    qualidade = Math.round(avgQual * 30)
  }

  // ── 3. Aderência à meta (0-30) ───────────────────────────────────────────
  let aderencia = 0
  if (n > 0 && dailyCalorieGoal > 0) {
    const adherenceScores = loggedDays.map(day => {
      const deviation = Math.abs(day.totalCal - dailyCalorieGoal) / dailyCalorieGoal
      if (deviation < 0.10) return 30
      if (deviation < 0.20) return 20
      if (deviation < 0.35) return 10
      return 0
    })
    aderencia = Math.round(
      adherenceScores.reduce((a, b) => a + b, 0) / adherenceScores.length
    )
  }

  const score = Math.min(100, consistencia + qualidade + aderencia)
  const { label, labelDetail } = getLabel(score)

  return {
    score,
    label,
    labelDetail,
    breakdown: { consistencia, qualidade, aderencia },
  }
}
