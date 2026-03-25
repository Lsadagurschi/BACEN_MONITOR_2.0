'use client'
import { useEffect, useState } from 'react'

const LS_SETTINGS_KEY = 'bm_company_settings_v1'
const LS_AUDIT_KEY = 'bm_audit_v1'

interface CompanySettings {
  nomeEmpresa: string
  cnpj: string
  ispb: string
  segmento: string
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

const CADOC_DEFS: Record<string, { nome: string; desc: string; periodicidade: string; prazo: string; campos: string[] }> = {
  '3040': {
    nome: 'SCR — Dados de Risco de Crédito',
    desc: 'Informações mensais sobre carteira de crédito para o Sistema de Crédito do Banco Central (SCR). Inclui clientes, operações, modalidades e valores.',
    periodicidade: 'Mensal',
    prazo: '18º dia do mês seguinte à data-base',
    campos: ['Data-base', 'Responsável (CNPJ)', 'Nº de clientes', 'Nº de operações', 'Valor total da carteira', 'Modalidade de crédito'],
  },
  '3044': {
    nome: 'SCR — Eventos em Operações de Crédito',
    desc: 'Reporte por evento de abertura, liquidação, cessão e reestruturação de operações de crédito. Prazo de 5 dias úteis após o evento.',
    periodicidade: 'Por evento (até 5 DU)',
    prazo: '5 dias úteis após o evento de crédito',
    campos: ['Tipo de evento', 'IPOC (24 chars)', 'Data do evento', 'CNPJ do devedor', 'Valor', 'Modalidade'],
  },
  '4010': {
    nome: 'Balancete COSIF',
    desc: 'Demonstrativo contábil padrão no formato COSIF. Inclui todas as contas do plano contábil das IFs com saldos mensais.',
    periodicidade: 'Mensal',
    prazo: '9º dia útil do mês seguinte',
    campos: ['Data-base', 'CNPJ da IF', 'Código COSIF', 'Saldo devedor', 'Saldo credor', 'Natureza'],
  },
  '2055': {
    nome: 'Pix — Informações Operacionais',
    desc: 'Estatísticas mensais de transações Pix: volume, valor, chaves registradas, incidentes e métricas operacionais.',
    periodicidade: 'Mensal',
    prazo: '10º dia do mês seguinte',
    campos: ['Data-base', 'ISPB', 'Volume de transações', 'Valor total', 'Nº de chaves ativas', 'Incidentes'],
  },
  '6334': {
    nome: 'Cartões — Credenciadores (ASPB034)',
    desc: 'Dados trimestrais de credenciamento: volume de estabelecimentos, transações por bandeira, taxas e modalidades.',
    periodicidade: 'Trimestral',
    prazo: '20º dia do mês seguinte ao trimestre',
    campos: ['Trimestre', 'CNPJ credenciador', 'Estabelecimentos ativos', 'Volume de transações', 'Bandeira', 'Modalidade (débito/crédito)'],
  },
  '2020': {
    nome: 'Capital e PR — Basileia III',
    desc: 'Demonstrativo de adequação de capital: PR, RWA, Tier 1, índices de Basileia e parcelas de capital regulatório.',
    periodicidade: 'Mensal',
    prazo: '9º dia útil do mês seguinte',
    campos: ['Data-base', 'PR Total', 'PR Tier 1', 'RWA Total', 'Índice Basileia', 'Índice de Alavancagem'],
  },
  '2025': {
    nome: 'LCR — Liquidity Coverage Ratio',
    desc: 'Indicador de liquidez de curto prazo (30 dias). Apura HQLA (ativos líquidos de alta qualidade) vs. saídas líquidas de caixa.',
    periodicidade: 'Mensal',
    prazo: '9º dia útil do mês seguinte',
    campos: ['Data-base', 'HQLA', 'Saídas brutas de caixa', 'Entradas brutas de caixa', 'Saídas líquidas', 'LCR (%)'],
  },
  '2030': {
    nome: 'NSFR — Net Stable Funding Ratio',
    desc: 'Indicador de estabilidade de funding de longo prazo. Apura ASF (financiamento estável disponível) vs. RSF (financiamento estável requerido).',
    periodicidade: 'Mensal',
    prazo: '9º dia útil do mês seguinte',
    campos: ['Data-base', 'ASF', 'RSF', 'NSFR (%)', 'Fonte de funding', 'Prazo residual'],
  },
}

const MODALIDADES_3040 = [
  { code: '01', label: 'Empréstimos sem consignação' },
  { code: '02', label: 'Empréstimos com consignação' },
  { code: '03', label: 'Cheque especial' },
  { code: '04', label: 'Cartão de crédito' },
  { code: '05', label: 'Financiamento imobiliário' },
  { code: '06', label: 'Crédito rural' },
  { code: '07', label: 'BNDES — repasse' },
  { code: '08', label: 'Outros financiamentos' },
]

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function lastMonth() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function CadocsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [selectedCadoc, setSelectedCadoc] = useState('3040')
  const [dtBase, setDtBase] = useState(lastMonth())
  const [totalCli, setTotalCli] = useState('')
  const [totalOps, setTotalOps] = useState('')
  const [modalidade, setModalidade] = useState('01')
  const [valorTotal, setValorTotal] = useState('')
  const [generating, setGenerating] = useState(false)
  const [lastResult, setLastResult] = useState<AuditEntry | null>(null)
  const [tab, setTab] = useState<'gerar' | 'historico'>('gerar')

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

