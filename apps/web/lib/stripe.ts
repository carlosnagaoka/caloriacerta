import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// Price IDs por plano e moeda
export const PRICES = {
  basico: {
    jpy: {
      mensal: 'price_1TKYdo64Tsnlqs9zqTYH16zM',  // ¥490/mês
      anual:  'price_1TKYf564Tsnlqs9z7XhlCTo1',  // ¥3,900/ano
    },
    brl: {
      mensal: 'price_1TKYg464Tsnlqs9zZNbM4AVb',  // R$14,90/mês
      anual:  'price_1TKYgn64Tsnlqs9zH6j4VY8m',  // R$119/ano
    },
  },
  premium: {
    jpy: {
      mensal: 'price_1TKZQf64Tsnlqs9zzWqkXhE0',  // ¥980/mês
      anual:  'price_1TKZTu64Tsnlqs9zBPi0tux8',  // ¥7,800/ano
    },
    brl: {
      mensal: 'price_1TKZXe64Tsnlqs9zwKSGtHnX',  // R$29,90/mês
      anual:  'price_1TKZYT64Tsnlqs9z9hBYrLFT',  // R$239/ano
    },
  },
} as const

export type Plano = 'basico' | 'premium'
export type Moeda = 'jpy' | 'brl'
export type Periodo = 'mensal' | 'anual'
