'use server'

// LOG IMEDIATO (antes de qualquer import)
console.log('>>>>>>>>>> ACTIONS.TS CARREGADO <<<<<<<<<<')

import { createClient } from '@supabase/supabase-js'

// Forçar leitura das variáveis de ambiente
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Debug: verificar no terminal do servidor
console.log('[Server Action] URL exists:', !!SUPABASE_URL)
console.log('[Server Action] KEY exists:', !!SERVICE_KEY)
console.log('[Server Action] KEY length:', SERVICE_KEY?.length)
console.log('[Server Action] KEY starts with:', SERVICE_KEY?.substring(0, 20))

// Cliente admin com service role (ignora RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function criarPerfilCompleto(formData: {
  userId: string
  name: string
  email: string
  sex: string
  age: number | null
  weight: number | null
  dailyCalorieGoal: number
}) {
  console.log('[Server Action] Iniciando para user:', formData.userId)

  try {
    // 1. Inserir na tabela users (service role ignora RLS)
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: formData.userId,
        name: formData.name,
        email: formData.email,
        sex: formData.sex,
        age: formData.age,
        weight_kg: formData.weight,
        daily_calorie_goal: formData.dailyCalorieGoal,
        ic_score: 0,
        ic_streak_days: 0,
        preferred_modes: ['scanner', 'daily'],
        status: 'ativo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    console.log('[Server Action] Insert result:', { data: insertData, error: insertError })

    if (insertError) {
      console.error('[Server Action] ERRO INSERT:', insertError)
      return { success: false, error: `DB Error: ${insertError.message} (code: ${insertError.code})` }
    }

    // 2. Buscar plano trial
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('slug', 'trial')
      .single()

    if (planError || !plan) {
      console.error('[Server Action] Plano não encontrado:', planError)
      return { success: false, error: 'Configuração: plano trial não encontrado' }
    }

    // 3. Criar subscription trial (10 dias)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 10)

    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: formData.userId,
        plan_id: plan.id,
        status: 'trial',
        starts_at: new Date().toISOString(),
        ends_at: trialEndsAt.toISOString(),
      })

    if (subError) {
      console.log('[Server Action] Subscription warning:', subError.message)
    }

    console.log('[Server Action] SUCESSO!')
    return { success: true }

  } catch (err: any) {
    console.error('[Server Action] CATCH ERROR:', err)
    return { success: false, error: `Exception: ${err.message}` }
  }
}