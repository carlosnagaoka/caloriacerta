import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function planoFromPriceId(priceId: string): string {
  const premiumIds = [
    'price_1TKZQf64Tsnlqs9zzWqkXhE0',
    'price_1TKZTu64Tsnlqs9zBPi0tux8',
    'price_1TKZXe64Tsnlqs9zwKSGtHnX',
    'price_1TKZYT64Tsnlqs9z9hBYrLFT',
  ]
  return premiumIds.includes(priceId) ? 'premium' : 'basico'
}

async function atualizarSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  status: string
) {
  const priceId = subscription.items.data[0]?.price.id || ''
  const plano = planoFromPriceId(priceId)

  // Buscar plan_id na tabela plans
  const { data: plan } = await supabaseAdmin
    .from('plans')
    .select('id')
    .eq('slug', plano)
    .single()

  const endsAt = new Date((subscription as any).current_period_end * 1000).toISOString()

  // Atualizar ou criar subscription
  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existing) {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        plan_id: plan?.id,
        status,
        ends_at: endsAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  } else {
    await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: plan?.id,
        status,
        starts_at: new Date().toISOString(),
        ends_at: endsAt,
      })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('[Webhook] Assinatura inválida:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[Webhook] Evento recebido:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        if (!userId || !session.subscription) break

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        await atualizarSubscription(userId, subscription, 'active')
        console.log('[Webhook] Assinatura criada para user:', userId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id
        if (!userId) break

        const status = subscription.status === 'active' ? 'active'
          : subscription.status === 'past_due' ? 'expired'
          : subscription.status === 'canceled' ? 'cancelled'
          : subscription.status

        await atualizarSubscription(userId, subscription, status)
        console.log('[Webhook] Subscription atualizada:', userId, status)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id
        if (!userId) break

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'cancelled',
            ends_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        console.log('[Webhook] Assinatura cancelada:', userId)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Webhook] Erro ao processar:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
