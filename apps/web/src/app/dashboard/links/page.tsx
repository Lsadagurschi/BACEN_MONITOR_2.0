'use client'
import { useState } from 'react'

const LINKS = [
  {ico:'🏛',nm:'Portal BCB',desc:'Banco Central do Brasil — portal oficial com normas, dados e comunicados',url:'https://www.bcb.gov.br',cat:'Regulador',tag:'Essencial'},
  {ico:'📜',nm:'Busca de Normas BCB',desc:'Sistema oficial de busca de normativos, resoluções e circulares do BCB',url:'https://www.bcb.gov.br/estabilidadefinanceira/buscanormas',cat:'Regulador',tag:'Essencial'},
  {ico:'📋',nm:'Leiaute CADOC/CRD',desc:'Documentação oficial de todos os CADOCs e documentos CRD do BCB',url:'https://www.bcb.gov.br/estabilidadefinanceira/leiautedocumentoscrd',cat:'CADOCs',tag:'Essencial'},
  {ico:'📊',nm:'Dados Abertos BCB',desc:'API pública, datasets e séries históricas do Banco Central',url:'https://dadosabertos.bcb.gov.br',cat:'Dados',tag:'API'},
  {ico:'⚡',nm:'Regulação Pix',desc:'Normas, regulamento, manuais e documentação técnica do Pix',url:'https://www.bcb.gov.br/estabilidadefinanceira/pix',cat:'Pagamentos',tag:''},
  {ico:'💳',nm:'Open Finance Brasil',desc:'Portal, documentação técnica e APIs do Open Finance',url:'https://openfinancebrasil.org.br',cat:'Pagamentos',tag:''},
  {ico:'🔐',nm:'PSAVs — Ativos Virtuais',desc:'Marco regulatório BCB para PSAVs — Res. 519-521/2023',url:'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20BCB&numero=519',cat:'Regulador',tag:'2023'},
  {ico:'📝',nm:'SCR — Instrução CADOC 3044',desc:'Manual de Preenchimento do Doc 3044 — Eventos de Crédito',url:'https://www.bcb.gov.br/content/estabilidadefinanceira/Leiaute_de_documentos/scrdoc3040/SCR_InstrucoesDePreenchimento_Doc3044.pdf',cat:'CADOCs',tag:'3044'},
  {ico:'🔍',nm:'COSIF — Plano Contábil',desc:'Plano Contábil das Instituições do SFN — busca de contas',url:'https://www3.bcb.gov.br/aplica/cosif',cat:'Contabilidade',tag:''},
  {ico:'📰',nm:'Diário Oficial da União',desc:'Publicações oficiais do governo federal — DOU',url:'https://www.in.gov.br/consulta/',cat:'Legislação',tag:''},
  {ico:'🌐',nm:'BIS / Basileia',desc:'Comitê de Basileia — padrões internacionais de supervisão bancária',url:'https://www.bis.org/bcbs/',cat:'Internacional',tag:''},
  {ico:'📱',nm:'STA — Sistema de Transferência',desc:'Documentação do Sistema de Transferência de Arquivos do BCB',url:'https://www.bcb.gov.br/estabilidadefinanceira/sta',cat:'Infraestrutura',tag:'STA'},
  {ico:'🏪',nm:'Arranjos de Pagamento BCB',desc:'Regulação, cadastro e documentação de arranjos de pagamento',url:'https://www.bcb.gov.br/estabilidadefinanceira/arranjos_pagamento',cat:'Pagamentos',tag:''},
  {ico:'📈',nm:'Res. CMN 4.966/2021',desc:'Instrumentos financeiros e nova metodologia PCLD (ECL)',url:'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20CMN&numero=4966',cat:'Crédito',tag:'PCLD'},
]

const CATS = ['Todos', ...new Set(LINKS.map(l => l.cat))]
const CAT_COLORS: Record<string,string> = {
  Regulador:'#dc2626', CADOCs:'#0891b2', Dados:'#7c3aed', Pagamentos:'#d97706',
  Contabilidade:'#1a6b52', Legislação:'#374151', Internacional:'#1d4ed8', Infraestrutura:'#6b7280', Crédito:'#9b1c1c'
}

export default function LinksPage() {
  const [cat, setCat] = useState('Todos')
  const [q, setQ] = useState('')

  const filtered = LINKS.filter(l => {
    if (cat !== 'Todos' && l.cat !== cat) return false
    if (q) return l.nm.toLowerCase().includes(q.toLowerCase()) || l.desc.toLowerCase().includes(q.toLowerCase())
    return true
  })

  return (
    <div style={{ padding: '24px 28px', minHeight: '100%', background: '#f0f2f7' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-.4px' }}>🔗 Links Úteis</h1>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Portais regulatórios, documentação BCB e referências normativas do SFN brasileiro</p>
      </div>

      {/* Search + Cats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 9, padding: '7px 12px', flex: 1, minWidth: 200, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <span style={{ fontSize: 14, color: '#9ca3af' }}>⌕</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar portais, documentação…" style={{ border: 'none', outline: 'none', fontSize: 12.5, color: '#111827', background: 'transparent', flex: 1 }}/>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', outline: 'none',
              border: `1px solid ${cat===c?(CAT_COLORS[c]||'#1a6b52'):'#e5e7eb'}`,
              background: cat===c?(CAT_COLORS[c]||'#1a6b52'):'#fff',
              color: cat===c?'#fff':'#6b7280',
              transition: 'all .12s',
            }}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
        {filtered.map(l => {
          const cc = CAT_COLORS[l.cat] || '#6b7280'
          return (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" style={{
              display: 'flex', gap: 14, padding: '16px 18px',
              background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 12,
              textDecoration: 'none', transition: 'all .15s', cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,.04)',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: cc + '12', border: `1px solid ${cc}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>{l.ico}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{l.nm}</div>
                  {l.tag && <span style={{ fontSize: 8.5, fontWeight: 700, fontFamily: 'monospace', background: cc+'15', color: cc, padding: '1px 6px', borderRadius: 3, border: `1px solid ${cc}25`, whiteSpace: 'nowrap', flexShrink: 0 }}>{l.tag}</span>}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5, marginBottom: 8 }}>{l.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: cc+'10', color: cc, border: `1px solid ${cc}20` }}>{l.cat}</span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>↗</span>
                </div>
              </div>
            </a>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Nenhum link encontrado</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Tente outra busca ou categoria</div>
        </div>
      )}
    </div>
  )
}
