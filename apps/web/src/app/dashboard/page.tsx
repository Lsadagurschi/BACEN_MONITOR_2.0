'use client'
import { useEffect, useState } from 'react'

const LS_SETTINGS_KEY = 'bm_company_settings_v1'
const LS_AUDIT_KEY = 'bm_audit_v1'

interface CompanySettings {
  nomeEmpresa: string
  cnpj: string
  ispb: string
  segmento: string
  updatedAt: string
}

interface AuditEntry {
  id: string
  ts: string
  acao: string
  cadoc: string
  cnpj: string
  dtBase: string
  status: string
  nErros: number
  nAvisos: number
  totalCli: number
  totalOps: number
}

// CADOCs obrigatórios (SIM) por segmento
const CADOCS_OBRIG: Record<string, { code: string; nome: string; per: string }[]> = {
  s1: [
    { code: '4010', nome: 'Balancete COSIF',       per: 'Mensal'    },
    { code: '2020', nome: 'Capital / Basileia III', per: 'Mensal'    },
    { code: '2025', nome: 'LCR',                   per: 'Mensal'    },
    { code: '2030', nome: 'NSFR',                  per: 'Mensal'    },
    { code: '3040', nome: 'SCR — Crédito',         per: 'Mensal'    },
    { code: '3044', nome: 'SCR — Eventos',         per: 'Por evento'},
    { code: '2055', nome: 'Pix Operacional',        per: 'Mensal'    },
    { code: '4020', nome: 'Demonstrações Fin.',    per: 'Semestral' },
  ],
  s2: [
    { code: '4010', nome: 'Balancete COSIF',       per: 'Mensal'    },
    { code: '2020', nome: 'Capital / Basileia III', per: 'Mensal'    },
    { code: '2025', nome: 'LCR',                   per: 'Mensal'    },
    { code: '2030', nome: 'NSFR',                  per: 'Mensal'    },
    { code: '3040', nome: 'SCR — Crédito',         per: 'Mensal'    },
    { code: '3044', nome: 'SCR — Eventos',         per: 'Por evento'},
    { code: '2055', nome: 'Pix Operacional',        per: 'Mensal'    },
    { code: '4020', nome: 'Demonstrações Fin.',    per: 'Semestral' },
  ],
  s3: [
    { code: '4010', nome: 'Balancete COSIF',       per: 'Mensal'    },
    { code: '2020', nome: 'Capital e PR',          per: 'Mensal'    },
    { code: '3040', nome: 'SCR — Crédito',         per: 'Mensal'    },
    { code: '3044', nome: 'SCR — Eventos',         per: 'Por evento'},
    { code: '4020', nome: 'Demonstrações Fin.',    per: 'Semestral' },
  ],
  s4: [
    { code: '4010', nome: 'Balancete COSIF',       per: 'Mensal'    },
    { code: '2020', nome: 'Capital (ICP)',         per: 'Mensal'    },
  ],
  s5: [
    { code: '4010', nome: 'Balancete COSIF',       per: 'Mensal'    },
    { code: '2020', nome: 'Capital (ICP trim.)',   per: 'Trimestral'},
  ],
  adquirente: [
    { code: '4010', nome: 'Balancete COSIF (IPs)', per: 'Mensal'    },
    { code: '6334', nome: 'Cartões / Credenciador',per: 'Trimestral'},
  ],
  subadquirente: [
    { code: '4010', nome: 'Balancete COSIF (IPs)', per: 'Mensal'    },
  ],
  emissor_pos: [
    { code: '4010', nome: 'Balancete COSIF (IPs)', per: 'Mensal'    },
    { code: '6308', nome: 'Cartões — Emissores',  per: 'Trimestral'},
    { code: '3040', nome: 'SCR — Crédito',        per: 'Mensal'    },
    { code: '3044', nome: 'SCR — Eventos',        per: 'Por evento'},
  ],
  emissor_pre: [
    { code: '4010', nome: 'Balancete COSIF (IPs)', per: 'Mensal'    },
  ],
  itp: [
    { code: '4010', nome: 'Balancete COSIF (IPs)', per: 'Mensal'    },
  ],
}

const SEGMENTO_LABELS: Record<string, string> = {
  s1: 'S1 — Banco Sistemicamente Importante',
  s2: 'S2 — Banco Médio com Atividade Internacional',
  s3: 'S3 — IF de Médio Porte',
  s4: 'S4 — IF de Menor Porte',
  s5: 'S5 — Microinstituição Financeira',
  adquirente:    'Adquirente (Credenciador)',
  subadquirente: 'Subadquirente',
  emissor_pos:   'Emissor Pós-pago',
  emissor_pre:   'Emissor Pré-pago',
  itp:           'Iniciador de Transação de Pagamento',
}

