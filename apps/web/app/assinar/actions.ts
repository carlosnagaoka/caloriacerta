'use server'

import { stripe, PRICES, type Plano, type Moeda, type Periodo } from '@/lib/stripe'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * Determina a URL base de forma robusta.
 * Prioridade: APP_URL explícita > VERCEL_URL automática > fallback hardcoded.
 * Remove barra final para evitar double-slash nas rotas.
 */
function getBaseUrl(): string {
  // 1. Variável explícita (sem NEXT_PUBLIC_ para ser segura no servidor)
  const explicit = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL
  if (explicit) return explicit.replace(/\/$/, '')

  // 2. VERCEL_URL é definida automaticamente pelo Vercel (sem https://)
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return `https://${vercelUrl}`

  // 3. Fallback hardcoded
  return 'https://caloriacerta.vercel.app'
}

// Retorna a URL em vez de redirecionar — client faz window.location.href
export async function criarCheckoutSession(
  plano: Plano,
  moeda: Moeda,
  periodo: Periodo
): Promise<{ url?: string; error?: string }> {
  try {
    // Verifica variáveis críticas antes de qualquer chamada
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Checkout] STRIPE_SECRET_KEY não definida')
      return { error: 'Configuração de pagamento ausente. Contate o suporte.' }
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('[Checkout] Auth error:', authError.message)
      return { error: 'Sessão expirada. Faça login novamente.' }
    }
    if (!user) return { error: 'Não autenticado. Faça login.' }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('email, name, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Checkout] Profile error:', profileError.message)
      // Continua sem perfil — usa dados do auth
    }

    const priceId = PRICES[plano][moeda][periodo]
    const baseUrl = getBaseUrl()
    console.log('[Checkout] user:', user.id, '| baseUrl:', baseUrl, '| priceId:', priceId)

    // Reusar ou criar customer no Stripe
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email!,
        name: profile?.name || undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/app/dashboard?assinatura=sucesso`,
      cancel_url: `${baseUrl}/assinar?cancelado=1`,
      metadata: {
        supabase_user_id: user.id,
        plano,
        moeda,
        periodo,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plano,
        },
      },
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    return { url: session.url! }

  } catch (err: any) {
    console.error('[Checkout] Erro:', err.message)
    return { error: err.message }
  }
}

export async function criarPortalSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) redirect('/assinar')

  const baseUrl = getBaseUrl()

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${baseUrl}/app/dashboard`,
  })

  redirect(session.url)
}
