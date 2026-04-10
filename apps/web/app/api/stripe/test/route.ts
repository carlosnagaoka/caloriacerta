import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    // Testa se a chave Stripe está funcionando
    const account = await stripe.accounts.retrieve()
    return NextResponse.json({
      ok: true,
      accountId: account.id,
      country: account.country,
      currency: account.default_currency,
    })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message,
      type: err.type,
    }, { status: 500 })
  }
}
