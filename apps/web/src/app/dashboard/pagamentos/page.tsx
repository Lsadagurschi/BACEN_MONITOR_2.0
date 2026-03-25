'use client'
import { useState } from 'react'

interface CadocItem {
  code: string
  nome: string
  periodicidade: string
  prazo: string
  base: string
  obrig: 'SIM' | 'COND' | 'NAO'
  desc: string
}

interface SegmentoData {
  id: string
  label: string
  desc: string
  cor: string
  prReq: string
  cadocs: CadocItem[]
}

const SEGMENTOS_PGTO: SegmentoData[] = [
  {
    id: 's1',
    label: 'S1',
    desc: 'Bancos Sistemicamente Importantes',
    cor: '#dc2626',
    prReq: 'PR ≥ R$245bi ou G-SIB',
    cadocs: [
      { code: '4010', nome: 'Balancete COSIF',                per:'Mensal',      prazo:'9º DU mês seg.',     base:'Mensal',   obrig:'SIM',  desc:'Demonstrativo contábil padrão COSIF, obrigatório para todos os segmentos' } as any,
      { code: '4020', nome: 'Demonstrações Financeiras',      per:'Semestral',   prazo:'60 dias após fech.', base:'Jun/Dez',  obrig:'SIM',  desc:'DRE, Balanço Patrimonial e Notas Explicativas' } as any,
      { code: '2010', nome: 'DLO — Demonstrativo de Liquidez',per:'Diário',      prazo:'D+0',                base:'Diário',   obrig:'SIM',  desc:'Monitoramento diário da liquidez — exclusivo S1/S2' } as any,
      { code: '2020', nome: 'Capital e PR — Basileia III',    per:'Mensal',      prazo:'9º DU mês seg.',     base:'Mensal',   obrig:'SIM',  desc:'RWA, índice de Basileia, Tier 1/2/Total' } as any,
      { code: '2025', nome: 'LCR — Liquidity Coverage Ratio', per:'Mensal',      prazo:'9º DU mês seg.',     base:'Mensal',   obrig:'SIM',  desc:'Cobertura de liquidez de 30 dias — Basel III' } as any,
      { code: '2030', nome: 'NSFR — Net Stable Funding',      per:'Mensal',      prazo:'9º DU mês seg.',     base:'Mensal',   obrig:'SIM',  desc:'Estabilidade de funding de longo prazo — Basel III' } as any,
      { code: '2045', nome: 'RWA — Parcelas de Capital',      per:'Mensal',      prazo:'9º DU mês seg.',     base:'Mensal',   obrig:'SIM',  desc:'Detalhamento das parcelas de capital por risco' } as any,
      { code: '3040', nome: 'SCR — Dados de Crédito',         per:'Mensal',      prazo:'18º dia mês seg.',   base:'Mensal',   obrig:'SIM',  desc:'Registro de clientes e operações de crédito no SCR' } as any,
      { code: '3044', nome: 'SCR — Eventos de Crédito',       per:'Por evento',  prazo:'5 DU do evento',     base:'Evento',   obrig:'SIM',  desc:'Abertura, liquidação, cessão e reestruturação de crédito' } as any,
      { code: '2055', nome: 'Pix — Informações Operacionais', per:'Mensal',      prazo:'10º dia mês seg.',   base:'Mensal',   obrig:'SIM',  desc:'Estatísticas operacionais de transações Pix' } as any,
      { code: '6334', nome: 'Cartões — Credenciadores',       per:'Trimestral',  prazo:'20º dia mês seg.',   base:'Trim.',    obrig:'COND', desc:'ASPB034 — obrigatório se credenciador de cartões' } as any,
      { code: '6308', nome: 'Cartões — Emissores',            per:'Trimestral',  prazo:'20º dia mês seg.',   base:'Trim.',    obrig:'COND', desc:'Obrigatório se emissor de cartão pós-pago' } as any,
    ],
  },
  {
    id: 's2',
    label: 'S2',
    desc: 'Bancos Médios com Atividade Internacional',
    cor: '#f97316',
    prReq: 'PR R$100–244bi',
    cadocs: [
      { code: '4010', nome: 'Balancete COSIF',                per:'Mensal',      prazo:'9º DU mês seg.',     base:'Mensal',   obrig:'SIM',  desc:'Demonstrativo contábil padrão COSIF' } as any,
      { code: '4020', nome: 'Demonstrações Financeiras',      per:'Semestral',   prazo:'60 dias após fech.', base:'Jun/Dez',  obrig:'SIM',  desc:'DRE, Balanço e Notas Explicativas' } as any,
      { code: '2010', nome: 'DLO — Demonstrativo de Liquidez',per:'Diário',      prazo:'D+0',                base:'Diário',   obrig:'SIM',  desc:'Monitoramento diário da liquidez' } as any,
      { code: '2020', nome: 'Capital e PR — Basileia III',    per:'Mensal',      prazo:'9º DU mês seg.',     base:'Mensal',   obrig:'SIM',  desc:'RWA, índice de Basileia completo' } as any,
      { code: '2025', nome: 'LCR',                            per:'Mensal',      prazo:'9º DU mês seg.',     base:'Mensal',   obrig:'SIM',  desc:'Cobertura de liquidez de 30 dias' } as any,
      { code: '2030', nome: 'NSFR',                           per:'Mensal',      prazo:'9º DU mês seg.',     base:'Mensal',   obrig:'SIM',  desc:'Estabilidade de funding de longo prazo' } as any,
      { code: '2045', nome: 'RWA — Parcelas de Capital',      per:'Mensal',      prazo:'9º DU mês seg.',     base:'Mensal',   obrig:'SIM',  desc:'Detalhamento das parcelas de capital' } as any,
      { code: '3040', nome: 'SCR — Dados de Crédito',         per:'Mensal',      prazo:'18º dia mês seg.',   base:'Mensal',   obrig:'SIM',  desc:'Registro no Sistema de Crédito' } as any,
      { code: '3044', nome: 'SCR — Eventos de Crédito',       per:'Por evento',  prazo:'5 DU do evento',     base:'Evento',   obrig:'SIM',  desc:'Eventos de abertura, liquidação e cessão' } as any,
      { code: '2055', nome: 'Pix Operacional',                per:'Mensal',      prazo:'10º dia mês seg.',   base:'Mensal',   obrig:'SIM',  desc:'Estatísticas de transações Pix' } as any,
    ],
  },
  {
    id: 's3',
    label: 'S3',
    desc: 'IFs de Médio Porte',
    cor: '#eab308',
    prReq: 'PR R$2,3bi–99,9bi',
    cadocs: [
      { code: '4010', nome: 'Balancete COSIF',           per:'Mensal',      prazo:'9º DU mês seg.',   base:'Mensal',  obrig:'SIM',  desc:'Demonstrativo contábil padrão COSIF' } as any,
      { code: '4020', nome: 'Demonstrações Financeiras', per:'Semestral',   prazo:'60 dias',          base:'Jun/Dez', obrig:'SIM',  desc:'DRE, Balanço e Notas' } as any,
      { code: '2020', nome: 'Capital e PR',              per:'Mensal',      prazo:'9º DU mês seg.',   base:'Mensal',  obrig:'SIM',  desc:'RWA e índice de Basileia simplificado' } as any,
      { code: '2045', nome: 'RWA',                       per:'Mensal',      prazo:'9º DU mês seg.',   base:'Mensal',  obrig:'SIM',  desc:'Parcelas de capital por risco' } as any,
      { code: '3040', nome: 'SCR — Dados de Crédito',   per:'Mensal',      prazo:'18º dia mês seg.', base:'Mensal',  obrig:'SIM',  desc:'Registro no SCR' } as any,
      { code: '3044', nome: 'SCR — Eventos',             per:'Por evento',  prazo:'5 DU do evento',   base:'Evento',  obrig:'SIM',  desc:'Eventos de crédito' } as any,
      { code: '2010', nome: 'DLO — Liquidez',            per:'Diário',      prazo:'D+0',              base:'Diário',  obrig:'COND', desc:'Condicional conforme exposição ao risco' } as any,
      { code: '2055', nome: 'Pix Operacional',           per:'Mensal',      prazo:'10º dia mês seg.', base:'Mensal',  obrig:'COND', desc:'Obrigatório se participante do SPI' } as any,
    ],
  },
  {
    id: 's4',
    label: 'S4',
    desc: 'IFs de Menor Porte',
    cor: '#84cc16',
    prReq: 'PR R$500M–2,29bi',
    cadocs: [
      { code: '4010', nome: 'Balancete COSIF',           per:'Mensal',      prazo:'9º DU mês seg.',   base:'Mensal',  obrig:'SIM',  desc:'COSIF padrão simplificado' } as any,
      { code: '4020', nome: 'Demonstrações Financeiras', per:'Semestral',   prazo:'60 dias',          base:'Jun/Dez', obrig:'SIM',  desc:'DRE e Balanço' } as any,
      { code: '2020', nome: 'Capital (ICP Simplif.)',    per:'Mensal',      prazo:'9º DU mês seg.',   base:'Mensal',  obrig:'SIM',  desc:'Índice de Capital Próprio simplificado' } as any,
      { code: '3040', nome: 'SCR — Dados de Crédito',   per:'Mensal',      prazo:'18º dia mês seg.', base:'Mensal',  obrig:'COND', desc:'Obrigatório se tiver carteira de crédito > R$500M' } as any,
      { code: '3044', nome: 'SCR — Eventos',             per:'Por evento',  prazo:'5 DU do evento',   base:'Evento',  obrig:'COND', desc:'Condicional — se reportar 3040' } as any,
      { code: '2055', nome: 'Pix Operacional',           per:'Mensal',      prazo:'10º dia mês seg.', base:'Mensal',  obrig:'COND', desc:'Obrigatório se participante do SPI' } as any,
    ],
  },
  {
    id: 's5',
    label: 'S5',
    desc: 'Microinstituições Financeiras',
    cor: '#22c55e',
    prReq: 'PR < R$500M',
    cadocs: [
      { code: '4010', nome: 'Balancete COSIF',        per:'Mensal',      prazo:'9º DU mês seg.',   base:'Mensal',  obrig:'SIM',  desc:'COSIF simplificado para micro-IFs' } as any,
      { code: '2020', nome: 'Capital (ICP Trim.)',    per:'Trimestral',  prazo:'9º DU mês seg.',   base:'Trim.',   obrig:'SIM',  desc:'ICP trimestral — carga reduzida' } as any,
      { code: '3040', nome: 'SCR',                   per:'Mensal',      prazo:'18º dia mês seg.', base:'Mensal',  obrig:'COND', desc:'Se tiver carteira de crédito' } as any,
      { code: '3044', nome: 'SCR — Eventos',          per:'Por evento',  prazo:'5 DU do evento',   base:'Evento',  obrig:'COND', desc:'Se reportar 3040' } as any,
    ],
  },
  {
    id: 'adquirente',
    label: 'Adquirente',
    desc: 'Credenciadores de Estabelecimentos',
    cor: '#3b82f6',
    prReq: 'Credenciador (Res. BCB 80)',
    cadocs: [
      { code: '4010', nome: 'Balancete COSIF (IPs)',        per:'Mensal',     prazo:'9º DU mês seg.',   base:'Mensal',  obrig:'SIM',  desc:'COSIF para IPs — Plano Contábil de IPs' } as any,
      { code: '6334', nome: 'Cartões — Credenciadores',     per:'Trimestral', prazo:'20º dia mês seg.', base:'Trim.',   obrig:'SIM',  desc:'ASPB034 — volume, transações e credenciamento' } as any,
      { code: '2055', nome: 'Pix Operacional',              per:'Mensal',     prazo:'10º dia mês seg.', base:'Mensal',  obrig:'COND', desc:'Se participante do SPI' } as any,
      { code: '2050', nome: 'Arranjos de Pagamento',        per:'Mensal',     prazo:'9º DU mês seg.',   base:'Mensal',  obrig:'COND', desc:'Se participante de arranjo regulado' } as any,
      { code: '3040', nome: 'SCR',                          per:'Mensal',     prazo:'18º dia mês seg.', base:'Mensal',  obrig:'COND', desc:'Se oferecer crédito (parcelamento lojista)' } as any,
    ],
  },
  {
    id: 'emissor_pos',
    label: 'Emissor Pós-pago',
    desc: 'Emissor de Cartão de Crédito',
    cor: '#8b5cf6',
    prReq: 'Emissor cartão pós-pago',
    cadocs: [
      { code: '4010', nome: 'Balancete COSIF (IPs)', per:'Mensal',     prazo:'9º DU mês seg.',   base:'Mensal',  obrig:'SIM',  desc:'COSIF para IPs' } as any,
      { code: '6308', nome: 'Cartões — Emissores',   per:'Trimestral', prazo:'20º dia mês seg.', base:'Trim.',   obrig:'SIM',  desc:'ASPB031 — cartões emitidos, transações, inadimplência' } as any,
      { code: '3040', nome: 'SCR',                   per:'Mensal',     prazo:'18º dia mês seg.', base:'Mensal',  obrig:'SIM',  desc:'Crédito rotativo e parcelado de cartão' } as any,
      { code: '3044', nome: 'SCR — Eventos',          per:'Por evento', prazo:'5 DU do evento',   base:'Evento',  obrig:'SIM',  desc:'Eventos de crédito de cartão' } as any,
      { code: '2055', nome: 'Pix Operacional',        per:'Mensal',     prazo:'10º dia mês seg.', base:'Mensal',  obrig:'COND', desc:'Se participante do SPI' } as any,
    ],
  },
]

