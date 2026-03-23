# Billing & Planos — BACEN Monitor

## Modelo: Mensalidade Fixa + Volume Excedente

Inspirado em Twilio/Datadog: base previsível para o cliente, escala natural para o produto.

### Por que não só flat ou só por transação

| Modelo | Problema |
|--------|---------|
| Flat apenas | Banco com 400k ops/mês paga o mesmo que cooperativa com 5k — deixa muito dinheiro na mesa |
| Por transação apenas | CFO não consegue aprovar linha orçamentária variável; churn alto em meses com volume baixo |
| **Híbrido** | Base fixa para orçamento, volume captura o valor real entregue a grandes clientes ✅ |

---

## Contagem de Operações por CADOC

| CADOC | O que é 1 operação |
|-------|--------------------|
| 3040  | 1 par cliente-operação (`<Op>` dentro de `<Cli>`) |
| 3044  | 1 elemento no array `operacoes` (acao=1 ou acao=2) |
| 4010  | 1 conta COSIF no array `contas` |
| 6334  | 1 linha nos arquivos CONCCRED + INTERCAM + LUCRCRED |
| 3060  | Arquivo inteiro = 1 op (irrelevante em volume) |

**Não conta:** validações (validate-only), downloads, visualizações de dashboard.

---

## Tabela de Planos

```
Plano         | Mensalidade | Ops inclusas | Excedente    | Usuários | API   | SLA
──────────────────────────────────────────────────────────────────────────────────
Starter       | R$  690/mês |       5.000  | R$ 0,10/op  |    3     |  ✗   |  —
Professional  | R$1.990/mês |      50.000  | R$ 0,05/op  |   15     |  ✓   | 99.5%
Enterprise    | R$5.900/mês |     500.000  | R$ 0,02/op  |  ilim.   |  ✓   | 99.9%
API Only      | R$  290/mês |           0  | R$ 0,10/op  |    1     |  ✓   | 99.5%
```

---

## Implementação com Stripe

### Produtos necessários no Stripe

```
Produto 1: "BACEN Monitor Starter"
  └── Preço recorrente mensal: R$ 690,00
  └── Preço metered (excedente): R$ 0,10/op

Produto 2: "BACEN Monitor Professional"
  └── Preço recorrente mensal: R$ 1.990,00
  └── Preço metered (excedente): R$ 0,05/op

Produto 3: "BACEN Monitor Enterprise"
  └── Preço recorrente mensal: R$ 5.900,00
  └── Preço metered (excedente): R$ 0,02/op
```

### Fluxo de cobrança mensal

```
1. Job concluído
   → record_cadoc_usage(tenant_id, job_id, cadoc, n_ops)
   → INSERT INTO usage_records

2. Fim do mês (pg_cron: 1º de cada mês, 02:00 BRT)
   → SELECT SUM(n_operacoes) FROM usage_records WHERE billing_period = 'YYYY-MM'
   → Calcula excedente = MAX(0, total_ops - ops_included)
   → Se excedente > 0:
       stripe.billing.meterEvents.create({
         event_name: 'cadoc_operations',
         payload: { value: excedente, stripe_customer_id: ... }
       })

3. Stripe gera fatura automaticamente no dia 1
   → Webhook 'invoice.payment_succeeded' → marca billing como pago
   → Webhook 'invoice.payment_failed'    → envia alerta, pausa conta após 7 dias
```

### Add-ons opcionais (Stripe Products separados)

```
CADOC 3044 Fase 2 (cessões, aquisições, portabilidade)  → +R$ 490/mês
Reconciliação COSIF automatizada                          → +R$ 790/mês
White-label para consultorias                             → +R$ 2.900/mês
```

---

## Alertas de consumo

| Threshold | Ação |
|-----------|------|
| 80% das ops inclusas | E-mail + notificação in-app |
| 100% das ops inclusas | E-mail de aviso (cobrança de excedente ativada) |
| Fatura em aberto +7d | Conta pausada (read-only) |
| Fatura em aberto +30d | Conta cancelada |

---

## Trial (14 dias)

- Acesso completo ao plano Professional
- Limite: 1.000 operações total durante o trial
- Sem cartão de crédito para começar
- Ao expirar: downgrade automático para Starter (com prompt de upgrade)
- Extensão de trial: disponível via suporte para prospects qualificados
