'use client'
import { useEffect, useState } from 'react'

// ── Mapa de segmentos regulatórios (Res. BCB 197/2022) ──────────────────────
const SEGMENTOS = [
  {
    grupo: 'Segmentação Prudencial (Res. BCB 197/2022)',
    tipos: [
      { id: 's1', label: 'S1', desc: 'Bancos sistemicamente importantes — PR ≥ R$245bi ou G-SIB', cor: '#e53935' },
      { id: 's2', label: 'S2', desc: 'Bancos médios com atividade internacional — PR R$100–244bi', cor: '#f4511e' },
      { id: 's3', label: 'S3', desc: 'IFs de médio porte — PR R$2,3–99,9bi', cor: '#fb8c00' },
      { id: 's4', label: 'S4', desc: 'IFs de menor porte — PR R$500M–2,29bi', cor: '#c0ca33' },
      { id: 's5', label: 'S5', desc: 'Microinstituições financeiras — PR < R$500M', cor: '#43a047' },
    ],
  },
  {
    grupo: 'Instituições de Pagamento (Res. BCB 80/2021)',
    tipos: [
      { id: 'adquirente',    label: 'Adquirente',      desc: 'Credenciador de estabelecimentos — CADOC 6334 (ASPB034)', cor: '#1d5fcc' },
      { id: 'subadquirente', label: 'Subadquirente',   desc: 'IP sem participação direta na câmara de liquidação',       cor: '#0e7490' },
      { id: 'emissor_pos',   label: 'Emissor Pós-pago', desc: 'Emissor de cartão de crédito — CADOC 6308',               cor: '#7c3aed' },
      { id: 'emissor_pre',   label: 'Emissor Pré-pago', desc: 'Emissor de instrumento pré-pago (wallet, cartão pré)',   cor: '#c2410c' },
      { id: 'itp',           label: 'ITP',              desc: 'Iniciador de transação de pagamento (Open Finance)',      cor: '#0a7c5c' },
    ],
  },
]