function fmtCNPJ(cnpj: string) {
  if (!cnpj || cnpj.length !== 14) return cnpj || '—'
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export default function DashboardPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [now] = useState(new Date())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY)
      if (raw) setSettings(JSON.parse(raw))
    } catch {}
    try {
      const rawA = localStorage.getItem(LS_AUDIT_KEY)
      if (rawA) setAudit(JSON.parse(rawA) || [])
    } catch {}
  }, [])

  const cadocsObrig = settings ? (CADOCS_OBRIG[settings.segmento] || []) : []
  const aprovados   = audit.filter(a => a.status === 'APROVADO').length
  const reprovados  = audit.filter(a => a.status === 'REPROVADO').length
  const totalJobs   = audit.length

  // CADOCs gerados este mês
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const jobsMes  = audit.filter(a => a.ts && a.ts.startsWith(now.getDate() > 0 ? '' : mesAtual)).length

  if (!settings) {
    return (
      <div style={{ padding: '32px 36px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0a0f1e', marginBottom: 8 }}>Dashboard Executivo</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>Visão geral da conformidade regulatória</p>

        <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏦</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0a0f1e', marginBottom: 8 }}>
            Bem-vindo ao BACEN Monitor 2.0
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 24px' }}>
            Configure o tipo da sua instituição para que o sistema calcule automaticamente
            as obrigações de CADOC, prazos e o calendário de entregas.
          </div>
          <a href="/dashboard/settings" style={{
            display: 'inline-block', padding: '10px 24px', background: '#0a7c5c', color: '#fff',
            borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 700,
          }}>
            Configurar Instituição
          </a>
        </div>
      </div>
    )
  }

  const statusGeral = reprovados > 0 ? { label: '🔴 Atenção', color: '#dc2626' }
    : totalJobs === 0 ? { label: '🔵 Aguardando', color: '#0891b2' }
    : { label: '🟢 OK', color: '#22c55e' }

  return (
    <div style={{ padding: '28px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0f1e', marginBottom: 2 }}>
            {settings.nomeEmpresa || 'Dashboard Executivo'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#6b7280' }}>{SEGMENTO_LABELS[settings.segmento] || settings.segmento}</span>
            {settings.cnpj && (
              <span style={{ fontSize: 11, fontFamily: 'Courier New, monospace', color: '#9ca3af' }}>
                CNPJ: {fmtCNPJ(settings.cnpj)}
              </span>
            )}
            {settings.ispb && (
              <span style={{ fontSize: 11, fontFamily: 'Courier New, monospace', color: '#0e7490', background: '#ecfeff', padding: '1px 6px', borderRadius: 4, border: '1px solid #a5f3fc' }}>
                ISPB: {settings.ispb}
              </span>
            )}
          </div>
        </div>
        <a href="/dashboard/settings" style={{
          padding: '6px 13px', borderRadius: 7, border: '1px solid #d1c9b8', background: '#fff',
          fontSize: 11.5, color: '#374151', textDecoration: 'none', fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          ⚙ Configurações
        </a>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Status Geral',    value: statusGeral.label,   color: statusGeral.color },
          { label: 'Jobs Gerados',    value: String(totalJobs),   color: '#0891b2' },
          { label: 'Aprovados',       value: String(aprovados),   color: '#22c55e' },
          { label: 'Com erros',       value: String(reprovados),  color: reprovados > 0 ? '#dc2626' : '#22c55e' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: '16px 20px',
            borderTop: `3px solid ${kpi.color}`,
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: kpi.color, fontFamily: 'Courier New, monospace', lineHeight: 1.2 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 4 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* CADOCs obrigatórios do segmento */}
        <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0a0f1e', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>CADOCs Obrigatórios — {SEGMENTO_LABELS[settings.segmento]?.split(' — ')[0] || settings.segmento.toUpperCase()}</span>
            <span style={{ fontSize: 10, fontFamily: 'Courier New, monospace', color: '#9ca3af' }}>{cadocsObrig.length} docs</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {cadocsObrig.map(c => {
              const ultimoJob = audit.find(a => a.cadoc === c.code)
              const entregue = !!ultimoJob
              return (
                <div key={c.code} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7,
                }}>
                  <span style={{
                    fontFamily: 'Courier New, monospace', fontSize: 9.5, fontWeight: 800,
                    color: '#0e7490', background: '#ecfeff', border: '1px solid #a5f3fc',
                    padding: '1px 6px', borderRadius: 4, flexShrink: 0,
                  }}>{c.code}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0a0f1e' }}>{c.nome}</div>
                    <div style={{ fontSize: 9.5, color: '#9ca3af', fontFamily: 'Courier New, monospace' }}>{c.per}</div>
                  </div>
                  <div style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                    background: entregue ? '#dcfce7' : '#f3f4f6',
                    color: entregue ? '#15803d' : '#9ca3af',
                    border: `1px solid ${entregue ? '#bbf7d0' : '#e5e7eb'}`,
                    flexShrink: 0,
                  }}>
                    {entregue ? '✓ Gerado' : 'Pendente'}
                  </div>
                </div>
              )
            })}
          </div>
          <a href="/dashboard/cadocs" style={{
            display: 'block', marginTop: 14, textAlign: 'center', padding: '7px 0',
            background: '#0a7c5c', color: '#fff', borderRadius: 7, textDecoration: 'none',
            fontSize: 12, fontWeight: 700,
          }}>
            Gerar CADOC
          </a>
        </div>

        {/* Histórico de geração */}
        <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0a0f1e', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Histórico de Geração</span>
            <a href="/dashboard/entregas" style={{ fontSize: 10, color: '#0a7c5c', textDecoration: 'none', fontWeight: 600 }}>
              Ver entregas →
            </a>
          </h2>
          {audit.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 12 }}>Nenhum CADOC gerado ainda.</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Acesse <strong>CADOCs</strong> para começar.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {audit.slice(0, 8).map(h => {
                const isOk = h.status === 'APROVADO' || h.status === 'EXPORTADO'
                const isErr = h.status === 'REPROVADO'
                const statusColor = isOk ? '#15803d' : isErr ? '#dc2626' : '#92400e'
                const statusBg    = isOk ? '#dcfce7'  : isErr ? '#fef2f2'  : '#fef3c7'
                const statusBrd   = isOk ? '#bbf7d0'  : isErr ? '#fecaca'  : '#fde68a'
                return (
                  <div key={h.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                    background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 11,
                  }}>
                    <span style={{
                      fontFamily: 'Courier New, monospace', fontSize: 9.5, fontWeight: 800,
                      color: '#0e7490', background: '#ecfeff', border: '1px solid #a5f3fc',
                      padding: '1px 5px', borderRadius: 3, flexShrink: 0,
                    }}>{h.cadoc}</span>
                    <span style={{ color: '#6b7280', fontFamily: 'Courier New, monospace', fontSize: 10, flexShrink: 0 }}>
                      {h.dtBase}
                    </span>
                    <span style={{ flex: 1, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10.5 }}>
                      {h.totalCli > 0 ? `${h.totalCli} clientes · ${h.totalOps} ops` : h.acao}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                      background: statusBg, color: statusColor, border: `1px solid ${statusBrd}`, flexShrink: 0,
                    }}>
                      {h.status}{h.nErros > 0 ? ` · ${h.nErros}E` : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Links rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { href: '/dashboard/cadocs',     icon: '⚙️',  title: 'Gerar CADOC',       desc: 'Geração, validação e download' },
          { href: '/dashboard/entregas',   icon: '📅', title: 'Calendário',          desc: 'Prazos regulatórios BCB'      },
          { href: '/dashboard/pagamentos', icon: '💳', title: 'CADOCs por Segmento', desc: 'Obrigações por porte da IF'   },
          { href: '/dashboard/normas',     icon: '📰', title: 'Normas BCB',          desc: 'Atualizações regulatórias'    },
          { href: '/dashboard/ia',         icon: '🤖', title: 'Análise IA',          desc: 'Insights regulatórios com IA' },
          { href: '/dashboard/links',      icon: '🔗', title: 'Links Úteis',         desc: 'BCB, STA, SGS, COSIF...'     },
        ].map(l => (
          <a key={l.href} href={l.href} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
            background: '#fff', border: '1px solid #d1c9b8', borderRadius: 10,
            textDecoration: 'none', transition: 'border-color .15s',
          }}>
            <span style={{ fontSize: 22 }}>{l.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0f1e' }}>{l.title}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{l.desc}</div>
            </div>
          </a>
        ))}
      </div>

      {/* Indicadores econômicos BCB */}
      <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0a0f1e', margin: 0 }}>
            Indicadores Econômicos BCB
          </h2>
          <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 10, color: '#0a7c5c', textDecoration: 'none', fontWeight: 600 }}>
            API SGS BCB →
          </a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { code: '432',  label: 'Selic Meta',     valor: '13,25% a.a.',  var: '▼ -0,25',  cor: '#0891b2', desc: 'Taxa básica de juros' },
            { code: '433',  label: 'IPCA Acum. 12m', valor: '5,06%',        var: '▲ +0,14',  cor: '#f97316', desc: 'Inflação oficial' },
            { code: '1',    label: 'PTAX (USD)',      valor: 'R$ 5,89',      var: '▼ -0,02',  cor: '#22c55e', desc: 'Câmbio comercial' },
            { code: '24369',label: 'CDI a.a.',        valor: '13,15% a.a.',  var: '▼ -0,25',  cor: '#7c3aed', desc: 'Taxa interbancária' },
          ].map(ind => (
            <div key={ind.code} style={{
              padding: '12px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
              borderLeft: `3px solid ${ind.cor}`,
            }}>
              <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'Courier New', marginBottom: 4 }}>
                SGS·{ind.code} · {ind.desc}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0a0f1e', fontFamily: 'Courier New, monospace' }}>
                {ind.valor}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0a0f1e' }}>{ind.label}</span>
                <span style={{ fontSize: 10, color: ind.var.startsWith('▲') ? '#dc2626' : '#15803d', fontFamily: 'Courier New' }}>
                  {ind.var}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: '#9ca3af' }}>
          Dados ilustrativos — integre com a API SGS do BCB em Configurações para valores em tempo real.
          <a href="/dashboard/links" style={{ color: '#0a7c5c', textDecoration: 'none', marginLeft: 6, fontWeight: 600 }}>Ver links API →</a>
        </div>
      </div>
    </div>
  )
}
