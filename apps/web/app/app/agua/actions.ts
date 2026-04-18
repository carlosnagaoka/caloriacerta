'use server'

import { createClient as createAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function registrarAgua(
  userId: string,
  date: string,
  totalMl: number
): Promise<{ success: boolean; totalMl?: number }> {
  try {
    const ml = Math.max(0, Math.round(totalMl))

    const { error } = await supabaseAdmin
      .from('water_logs')
      .upsert(
        { user_id: userId, log_date: date, total_ml: ml, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,log_date' }
      )

    if (error) {
      console.error('[Água] Erro ao salvar:', error.message)
      return { success: false }
    }

    revalidatePath('/app/dashboard')
    return { success: true, totalMl: ml }
  } catch (err: any) {
    console.error('[Água] Erro:', err.message)
    return { success: false }
  }
}