// ── CADOCs obrigatórios por segmento ────────────────────────────────────────
const CADOCS_POR_SEGMENTO: Record<string, { code: string; nome: string; per: string; obrig: 'SIM' | 'COND' }[]> = {
  s1: [
    { code: '4010', nome: 'Balancete COSIF',                   per: 'Mensal',     obrig: 'SIM'  },
    { code: '4020', nome: 'Demonstrações Financeiras',         per: 'Semestral',  obrig: 'SIM'  },
    { code: '2010', nome: 'DLO — Demonstrativo de Liquidez',   per: 'Diário',     obrig: 'SIM'  },
    { code: '2020', nome: 'Capital e PR — Basileia III',       per: 'Mensal',     obrig: 'SIM'  },
    { code: '2025', nome: 'LCR — Liquidity Coverage Ratio',    per: 'Mensal',     obrig: 'SIM'  },
    { code: '2030', nome: 'NSFR — Net Stable Funding Ratio',   per: 'Mensal',     obrig: 'SIM'  },
    { code: '2045', nome: 'RWA — Parcelas de Capital',         per: 'Mensal',     obrig: 'SIM'  },
    { code: '3040', nome: 'Dados de Risco de Crédito (SCR)',   per: 'Mensal',     obrig: 'SIM'  },
    { code: '3044', nome: 'Eventos em Operações de Crédito',   per: 'Por evento', obrig: 'SIM'  },
    { code: '2055', nome: 'Pix — Informações Operacionais',    per: 'Mensal',     obrig: 'SIM'  },
    { code: '6334', nome: 'Cartões — Credenciadores',          per: 'Trimestral', obrig: 'COND' },
    { code: '6308', nome: 'Cartões — Emissores',               per: 'Trimestral', obrig: 'COND' },
  ],
  s2: [
    { code: '4010', nome: 'Balancete COSIF',                   per: 'Mensal',     obrig: 'SIM'  },
    { code: '4020', nome: 'Demonstrações Financeiras',         per: 'Semestral',  obrig: 'SIM'  },
    { code: '2010', nome: 'DLO — Demonstrativo de Liquidez',   per: 'Diário',     obrig: 'SIM'  },
    { code: '2020', nome: 'Capital e PR — Basileia III',       per: 'Mensal',     obrig: 'SIM'  },
    { code: '2025', nome: 'LCR — Liquidity Coverage Ratio',    per: 'Mensal',     obrig: 'SIM'  },
    { code: '2030', nome: 'NSFR — Net Stable Funding Ratio',   per: 'Mensal',     obrig: 'SIM'  },
    { code: '2045', nome: 'RWA — Parcelas de Capital',         per: 'Mensal',     obrig: 'SIM'  },
    { code: '3040', nome: 'Dados de Risco de Crédito (SCR)',   per: 'Mensal',     obrig: 'SIM'  },
    { code: '3044', nome: 'Eventos em Operações de Crédito',   per: 'Por evento', obrig: 'SIM'  },
    { code: '2055', nome: 'Pix — Informações Operacionais',    per: 'Mensal',     obrig: 'SIM'  },
    { code: '6334', nome: 'Cartões — Credenciadores',          per: 'Trimestral', obrig: 'COND' },
  ],
  s3: [
    { code: '4010', nome: 'Balancete COSIF',                   per: 'Mensal',     obrig: 'SIM'  },
    { code: '4020', nome: 'Demonstrações Financeiras',         per: 'Semestral',  obrig: 'SIM'  },
    { code: '2010', nome: 'DLO — Demonstrativo de Liquidez',   per: 'Diário',     obrig: 'COND' },
    { code: '2020', nome: 'Capital e PR — Basileia III',       per: 'Mensal',     obrig: 'SIM'  },
    { code: '2045', nome: 'RWA — Parcelas de Capital',         per: 'Mensal',     obrig: 'SIM'  },
    { code: '3040', nome: 'Dados de Risco de Crédito (SCR)',   per: 'Mensal',     obrig: 'SIM'  },
    { code: '3044', nome: 'Eventos em Operações de Crédito',   per: 'Por evento', obrig: 'SIM'  },
    { code: '2055', nome: 'Pix — Informações Operacionais',    per: 'Mensal',     obrig: 'COND' },
    { code: '6334', nome: 'Cartões — Credenciadores',          per: 'Trimestral', obrig: 'COND' },
  ],
  s4: [
    { code: '4010', nome: 'Balancete COSIF',                   per: 'Mensal',     obrig: 'SIM'  },
    { code: '4020', nome: 'Demonstrações Financeiras',         per: 'Semestral',  obrig: 'SIM'  },
    { code: '2010', nome: 'DLO — Demonstrativo de Liquidez',   per: 'Diário',     obrig: 'COND' },
    { code: '2020', nome: 'Capital (ICP simplificado)',        per: 'Mensal',     obrig: 'SIM'  },
    { code: '3040', nome: 'Dados de Risco de Crédito (SCR)',   per: 'Mensal',     obrig: 'COND' },
    { code: '3044', nome: 'Eventos em Operações de Crédito',   per: 'Por evento', obrig: 'COND' },
    { code: '2055', nome: 'Pix — Informações Operacionais',    per: 'Mensal',     obrig: 'COND' },
  ],
  s5: [
    { code: '4010', nome: 'Balancete COSIF',                   per: 'Mensal',     obrig: 'SIM'  },
    { code: '2020', nome: 'Capital (ICP trimestral)',          per: 'Trimestral', obrig: 'SIM'  },
    { code: '3040', nome: 'Dados de Risco de Crédito (SCR)',   per: 'Mensal',     obrig: 'COND' },
    { code: '3044', nome: 'Eventos em Operações de Crédito',   per: 'Por evento', obrig: 'COND' },
  ],
  adquirente: [
    { code: '4010', nome: 'Balancete COSIF (IPs)',             per: 'Mensal',     obrig: 'SIM'  },
    { code: '6334', nome: 'Cartões — Credenciadores (ASPB034)',per: 'Trimestral', obrig: 'SIM'  },
    { code: '2055', nome: 'Pix — Informações Operacionais',    per: 'Mensal',     obrig: 'COND' },
    { code: '2050', nome: 'Arranjos de Pagamento',             per: 'Mensal',     obrig: 'COND' },
    { code: '3040', nome: 'Dados de Risco de Crédito (SCR)',   per: 'Mensal',     obrig: 'COND' },
  ],
  subadquirente: [
    { code: '4010', nome: 'Balancete COSIF (IPs)',             per: 'Mensal',     obrig: 'SIM'  },
    { code: '2055', nome: 'Pix — Informações Operacionais',    per: 'Mensal',     obrig: 'COND' },
    { code: '3040', nome: 'Dados de Risco de Crédito (SCR)',   per: 'Mensal',     obrig: 'COND' },
  ],
  emissor_pos: [
    { code: '4010', nome: 'Balancete COSIF (IPs)',             per: 'Mensal',     obrig: 'SIM'  },
    { code: '6308', nome: 'Cartões — Emissores',               per: 'Trimestral', obrig: 'SIM'  },
    { code: '3040', nome: 'Dados de Risco de Crédito (SCR)',   per: 'Mensal',     obrig: 'SIM'  },
    { code: '3044', nome: 'Eventos em Operações de Crédito',   per: 'Por evento', obrig: 'SIM'  },
    { code: '2055', nome: 'Pix — Informações Operacionais',    per: 'Mensal',     obrig: 'COND' },
  ],
  emissor_pre: [
    { code: '4010', nome: 'Balancete COSIF (IPs)',             per: 'Mensal',     obrig: 'SIM'  },
    { code: '2055', nome: 'Pix — Informações Operacionais',    per: 'Mensal',     obrig: 'COND' },
  ],
  itp: [
    { code: '4010', nome: 'Balancete COSIF (IPs)',             per: 'Mensal',     obrig: 'SIM'  },
  ],
}

const LS_SETTINGS_KEY = 'bm_company_settings_v1'

interface CompanySettings {
  nomeEmpresa: string
  cnpj: string
  ispb: string
  segmento: string
  updatedAt: string
}

