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

// Retorna a URL em vez de redirecionar — client faz window.location.href
export async function criarCheckoutSession(
  plano: Plano,
  moeda: Moeda,
  periodo: Periodo
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autenticado' }

    const { data: profile } = await supabase
      .from('users')
      .select('email, name, stripe_customer_id')
      .eq('id', user.id)
      .single()

    const priceId = PRICES[plano][moeda][periodo]
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://caloriacerta.vercel.app'

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
      // Deixa o Stripe escolher os métodos automaticamente por país/moeda
      automatic_payment_methods: { enabled: true },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'pt-BR',
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://caloriacerta.vercel.app'

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${baseUrl}/app/dashboard`,
  })

  redirect(session.url)
}
