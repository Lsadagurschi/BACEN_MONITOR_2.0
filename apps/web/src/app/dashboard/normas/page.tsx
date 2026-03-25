'use client'
import { useEffect, useState } from 'react'

interface Norma {
  id: string
  tipo: string
  numero: string
  data: string
  ementa: string
  url: string
  tags: string[]
  status: 'vigente' | 'revogada' | 'nova'
}

// Banco de normas regulatórias BCB — atualizado para 2025/2026
const NORMAS_BCB: Norma[] = [
  {
    id: 'res-bcb-362',
    tipo: 'Resolução BCB',
    numero: '362/2025',
    data: '2025-12-15',
    ementa: 'Altera requisitos de capital mínimo para instituições de pagamento e atualiza faixas do segmento S4/S5.',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolução%20BCB&numero=362',
    tags: ['Capital', 'IP', 'S4', 'S5'],
    status: 'nova',
  },
  {
    id: 'res-bcb-355',
    tipo: 'Resolução BCB',
    numero: '355/2025',
    data: '2025-10-20',
    ementa: 'Dispõe sobre o envio de informações ao Sistema de Controle de Garantias (SCG) e altera o CADOC 3040.',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolução%20BCB&numero=355',
    tags: ['SCR', 'CADOC 3040', 'Garantias'],
    status: 'vigente',
  },
  {
    id: 'res-bcb-348',
    tipo: 'Resolução BCB',
    numero: '348/2025',
    data: '2025-08-10',
    ementa: 'Regulamenta o Open Finance — fase 4: dados de investimentos, seguros e previdência, com novos endpoints obrigatórios.',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolução%20BCB&numero=348',
    tags: ['Open Finance', 'Fase 4', 'API'],
    status: 'vigente',
  },
  {
    id: 'circ-bcb-4012',
    tipo: 'Circular BCB',
    numero: '4.012/2024',
    data: '2024-11-05',
    ementa: 'Atualiza o manual do Pix: novas regras de devolução, prazo máximo de D+90 para contestação de fraudes.',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Circular&numero=4012',
    tags: ['Pix', 'Fraude', 'Devolução', 'CADOC 2055'],
    status: 'vigente',
  },
  {
    id: 'res-bcb-330',
    tipo: 'Resolução BCB',
    numero: '330/2024',
    data: '2024-09-18',
    ementa: 'Altera o Regulamento do Sistema de Pagamentos Brasileiro (SPB) — adequação às novas modalidades de Pix e DREX.',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolução%20BCB&numero=330',
    tags: ['SPB', 'Pix', 'DREX', 'Pagamentos'],
    status: 'vigente',
  },
  {
    id: 'res-bcb-317',
    tipo: 'Resolução BCB',
    numero: '317/2024',
    data: '2024-06-25',
    ementa: 'Dispõe sobre a governança e os controles de dados pessoais no contexto do Open Finance e da LGPD.',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolução%20BCB&numero=317',
    tags: ['LGPD', 'Open Finance', 'Dados', 'Privacidade'],
    status: 'vigente',
  },
  {
    id: 'res-bcb-305',
    tipo: 'Resolução BCB',
    numero: '305/2024',
    data: '2024-04-02',
    ementa: 'Atualiza critérios de classificação e provisão de operações de crédito — alinha com IFRS 9 para S1 e S2.',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolução%20BCB&numero=305',
    tags: ['Crédito', 'IFRS 9', 'Provisão', 'S1', 'S2'],
    status: 'vigente',
  },
  {
    id: 'res-bcb-197',
    tipo: 'Resolução BCB',
    numero: '197/2022',
    data: '2022-03-30',
    ementa: 'Estabelece a segmentação prudencial de instituições autorizadas a funcionar pelo BCB (S1 a S5).',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolução%20BCB&numero=197',
    tags: ['Segmentação', 'S1', 'S2', 'S3', 'S4', 'S5', 'Basileia'],
    status: 'vigente',
  },
  {
    id: 'res-bcb-80',
    tipo: 'Resolução BCB',
    numero: '80/2021',
    data: '2021-05-31',
    ementa: 'Regulamenta as instituições de pagamento: modalidades, autorização, obrigações e reportes CADOC.',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolução%20BCB&numero=80',
    tags: ['IP', 'Pagamentos', 'Autorização', 'Adquirente', 'Emissor'],
    status: 'vigente',
  },
  {
    id: 'res-cmn-4966',
    tipo: 'Resolução CMN',
    numero: '4.966/2021',
    data: '2021-11-25',
    ementa: 'Altera critérios contábeis de instrumentos financeiros para IFs — base para COSIF atualizado.',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolução%20CMN&numero=4966',
    tags: ['COSIF', 'Contabilidade', 'Instrumentos Financeiros', 'CADOC 4010'],
    status: 'vigente',
  },
  {
    id: 'circ-bcb-3978',
    tipo: 'Circular BCB',
    numero: '3.978/2020',
    data: '2020-01-23',
    ementa: 'Dispõe sobre a Política de Prevenção à Lavagem de Dinheiro e ao Financiamento do Terrorismo (PLD/FT).',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Circular&numero=3978',
    tags: ['PLD', 'FT', 'Compliance', 'KYC'],
    status: 'vigente',
  },
  {
    id: 'res-bcb-1',
    tipo: 'Resolução BCB',
    numero: '1/2020',
    data: '2020-09-04',
    ementa: 'Institui o Banco de Dados de Clientes e Operações (BDCO) e regula o envio de dados ao SCR.',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolução%20BCB&numero=1',
    tags: ['SCR', 'CADOC 3040', 'Clientes', 'Crédito'],
    status: 'vigente',
  },
]

