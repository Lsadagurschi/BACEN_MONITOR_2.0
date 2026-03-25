'use client'
import { useEffect, useState } from 'react'

// ── CADOCs e prazos por segmento ────────────────────────────────────────────
// tipoCalc: 'du9' = 9º dia útil do mês seguinte | 'du18' = dia 18 | 'trimestral' | 'semestral'
interface CadocDef {
  code: string
  nome: string
  obrig: 'SIM' | 'COND'
  tipoCalc: 'du9' | 'du18' | 'diario' | 'trimestral' | 'semestral' | 'evento'
  prazoDesc: string
}

const CADOCS_SCHEDULE: Record<string, CadocDef[]> = {
  s1: [
    { code: '4010', nome: 'Balancete COSIF',                per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '2010', nome: 'DLO — Liquidez Diária',          per: 'Diário',     obrig: 'SIM',  tipoCalc: 'diario',    prazoDesc: 'Diário (D+0)' } as any,
    { code: '2020', nome: 'Capital e PR (Basileia III)',     per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '2025', nome: 'LCR — Liquidity Coverage Ratio', per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '2030', nome: 'NSFR — Net Stable Funding',      per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '2045', nome: 'RWA — Parcelas de Capital',      per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '3040', nome: 'SCR — Risco de Crédito',         per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du18',      prazoDesc: 'Dia 18 do mês seguinte' } as any,
    { code: '3044', nome: 'SCR — Eventos de Crédito',       per: 'Por evento', obrig: 'SIM',  tipoCalc: 'evento',    prazoDesc: 'Em até 5 dias úteis do evento' } as any,
    { code: '2055', nome: 'Pix — Informações Operacionais', per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '10º dia do mês seguinte' } as any,
    { code: '4020', nome: 'Demonstrações Financeiras',      per: 'Semestral',  obrig: 'SIM',  tipoCalc: 'semestral', prazoDesc: 'Jun e Dez — 60 dias após encerramento' } as any,
  ],
  s2: [
    { code: '4010', nome: 'Balancete COSIF',                per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '2010', nome: 'DLO — Liquidez Diária',          per: 'Diário',     obrig: 'SIM',  tipoCalc: 'diario',    prazoDesc: 'Diário (D+0)' } as any,
    { code: '2020', nome: 'Capital e PR (Basileia III)',     per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '2025', nome: 'LCR — Liquidity Coverage Ratio', per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '2030', nome: 'NSFR — Net Stable Funding',      per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '2045', nome: 'RWA — Parcelas de Capital',      per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '3040', nome: 'SCR — Risco de Crédito',         per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du18',      prazoDesc: 'Dia 18 do mês seguinte' } as any,
    { code: '3044', nome: 'SCR — Eventos de Crédito',       per: 'Por evento', obrig: 'SIM',  tipoCalc: 'evento',    prazoDesc: 'Em até 5 dias úteis do evento' } as any,
    { code: '2055', nome: 'Pix — Informações Operacionais', per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '10º dia do mês seguinte' } as any,
    { code: '4020', nome: 'Demonstrações Financeiras',      per: 'Semestral',  obrig: 'SIM',  tipoCalc: 'semestral', prazoDesc: 'Jun e Dez — 60 dias após encerramento' } as any,
  ],
  s3: [
    { code: '4010', nome: 'Balancete COSIF',                per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '2020', nome: 'Capital e PR',                   per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '3040', nome: 'SCR — Risco de Crédito',         per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du18',      prazoDesc: 'Dia 18 do mês seguinte' } as any,
    { code: '3044', nome: 'SCR — Eventos de Crédito',       per: 'Por evento', obrig: 'SIM',  tipoCalc: 'evento',    prazoDesc: 'Em até 5 dias úteis do evento' } as any,
    { code: '2055', nome: 'Pix — Informações Operacionais', per: 'Mensal',     obrig: 'COND', tipoCalc: 'du9',       prazoDesc: '10º dia do mês seguinte (se ISPB)' } as any,
    { code: '4020', nome: 'Demonstrações Financeiras',      per: 'Semestral',  obrig: 'SIM',  tipoCalc: 'semestral', prazoDesc: 'Jun e Dez — 60 dias após encerramento' } as any,
  ],
  s4: [
    { code: '4010', nome: 'Balancete COSIF',                per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '2020', nome: 'Capital (ICP)',                  per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '3040', nome: 'SCR — Risco de Crédito',         per: 'Mensal',     obrig: 'COND', tipoCalc: 'du18',      prazoDesc: 'Dia 18 (se houver carteira)' } as any,
    { code: '3044', nome: 'SCR — Eventos de Crédito',       per: 'Por evento', obrig: 'COND', tipoCalc: 'evento',    prazoDesc: 'Em até 5 dias úteis do evento' } as any,
  ],
  s5: [
    { code: '4010', nome: 'Balancete COSIF',                per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '2020', nome: 'Capital (ICP trimestral)',        per: 'Trimestral', obrig: 'SIM',  tipoCalc: 'trimestral',prazoDesc: 'Último DU do mês seguinte ao trimestre' } as any,
    { code: '3040', nome: 'SCR — Risco de Crédito',         per: 'Mensal',     obrig: 'COND', tipoCalc: 'du18',      prazoDesc: 'Dia 18 (se houver carteira)' } as any,
  ],
  adquirente: [
    { code: '4010', nome: 'Balancete COSIF (IPs)',          per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '6334', nome: 'Cartões — Credenciadores',       per: 'Trimestral', obrig: 'SIM',  tipoCalc: 'trimestral',prazoDesc: 'Último DU do mês seguinte ao trimestre' } as any,
    { code: '2055', nome: 'Pix — Informações Operacionais', per: 'Mensal',     obrig: 'COND', tipoCalc: 'du9',       prazoDesc: '10º dia do mês seguinte (se ISPB)' } as any,
  ],
  subadquirente: [
    { code: '4010', nome: 'Balancete COSIF (IPs)',          per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '2055', nome: 'Pix — Informações Operacionais', per: 'Mensal',     obrig: 'COND', tipoCalc: 'du9',       prazoDesc: '10º dia do mês seguinte (se ISPB)' } as any,
  ],
  emissor_pos: [
    { code: '4010', nome: 'Balancete COSIF (IPs)',          per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
    { code: '6308', nome: 'Cartões — Emissores',            per: 'Trimestral', obrig: 'SIM',  tipoCalc: 'trimestral',prazoDesc: 'Último DU do mês seguinte ao trimestre' } as any,
    { code: '3040', nome: 'SCR — Risco de Crédito',         per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du18',      prazoDesc: 'Dia 18 do mês seguinte' } as any,
    { code: '3044', nome: 'SCR — Eventos de Crédito',       per: 'Por evento', obrig: 'SIM',  tipoCalc: 'evento',    prazoDesc: 'Em até 5 dias úteis do evento' } as any,
  ],
  emissor_pre: [
    { code: '4010', nome: 'Balancete COSIF (IPs)',          per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
  ],
  itp: [
    { code: '4010', nome: 'Balancete COSIF (IPs)',          per: 'Mensal',     obrig: 'SIM',  tipoCalc: 'du9',       prazoDesc: '9º dia útil do mês seguinte' } as any,
  ],
}

function addDiasUteis(data: Date, n: number): Date {
  const d = new Date(data)
  let added = 0
  while (added < n) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) added++
  }
  return d
}

function ultimoDuMes(ano: number, mes: number): Date {
  let d = new Date(ano, mes, 0)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1)
  return d
}

interface EntregaItem {
  code: string
  nome: string
  obrig: 'SIM' | 'COND'
  prazo: Date
  prazoDesc: string
  diasRestantes: number
  mes: string
}

function calcularEntregas(segmento: string): EntregaItem[] {
  const defs = CADOCS_SCHEDULE[segmento] || []
  const now = new Date()
  const ano = now.getFullYear()
  const mes = now.getMonth() // 0-based
  const entregas: EntregaItem[] = []

  // Gera prazos para os próximos 3 meses
  for (let m = 0; m <= 2; m++) {
    const refMes = (mes + m) % 12
    const refAno = ano + Math.floor((mes + m) / 12)
    const label = new Date(refAno, refMes, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

    defs.forEach(def => {
      let prazo: Date | null = null
      const tc = (def as any).tipoCalc

      if (tc === 'du9') {
        // 9º DU do mês seguinte à referência
        const base = new Date(refAno, refMes + 1, 1)
        prazo = addDiasUteis(new Date(refAno, refMes + 1, 0), 9)
        prazo = addDiasUteis(new Date(refAno, refMes + 1, 1), 9)
      } else if (tc === 'du18') {
        // Dia 18 do mês seguinte
        const nextM = (refMes + 1) % 12
        const nextY = refAno + (refMes === 11 ? 1 : 0)
        prazo = new Date(nextY, nextM, 18)
      } else if (tc === 'trimestral') {
        // Último DU do mês seguinte ao fim do trimestre
        const trimFim = [2, 5, 8, 11] // março, junho, setembro, dezembro
        if (trimFim.includes(refMes)) {
          const nextM = (refMes + 1) % 12
          const nextY = refAno + (refMes === 11 ? 1 : 0)
          prazo = ultimoDuMes(nextY, nextM + 1)
        }
      } else if (tc === 'semestral') {
        if (refMes === 5 || refMes === 11) {
          const nextM = refMes === 5 ? 7 : 1
          const nextY = refMes === 11 ? refAno + 1 : refAno
          prazo = new Date(nextY, nextM, 28)
        }
      } else if (tc === 'diario' || tc === 'evento') {
        // Não gera prazo fixo
        return
      }

      if (prazo) {
        const diasRestantes = Math.round((prazo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        entregas.push({
          code: def.code,
          nome: def.nome,
          obrig: def.obrig,
          prazo,
          prazoDesc: (def as any).prazoDesc,
          diasRestantes,
          mes: label,
        })
      }
    })
  }

  return entregas.sort((a, b) => a.prazo.getTime() - b.prazo.getTime())
}

const LS_SETTINGS_KEY = 'bm_company_settings_v1'

const SEGMENTO_LABELS: Record<string, string> = {
  s1: 'S1', s2: 'S2', s3: 'S3', s4: 'S4', s5: 'S5',
  adquirente: 'Adquirente', subadquirente: 'Subadquirente',
  emissor_pos: 'Emissor Pós-pago', emissor_pre: 'Emissor Pré-pago', itp: 'ITP',
}

export default function EntregasPage() {
  const [segmento, setSegmento] = useState('s3')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [entregas, setEntregas] = useState<EntregaItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY)
      if (raw) {
        const s = JSON.parse(raw)
        setSegmento(s.segmento || 's3')
        setNomeEmpresa(s.nomeEmpresa || '')
      }
    } catch {}
  }, [])

  useEffect(() => {
    setEntregas(calcularEntregas(segmento))
  }, [segmento])

  const urgentes  = entregas.filter(e => e.diasRestantes >= 0 && e.diasRestantes <= 7)
  const proximos  = entregas.filter(e => e.diasRestantes > 7 && e.diasRestantes <= 21)
  const normais   = entregas.filter(e => e.diasRestantes > 21)
  const vencidos  = entregas.filter(e => e.diasRestantes < 0)

  function urgColor(dias: number) {
    if (dias < 0)  return { bg: '#fef2f2', brd: '#fecaca', txt: '#dc2626' }
    if (dias <= 7) return { bg: '#fff7ed', brd: '#fed7aa', txt: '#c2410c' }
    if (dias <= 21) return { bg: '#fefce8', brd: '#fde68a', txt: '#92400e' }
    return { bg: '#f0fdf4', brd: '#bbf7d0', txt: '#15803d' }
  }

  function renderCard(e: EntregaItem) {
    const c = urgColor(e.diasRestantes)
    const diasLabel = e.diasRestantes < 0
      ? `${Math.abs(e.diasRestantes)}d vencido`
      : e.diasRestantes === 0 ? 'Hoje!' : `${e.diasRestantes}d restantes`

    return (
      <div key={`${e.code}-${e.prazo.toISOString()}`} style={{
        background: '#fff', border: `1px solid ${c.brd}`, borderRadius: 10,
        padding: '12px 16px', borderLeft: `3px solid ${c.txt}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{
                fontFamily: 'Courier New, monospace', fontSize: 10, fontWeight: 800,
                color: '#0e7490', background: '#ecfeff', border: '1px solid #a5f3fc',
                padding: '1px 7px', borderRadius: 4,
              }}>{e.code}</span>
              {e.obrig === 'COND' && (
                <span style={{ fontSize: 9, fontWeight: 700, color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', padding: '1px 5px', borderRadius: 3 }}>COND</span>
              )}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0a0f1e', marginBottom: 3 }}>{e.nome}</div>
            <div style={{ fontSize: 10, color: '#6b7280', fontFamily: 'Courier New, monospace' }}>
              {e.prazoDesc} · {e.prazo.toLocaleDateString('pt-BR')}
            </div>
          </div>
          <div style={{
            textAlign: 'center', flexShrink: 0, background: c.bg, border: `1px solid ${c.brd}`,
            borderRadius: 8, padding: '6px 12px', minWidth: 72,
          }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: c.txt, fontFamily: 'Courier New, monospace', lineHeight: 1.1 }}>
              {e.diasRestantes < 0 ? Math.abs(e.diasRestantes) : e.diasRestantes}
            </div>
            <div style={{ fontSize: 8.5, color: c.txt, marginTop: 2, fontWeight: 600 }}>{diasLabel}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0f1e', marginBottom: 4 }}>Calendário de Entregas</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            Prazos regulatórios BCB para {nomeEmpresa ? <strong>{nomeEmpresa}</strong> : 'sua instituição'} —{' '}
            segmento <strong>{SEGMENTO_LABELS[segmento] || segmento.toUpperCase()}</strong>
          </p>
        </div>
        <a href="/dashboard/settings" style={{
          padding: '7px 14px', borderRadius: 7, border: '1px solid #d1c9b8',
          background: '#fff', fontSize: 11.5, fontWeight: 600, color: '#374151',
          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          Alterar Segmento
        </a>
      </div>

      {/* KPIs de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Vencidos',      value: vencidos.length,  color: '#dc2626', bg: '#fef2f2', brd: '#fecaca' },
          { label: 'Urgentes ≤7d',  value: urgentes.length,  color: '#c2410c', bg: '#fff7ed', brd: '#fed7aa' },
          { label: 'Próximos ≤21d', value: proximos.length,  color: '#92400e', bg: '#fefce8', brd: '#fde68a' },
          { label: 'No prazo',      value: normais.length,   color: '#15803d', bg: '#f0fdf4', brd: '#bbf7d0' },
        ].map(k => (
          <div key={k.label} style={{
            background: k.bg, border: `1px solid ${k.brd}`, borderRadius: 10, padding: '14px 18px',
            borderTop: `3px solid ${k.color}`,
          }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: k.color, fontFamily: 'Courier New, monospace', lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Lista de entregas */}
      {vencidos.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
            <span>⚠</span> Vencidos
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
            {vencidos.map(renderCard)}
          </div>
        </section>
      )}

      {urgentes.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#c2410c', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
            <span>🔴</span> Urgentes — Próximos 7 dias
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
            {urgentes.map(renderCard)}
          </div>
        </section>
      )}

      {proximos.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
            <span>🟡</span> Próximos 21 dias
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
            {proximos.map(renderCard)}
          </div>
        </section>
      )}

      {normais.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
            <span>🟢</span> Calendário — Próximos 3 meses
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
            {normais.map(renderCard)}
          </div>
        </section>
      )}

      {entregas.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0f1e', marginBottom: 8 }}>Nenhuma entrega calculada</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Configure o segmento da sua instituição para ver os prazos regulatórios.</div>
          <a href="/dashboard/settings" style={{
            display: 'inline-block', padding: '8px 20px', background: '#0a7c5c', color: '#fff',
            borderRadius: 7, textDecoration: 'none', fontSize: 13, fontWeight: 600,
          }}>Ir para Configurações</a>
        </div>
      )}
    </div>
  )
}
