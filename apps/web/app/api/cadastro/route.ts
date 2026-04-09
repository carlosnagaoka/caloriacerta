export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('[API Route] URL exists:', !!SUPABASE_URL)
console.log('[API Route] KEY exists:', !!SERVICE_KEY)

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  console.log('[API Route] Requisicao recebida')
  
  try {
    const body = await request.json()
    const { userId, name, email, sex, age, weight, dailyCalorieGoal } = body

    console.log('[API Route] Dados:', { userId, name, email })

    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        name,
        email,
        sex,
        age,
        weight_kg: weight,
        daily_calorie_goal: dailyCalorieGoal,
        ic_score: 0,
        ic_streak_days: 0,
        preferred_modes: ['scanner', 'daily'],
        status: 'ativo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('[API Route] Erro profile:', profileError)
      return NextResponse.json(
        { success: false, error: profileError.message },
        { status: 500 }
      )
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('slug', 'trial')
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, error: 'Plano trial nao encontrado' },
        { status: 500 }
      )
    }

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 10)

    await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        status: 'trial',
        starts_at: new Date().toISOString(),
        ends_at: trialEndsAt.toISOString(),
      })

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[API Route] Erro:', err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