  function saveAudit(entries: AuditEntry[]) {
    localStorage.setItem(LS_AUDIT_KEY, JSON.stringify(entries))
    setAudit(entries)
  }

  async function handleGenerate() {
    if (!settings) return
    setGenerating(true)
    setLastResult(null)

    await new Promise(r => setTimeout(r, 800))

    const nCli = parseInt(totalCli) || 0
    const nOps = parseInt(totalOps) || 0
    const val  = parseFloat(valorTotal.replace(/\./g, '').replace(',', '.')) || 0

    // Validação local
    const erros: string[] = []
    const avisos: string[] = []

    if (!dtBase) erros.push('Data-base é obrigatória')
    if (selectedCadoc === '3040') {
      if (nCli === 0) erros.push('Nº de clientes deve ser maior que zero')
      if (nOps === 0) erros.push('Nº de operações deve ser maior que zero')
      if (nOps < nCli) avisos.push('Nº de operações menor que nº de clientes — verifique se há clientes com múltiplas operações')
      if (val === 0) avisos.push('Valor total zerado — confirme se a carteira está vazia')
    }
    if (selectedCadoc === '3044') {
      if (nOps === 0) erros.push('Informe o número de eventos de crédito no período')
    }

    const status = erros.length > 0 ? 'REPROVADO' : avisos.length > 0 ? 'COM AVISOS' : 'APROVADO'

    const entry: AuditEntry = {
      id: generateId(),
      ts: new Date().toISOString(),
      acao: `Geração CADOC ${selectedCadoc}`,
      cadoc: selectedCadoc,
      cnpj: settings.cnpj,
      dtBase,
      status,
      nErros: erros.length,
      nAvisos: avisos.length,
      totalCli: nCli,
      totalOps: nOps,
    }

    const newAudit = [entry, ...audit]
    saveAudit(newAudit)
    setLastResult(entry)
    setGenerating(false)
  }