const OBRIG_CORES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  SIM:  { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', label: 'Obrigatório' },
  COND: { bg: '#fef9c3', color: '#854d0e', border: '#fde68a', label: 'Condicional' },
  NAO:  { bg: '#f3f4f6', color: '#9ca3af', border: '#e5e7eb', label: 'Não aplicável' },
}

export default function PagamentosPage() {
  const [segSel, setSegSel] = useState('s1')
  const seg = SEGMENTOS_PGTO.find(s => s.id === segSel) || SEGMENTOS_PGTO[0]
  const obrig = seg.cadocs.filter(c => c.obrig === 'SIM').length
  const cond  = seg.cadocs.filter(c => c.obrig === 'COND').length

  return (
    <div style={{ padding: '28px 36px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0f1e', marginBottom: 4 }}>
          CADOCs Obrigatórios por Porte de IF
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          Meios de pagamento e obrigações regulatórias de CADOC conforme o porte e tipo da instituição — baseado na Res. BCB 197/2022 e Res. BCB 80/2021.
        </p>
      </div>

      {/* Seletor de segmento */}
      <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Courier New', marginBottom: 12 }}>
          Selecione o Segmento / Porte da IF
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SEGMENTOS_PGTO.map(s => (
            <button
              key={s.id}
              onClick={() => setSegSel(s.id)}
              style={{
                padding: '7px 15px', borderRadius: 8, cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                border: `2px solid ${segSel === s.id ? s.cor : '#d1c9b8'}`,
                background: segSel === s.id ? s.cor + '18' : '#f9fafb',
                color: segSel === s.id ? s.cor : '#4b5563',
                transition: 'all .15s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info do segmento selecionado */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Segmento',       value: seg.label,              color: seg.cor    },
          { label: 'CADOCs Obrig.',  value: String(obrig),           color: '#15803d' },
          { label: 'Condicionais',   value: String(cond),            color: '#854d0e' },
          { label: 'Req. de PR',     value: seg.prReq,              color: '#0891b2' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12,
            padding: '14px 18px', borderTop: `3px solid ${kpi.color}`,
          }}>
            <div style={{ fontSize: kpi.value.length > 8 ? 13 : 22, fontWeight: 900, color: kpi.color, fontFamily: 'Courier New, monospace' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: `2px solid ${seg.cor}30`, borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', background: seg.cor, flexShrink: 0,
          }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0a0f1e' }}>{seg.label} — {seg.desc}</span>
            <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 10 }}>{seg.prReq}</span>
          </div>
        </div>
      </div>

      {/* Tabela de CADOCs */}
      <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        {/* Cabeçalho */}
        <div style={{
          display: 'grid', gridTemplateColumns: '80px 1fr 100px 140px 80px',
          padding: '10px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
          fontSize: 10, fontWeight: 700, color: '#9ca3af', fontFamily: 'Courier New, monospace',
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          <div>CADOC</div>
          <div>Nome / Descrição</div>
          <div>Periodicidade</div>
          <div>Prazo</div>
          <div style={{ textAlign: 'center' }}>Status</div>
        </div>

        {seg.cadocs.map((c, i) => {
          const oc = OBRIG_CORES[c.obrig]
          return (
            <div key={c.code} style={{
              display: 'grid', gridTemplateColumns: '80px 1fr 100px 140px 80px',
              padding: '12px 16px', borderBottom: i < seg.cadocs.length - 1 ? '1px solid #f3f4f6' : 'none',
              alignItems: 'center',
            }}>
              <div>
                <span style={{
                  fontFamily: 'Courier New, monospace', fontSize: 11, fontWeight: 800,
                  color: '#0e7490', background: '#ecfeff', border: '1px solid #a5f3fc',
                  padding: '2px 7px', borderRadius: 5,
                }}>{c.code}</span>
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0a0f1e' }}>{c.nome}</div>
                <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 2 }}>{c.desc}</div>
              </div>
              <div style={{ fontSize: 11.5, color: '#374151', fontFamily: 'Courier New, monospace' }}>
                {c.periodicidade}
              </div>
              <div style={{ fontSize: 11, color: '#374151' }}>
                {c.prazo}
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                  background: oc.bg, color: oc.color, border: `1px solid ${oc.border}`,
                  whiteSpace: 'nowrap',
                }}>{oc.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparativo de todos os segmentos */}
      <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0a0f1e', marginBottom: 16 }}>
          Comparativo — CADOCs por Segmento
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, color: '#9ca3af', fontFamily: 'Courier New' }}>CADOC</th>
                {SEGMENTOS_PGTO.map(s => (
                  <th key={s.id} style={{ textAlign: 'center', padding: '8px 10px', fontSize: 10, color: s.cor, fontFamily: 'Courier New' }}>
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['4010','4020','2010','2020','2025','2030','2045','3040','3044','2055','6334','6308','2050'].map(code => {
                const nome = SEGMENTOS_PGTO.flatMap(s => s.cadocs).find(c => c.code === code)?.nome || code
                return (
                  <tr key={code} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '7px 12px' }}>
                      <span style={{
                        fontFamily: 'Courier New, monospace', fontSize: 10, fontWeight: 800,
                        color: '#0e7490', background: '#ecfeff', border: '1px solid #a5f3fc',
                        padding: '1px 5px', borderRadius: 3, marginRight: 8,
                      }}>{code}</span>
                      <span style={{ color: '#374151', fontSize: 10.5 }}>{nome}</span>
                    </td>
                    {SEGMENTOS_PGTO.map(s => {
                      const c = s.cadocs.find(c => c.code === code)
                      const oc = c ? OBRIG_CORES[c.obrig] : null
                      return (
                        <td key={s.id} style={{ textAlign: 'center', padding: '7px 10px' }}>
                          {oc ? (
                            <span style={{
                              fontSize: 8.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                              background: oc.bg, color: oc.color, border: `1px solid ${oc.border}`,
                            }}>
                              {c?.obrig}
                            </span>
                          ) : (
                            <span style={{ color: '#d1c9b8', fontSize: 12 }}>—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {Object.entries(OBRIG_CORES).map(([key, oc]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                background: oc.bg, color: oc.color, border: `1px solid ${oc.border}`,
              }}>{key}</span>
              <span style={{ color: '#6b7280' }}>{oc.label}</span>
            </div>
          ))}
          <span style={{ color: '#9ca3af', fontSize: 11 }}>— Não aplicável</span>
        </div>
      </div>
    </div>
  )
}
