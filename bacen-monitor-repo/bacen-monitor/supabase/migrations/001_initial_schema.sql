-- ============================================================
-- BACEN MONITOR — Schema Principal
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ── Extensões ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ── Enums ────────────────────────────────────────────────────
CREATE TYPE plan_type AS ENUM ('starter', 'professional', 'enterprise', 'api_only');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'paused');
CREATE TYPE cadoc_type AS ENUM ('3040', '3044', '3060', '4010', '6334', '2050', '2055', '3050');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE job_result AS ENUM ('aprovado', 'com_alertas', 'reprovado', 'erro_conversao');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'compliance', 'viewer');

-- ============================================================
-- TENANTS (Instituições Financeiras)
-- ============================================================
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,           -- ex: "banco-xyz"
  name            TEXT NOT NULL,                  -- Razão social
  cnpj            TEXT UNIQUE NOT NULL,           -- CNPJ da IF (14 dígitos)
  ispb            TEXT,                           -- ISPB para STA
  tipo_if         TEXT,                           -- B, C, D, E, N...
  bcb_autorizacao TEXT,                           -- Nº autorização BCB

  -- Billing
  plan            plan_type NOT NULL DEFAULT 'starter',
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  subscription_status     subscription_status DEFAULT 'trialing',
  trial_ends_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  billing_email   TEXT,

  -- Limites do plano
  ops_included    INTEGER NOT NULL DEFAULT 5000,      -- ops/mês inclusas
  ops_price_cents INTEGER NOT NULL DEFAULT 10,        -- centavos por op excedente

  -- Metadata
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        user_role NOT NULL DEFAULT 'compliance',
  avatar_url  TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, email)
);

-- ============================================================
-- CADOC JOBS (Geração & Validação)
-- ============================================================
CREATE TABLE cadoc_jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES users(id),

  -- Identificação
  cadoc           cadoc_type NOT NULL,
  cnpj_if         TEXT NOT NULL,
  data_base       TEXT NOT NULL,                  -- YYYY-MM ou YYYYMM
  periodo_ref     TEXT,                           -- ex: "Jan/2026"

  -- Status do job
  status          job_status NOT NULL DEFAULT 'pending',
  result          job_result,
  n_erros         INTEGER DEFAULT 0,
  n_avisos        INTEGER DEFAULT 0,
  n_operacoes     INTEGER DEFAULT 0,              -- ops processadas (para billing)

  -- Payload
  input_json      JSONB,                          -- JSON enviado pelo usuário
  output_xml      TEXT,                           -- XML/TXT gerado
  output_filename TEXT,                           -- nome do arquivo gerado
  validation_report JSONB,                        -- erros e avisos detalhados

  -- Timing
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  processing_ms   INTEGER,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USAGE RECORDS (Billing por volume)
-- ============================================================
CREATE TABLE usage_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id          UUID REFERENCES cadoc_jobs(id),

  -- Período de billing (YYYY-MM)
  billing_period  TEXT NOT NULL,                  -- "2026-03"
  cadoc           cadoc_type NOT NULL,
  n_operacoes     INTEGER NOT NULL DEFAULT 0,

  -- Controle
  reported_to_stripe BOOLEAN DEFAULT false,
  stripe_usage_record_id TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, billing_period, cadoc, job_id)
);

-- View: consumo mensal por tenant
-- Usa CTE para pré-agregar por cadoc antes de montar o JSONB
-- (PostgreSQL não permite aninhar funções de agregação diretamente)
CREATE VIEW monthly_usage AS
WITH por_cadoc AS (
  SELECT
    tenant_id,
    billing_period,
    cadoc::TEXT                  AS cadoc,
    SUM(n_operacoes)::INT        AS ops,
    COUNT(DISTINCT job_id)       AS jobs
  FROM usage_records
  GROUP BY tenant_id, billing_period, cadoc
)
SELECT
  tenant_id,
  billing_period,
  SUM(ops)                                  AS total_ops,
  JSONB_OBJECT_AGG(cadoc, ops)              AS ops_por_cadoc,
  SUM(jobs)                                 AS total_jobs
FROM por_cadoc
GROUP BY tenant_id, billing_period;

-- ============================================================
-- DELIVERY CALENDAR (Vencimentos regulatórios)
-- ============================================================
CREATE TABLE delivery_schedules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  cadoc           cadoc_type NOT NULL,
  periodo_ref     TEXT NOT NULL,                  -- "2026-01"
  prazo           DATE NOT NULL,                  -- data limite BCB
  -- dias_restantes calculado via (prazo - CURRENT_DATE) nas queries / views

  -- Status de entrega
  entregue        BOOLEAN DEFAULT false,
  job_id          UUID REFERENCES cadoc_jobs(id),
  entregue_em     TIMESTAMPTZ,
  entregue_por    UUID REFERENCES users(id),

  -- Alertas
  alerta_enviado_7d  BOOLEAN DEFAULT false,
  alerta_enviado_1d  BOOLEAN DEFAULT false,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, cadoc, periodo_ref)
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),

  action      TEXT NOT NULL,                      -- "cadoc.generate", "cadoc.download"
  resource    TEXT,                               -- "3040", "delivery_schedule"
  resource_id UUID,
  metadata    JSONB,
  ip_address  INET,
  user_agent  TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),          -- NULL = todos do tenant

  type        TEXT NOT NULL,                      -- "prazo_vencendo", "job_failed"
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB,
  read        BOOLEAN DEFAULT false,
  read_at     TIMESTAMPTZ,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- API KEYS (para integração via API)
