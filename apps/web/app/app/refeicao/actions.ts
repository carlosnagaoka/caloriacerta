'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function salvarRefeicao(formData: {
  userId: string
  mealType: string
  mealDate: string
  mealTime: string
  photoUrl: string | null
  notes: string
  items: Array<{
    foodId?: string
    name: string
    weight: number
    caloriesPer100g: number
  }>
}) {
  console.log('[Refeicao Action] Salvando para user:', formData.userId)

  try {
    // Calcular total da refeição
    const totalCalories = formData.items.reduce((sum, item) => {
      const itemCalories = (item.weight * item.caloriesPer100g) / 100
      return sum + itemCalories
    }, 0)

    // 1. Buscar ou criar evento de consciência para a data
    let event: any

    const { data: existingEvent } = await supabaseAdmin
      .from('consciousness_events')
      .select('id')
      .eq('user_id', formData.userId)
      .eq('meal_date', formData.mealDate)
      .eq('event_type', 'daily')
      .single()

    if (existingEvent) {
      event = existingEvent
    } else {
      const { data: newEvent, error: eventError } = await supabaseAdmin
        .from('consciousness_events')
        .insert({
          user_id: formData.userId,
          event_type: 'daily',
          meal_date: formData.mealDate,
          estimated_calories_min: Math.round(totalCalories * 0.9),
          estimated_calories_max: Math.round(totalCalories * 1.1),
          photo_path: formData.photoUrl,
          mood: null,
          processed_by_ia: false,
          ic_contribution: 0.5,
        })
        .select()
        .single()

      if (eventError) {
        console.error('[Refeicao Action] Erro evento:', eventError)
        return { success: false, error: 'Erro ao criar evento: ' + eventError.message }
      }

      event = newEvent
    }

    // 2. Criar refeição
    const { data: meal, error: mealError } = await supabaseAdmin
      .from('meals')
      .insert({
        user_id: formData.userId,
        consciousness_event_id: event.id,
        meal_type: formData.mealType,
        meal_date: formData.mealDate,
        meal_time: formData.mealTime,
        photo_path: formData.photoUrl,
        notes: formData.notes,
        total_calories: Math.round(totalCalories),
      })
      .select()
      .single()

    if (mealError) {
      console.error('[Refeicao Action] Erro refeição:', mealError)
      return { success: false, error: 'Erro ao criar refeição: ' + mealError.message }
    }

    // 3. Criar itens da refeição
    const mealItems = formData.items.map(item => ({
      meal_id: meal.id,
      food_id: item.foodId || null,
      item_name: item.name,
      weight_grams: item.weight,
      calories_per_100g: item.caloriesPer100g,
      total_calories: Math.round((item.weight * item.caloriesPer100g) / 100),
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('meal_items')
      .insert(mealItems)

    if (itemsError) {
      console.error('[Refeicao Action] Erro itens:', itemsError)
      // Não falha tudo, só loga
    }

    // 4. Atualizar IC Score do usuário (simplificado)
    await supabaseAdmin.rpc('increment_streak', { user_uuid: formData.userId })

    console.log('[Refeicao Action] Sucesso! Total calorias:', totalCalories)

    revalidatePath('/app/dashboard')
    revalidatePath('/app/historico')

    return {
      success: true,
      mealId: meal.id,
      totalCalories: Math.round(totalCalories)
    }

  } catch (err: any) {
    console.error('[Refeicao Action] Erro catch:', err)
    return { success: false, error: err.message }
  }
}

export async function excluirRefeicao(mealId: string) {
  try {
    // meal_items são deletados em cascata via FK
    const { error } = await supabaseAdmin
      .from('meals')
      .delete()
      .eq('id', mealId)

    if (error) {
      console.error('[Refeicao Action] Erro ao excluir:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/app/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function registrarTrigger(mealId: string, triggerType: string) {
  try {
    const { error } = await supabaseAdmin
      .from('meals')
      .update({ trigger_type: triggerType })
      .eq('id', mealId)

    if (error) {
      console.error('[Refeicao Action] Erro ao registrar trigger:', error)
      return { success: false }
    }
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function buscarAlimentos(busca: string) {
  const { data, error } = await supabaseAdmin
    .from('foods')
    .select('id, name, calories_per_100g, category')
    .ilike('name', `%${busca}%`)
    .limit(10)

  if (error) {
    console.error('[Refeicao Action] Erro busca:', error)
    return []
  }

  return data || []
}