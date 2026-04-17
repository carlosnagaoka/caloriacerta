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

// URL de produção — fixa para evitar qualquer ambiguidade com env vars
const BASE_URL = 'https://caloriacerta.vercel.app'

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
    const successUrl = `${BASE_URL}/app/dashboard?assinatura=sucesso`
    const cancelUrl  = `${BASE_URL}/assinar?cancelado=1`
    console.log('[Checkout] user:', user.id)
    console.log('[Checkout] priceId:', priceId)
    console.log('[Checkout] success_url:', successUrl)
    console.log('[Checkout] cancel_url:', cancelUrl)

    // Cria customer Stripe (sem depender da coluna stripe_customer_id)
    const email = user.email || profile?.email || ''
    const customer = await stripe.customers.create({
      email,
      name: profile?.name || undefined,
      metadata: { supabase_user_id: user.id },
    })
    console.log('[Checkout] customer criado:', customer.id)

    // Salva o customer ID se a coluna existir (ignora erro se não existir)
    await supabaseAdmin
      .from('users')
      .update({ stripe_customer_id: customer.id })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) console.log('[Checkout] stripe_customer_id não salvo (coluna ausente):', error.message)
      })

    // Checkout mínimo — apenas campos obrigatórios
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    })
    console.log('[Checkout] session criada:', session.id, '| url:', session.url?.slice(0, 50))

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

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${BASE_URL}/app/dashboard`,
  })

  redirect(session.url)
}
