// Billing lib — Stripe integration (stub until auth is enabled)
export const PLAN_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER || '',
  professional: process.env.STRIPE_PRICE_PROFESSIONAL || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
}
export const PLAN_OPS_INCLUDED = {
  starter: 5000,
  professional: 50000,
  enterprise: 500000,
  api_only: 0,
}
