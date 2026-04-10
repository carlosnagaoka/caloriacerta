'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export interface OnboardingData {
  userId: string
  name: string
  objetivo: string
  sexo: string
  idade: number
  altura_cm: number
  peso_kg: number
  peso_alvo_kg: number
  nivel_atividade: string
  preocupacoes_saude: string[]
  prazo_semanas: number
  preferencia_alimentar: string
  refeicoes_por_dia: number
  horario_acordar: string
  horario_dormir: string
}

// Mifflin-St Jeor TDEE
function calcularTDEE(peso: number, altura: number, idade: number, sexo: string, atividade: string): number {
  const tmb = sexo === 'feminino'
    ? 10 * peso + 6.25 * altura - 5 * idade - 161
    : 10 * peso + 6.25 * altura - 5 * idade + 5
  const fatores: Record<string, number> = {
    sedentario: 1.2, leve: 1.375, moderado: 1.55, ativo: 1.725, muito_ativo: 1.9,
  }
  return Math.round(tmb * (fatores[atividade] ?? 1.55))
}

function calcularMeta(tdee: number, objetivo: string, prazo: number, pesoAtual: number, pesoAlvo: number): number {
  if (objetivo === 'manter') return tdee
  if (objetivo === 'emagrecer' && pesoAtual > pesoAlvo) {
    const deficit = Math.min(1000, ((pesoAtual - pesoAlvo) * 7700) / (prazo * 7))
    return Math.max(1200, Math.round(tdee - deficit))
  }
  if (objetivo === 'ganhar_massa') return Math.round(tdee + 300)
  return tdee
}

export async function salvarOnboarding(data: OnboardingData) {
  const tdee = calcularTDEE(data.peso_kg, data.altura_cm, data.idade, data.sexo, data.nivel_atividade)
  const meta = calcularMeta(tdee, data.objetivo, data.prazo_semanas, data.peso_kg, data.peso_alvo_kg)

  console.log('[Onboarding] Salvando para user:', data.userId, '| TDEE:', tdee, '| Meta:', meta)

  // Tentativa 1: salvar tudo (requer SQL ter sido rodado)
  const { error: fullError } = await supabaseAdmin
    .from('users')
    .update({
      name: data.name,
      sex: data.sexo,
      age: data.idade,
      weight_kg: data.peso_kg,
      daily_calorie_goal: meta,
      // colunas novas (requerem SQL)
      objetivo: data.objetivo,
      height_cm: data.altura_cm,
      peso_alvo_kg: data.peso_alvo_kg,
      nivel_atividade: data.nivel_atividade,
      preocupacoes_saude: data.preocupacoes_saude,
      prazo_semanas: data.prazo_semanas,
      preferencia_alimentar: data.preferencia_alimentar,
      refeicoes_por_dia: data.refeicoes_por_dia,
      horario_acordar: data.horario_acordar + ':00',
      horario_dormir: data.horario_dormir + ':00',
      tdee,
      onboarding_completo: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.userId)

  if (!fullError) {
    console.log('[Onboarding] Sucesso completo!')
    return { success: true, tdee, meta }
  }

  console.error('[Onboarding] Erro ao salvar completo:', fullError.message)
  console.log('[Onboarding] Tentando salvar apenas campos básicos...')

  // Tentativa 2: salvar só o que certamente existe na tabela
  const { error: minError } = await supabaseAdmin
    .from('users')
    .update({
      name: data.name,
      sex: data.sexo,
      age: data.idade,
      weight_kg: data.peso_kg,
      daily_calorie_goal: meta,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.userId)

  if (minError) {
    console.error('[Onboarding] Erro mesmo no mínimo:', minError.message)
    return { success: false, error: `Erro ao salvar: ${fullError.message}` }
  }

  // Salvou o mínimo — redireciona mas avisa sobre SQL
  console.log('[Onboarding] Salvo com campos básicos (SQL pendente)')
  return { success: true, tdee, meta, warning: 'SQL pendente' }
}
