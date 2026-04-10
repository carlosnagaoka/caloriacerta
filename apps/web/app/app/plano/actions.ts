'use server'

import { stripe } from '@/lib/stripe'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * Cria uma sessão no Stripe Customer Portal.
 * Permite ao usuário: cancelar, trocar plano, atualizar cartão.
 */
export async function criarPortalSession(
  userId: string
): Promise<{ url?: string; error?: string }> {
  try {
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (!profile?.stripe_customer_id) {
      return { error: 'Nenhuma assinatura ativa encontrada.' }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://caloriacerta.app'

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${baseUrl}/app/plano`,
    })

    return { url: session.url }
  } catch (err: any) {
    return { error: err.message }
  }
}
