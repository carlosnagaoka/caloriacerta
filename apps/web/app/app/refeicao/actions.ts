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
    proteinGrams?: number
    carbsGrams?: number
    fatGrams?: number
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
      ...(item.proteinGrams != null && { protein_grams: item.proteinGrams }),
      ...(item.carbsGrams   != null && { carbs_grams:   item.carbsGrams }),
      ...(item.fatGrams     != null && { fat_grams:     item.fatGrams }),
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

export async function atualizarRefeicao(
  mealId: string,
  items: Array<{
    foodId?: string
    name: string
    weight: number
    caloriesPer100g: number
    proteinGrams?: number
    carbsGrams?: number
    fatGrams?: number
  }>,
  meta?: { mealType?: string; mealTime?: string }
) {
  try {
    const totalCalories = items.reduce((sum, item) => {
      return sum + Math.round((item.weight * item.caloriesPer100g) / 100)
    }, 0)

    // Atualiza campos da refeição (tipo, hora, total)
    const mealUpdate: Record<string, any> = { total_calories: totalCalories }
    if (meta?.mealType) mealUpdate.meal_type = meta.mealType
    if (meta?.mealTime) mealUpdate.meal_time = meta.mealTime

    await supabaseAdmin.from('meals').update(mealUpdate).eq('id', mealId)

    // Apaga os itens antigos e insere os novos
    const { error: deleteError } = await supabaseAdmin
      .from('meal_items')
      .delete()
      .eq('meal_id', mealId)

    if (deleteError) {
      console.error('[atualizarRefeicao] Erro ao deletar itens:', deleteError)
      return { success: false, error: deleteError.message }
    }

    if (items.length > 0) {
      const newItems = items.map(item => ({
        meal_id: mealId,
        food_id: item.foodId || null,
        item_name: item.name,
        weight_grams: item.weight,
        calories_per_100g: item.caloriesPer100g,
        total_calories: Math.round((item.weight * item.caloriesPer100g) / 100),
        ...(item.proteinGrams != null && { protein_grams: item.proteinGrams }),
        ...(item.carbsGrams   != null && { carbs_grams:   item.carbsGrams }),
        ...(item.fatGrams     != null && { fat_grams:     item.fatGrams }),
      }))

      const { error: insertError } = await supabaseAdmin
        .from('meal_items')
        .insert(newItems)

      if (insertError) {
        console.error('[atualizarRefeicao] Erro ao inserir itens:', insertError)
        return { success: false, error: insertError.message }
      }
    }

    revalidatePath('/app/dashboard')
    revalidatePath('/app/historico')

    return { success: true, totalCalories }
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

// Busca combinada: banco global + histórico pessoal do usuário
// O histórico tem prioridade e aparece primeiro na lista
export async function buscarAlimentosComHistorico(busca: string, userId: string) {
  if (busca.length < 2) return []

  // 1. Banco global de alimentos
  const { data: globalFoods } = await supabaseAdmin
    .from('foods')
    .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category')
    .ilike('name', `%${busca}%`)
    .limit(8)

  // 2. Histórico pessoal: refeições deste usuário
  //    Busca os meal_ids do usuário primeiro
  const { data: userMeals } = await supabaseAdmin
    .from('meals')
    .select('id')
    .eq('user_id', userId)
    .limit(2000)

  const mealIds = (userMeals || []).map(m => m.id)

  let historyItems: any[] = []
  if (mealIds.length > 0) {
    const { data: rawHistory } = await supabaseAdmin
      .from('meal_items')
      .select('item_name, calories_per_100g, protein_grams, carbs_grams, fat_grams, weight_grams')
      .in('meal_id', mealIds)
      .ilike('item_name', `%${busca}%`)
      .gt('calories_per_100g', 0)
      .limit(100)

    // Agrupa por nome e calcula média de kcal/100g + frequência
    const grouped: Record<string, {
      name: string
      calSamples: number[]
      protSamples: number[]
      carbsSamples: number[]
      fatSamples: number[]
      frequency: number
    }> = {}

    for (const item of rawHistory || []) {
      const key = item.item_name.toLowerCase().trim()
      if (!grouped[key]) {
        grouped[key] = { name: item.item_name, calSamples: [], protSamples: [], carbsSamples: [], fatSamples: [], frequency: 0 }
      }
      grouped[key].frequency++
      if (item.calories_per_100g > 0) grouped[key].calSamples.push(item.calories_per_100g)
      // Se tem macros reais, normaliza para per100g
      if (item.protein_grams != null && item.weight_grams > 0)
        grouped[key].protSamples.push((item.protein_grams / item.weight_grams) * 100)
      if (item.carbs_grams != null && item.weight_grams > 0)
        grouped[key].carbsSamples.push((item.carbs_grams / item.weight_grams) * 100)
      if (item.fat_grams != null && item.weight_grams > 0)
        grouped[key].fatSamples.push((item.fat_grams / item.weight_grams) * 100)
    }

    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0

    historyItems = Object.values(grouped)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 6)
      .map(g => ({
        id: undefined,
        name: g.name,
        calories_per_100g: avg(g.calSamples),
        protein_per_100g: avg(g.protSamples) || undefined,
        carbs_per_100g: avg(g.carbsSamples) || undefined,
        fat_per_100g: avg(g.fatSamples) || undefined,
        category: null,
        fromHistory: true,
        frequency: g.frequency,
      }))
  }

  // Mescla: histórico primeiro, depois banco global (sem duplicatas por nome)
  const historyNames = new Set(historyItems.map(i => i.name.toLowerCase()))
  const dedupedGlobal = (globalFoods || []).filter(f => !historyNames.has(f.name.toLowerCase()))

  return [...historyItems, ...dedupedGlobal]
}