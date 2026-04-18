import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { titulo, tipoRefeicao, caloriasTotal } = await req.json()

    // Data local (Japão UTC+9)
    const now = new Date()
    const jpOffset = 9 * 60
    const jpDate = new Date(now.getTime() + jpOffset * 60000)
    const mealDate = jpDate.toISOString().split('T')[0]
    const mealTime = jpDate.toISOString().split('T')[1].slice(0, 5)

    // Cria a refeição
    const { data: meal, error: mealError } = await supabaseAdmin
      .from('meals')
      .insert({
        user_id: user.id,
        meal_type: tipoRefeicao,
        meal_date: mealDate,
        meal_time: mealTime,
        total_calories: caloriasTotal,
        notes: `Receita: ${titulo}`,
      })
      .select('id')
      .single()

    if (mealError || !meal) {
      console.error('[Receita] Erro ao criar meal:', mealError?.message)
      return NextResponse.json({ error: mealError?.message }, { status: 500 })
    }

    // Cria um meal_item com o nome da receita
    await supabaseAdmin.from('meal_items').insert({
      meal_id: meal.id,
      item_name: titulo,
      weight_grams: 100,
      calories_per_100g: caloriasTotal,
      total_calories: caloriasTotal,
    })

    return NextResponse.json({ success: true, mealId: meal.id })
  } catch (err: any) {
    console.error('[Receita] Erro:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
