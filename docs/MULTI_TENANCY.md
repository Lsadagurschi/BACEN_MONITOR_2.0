# Multi-tenancy — BACEN Monitor

## Modelo de Isolamento

Utilizamos **Row-Level Security (RLS)** do PostgreSQL via Supabase.  
Cada tenant (IF) é isolado na mesma base de dados — sem schemas separados.

```
┌─────────────────────────────────────────────────────┐
│                   PostgreSQL DB                      │
│                                                      │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│   │ Tenant A │  │ Tenant B │  │ Tenant C │         │
│   │  (Banco) │  │  (Coop)  │  │ (Fintech)│         │
│   └──────────┘  └──────────┘  └──────────┘         │
│                                                      │
│   Isolamento via RLS: auth_tenant_id() = tenant.id  │
└─────────────────────────────────────────────────────┘
```

## Fluxo de Autenticação

```
1. Usuário entra com e-mail (magic link)
2. Supabase Auth cria sessão JWT
3. JWT contém user.id (UUID do auth.users)
4. RLS function auth_tenant_id():
     SELECT tenant_id FROM users WHERE id = auth.uid()
5. Todas as queries são filtradas automaticamente por tenant_id
```

## Onboarding de Novo Tenant

```
POST /api/onboarding
{
  "cnpj": "12345678000199",
  "name": "Banco Exemplo S.A.",
  "email": "compliance@banco.com.br",
  "plan": "starter"
}
```

Fluxo interno:
1. Validar CNPJ (algoritmo módulo 11)
2. Verificar se CNPJ já existe → erro 409
3. Criar `tenant` no banco
4. Criar cliente no Stripe
5. Criar usuário `owner` no `auth.users` + `users`
6. Enviar magic link por e-mail
7. Criar trial (14 dias)
8. Popular `delivery_schedules` com próximos vencimentos

## Convite de Usuários

Owners e Admins podem convidar outros usuários:
```
POST /api/users/invite
{
  "email": "analista@banco.com.br",
  "role": "compliance"
}
```

- Supabase envia e-mail de convite
- Ao aceitar, usuário é criado e associado ao tenant
- Limite por plano: Starter=3, Professional=15, Enterprise=ilimitado

## API Keys (integração machine-to-machine)

```
POST /api/api-keys
{ "name": "Integração Core Bancário", "scopes": ["cadoc:generate"] }

Response:
{
  "id": "uuid",
  "key": "bm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",  ← mostrado UMA VEZ
  "prefix": "bm_live_xxxx"
}
```

Uso:
```
curl -H "Authorization: Bearer bm_live_xxx..." \
     -X POST https://app.bacen-monitor.com.br/api/v1/cadoc/generate \
     -d '{"cadoc":"3040","input":{...}}'
```

## Segurança

### O que nunca armazenamos
- CPF/CNPJ de clientes em texto plano no `input_json`
  → Mascarar antes de persistir: `123.456.789-00` → `***.456.789-**`
- Senhas (auth por magic link + OAuth)
- Chaves de API em texto (apenas SHA-256 hash)

### Auditoria
Toda ação relevante é registrada em `audit_logs`:
- `cadoc.generate` — geração de arquivo
- `cadoc.download` — download de arquivo  
- `user.invite` — convite de usuário
- `billing.upgrade` — mudança de plano
- `api_key.created` / `api_key.revoked`
Retenção: 2 anos (obrigação regulatória BCB)

### Headers de segurança (Next.js)
```js
// next.config.js
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]
```
