'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function registrarPeso(userId: string, weightKg: number, date: string) {
  const { error } = await supabaseAdmin
    .from('weight_logs')
    .upsert(
      { user_id: userId, logged_at: date, weight_kg: weightKg },
      { onConflict: 'user_id,logged_at' }
    )

  if (error) return { success: false, error: error.message }

  // Atualiza o peso atual no perfil com o registro mais recente
  await supabaseAdmin
    .from('users')
    .update({ weight_kg: weightKg })
    .eq('id', userId)

  // Tenta ajuste adaptativo de TDEE (silencioso — só age se tiver 7+ registros)
  await ajustarTDEEAdaptativo(userId)

  revalidatePath('/app/dashboard')
  return { success: true }
}

export async function buscarPesos(userId: string, limit = 30) {
  const { data } = await supabaseAdmin
    .from('weight_logs')
    .select('logged_at, weight_kg')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit)

  return data || []
}

/**
 * Algoritmo adaptativo de TDEE — MacroFactor-style.
 * Fórmula: TDEE_real = média_kcal_logada - (Δpeso_kg × 7700 / dias)
 *
 * Exemplo: comeu 1.500 kcal/dia, perdeu 0,5 kg em 7 dias
 * → TDEE_real = 1.500 - (-0,5 × 7700 / 7) = 1.500 + 550 = 2.050 kcal
 *
 * Só ajusta se diferença > 150 kcal do TDEE atual (evita ruído).
 */
export async function ajustarTDEEAdaptativo(userId: string): Promise<{
  adjusted: boolean
  tdeeReal?: number
  novaMetaCalorica?: number
  tdeeAnterior?: number
}> {
  const [{ data: pesos }, { data: profile }] = await Promise.all([
    supabaseAdmin
      .from('weight_logs')
      .select('logged_at, weight_kg')
      .eq('user_id', userId)
      .order('logged_at', { ascending: true })
      .limit(30),
    supabaseAdmin
      .from('users')
      .select('tdee, daily_calorie_goal, peso_alvo_kg, weight_kg, objetivo')
      .eq('id', userId)
      .single(),
  ])

  if (!pesos || pesos.length < 7 || !profile) return { adjusted: false }

  // Usa os últimos 7 registros de peso
  const recentes = pesos.slice(-7)
  const primeiroDia = recentes[0].logged_at
  const ultimoDia = recentes[recentes.length - 1].logged_at
  const dias = Math.max(
    (new Date(ultimoDia).getTime() - new Date(primeiroDia).getTime()) / 86400000,
    1
  )

  const variacaoPeso = recentes[recentes.length - 1].weight_kg - recentes[0].weight_kg

  // Busca refeições do período
  const { data: refeicoes } = await supabaseAdmin
    .from('meals')
    .select('total_calories, meal_date')
    .eq('user_id', userId)
    .gte('meal_date', primeiroDia)
    .lte('meal_date', ultimoDia)

  if (!refeicoes || refeicoes.length < 5) return { adjusted: false }

  // Agrupa por dia e calcula média
  const porDia: Record<string, number> = {}
  refeicoes.forEach(r => {
    porDia[r.meal_date] = (porDia[r.meal_date] || 0) + r.total_calories
  })
  const diasLogados = Object.keys(porDia).length
  if (diasLogados < 5) return { adjusted: false }

  const mediaKcal = Object.values(porDia).reduce((s, c) => s + c, 0) / diasLogados

  // TDEE real: se peso caiu → queimou mais do que comeu
  const tdeeReal = Math.round(mediaKcal - (variacaoPeso * 7700) / dias)

  const tdeeAtual = profile.tdee || 2000
  if (Math.abs(tdeeReal - tdeeAtual) < 150) return { adjusted: false }

  // Mantém o mesmo déficit/superávit relativo
  const deficitAtual = tdeeAtual - (profile.daily_calorie_goal || tdeeAtual - 500)
  const novaMetaCalorica = Math.max(tdeeReal - deficitAtual, 1200)

  await supabaseAdmin
    .from('users')
    .update({ tdee: tdeeReal, daily_calorie_goal: novaMetaCalorica })
    .eq('id', userId)

  return { adjusted: true, tdeeReal, novaMetaCalorica, tdeeAnterior: tdeeAtual }
}
