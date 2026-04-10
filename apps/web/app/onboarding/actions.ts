'use server'

import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export interface OnboardingData {
  userId: string
  name: string
  objetivo: string          // emagrecer | manter | ganhar_massa
  sexo: string              // masculino | feminino
  idade: number
  altura_cm: number
  peso_kg: number
  peso_alvo_kg: number
  nivel_atividade: string   // sedentario | leve | moderado | ativo | muito_ativo
  preocupacoes_saude: string[]
  prazo_semanas: number
  preferencia_alimentar: string  // onivoro | vegetariano | vegano | low_carb | outro
  refeicoes_por_dia: number
  horario_acordar: string   // HH:MM
  horario_dormir: string    // HH:MM
}

// Mifflin-St Jeor TDEE
function calcularTDEE(
  peso: number,
  altura: number,
  idade: number,
  sexo: string,
  atividade: string
): number {
  const tmb =
    sexo === 'feminino'
      ? 10 * peso + 6.25 * altura - 5 * idade - 161
      : 10 * peso + 6.25 * altura - 5 * idade + 5

  const fatores: Record<string, number> = {
    sedentario: 1.2,
    leve: 1.375,
    moderado: 1.55,
    ativo: 1.725,
    muito_ativo: 1.9,
  }

  const fator = fatores[atividade] ?? 1.55
  return Math.round(tmb * fator)
}

function calcularMeta(tdee: number, objetivo: string, prazo: number, pesoAtual: number, pesoAlvo: number): number {
  if (objetivo === 'manter') return tdee
  const diffKg = pesoAtual - pesoAlvo
  if (objetivo === 'emagrecer' && diffKg > 0) {
    // Déficit: max 1000 kcal/dia, min 1200 kcal
    const deficit = Math.min(1000, (diffKg * 7700) / (prazo * 7))
    return Math.max(1200, Math.round(tdee - deficit))
  }
  if (objetivo === 'ganhar_massa') {
    return Math.round(tdee + 300)
  }
  return tdee
}

export async function salvarOnboarding(data: OnboardingData) {
  const tdee = calcularTDEE(data.peso_kg, data.altura_cm, data.idade, data.sexo, data.nivel_atividade)
  const meta = calcularMeta(tdee, data.objetivo, data.prazo_semanas, data.peso_kg, data.peso_alvo_kg)

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      name: data.name,
      objetivo: data.objetivo,
      sex: data.sexo,
      age: data.idade,
      height_cm: data.altura_cm,
      weight_kg: data.peso_kg,
      peso_alvo_kg: data.peso_alvo_kg,
      nivel_atividade: data.nivel_atividade,
      preocupacoes_saude: data.preocupacoes_saude,
      prazo_semanas: data.prazo_semanas,
      preferencia_alimentar: data.preferencia_alimentar,
      refeicoes_por_dia: data.refeicoes_por_dia,
      horario_acordar: data.horario_acordar,
      horario_dormir: data.horario_dormir,
      daily_calorie_goal: meta,
      tdee,
      onboarding_completo: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.userId)

  if (error) {
    console.error('[Onboarding] Erro ao salvar:', error)
    return { success: false, error: error.message }
  }

  return { success: true, tdee, meta }
}