  function handleExport() {
    if (!lastResult) return
    const cadocDef = CADOC_DEFS[selectedCadoc]
    const csv = [
      `CADOC;${selectedCadoc}`,
      `Nome;${cadocDef?.nome || selectedCadoc}`,
      `Data-base;${dtBase}`,
      `Instituição;${settings?.nomeEmpresa || ''}`,
      `CNPJ;${settings?.cnpj || ''}`,
      `Status;${lastResult.status}`,
      `Erros;${lastResult.nErros}`,
      `Avisos;${lastResult.nAvisos}`,
      `Total Clientes;${lastResult.totalCli}`,
      `Total Operações;${lastResult.totalOps}`,
      `Gerado em;${new Date(lastResult.ts).toLocaleString('pt-BR')}`,
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CADOC_${selectedCadoc}_${dtBase.replace('-','')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const cadocDef = CADOC_DEFS[selectedCadoc]
  const allCadocs = Object.keys(CADOC_DEFS)

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 11px', borderRadius: 7, border: '1px solid #d1c9b8',
    fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#0a0f1e', outline: 'none',
    boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }

  return (
    <div style={{ padding: '28px 36px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0f1e', marginBottom: 4 }}>
            Geração de CADOCs
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            Preencha os dados, valide e gere o arquivo CADOC para envio ao STA — BCB.
          </p>
        </div>
        <a href="https://www.bcb.gov.br/estabilidadefinanceira/cadocs" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 11, color: '#0a7c5c', textDecoration: 'none', fontWeight: 600, border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: 7, background: '#f0fdf4' }}>
          Manual BCB ↗
        </a>
      </div>

      {!settings && (
        <div style={{ padding: 24, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>
            Configure sua instituição para habilitar a geração de CADOCs
          </div>
          <a href="/dashboard/settings" style={{ fontSize: 12, color: '#0a7c5c', fontWeight: 700, textDecoration: 'none' }}>
            → Ir para Configurações
          </a>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        {[
          { id: 'gerar',     label: '⚙️ Gerar CADOC'    },
          { id: 'historico', label: '📋 Histórico'        },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{
            padding: '9px 20px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
            borderBottom: tab === t.id ? '2px solid #0a7c5c' : '2px solid transparent',
            background: tab === t.id ? '#fff' : 'transparent',
            color: tab === t.id ? '#0a7c5c' : '#6b7280',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'gerar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Formulário */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Seletor de CADOC */}
            <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 20 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0a0f1e', marginBottom: 14 }}>Tipo de CADOC</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {allCadocs.map(code => (
                  <button key={code} onClick={() => setSelectedCadoc(code)} style={{
                    padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 11.5, fontWeight: 700,
                    fontFamily: 'Courier New, monospace',
                    border: `2px solid ${selectedCadoc === code ? '#0a7c5c' : '#d1c9b8'}`,
                    background: selectedCadoc === code ? '#f0fdf4' : '#f9fafb',
                    color: selectedCadoc === code ? '#0a7c5c' : '#4b5563',
                  }}>
                    {code}
                  </button>
                ))}
              </div>
              {cadocDef && (
                <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0a0f1e', marginBottom: 4 }}>{cadocDef.nome}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6, marginBottom: 8 }}>{cadocDef.desc}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 10.5, color: '#374151' }}>
                    <span><strong>Periodicidade:</strong> {cadocDef.periodicidade}</span>
                    <span><strong>Prazo:</strong> {cadocDef.prazo}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Campos do formulário */}
            <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 20 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0a0f1e', marginBottom: 16 }}>Dados para Geração</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={lbl}>Data-base (AAAA-MM)</label>
                  <input style={{ ...inp, fontFamily: 'Courier New, monospace' }}
                    type="month" value={dtBase} onChange={e => setDtBase(e.target.value)} />
                </div>

                {(selectedCadoc === '3040' || selectedCadoc === '3044') && (
                  <>
                    <div>
                      <label style={lbl}>
                        {selectedCadoc === '3040' ? 'Nº de Clientes na Carteira' : 'Nº de Eventos no Período'}
                      </label>
                      <input style={{ ...inp, fontFamily: 'Courier New, monospace' }}
                        type="number" min="0" placeholder="0"
                        value={totalCli} onChange={e => setTotalCli(e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Nº de Operações</label>
                      <input style={{ ...inp, fontFamily: 'Courier New, monospace' }}
                        type="number" min="0" placeholder="0"
                        value={totalOps} onChange={e => setTotalOps(e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Modalidade Principal</label>
                      <select style={inp} value={modalidade} onChange={e => setModalidade(e.target.value)}>
                        {MODALIDADES_3040.map(m => (
                          <option key={m.code} value={m.code}>{m.code} — {m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Valor Total da Carteira (R$)</label>
                      <input style={{ ...inp, fontFamily: 'Courier New, monospace' }}
                        type="text" placeholder="0,00"
                        value={valorTotal} onChange={e => setValorTotal(e.target.value)} />
                    </div>
                  </>
                )}

                {selectedCadoc === '4010' && (
                  <div style={{ padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 11, color: '#1d4ed8' }}>
                    O CADOC 4010 requer a exportação contábil completa no formato COSIF. Confirme que os dados foram extraídos do seu sistema core banking.
                  </div>
                )}

                {(selectedCadoc === '2055') && (
                  <div>
                    <label style={lbl}>Nº de Transações Pix no Mês</label>
                    <input style={{ ...inp, fontFamily: 'Courier New, monospace' }}
                      type="number" min="0" placeholder="0"
                      value={totalOps} onChange={e => setTotalOps(e.target.value)} />
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={generating || !settings}
                  style={{
                    padding: '10px 0', borderRadius: 8,
                    background: generating || !settings ? '#e5e7eb' : '#0a7c5c',
                    color: generating || !settings ? '#9ca3af' : '#fff',
                    border: 'none', fontSize: 13, fontWeight: 700, cursor: generating || !settings ? 'not-allowed' : 'pointer',
                    width: '100%',
                  }}>
                  {generating ? '⏳ Gerando e validando...' : `⚙️ Gerar CADOC ${selectedCadoc}`}
                </button>
              </div>
            </div>
          </div>

          {/* Resultado e campos esperados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Resultado da geração */}
            {lastResult && (
              <div style={{
                background: '#fff', border: `2px solid ${lastResult.status === 'APROVADO' ? '#bbf7d0' : lastResult.status === 'COM AVISOS' ? '#fde68a' : '#fecaca'}`,
                borderRadius: 12, padding: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 24 }}>
                    {lastResult.status === 'APROVADO' ? '✅' : lastResult.status === 'COM AVISOS' ? '⚠️' : '❌'}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: lastResult.status === 'APROVADO' ? '#15803d' : lastResult.status === 'COM AVISOS' ? '#854d0e' : '#dc2626' }}>
                      {lastResult.status}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      CADOC {lastResult.cadoc} · {lastResult.dtBase}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Erros',    value: String(lastResult.nErros),   color: lastResult.nErros > 0 ? '#dc2626' : '#15803d' },
                    { label: 'Avisos',   value: String(lastResult.nAvisos),  color: lastResult.nAvisos > 0 ? '#d97706' : '#15803d' },
                    { label: 'Clientes', value: String(lastResult.totalCli), color: '#0891b2' },
                    { label: 'Operações',value: String(lastResult.totalOps), color: '#7c3aed' },
                  ].map(k => (
                    <div key={k.label} style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: 7, textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: k.color, fontFamily: 'Courier New, monospace' }}>{k.value}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{k.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleExport} style={{
                    flex: 1, padding: '8px 0', borderRadius: 7, background: '#0a7c5c', color: '#fff',
                    border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>
                    ⬇️ Exportar CSV
                  </button>
                  <a href="https://www.bcb.gov.br/estabilidadefinanceira/sta" target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: '8px 0', borderRadius: 7, background: '#1d5fcc', color: '#fff',
                    border: 'none', fontSize: 12, fontWeight: 700, textDecoration: 'none', textAlign: 'center', display: 'block' }}>
                    📤 Ir ao STA BCB
                  </a>
                </div>
              </div>
            )}

            {/* Campos esperados */}
            {cadocDef && (
              <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 20 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0a0f1e', marginBottom: 14 }}>
                  Campos do CADOC {selectedCadoc}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cadocDef.campos.map((campo, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                      background: '#f9fafb', borderRadius: 7, fontSize: 11.5, color: '#374151',
                    }}>
                      <span style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {campo}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Link STA */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>📤 Envio ao STA — BCB</div>
              <div style={{ fontSize: 11, color: '#1e40af', lineHeight: 1.6, marginBottom: 12 }}>
                Após gerar e validar o CADOC, envie o arquivo pelo Sistema de Transferência de Arquivos (STA) do Banco Central.
                Certifique-se de ter o certificado digital e-CNPJ válido para autenticação.
              </div>
              <a href="https://www.bcb.gov.br/estabilidadefinanceira/sta" target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-block', padding: '7px 16px', background: '#1d5fcc', color: '#fff',
                borderRadius: 7, textDecoration: 'none', fontSize: 11.5, fontWeight: 700,
              }}>
                Acessar STA ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {tab === 'historico' && (
        <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, overflow: 'hidden' }}>
          {audit.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Nenhum CADOC gerado ainda</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Use a aba "Gerar CADOC" para começar.</div>
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid', gridTemplateColumns: '80px 90px 120px 1fr 80px 60px 60px',
                padding: '10px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
                fontSize: 10, fontWeight: 700, color: '#9ca3af', fontFamily: 'Courier New', letterSpacing: '0.04em',
              }}>
                <div>CADOC</div>
                <div>Data-base</div>
                <div>Gerado em</div>
                <div>Instituição</div>
                <div>Status</div>
                <div style={{ textAlign: 'center' }}>Erros</div>
                <div style={{ textAlign: 'center' }}>Ops</div>
              </div>
              {audit.map((h, i) => {
                const isOk  = h.status === 'APROVADO'
                const isWarn = h.status === 'COM AVISOS'
                const isErr = h.status === 'REPROVADO'
                const sc = isOk ? '#15803d' : isWarn ? '#854d0e' : '#dc2626'
                const sb = isOk ? '#dcfce7'  : isWarn ? '#fef9c3'  : '#fef2f2'
                return (
                  <div key={h.id} style={{
                    display: 'grid', gridTemplateColumns: '80px 90px 120px 1fr 80px 60px 60px',
                    padding: '10px 16px', borderBottom: i < audit.length - 1 ? '1px solid #f3f4f6' : 'none',
                    alignItems: 'center', fontSize: 11.5,
                  }}>
                    <div>
                      <span style={{ fontFamily: 'Courier New, monospace', fontSize: 10, fontWeight: 800, color: '#0e7490', background: '#ecfeff', border: '1px solid #a5f3fc', padding: '1px 5px', borderRadius: 4 }}>
                        {h.cadoc}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: '#374151' }}>{h.dtBase}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{new Date(h.ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                    <div style={{ fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.totalCli > 0 ? `${h.totalCli.toLocaleString('pt-BR')} clientes` : h.acao}
                    </div>
                    <div>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: sb, color: sc }}>
                        {h.status}
                      </span>
                    </div>
                    <div style={{ textAlign: 'center', fontFamily: 'Courier New', fontSize: 11, color: h.nErros > 0 ? '#dc2626' : '#9ca3af' }}>
                      {h.nErros}
                    </div>
                    <div style={{ textAlign: 'center', fontFamily: 'Courier New', fontSize: 11, color: '#374151' }}>
                      {h.totalOps.toLocaleString('pt-BR')}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
