/**
 * PatternDetectionEngine — detecta o padrão dominante do usuário
 *
 * Analisa os últimos 30 dias de refeições e identifica comportamentos
 * recorrentes — problemas E padrões positivos.
 *
 * Requer mínimo de 5 dias de dados para ser significativo.
 * Abaixo disso, retorna 'insufficient_data'.
 *
 * Princípio de design: nunca lista 5 problemas. Detecta O padrão mais
 * relevante do momento e reporta apenas esse.
 */

export type PatternType =
  | 'snacking'          // lanches > 30% das calorias diárias
  | 'late_overeating'   // jantar > 40% das calorias
  | 'weekend_excess'    // fim de semana > semana em 30%+
  | 'breakfast_skipper' // pula café da manhã 60%+ dos dias
  | 'calorie_spikes'    // alta variância diária (desvio padrão > 500 kcal)
  | 'under_logging'     // menos de 5 dias logados em 14
  | 'breakfast_anchor'  // café consistente 70%+ — padrão positivo
  | 'consistent_logger' // 10+ dias logados em 14 — padrão positivo
  | 'balanced'          // nenhum padrão problemático detectado
  | 'insufficient_data' // dados insuficientes

export interface PatternInsight {
  type: PatternType
  positive: boolean
  headline: string   // frase direta ao usuário
  detail: string     // contexto explicativo
  dataPoints: number // dias de dados analisados
}

// Estrutura de refeição para análise
export interface MealRecord {
  meal_date: string   // 'YYYY-MM-DD'
  meal_type: string   // 'cafe_da_manha' | 'almoco' | 'jantar' | 'lanche' | 'outro'
  total_calories: number
}

interface DayStats {
  date: string
  total: number
  byType: Record<string, number>
  dayOfWeek: number  // 0=dom, 1=seg, ..., 6=sab
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const sq = values.map(v => Math.pow(v - mean, 2))
  return Math.sqrt(sq.reduce((a, b) => a + b, 0) / values.length)
}

