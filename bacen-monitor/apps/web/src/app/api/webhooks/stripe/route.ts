// apps/web/src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/billing'
import { createAdminClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature invalid:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    // ── Assinatura criada / atualizada ────────────────────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const plan = sub.metadata.plan ?? 'starter'
      const customerId = String(sub.customer)

      await supabase
        .from('tenants')
        .update({
          stripe_subscription_id: sub.id,
          subscription_status: sub.status,
          plan,
          ops_included: getPlanOps(plan),
          ops_price_cents: getPlanPriceCents(plan),
        })
        .eq('stripe_customer_id', customerId)

      console.log(`Subscription ${sub.status} for customer ${customerId}, plan: ${plan}`)
      break
    }

    // ── Assinatura cancelada ──────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('tenants')
        .update({
          subscription_status: 'canceled',
          plan: 'starter',
          ops_included: 5000,
          ops_price_cents: 10,
        })
        .eq('stripe_customer_id', String(sub.customer))
      break
    }

    // ── Pagamento bem-sucedido ────────────────────────────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = String(invoice.customer)

      // Reativa conta se estava pausada por falta de pagamento
      await supabase
        .from('tenants')
        .update({ is_active: true, subscription_status: 'active' })
        .eq('stripe_customer_id', customerId)
        .eq('subscription_status', 'past_due')

      console.log(`Invoice paid for customer ${customerId}: R$ ${(invoice.amount_paid / 100).toFixed(2)}`)
      break
    }

    // ── Pagamento falhou ──────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = String(invoice.customer)

      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (tenant) {
        await supabase.from('tenants').update({ subscription_status: 'past_due' })
          .eq('id', tenant.id)

        // Enviar notificação para todos os admins/owners do tenant
        await supabase.from('notifications').insert({
          tenant_id: tenant.id,
          type: 'billing.payment_failed',
          title: 'Falha no pagamento da fatura',
          body: 'Sua fatura não foi paga. Atualize o método de pagamento para evitar interrupção do serviço.',
          data: { invoice_id: invoice.id },
        })
      }
      break
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

function getPlanOps(plan: string): number {
  const map: Record<string, number> = {
    starter: 5000, professional: 50000, enterprise: 500000, api_only: 0,
  }
  return map[plan] ?? 5000
}

function getPlanPriceCents(plan: string): number {
  const map: Record<string, number> = {
    starter: 10, professional: 5, enterprise: 2, api_only: 10,
  }
  return map[plan] ?? 10
}
