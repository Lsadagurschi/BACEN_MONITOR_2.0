# API Reference — BACEN Monitor

Base URL: `https://app.bacen-monitor.com.br/api/v1`

## Autenticação

Todas as requisições devem incluir a API Key no header:
```
Authorization: Bearer bm_live_xxxxxxxxxxxxxxxxxxxx
```

Ou para usuários autenticados via sessão:
```
Cookie: sb-access-token=eyJ...
```

---

## POST /cadoc/generate

Gera e valida um arquivo CADOC a partir de JSON.

### Request
```json
{
  "cadoc": "3040",
  "input": {
    "cabecalho": {
      "CNPJ": "12345678",
      "DtBase": "2026-01-31",
      "MetodApPE": "S",
      "TotalCli": 1
    },
    "clientes": [...]
  },
  "options": {
    "validate": true
  }
}
```

### Response 200
```json
{
  "jobId": "uuid",
  "cadoc": "3040",
  "filename": "cadoc3040_12345678_20260131.xml",
  "nOperacoes": 42,
  "downloadUrl": "https://storage.bacen-monitor.com.br/...",
  "validation": {
    "nErros": 0,
    "nAvisos": 2,
    "erros": [],
    "avisos": [
      {
        "tipo": "aviso",
        "cod": "MV01",
        "msg": "Somatório de saldos diverge do COSIF 4010 em R$ 150,00"
      }
    ]
  }
}
```

### Response 422 (erros de validação)
```json
{
  "error": "VALIDATION_FAILED",
  "message": "3 erro(s) de validação impedem a geração",
  "validation": {
    "nErros": 3,
    "erros": [...]
  }
}
```

### Response 402 (limite de plano)
```json
{
  "error": "USAGE_LIMIT_EXCEEDED",
  "message": "Limite de 5.000 operações/mês atingido. Faça upgrade para Professional.",
  "opsUsed": 4987,
  "opsLimit": 5000
}
```

---

## POST /cadoc/validate

Valida um JSON sem gerar o arquivo (não consome ops do plano).

### Request
```json
{
  "cadoc": "3044",
  "input": { ... }
}
```

### Response 200
```json
{
  "valid": true,
  "nErros": 0,
  "nAvisos": 1,
  "erros": [],
  "avisos": [...]
}
```

---

## GET /cadoc/jobs

Lista histórico de jobs do tenant.

### Query params
| Param | Tipo | Descrição |
|-------|------|-----------|
| `cadoc` | string | Filtrar por CADOC (3040, 3044...) |
| `status` | string | pending, completed, failed |
| `from` | ISO date | Data início |
| `to` | ISO date | Data fim |
| `limit` | int | Default 20, máx 100 |
| `offset` | int | Para paginação |

### Response 200
```json
{
  "data": [
    {
      "id": "uuid",
      "cadoc": "3040",
      "cnpjIf": "12345678",
      "dataBase": "2026-01",
      "status": "completed",
      "result": "aprovado",
      "nErros": 0,
      "nAvisos": 0,
      "nOperacoes": 42,
      "createdAt": "2026-03-17T14:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

## GET /cadoc/jobs/:id

Detalhes de um job específico, incluindo relatório de validação.

---

## GET /billing/usage

Consumo do mês atual.

### Response 200
```json
{
  "billingPeriod": "2026-03",
  "plan": "professional",
  "totalOps": 12450,
  "opsIncluded": 50000,
  "opsExcedentes": 0,
  "custoExcedenteCentavos": 0,
  "opsPorCadoc": {
    "3040": 8200,
    "3044": 3800,
    "4010": 450
  }
}
```

---

## GET /delivery/calendar

Calendário de vencimentos regulatórios.

### Response 200
```json
{
  "data": [
    {
      "cadoc": "3040",
      "periodoRef": "2026-02",
      "prazo": "2026-03-07",
      "diasRestantes": -10,
      "entregue": true,
      "jobId": "uuid",
      "entregueEm": "2026-03-05T10:30:00Z"
    },
    {
      "cadoc": "4010",
      "periodoRef": "2026-02",
      "prazo": "2026-03-13",
      "diasRestantes": -4,
      "entregue": false
    }
  ]
}
```

---

## Rate Limits

| Plano | Requests/min | Requests/hora |
|-------|-------------|---------------|
| Starter | 30 | 500 |
| Professional | 120 | 5.000 |
| Enterprise | 600 | 50.000 |

Headers de rate limit retornados em toda resposta:
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1710684000
```

---

## Webhooks

Configure uma URL para receber eventos em:  
`Settings → Integrações → Webhooks`

### Eventos disponíveis

| Evento | Quando |
|--------|--------|
| `job.completed` | Job finalizado com sucesso |
| `job.failed` | Job falhou |
| `delivery.vencendo` | Prazo ≤ 7 dias sem entrega |
| `delivery.vencido` | Prazo expirado sem entrega |
| `billing.usage_alert` | 80% do limite de ops atingido |
| `subscription.updated` | Plano alterado |

### Payload
```json
{
  "event": "delivery.vencendo",
  "tenantId": "uuid",
  "timestamp": "2026-03-17T14:00:00Z",
  "data": {
    "cadoc": "3040",
    "periodoRef": "2026-03",
    "prazo": "2026-03-07",
    "diasRestantes": 3
  }
}
```

Assinatura HMAC-SHA256 no header `X-Bacen-Signature`.