function avg(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function groupByDay(meals: MealRecord[]): DayStats[] {
  const map: Record<string, DayStats> = {}

  for (const meal of meals) {
    if (!map[meal.meal_date]) {
      const d = new Date(meal.meal_date + 'T12:00:00')
      map[meal.meal_date] = {
        date: meal.meal_date,
        total: 0,
        byType: {},
        dayOfWeek: d.getDay(),
      }
    }
    map[meal.meal_date].total += meal.total_calories || 0
    const t = meal.meal_type || 'outro'
    map[meal.meal_date].byType[t] = (map[meal.meal_date].byType[t] || 0) + (meal.total_calories || 0)
  }

  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
}

export function detectPrimaryPattern(
  meals: MealRecord[],
  today: string
): PatternInsight {
  // Filtro: apenas últimos 30 dias
  const cutoff = new Date(today + 'T12:00:00')
  cutoff.setDate(cutoff.getDate() - 29)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const filtered = meals.filter(m => m.meal_date >= cutoffStr)
  const days = groupByDay(filtered)
  const totalDays = days.length

  // ── Dados insuficientes ──────────────────────────────────────────────────
  if (totalDays < 5) {
    return {
      type: 'insufficient_data',
      positive: false,
      headline: 'Ainda coletando dados para análise.',
      detail: `Registre por pelo menos 5 dias para o sistema identificar seu padrão. Você tem ${totalDays} dia${totalDays !== 1 ? 's' : ''} registrado${totalDays !== 1 ? 's' : ''}.`,
      dataPoints: totalDays,
    }
  }

  // ── Calcular últimos 14 dias para consistência ───────────────────────────
  const cutoff14 = new Date(today + 'T12:00:00')
  cutoff14.setDate(cutoff14.getDate() - 13)
  const cutoff14Str = cutoff14.toISOString().split('T')[0]
  const days14 = days.filter(d => d.date >= cutoff14Str)

  // ── Checar padrões (ordem = prioridade) ─────────────────────────────────

  // 1. Under-logging — detectar antes de tudo, pois distorce outros padrões
  if (days14.length < 5) {
    return {
      type: 'under_logging',
      positive: false,
      headline: 'Você registra pouco nos momentos que mais importa.',
      detail: `Nos últimos 14 dias, registrou apenas ${days14.length} dia${days14.length !== 1 ? 's' : ''}. O sistema precisa de registros frequentes para funcionar a seu favor.`,
      dataPoints: totalDays,
    }
  }

  const dailyTotals = days.map(d => d.total)

  // 2. Snacking — lanches > 30% das calorias na média dos dias com lanche
  const daysWithLanche = days.filter(d => (d.byType['lanche'] || 0) > 0)
  if (daysWithLanche.length >= 3) {
    const lanchePcts = daysWithLanche.map(d => (d.byType['lanche'] || 0) / (d.total || 1))
    const avgLanchePct = avg(lanchePcts)
    if (avgLanchePct > 0.30) {
      return {
        type: 'snacking',
        positive: false,
        headline: `Seu maior excesso não está no almoço. Está nos lanches.`,
        detail: `Em média, seus lanches representam ${Math.round(avgLanchePct * 100)}% das suas calorias diárias. Isso é alto — e fácil de mudar.`,
        dataPoints: totalDays,
      }
    }
  }

  // 3. Late overeating — jantar > 40% das calorias
  const daysWithJantar = days.filter(d => (d.byType['jantar'] || 0) > 0)
  if (daysWithJantar.length >= 3) {
    const jantarPcts = daysWithJantar.map(d => (d.byType['jantar'] || 0) / (d.total || 1))
    const avgJantarPct = avg(jantarPcts)
    if (avgJantarPct > 0.40) {
      return {
        type: 'late_overeating',
        positive: false,
        headline: `Você tende a perder o controle no jantar.`,
        detail: `Em média, seu jantar consome ${Math.round(avgJantarPct * 100)}% das suas calorias do dia. O que acontece antes do jantar está impactando suas escolhas.`,
        dataPoints: totalDays,
      }
    }
  }

  // 4. Weekend excess
  const weekdays = days.filter(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5)
  const weekends = days.filter(d => d.dayOfWeek === 0 || d.dayOfWeek === 6)
  if (weekdays.length >= 3 && weekends.length >= 2) {
    const avgWeekday = avg(weekdays.map(d => d.total))
    const avgWeekend = avg(weekends.map(d => d.total))
    if (avgWeekend > avgWeekday * 1.30) {
      const diff = Math.round(avgWeekend - avgWeekday)
      return {
        type: 'weekend_excess',
        positive: false,
        headline: `Seu fim de semana está anulando o esforço da semana.`,
        detail: `Você consome em média ${diff} kcal a mais no fim de semana do que nos dias úteis. É o padrão mais comum — e um dos mais tratáveis.`,
        dataPoints: totalDays,
      }
    }
  }

  // 5. Breakfast skipper
  const daysWithCafe = days.filter(d => (d.byType['cafe_da_manha'] || 0) > 0)
  const cafePresencePct = daysWithCafe.length / days.length
  if (cafePresencePct < 0.40 && totalDays >= 7) {
    return {
      type: 'breakfast_skipper',
      positive: false,
      headline: `Você costuma pular o café da manhã.`,
      detail: `Em ${Math.round((1 - cafePresencePct) * 100)}% dos dias registrados, não há café da manhã. Quem pula o café tende a compensar no jantar.`,
      dataPoints: totalDays,
    }
  }

  // 6. Calorie spikes — alta variância
  if (dailyTotals.length >= 7) {
    const sd = stdDev(dailyTotals)
    if (sd > 500) {
      return {
        type: 'calorie_spikes',
        positive: false,
        headline: `Sua alimentação é muito irregular de dia para dia.`,
        detail: `Seus dias variam em até ${Math.round(sd * 2)} kcal entre si. Alta variância dificulta a adaptação metabólica e o controle de peso.`,
        dataPoints: totalDays,
      }
    }
  }

  // ── Padrões positivos ────────────────────────────────────────────────────

  // 7. Breakfast anchor — café consistente
  if (cafePresencePct >= 0.70) {
    return {
      type: 'breakfast_anchor',
      positive: true,
      headline: `Você é consistente no café da manhã. É sua âncora.`,
      detail: `Em ${Math.round(cafePresencePct * 100)}% dos seus dias, o café da manhã está presente. Quem tem esse hábito tende a manter controle no resto do dia. Proteja essa refeição.`,
      dataPoints: totalDays,
    }
  }

  // 8. Consistent logger
  if (days14.length >= 10) {
    return {
      type: 'consistent_logger',
      positive: true,
      headline: `Seu padrão de registro está acima da média.`,
      detail: `${days14.length} dos últimos 14 dias com registro. Isso é raro — a maioria abandona antes de chegar aqui. Esses dados já permitem análises precisas.`,
      dataPoints: totalDays,
    }
  }

  // 9. Balanced — sem problemas detectados
  return {
    type: 'balanced',
    positive: true,
    headline: `Seu padrão está equilibrado no momento.`,
    detail: `Nenhum desvio significativo detectado. Continue registrando para refinamentos mais precisos.`,
    dataPoints: totalDays,
  }
}
