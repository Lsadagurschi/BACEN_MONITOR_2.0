# Regras de Negócio — BACEN Monitor

## 1. Multi-tenancy

Cada **tenant** corresponde a uma Instituição Financeira (IF) identificada por CNPJ.

### Isolamento de dados
- Cada tenant só acessa seus próprios dados (Row-Level Security no PostgreSQL)
- A função `auth_tenant_id()` retorna o tenant do usuário autenticado
- Service Role Key **nunca** é exposta no frontend

### Hierarquia de usuários por tenant
| Role | Pode gerar CADOCs | Pode baixar | Pode gerenciar usuários | Pode ver billing |
|------|-------------------|-------------|------------------------|-----------------|
| `owner` | ✅ | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ (exceto owner) | ✅ |
| `compliance` | ✅ | ✅ | ❌ | ❌ |
| `viewer` | ❌ | ✅ | ❌ | ❌ |

---

## 2. CADOCs e Periodicidade

### Calendário Regulatório
| CADOC | Periodicidade | Prazo | Base Normativa |
|-------|--------------|-------|----------------|
| 3040  | Mensal | D+5 úteis | Res. CMN 3.658/2008 |
| 3044  | Por evento (D+5) | 5º dia útil após o evento | Res. CMN 5.037/2022 + IN BCB 530/2024 |
| 3060  | Semanal | D+5 após a quinta-feira | Circular BCB 4.019/2020 |
| 4010  | Mensal | D+9 úteis | Plano COSIF |
| 6334  | Trimestral | Último DU do mês seguinte | Res. BCB 150/2021 (ASPB034) |
| 2050  | Trimestral | Igual ao 6334 | Res. BCB 96/2021 |
| 2055  | Mensal | Dia 10 do mês seguinte | Res. BCB 1/2020 |

### Cálculo de dias úteis
- Excluir sábados, domingos e feriados nacionais
- Feriados municipais (São Paulo, Rio) NÃO são considerados
- Tabela `feriados_nacionais` mantida em `supabase/seed/feriados.sql`

---

## 3. Billing e Contagem de Operações

### O que conta como "operação"
| CADOC | Unidade de Operação |
|-------|---------------------|
| 3040  | 1 par cliente-operação (1 registro `<Op>` dentro de `<Cli>`) |
| 3044  | 1 evento no array `operacoes` (acao=1 ou acao=2) |
| 4010  | 1 conta COSIF no array `contas` |
| 6334  | 1 linha de dados nos arquivos CONCCRED + INTERCAM + LUCRCRED |
| 3060  | Arquivo inteiro = 1 operação (volume desprezível) |

### Ciclo de billing (mensal)
1. Jobs processados → `usage_records` recebe o número de operações
2. Ao final do mês, `pg_cron` agrega `monthly_usage`
3. Excedente = `total_ops - ops_included`
4. Se excedente > 0: Stripe Metered Usage API é chamada
5. Fatura gerada automaticamente pelo Stripe no dia 1 do mês seguinte

### Limites por plano
| Plano | Ops inclusas | Excedente | Max usuários |
|-------|-------------|-----------|-------------|
| Starter | 5.000/mês | R$ 0,10/op | 3 |
| Professional | 50.000/mês | R$ 0,05/op | 15 |
| Enterprise | 500.000/mês | R$ 0,02/op | Ilimitado |
| API Only | 0 | R$ 0,10/op | 1 |

### Trial
- 14 dias gratuitos, sem cartão de crédito
- Limite de 1.000 operações durante o trial
- Ao expirar: plano Starter automático com prompt de upgrade

---

## 4. Geração de CADOCs

### Fluxo completo
```
1. Usuário envia JSON → POST /api/cadoc/generate
2. Zod valida schema de entrada
3. cadoc-engine valida regras de negócio BCB
4. XML/TXT/JSON é gerado
5. Job registrado em cadoc_jobs
6. Operações registradas em usage_records
7. Download disponível por URL assinada (15 min de validade)
8. Auditoria registrada em audit_logs
```

### Validações obrigatórias por CADOC
#### CADOC 3040
- Regras MV01–MV18 (batimento COSIF)
- Regras M01–M24 (modalidades)
- Regras R01–R09 (risco AA-H × COSIF)
- Regras T01, T06 (totais)
- IPOC: 24 caracteres exatos

#### CADOC 3044
- T01: dataSaldoDevedor ≤ dataHoraRemessa
- T02: pagamento.data ≤ dataSaldoDevedor
- T03: concessao.data ≤ dataSaldoDevedor
- T04: dataHoraRemessa ≤ agora
- T05: sem duplicata de pagamento (ipoc + data)
- T06: sem duplicata de concessão (ipoc + data)
- T07: class3050 ausente quando envia3050=N
- T08: class3050 obrigatório e com 9 dígitos quando envia3050=S
- T11–T13: datas dentro de 24 meses
- B01: campos obrigatórios por acao

#### CADOC 4010
- Contas COSIF: 9 dígitos, sem ponto nem hífen
- Saldo: numérico, pode ser negativo (passivo)
- indicadorSaldo: D=devedor, C=credor (obrigatório se ambiguidade)

#### CADOC 6334
- 10 arquivos obrigatórios (DATABASE, CONCCRED, DESCONTO, INTERCAM, LUCRCRED, RANKING, INFRESTA, INFRTERM, CONTATOS, SEGMENTO)
- Leiaute posicional: largura exata por campo
- DATABASE.ISPB = 8 dígitos
- Encoding: ISO-8859-1

---

## 5. Segurança

### Dados sensíveis
- CPF/CNPJ de clientes NÃO são armazenados em texto plano no `input_json`
  - Opção: mascarar antes de armazenar (`123.456.789-00` → `***.456.789-**`)
- XML gerado armazenado temporariamente no Supabase Storage (bucket privado)
- URLs de download assinadas expiram em 15 minutos
- Logs de auditoria retidos por 2 anos (compliance BCB)

### API Keys
- Prefixo: `bm_live_` (produção) ou `bm_test_` (homologação)
- Armazenado: apenas SHA-256 hash
- Rotação recomendada: 90 dias
- Escopos: `cadoc:generate`, `cadoc:validate`, `cadoc:read`

---

## 6. Integrações

### SGS — Sistema Gerenciador de Séries Temporais (BCB)
- Endpoint: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{cod}/dados/ultimos/1`
- Séries monitoradas: Selic (11), IPCA (433), PTAX (1), Pix volume (24382)
- Cache: 1 hora no Supabase (tabela `sgs_cache`)
- Rate limit: 1 req/s por série

### STA — Sistema de Transferência de Arquivos
- Integração futura: upload automático via API STA
- Requer certificado digital A3 da IF
- Protocolo: HTTPS + certificado mútuo

---

## 7. Roadmap de CADOCs

### Fase 1 (atual — HTML prototipado)
- ✅ 3040, 3044, 3060, 4010, 6334

### Fase 2 (Q2 2026)
- 🔲 3044 Fase 2: cessões, aquisições, portabilidade (mai/2026)
- 🔲 2055: Pix — Informações Operacionais
- 🔲 6209: Cartões — Emissores (formato posicional)

### Fase 3 (Q3 2026)
- 🔲 Upload automático para STA
- 🔲 Reconciliação automatizada COSIF 3040×4010
- 🔲 White-label para consultorias
