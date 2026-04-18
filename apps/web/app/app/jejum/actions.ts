'use server'

import { createClient as createAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function iniciarJejum(
  userId: string,
  plan: string,
  targetHours: number
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    // Encerra qualquer sessão ativa anterior
    await supabaseAdmin
      .from('fasting_sessions')
      .update({ ended_at: new Date().toISOString(), completed: false })
      .eq('user_id', userId)
      .is('ended_at', null)

    const { data, error } = await supabaseAdmin
      .from('fasting_sessions')
      .insert({
        user_id: userId,
        plan,
        target_hours: targetHours,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) throw error

    revalidatePath('/app/dashboard')
    return { success: true, sessionId: data.id }
  } catch (err: any) {
    console.error('[Jejum] iniciar:', err.message)
    return { success: false, error: err.message }
  }
}

export async function encerrarJejum(
  sessionId: string,
  completed: boolean
): Promise<{ success: boolean }> {
  try {
    await supabaseAdmin
      .from('fasting_sessions')
      .update({ ended_at: new Date().toISOString(), completed })
      .eq('id', sessionId)

    revalidatePath('/app/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('[Jejum] encerrar:', err.message)
    return { success: false }
  }
}
