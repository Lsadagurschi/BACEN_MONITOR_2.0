// ============================================================
// BACEN MONITOR — Core Types
// packages/types/src/index.ts
// ============================================================

// ── Enums ────────────────────────────────────────────────────
export type CadocType = '3040' | '3044' | '3060' | '4010' | '6334' | '2050' | '2055' | '3050'
export type PlanType = 'starter' | 'professional' | 'enterprise' | 'api_only'
export type UserRole = 'owner' | 'admin' | 'compliance' | 'viewer'
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type JobResult = 'aprovado' | 'com_alertas' | 'reprovado' | 'erro_conversao'
export type TipoEnvio = 'P' | 'T'
export type TipoRemessa = 'I' | 'S'
export type IndicadorSaldo = 'D' | 'C'
export type TipoConta = 'A' | 'P' | 'R'

// ── Tenant / Auth ─────────────────────────────────────────────
export interface Tenant {
  id: string
  slug: string
  name: string
  cnpj: string
  ispb?: string
  tipoIf?: string
  plan: PlanType
  opsIncluded: number
  opsPriceCents: number
  subscriptionStatus: string
  trialEndsAt?: string
  isActive: boolean
  createdAt: string
}

export interface User {
  id: string
  tenantId: string
  email: string
  fullName?: string
  role: UserRole
  avatarUrl?: string
  lastSeenAt?: string
}

// ── CADOC Jobs ────────────────────────────────────────────────
export interface CadocJob {
  id: string
  tenantId: string
  createdBy: string
  cadoc: CadocType
  cnpjIf: string
  dataBase: string
  periodoRef?: string
  status: JobStatus
  result?: JobResult
  nErros: number
  nAvisos: number
  nOperacoes: number
  outputFilename?: string
  validationReport?: ValidationReport
  startedAt?: string
  completedAt?: string
  processingMs?: number
  createdAt: string
}

// ── Validation ────────────────────────────────────────────────
export interface ValidationError {
  tipo: 'erro' | 'aviso'
  cod: string
  msg: string
  arquivo?: string
  linha?: number
  campo?: string
  op?: string         // identificador da operação (IPOC etc)
}

export interface ValidationReport {
  erros: ValidationError[]
  avisos: ValidationError[]
  nErros: number
  nAvisos: number
  resumo?: Record<string, unknown>
}

// ── CADOC 3040 — SCR Operações de Crédito ─────────────────────
export interface Cadoc3040Input {
  cabecalho: {
    CNPJ: string
    DtBase: string              // YYYY-MM-DD
    NumArqv?: number
    TpArqv?: string
    DtArqv?: string
    NomeResp?: string
    EmailResp?: string
    TelResp?: string
    MetodApPE: 'S' | 'N'
    TotalCli: number
    TpEnvio?: TipoEnvio
    TpRemessa?: TipoRemessa
  }
  clientes: Cadoc3040Cliente[]
}

export interface Cadoc3040Cliente {
  Cd: string                    // CPF/CNPJ sem formatação
  TpPessoa?: 'F' | 'J'
  operacoes: Cadoc3040Operacao[]
}

export interface Cadoc3040Operacao {
  IPOC: string
  Mod: string                   // modalidade COSIF (4 chars)
  NatuOp?: string               // natureza da operação
  ClassOp?: string              // AA-H
  InstOrigem?: string
  VlrContr: number
  VlrAtualiz?: number
  DtContr?: string
  DtVcmtOriginal?: string
  vencimentos?: Cadoc3040Vencimento[]
  infs?: Cadoc3040Inf[]
}

export interface Cadoc3040Vencimento {
  Cd: string                    // código de vencimento (110-310)
  Val: number
}

export interface Cadoc3040Inf {
  Cd: string
  Val: string | number
}

// ── CADOC 3044 — SCR Eventos de Crédito ──────────────────────
export interface Cadoc3044Input {
  cnpjIF: string
  dataHoraRemessa: string       // "YYYY-MM-DD HH:MM:SS"
  envia3050: 'S' | 'N'
  operacoes: Cadoc3044Operacao[]
}

export interface Cadoc3044Operacao {
  acao: 1 | 2                  // 1=incluir/alterar, 2=excluir
  ipoc: string
  saldoDevedor?: number
  dataSaldoDevedor?: string
  atraso?: 'S' | 'N'
  class3050?: string
  pagamentos?: Cadoc3044Evento[]
  concessoes?: Cadoc3044Evento[]
  cessoes?: Cadoc3044Evento[]
  aquisicoes?: Cadoc3044Evento[]
}

export interface Cadoc3044Evento {
  acao: 1 | 2
  data: string
  valor?: number
  tpMotivo?: string
}

// ── CADOC 4010 — Balancete COSIF ─────────────────────────────
export interface Cadoc4010Input {
  cabecalho: {
    cnpj: string
    dataBase: string
    tpArq?: string
    tpEnvio?: TipoEnvio
  }
  contas: Cadoc4010Conta[]
}

export interface Cadoc4010Conta {
  codigoConta: string           // 9-10 dígitos COSIF
  saldo: number
  indicadorSaldo?: IndicadorSaldo
  tipoConta?: TipoConta
}

// ── Billing ───────────────────────────────────────────────────
export interface UsageRecord {
  tenantId: string
  billingPeriod: string         // "YYYY-MM"
  cadoc: CadocType
  nOperacoes: number
  jobId?: string
}

export interface MonthlyUsageSummary {
  tenantId: string
  billingPeriod: string
  totalOps: number
  opsPorCadoc: Record<CadocType, number>
  totalJobs: number
  opsIncluded: number
  opsExcedentes: number
  custoExcedente: number        // em centavos BRL
}

// ── API ───────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface GenerateRequest {
  cadoc: CadocType
  input: Cadoc3040Input | Cadoc3044Input | Cadoc4010Input | unknown
  options?: {
    validate?: boolean          // default: true
    format?: 'xml' | 'json' | 'txt'
  }
}

export interface GenerateResponse {
  jobId: string
  cadoc: CadocType
  filename: string
  nOperacoes: number
  validation: ValidationReport
  downloadUrl?: string          // URL temporária para download
}

// ── Delivery Calendar ─────────────────────────────────────────
export interface DeliverySchedule {
  id: string
  tenantId: string
  cadoc: CadocType
  periodoRef: string
  prazo: string                 // ISO date
  diasRestantes: number
  entregue: boolean
  jobId?: string
  entregueEm?: string
  alertaEnviado7d: boolean
  alertaEnviado1d: boolean
}

// ── Dashboard KPIs ────────────────────────────────────────────
export interface CoverageKpis {
  totalCadocs: number
  cobertos: number
  scoreCobertura: number        // 0-100
  vencidos: number
  urgentes: number              // ≤7 dias
  proximos: number              // ≤21 dias
  conformidade: number          // % jobs sem erros
}