const TIPO_CORES: Record<string, { bg: string; color: string; border: string }> = {
  'Resolução BCB': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Circular BCB':  { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'Resolução CMN': { bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
  'Instrução':     { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
}

const STATUS_CORES: Record<string, { bg: string; color: string; label: string }> = {
  vigente:  { bg: '#dcfce7', color: '#15803d', label: 'Vigente'  },
  revogada: { bg: '#f3f4f6', color: '#9ca3af', label: 'Revogada' },
  nova:     { bg: '#fef9c3', color: '#854d0e', label: 'Nova'     },
}

function fmtData(iso: string) {
  const [y, m, d] = iso.split('-')
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${d} ${meses[parseInt(m) - 1]} ${y}`
}

export default function NormasPage() {
  const [filtro, setFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')
  const [statusFiltro, setStatusFiltro] = useState<string>('todos')

  const normasFiltradas = NORMAS_BCB.filter(n => {
    const texto = filtro.toLowerCase()
    const matchTexto = !filtro ||
      n.numero.toLowerCase().includes(texto) ||
      n.ementa.toLowerCase().includes(texto) ||
      n.tags.some(t => t.toLowerCase().includes(texto))
    const matchTipo   = tipoFiltro === 'todos'  || n.tipo === tipoFiltro
    const matchStatus = statusFiltro === 'todos' || n.status === statusFiltro
    return matchTexto && matchTipo && matchStatus
  })

  const novas   = NORMAS_BCB.filter(n => n.status === 'nova').length
  const tipos   = Array.from(new Set(NORMAS_BCB.map(n => n.tipo)))

  const inp: React.CSSProperties = {
    padding: '7px 11px', borderRadius: 7, border: '1px solid #d1c9b8',
    fontSize: 12.5, fontFamily: 'inherit', background: '#fff', color: '#0a0f1e',
    outline: 'none',
  }

  return (
    <div style={{ padding: '28px 36px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0f1e', marginBottom: 4 }}>
          Atualizações Regulatórias BCB
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          Normas, resoluções e circulares do Banco Central e CMN com impacto nas obrigações de reporte CADOC.
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total de Normas',  value: String(NORMAS_BCB.length), color: '#0891b2' },
          { label: 'Novas / Recentes', value: String(novas),             color: '#854d0e' },
          { label: 'Vigentes',         value: String(NORMAS_BCB.filter(n=>n.status==='vigente').length), color: '#15803d' },
          { label: 'Tipos de Ato',     value: String(tipos.length),      color: '#7c3aed' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12,
            padding: '14px 18px', borderTop: `3px solid ${kpi.color}`,
          }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color, fontFamily: 'Courier New, monospace' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{ ...inp, flex: '1 1 220px' }}
          placeholder="Buscar por número, ementa ou tag..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
        />
        <select style={{ ...inp, flex: '0 0 auto' }} value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}>
          <option value="todos">Todos os tipos</option>
          {tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select style={{ ...inp, flex: '0 0 auto' }} value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}>
          <option value="todos">Todos os status</option>
          <option value="nova">Novas</option>
          <option value="vigente">Vigentes</option>
          <option value="revogada">Revogadas</option>
        </select>
        <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
          {normasFiltradas.length} resultado{normasFiltradas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lista de normas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {normasFiltradas.map(n => {
          const tc = TIPO_CORES[n.tipo] || TIPO_CORES['Resolução BCB']
          const sc = STATUS_CORES[n.status]
          return (
            <div key={n.id} style={{
              background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12,
              padding: '16px 20px',
              borderLeft: n.status === 'nova' ? '4px solid #d97706' : '1px solid #d1c9b8',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                {/* Tipo e número */}
                <div style={{ flex: '0 0 auto' }}>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                    background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, fontFamily: 'Courier New, monospace',
                  }}>
                    {n.tipo}
                  </span>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0a0f1e', marginTop: 4, fontFamily: 'Courier New, monospace' }}>
                    {n.numero}
                  </div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{fmtData(n.data)}</div>
                </div>

                {/* Ementa */}
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0a0f1e', lineHeight: 1.5, marginBottom: 10 }}>
                    {n.ementa}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {n.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: 9.5, padding: '2px 7px', borderRadius: 4,
                        background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb',
                        fontFamily: 'Courier New, monospace',
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Status + link */}
                <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                    background: sc.bg, color: sc.color,
                  }}>
                    {sc.label}
                  </span>
                  <a href={n.url} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: 11, color: '#0a7c5c', textDecoration: 'none', fontWeight: 600,
                    border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: 6,
                    display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fdf4',
                  }}>
                    Ver no BCB →
                  </a>
                </div>
              </div>
            </div>
          )
        })}

        {normasFiltradas.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 13 }}>Nenhuma norma encontrada para os filtros selecionados.</div>
          </div>
        )}
      </div>

      {/* Aviso de atualização */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 11, color: '#92400e' }}>
        <strong>Nota:</strong> Este painel exibe normas relevantes para as obrigações de reporte (CADOC). Para a versão completa e atualizada, consulte o{' '}
        <a href="https://www.bcb.gov.br/estabilidadefinanceira/normatizacao_regulamentacao" target="_blank" rel="noopener noreferrer" style={{ color: '#0a7c5c' }}>
          portal de normatização do BCB
        </a>. Configure sua chave de IA em <a href="/dashboard/settings" style={{ color: '#0a7c5c' }}>Configurações</a> para análises automáticas.
      </div>
    </div>
  )
}