-- ============================================================
CREATE TABLE api_keys (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES users(id),

  name        TEXT NOT NULL,
  key_hash    TEXT NOT NULL UNIQUE,               -- SHA-256 da key
  key_prefix  TEXT NOT NULL,                      -- "bm_live_xxxx" para exibição
  scopes      TEXT[] DEFAULT ARRAY['cadoc:generate', 'cadoc:validate'],
  last_used_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT true,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- View: delivery_schedules com dias_restantes calculado em tempo real
CREATE VIEW delivery_schedules_view AS
SELECT
  *,
  (prazo - CURRENT_DATE)::INTEGER AS dias_restantes
FROM delivery_schedules;
-- ============================================================
CREATE INDEX idx_users_tenant           ON users(tenant_id);
CREATE INDEX idx_cadoc_jobs_tenant      ON cadoc_jobs(tenant_id);
CREATE INDEX idx_cadoc_jobs_status      ON cadoc_jobs(status);
CREATE INDEX idx_cadoc_jobs_cadoc       ON cadoc_jobs(cadoc);
CREATE INDEX idx_cadoc_jobs_created_at  ON cadoc_jobs(created_at DESC);
CREATE INDEX idx_usage_tenant_period    ON usage_records(tenant_id, billing_period);
CREATE INDEX idx_delivery_tenant        ON delivery_schedules(tenant_id);
CREATE INDEX idx_delivery_prazo         ON delivery_schedules(prazo);
CREATE INDEX idx_audit_tenant           ON audit_logs(tenant_id);
CREATE INDEX idx_audit_created_at       ON audit_logs(created_at DESC);
CREATE INDEX idx_notifications_user     ON notifications(user_id, read);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadoc_jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys           ENABLE ROW LEVEL SECURITY;

-- Helper: retorna o tenant_id do usuário autenticado
CREATE OR REPLACE FUNCTION auth_tenant_id()
RETURNS UUID LANGUAGE SQL STABLE AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid()
$$;

-- Helper: retorna o role do usuário autenticado
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role LANGUAGE SQL STABLE AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

-- Policies: cada tenant só vê seus próprios dados
CREATE POLICY tenant_isolation ON tenants
  USING (id = auth_tenant_id());

CREATE POLICY tenant_isolation ON users
  USING (tenant_id = auth_tenant_id());

CREATE POLICY tenant_isolation ON cadoc_jobs
  USING (tenant_id = auth_tenant_id());

CREATE POLICY tenant_isolation ON usage_records
  USING (tenant_id = auth_tenant_id());

CREATE POLICY tenant_isolation ON delivery_schedules
  USING (tenant_id = auth_tenant_id());

CREATE POLICY tenant_isolation ON audit_logs
  USING (tenant_id = auth_tenant_id());

CREATE POLICY tenant_isolation ON notifications
  USING (tenant_id = auth_tenant_id());

CREATE POLICY tenant_isolation ON api_keys
  USING (tenant_id = auth_tenant_id());

-- Apenas admin/owner pode gerenciar API keys
CREATE POLICY api_keys_write ON api_keys FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id() AND auth_user_role() IN ('owner', 'admin'));

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER delivery_schedules_updated_at
  BEFORE UPDATE ON delivery_schedules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- FUNÇÃO: registrar uso e atualizar billing
-- ============================================================
CREATE OR REPLACE FUNCTION record_cadoc_usage(
  p_tenant_id     UUID,
  p_job_id        UUID,
  p_cadoc         cadoc_type,
  p_n_operacoes   INTEGER
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_period TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  INSERT INTO usage_records (tenant_id, job_id, billing_period, cadoc, n_operacoes)
  VALUES (p_tenant_id, p_job_id, v_period, p_cadoc, p_n_operacoes)
  ON CONFLICT (tenant_id, billing_period, cadoc, job_id)
  DO UPDATE SET n_operacoes = EXCLUDED.n_operacoes;
END;
$$;

-- ============================================================
-- SEED: Planos padrão (limites por plano)
-- ============================================================
-- Tabela auxiliar de configuração de planos
CREATE TABLE plan_configs (
  plan             plan_type PRIMARY KEY,
  ops_included     INTEGER NOT NULL,
  ops_price_cents  INTEGER NOT NULL,  -- centavos BRL por op excedente
  max_users        INTEGER,           -- NULL = ilimitado
  max_cadocs       TEXT[],            -- NULL = todos
  has_api          BOOLEAN DEFAULT false,
  has_sso          BOOLEAN DEFAULT false,
  sla_uptime       NUMERIC(5,2)       -- percentual
);

INSERT INTO plan_configs VALUES
  ('starter',      5000,   10, 3,   ARRAY['3040','4010'],                     false, false, NULL),
  ('professional', 50000,   5, 15,  NULL,                                      true,  false, 99.5),
  ('enterprise',   500000,  2, NULL, NULL,                                     true,  true,  99.9),
  ('api_only',     0,      10, 1,   NULL,                                      true,  false, 99.5);
