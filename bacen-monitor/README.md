# BACEN Monitor — Plataforma RegTech para IFs Brasileiras

> Geração, validação e gestão de CADOCs regulatórios para o Banco Central do Brasil (BCB).  
> Multi-tenant SaaS · CADOC 3040/3044/3060/4010/6334 · Billing por volume

[![CI](https://github.com/seu-usuario/bacen-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/seu-usuario/bacen-monitor/actions)
[![License](https://img.shields.io/badge/license-Commercial-red.svg)](LICENSE)

---

## Visão Geral

O **BACEN Monitor** automatiza o ciclo de vida regulatório de Instituições Financeiras:

```
JSON/API  →  Geração XML/TXT  →  Validação BCB  →  Download/STA  →  Auditoria
```

### CADOCs Suportados

| CADOC | Nome | Formato | Periodicidade |
|-------|------|---------|---------------|
| 3040  | SCR — Operações de Crédito | XML | Mensal (D+5) |
| 3044  | SCR — Eventos de Crédito  | JSON | D+5 por evento |
| 3060  | SCR — Taxas de Juros       | XML | Semanal |
| 4010  | Balancete COSIF            | XML | Mensal (D+9) |
| 6334  | Cartões — Credenciadores   | 10× TXT | Trimestral |

---

## Arquitetura

```
bacen-monitor/
├── apps/
│   ├── web/          # Next.js 14 — App principal (dashboard, auth)
│   └── landing/      # Next.js — Site de marketing + pricing
├── packages/
│   ├── cadoc-engine/ # Core: parsers, validators, generators (NPM privado)
│   ├── ui/           # Design system (shadcn/ui extendido)
│   └── types/        # TypeScript types compartilhados
├── supabase/
│   ├── migrations/   # Schema SQL versionado
│   └── functions/    # Edge Functions (alertas, webhooks)
└── docs/             # Regras de negócio, leiautes BCB, ADRs
```

### Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, tRPC, Zod |
| Banco de Dados | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth (magic link + SSO enterprise) |
| Billing | Stripe (subscriptions + usage-based) |
| Deploy | Vercel (web + landing) |
| CI/CD | GitHub Actions |
| Monorepo | Turborepo |

---

## Início Rápido

### Pré-requisitos
- Node.js ≥ 20
- npm ≥ 10
- Supabase CLI
- Conta Vercel (deploy)
- Conta Stripe (billing)

### Setup local

```bash
# 1. Clone
git clone https://github.com/seu-usuario/bacen-monitor.git
cd bacen-monitor

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp apps/web/.env.example apps/web/.env.local
# Editar .env.local com suas credenciais

# 4. Banco de dados
supabase start
supabase db push
npm run db:seed

# 5. Rodar em desenvolvimento
npm run dev
```

Acesse: `http://localhost:3000`

---

## Variáveis de Ambiente

```bash
# apps/web/.env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (criar no dashboard Stripe)
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_ENTERPRISE=price_...
STRIPE_PRICE_USAGE_STARTER=price_...   # R$ 0,10/op excedente
STRIPE_PRICE_USAGE_PROFESSIONAL=price_...  # R$ 0,05/op
STRIPE_PRICE_USAGE_ENTERPRISE=price_...    # R$ 0,02/op

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Documentação

- [Regras de Negócio](docs/REGRAS_NEGOCIO.md)
- [CADOC 3040 — Leiaute e Validações](docs/CADOC_3040.md)
- [CADOC 3044 — Eventos de Crédito](docs/CADOC_3044.md)
- [API Reference](docs/API.md)
- [Billing & Planos](docs/BILLING.md)
- [Multi-tenancy](docs/MULTI_TENANCY.md)
- [ADRs](docs/adr/)

---

## Planos e Pricing

| Plano | Mensal | Operações Inclusas | Excedente |
|-------|--------|-------------------|-----------|
| Starter | R$ 690 | 5.000 | R$ 0,10/op |
| Professional | R$ 1.990 | 50.000 | R$ 0,05/op |
| Enterprise | R$ 5.900 | 500.000 | R$ 0,02/op |

> "Operação" = 1 cliente-operação no 3040, 1 evento no 3044, 1 linha no 6334, 1 conta no 4010.

---

## Licença

Código proprietário. Todos os direitos reservados.  
Veja [LICENSE](LICENSE) para detalhes.
