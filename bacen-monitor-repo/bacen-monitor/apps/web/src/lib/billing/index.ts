// apps/web/src/lib/billing/index.ts
import Stripe from 'stripe'
import type { CadocType } from '@bacen-monitor/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  appInfo: {
    name: 'BACEN Monitor',
    version: '1.0.0',
  },
})

// ── Mapa de Price IDs por plano ───────────────────────────────
export const PLAN_PRICES = {
  starter:      process.env.STRIPE_PRICE_STARTER!,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL!,
  enterprise:   process.env.STRIPE_PRICE_ENTERPRISE!,
} as const

export const METER_PRICES = {
  starter:      process.env.STRIPE_METER_STARTER!,
  professional: process.env.STRIPE_METER_PROFESSIONAL!,
  enterprise:   process.env.STRIPE_METER_ENTERPRISE!,
} as const

// ── Ops incluídas por plano ───────────────────────────────────
export const PLAN_OPS_INCLUDED = {
  starter:      5_000,
  professional: 50_000,
  enterprise:   500_000,
  api_only:     0,
} as const

// ── Preço do excedente (centavos BRL) ─────────────────────────
export const PLAN_OPS_PRICE_CENTS = {
  starter:      10,   // R$ 0,10
  professional: 5,    // R$ 0,05
  enterprise:   2,    // R$ 0,02
  api_only:     10,
} as const

// ── Peso de cada CADOC para contagem de operações ─────────────
export const CADOC_OP_WEIGHT: Record<CadocType, number> = {
  '3040': 1,     // 1 par cliente-operação
  '3044': 1,     // 1 evento
  '4010': 1,     // 1 conta COSIF
  '6334': 1,     // 1 linha CONCCRED/INTERCAM/LUCRCRED
  '3060': 0,     // arquivo pequeno — não conta
  '2050': 1,
  '2055': 1,
  '3050': 0,
}

// ── Criar checkout session para upgrade ───────────────────────
export async function createCheckoutSession({
  customerId,
  plan,
  successUrl,
  cancelUrl,
}: {
  customerId: string
  plan: keyof typeof PLAN_PRICES
  successUrl: string
  cancelUrl: string
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: PLAN_PRICES[plan],
        quantity: 1,
      },
      {
        price: METER_PRICES[plan],  // metered — excedente
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: 'pt-BR',
    currency: 'brl',
    subscription_data: {
      metadata: { plan },
    },
  })
}

// ── Criar portal de billing (gerenciar assinatura) ────────────
export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

// ── Registrar uso no Stripe (operações excedentes) ────────────
export async function reportUsageToStripe({
  subscriptionItemId,
  quantity,
  timestamp,
}: {
  subscriptionItemId: string
  quantity: number
  timestamp?: number
}) {
  if (quantity <= 0) return null

  return stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp: timestamp ?? Math.floor(Date.now() / 1000),
    action: 'increment',
  })
}