function loadSettings(): CompanySettings | null {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveSettings(s: CompanySettings) {
  localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(s))
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [segmento, setSegmento] = useState('s3')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [ispb, setIspb] = useState('')

  useEffect(() => {
    const s = loadSettings()
    if (s) {
      setSegmento(s.segmento || 's3')
      setNomeEmpresa(s.nomeEmpresa || '')
      setCnpj(s.cnpj || '')
      setIspb(s.ispb || '')
    }
  }, [])

  function handleSave() {
    const settings: CompanySettings = {
      nomeEmpresa,
      cnpj: cnpj.replace(/\D/g, ''),
      ispb: ispb.replace(/\D/g, ''),
      segmento,
      updatedAt: new Date().toISOString(),
    }
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const tipoSel = SEGMENTOS.flatMap(g => g.tipos).find(t => t.id === segmento)
  const cadocsObrigados = CADOCS_POR_SEGMENTO[segmento] || []
  const obrigatorios = cadocsObrigados.filter(c => c.obrig === 'SIM')
  const condicionais = cadocsObrigados.filter(c => c.obrig === 'COND')

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 11px', borderRadius: 7, border: '1px solid #d1c9b8',
    fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#0a0f1e', outline: 'none',
  }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }

  return (
    <div style={{ padding: '28px 36px', maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0f1e', marginBottom: 4 }}>Configurações da Instituição</h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 28 }}>
        Configure os dados da sua instituição para personalizar o dashboard e as obrigações regulatórias de entrega de CADOCs.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* ── Dados da empresa ── */}
        <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0a0f1e', marginBottom: 18 }}>Dados da Instituição</h2>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Razão Social / Nome</label>
            <input style={inp} value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)}
              placeholder="Ex: Banco Regional S.A." />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>CNPJ (14 dígitos)</label>
            <input style={{ ...inp, fontFamily: 'Courier New, monospace' }}
              value={cnpj} onChange={e => setCnpj(e.target.value)}
              placeholder="00000000000000" maxLength={14} />
          </div>
          <div>
            <label style={lbl}>ISPB (8 dígitos) — para participantes do Pix/STR</label>
            <input style={{ ...inp, fontFamily: 'Courier New, monospace' }}
              value={ispb} onChange={e => setIspb(e.target.value)}
              placeholder="00000000" maxLength={8} />
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
              Deixe em branco se não for participante direto do SPI
            </div>
          </div>
        </div>

        {/* ── Segmento regulatório ── */}
        <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0a0f1e', marginBottom: 6 }}>Segmento Regulatório BCB</h2>
          <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
            Define quais CADOCs são obrigatórios e personaliza prazos no calendário de entregas.
          </p>
          {SEGMENTOS.map(grupo => (
            <div key={grupo.grupo} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Courier New', marginBottom: 7 }}>
                {grupo.grupo}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {grupo.tipos.map(t => (
                  <button key={t.id} onClick={() => setSegmento(t.id)} style={{
                    padding: '5px 11px', borderRadius: 6, cursor: 'pointer', fontSize: 11.5, fontWeight: 700,
                    border: `2px solid ${segmento === t.id ? t.cor : '#d1c9b8'}`,
                    background: segmento === t.id ? t.cor + '18' : '#f9fafb',
                    color: segmento === t.id ? t.cor : '#4b5563',
                    transition: 'all .15s',
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {tipoSel && (
            <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 11, color: '#15803d', marginTop: 8 }}>
              <strong>{tipoSel.label}</strong> — {tipoSel.desc}
            </div>
          )}
        </div>
      </div>

      {/* ── Preview de CADOCs ── */}
      <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0a0f1e', marginBottom: 4 }}>
          CADOCs para {tipoSel?.label || segmento.toUpperCase()}
        </h2>
        <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 16 }}>
          {obrigatorios.length} obrigatórios · {condicionais.length} condicionais — conforme regulamentação BCB vigente
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {cadocsObrigados.map(c => (
            <div key={c.code} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              background: c.obrig === 'SIM' ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${c.obrig === 'SIM' ? '#bbf7d0' : '#fde68a'}`,
              borderRadius: 8,
            }}>
              <span style={{
                fontFamily: 'Courier New, monospace', fontSize: 10, fontWeight: 800,
                color: c.obrig === 'SIM' ? '#0a7c5c' : '#92400e',
                background: c.obrig === 'SIM' ? '#dcfce7' : '#fef3c7',
                padding: '2px 7px', borderRadius: 4, flexShrink: 0,
              }}>{c.code}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#0a0f1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</div>
                <div style={{ fontSize: 9.5, color: '#6b7280', fontFamily: 'Courier New, monospace' }}>{c.per} · {c.obrig}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Botão salvar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={handleSave} style={{
          padding: '10px 24px', borderRadius: 8, background: '#0a7c5c', color: '#fff', border: 'none',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background .15s',
        }}>
          Salvar Configurações
        </button>
        {saved && (
          <span style={{ fontSize: 12, color: '#0a7c5c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            ✓ Configurações salvas! Dashboard e entregas atualizados.
          </span>
        )}
      </div>
    </div>
  )
}
