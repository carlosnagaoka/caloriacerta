import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    // Testa se a chave Stripe está funcionando
    const balance = await stripe.balance.retrieve()
    return NextResponse.json({
      ok: true,
      available: balance.available,
      currency: balance.available[0]?.currency,
    })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message,
      type: err.type,
    }, { status: 500 })
  }
}
