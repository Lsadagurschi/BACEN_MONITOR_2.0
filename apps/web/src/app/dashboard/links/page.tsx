'use client'
import { useState } from 'react'

const LINKS = [
  { ico:'🏛', nm:'Portal BCB',                   desc:'Portal oficial do Banco Central do Brasil',                         url:'https://www.bcb.gov.br',                                                                  cat:'Regulador',      essencial:true  },
  { ico:'📜', nm:'Busca de Normas BCB',           desc:'Sistema oficial de busca de normativos, resoluções e circulares',  url:'https://www.bcb.gov.br/estabilidadefinanceira/buscanormas',                                cat:'Regulador',      essencial:true  },
  { ico:'📋', nm:'Leiaute CADOC / CRD',           desc:'Documentação de todos os CADOCs e documentos CRD do BCB',         url:'https://www.bcb.gov.br/estabilidadefinanceira/leiautedocumentoscrd',                       cat:'CADOCs',         essencial:true  },
  { ico:'🔗', nm:'STA — Sistema de Transferência', desc:'Portal para envio de arquivos via STA ao BCB',                   url:'https://www.bcb.gov.br/estabilidadefinanceira/sta',                                        cat:'CADOCs',         essencial:true  },
  { ico:'📊', nm:'Dados Abertos BCB',             desc:'API pública, datasets e séries históricas do Banco Central',      url:'https://dadosabertos.bcb.gov.br',                                                          cat:'Dados',          essencial:false },
  { ico:'⚡', nm:'Regulação Pix',                 desc:'Normas, manuais e documentação técnica do Pix',                  url:'https://www.bcb.gov.br/estabilidadefinanceira/pix',                                        cat:'Pagamentos',     essencial:true  },
  { ico:'💳', nm:'Open Finance Brasil',           desc:'Portal, documentação técnica e APIs do Open Finance',             url:'https://openfinancebrasil.org.br',                                                         cat:'Pagamentos',     essencial:false },
  { ico:'🔐', nm:'PSAVs — Marco Regulatório',     desc:'Res. BCB 519-521/2023 — autorização e funcionamento de PSAVs',   url:'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20BCB&numero=519', cat:'Regulador', essencial:false },
  { ico:'📋', nm:'Instrução CADOC 3044',          desc:'Manual de preenchimento do SCR — Eventos de Crédito',            url:'https://www.bcb.gov.br/content/estabilidadefinanceira/Leiaute_de_documentos/scrdoc3040/SCR_InstrucoesDePreenchimento_Doc3044.pdf', cat:'CADOCs', essencial:true },
  { ico:'🔍', nm:'COSIF — Plano Contábil',        desc:'Plano Contábil das IFs do SFN — busca de rubricas e contas',     url:'https://www3.bcb.gov.br/aplica/cosif',                                                     cat:'Contabilidade',  essencial:true  },
  { ico:'📰', nm:'Diário Oficial da União',       desc:'Publicações oficiais — DOU. Normas e atos de governo',           url:'https://www.in.gov.br/consulta/',                                                          cat:'Legislação',     essencial:false },
  { ico:'🌐', nm:'BIS — Basileia',                desc:'Comitê de Basileia — padrões internacionais de supervisão',      url:'https://www.bis.org/bcbs/',                                                                cat:'Internacional',  essencial:false },
  { ico:'📈', nm:'Res. CMN 4.966/2021 — PCLD',   desc:'Nova metodologia de provisão por perda esperada (ECL)',          url:'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20CMN&numero=4966', cat:'Crédito', essencial:true },
  { ico:'🏪', nm:'Arranjos de Pagamento',         desc:'Regulação, cadastro e documentação de arranjos no BCB',          url:'https://www.bcb.gov.br/estabilidadefinanceira/arranjos_pagamento',                         cat:'Pagamentos',     essencial:false },
]

const CATS = ['Todos', ...new Set(LINKS.map(l => l.cat))]
const CAT_COR: Record<string,string> = { Regulador:'#dc2626', CADOCs:'#0891b2', Dados:'#7c3aed', Pagamentos:'#d97706', Contabilidade:'#0d6e52', Legislação:'#374151', Internacional:'#1d4ed8', Crédito:'#9b1c1c' }

export default function LinksPage() {
  const [cat, setCat] = useState('Todos')
  const [q, setQ]     = useState('')
  const [soEss, setSoEss] = useState(false)

  const filtered = LINKS.filter(l => {
    if (cat !== 'Todos' && l.cat !== cat) return false
    if (soEss && !l.essencial) return false
    if (q) return l.nm.toLowerCase().includes(q.toLowerCase()) || l.desc.toLowerCase().includes(q.toLowerCase())
    return true
  })

  return (
    <div style={{ padding:'24px 28px', minHeight:'100%', background:'#f1f3f7' }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:'#111827', margin:'0 0 4px', letterSpacing:'-.4px' }}>⊕ Links e Portais Regulatórios</h1>
        <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>Portais BCB, documentação CADOC e referências normativas do Sistema Financeiro Nacional</p>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid #e5e7eb', borderRadius:9, padding:'7px 12px', flex:1, minWidth:200, boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
          <span style={{ fontSize:14, color:'#9ca3af' }}>⌕</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar portais, documentação…" style={{ border:'none', outline:'none', fontSize:13, color:'#111827', background:'transparent', flex:1, fontFamily:'inherit' }}/>
        </div>
        <button onClick={()=>setSoEss(!soEss)} style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${soEss?'#0d6e52':'#e5e7eb'}`, background:soEss?'#0d6e52':'#fff', color:soEss?'#fff':'#6b7280', fontSize:12, fontWeight:600, cursor:'pointer', outline:'none' }}>
          {soEss ? '✓ Essenciais' : 'Essenciais'}
        </button>
        {CATS.map(c => {
          const cor = CAT_COR[c] || '#374151'
          return (
            <button key={c} onClick={()=>setCat(c)} style={{ padding:'6px 13px', borderRadius:20, fontSize:11.5, fontWeight:600, cursor:'pointer', outline:'none', border:`1px solid ${cat===c?cor:'#e5e7eb'}`, background:cat===c?cor:'#fff', color:cat===c?'#fff':'#6b7280', transition:'all .12s' }}>{c}</button>
          )
        })}
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))', gap:12 }}>
        {filtered.map(l => {
          const cor = CAT_COR[l.cat] || '#374151'
          return (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" style={{ display:'flex', gap:14, padding:'16px 18px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, textDecoration:'none', boxShadow:'0 1px 3px rgba(0,0,0,.04)', transition:'box-shadow .15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,.1)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,.04)'}>
              <div style={{ width:44, height:44, borderRadius:10, background:cor+'12', border:`1px solid ${cor}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{l.ico}</div>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:6, marginBottom:4 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#111827', lineHeight:1.3 }}>{l.nm}</div>
                  {l.essencial && <span style={{ fontSize:8.5, fontWeight:700, background:'#f0fdf4', color:'#0d6e52', padding:'1px 6px', borderRadius:3, border:'1px solid #bbf7d0', whiteSpace:'nowrap', flexShrink:0 }}>essencial</span>}
                </div>
                <div style={{ fontSize:11.5, color:'#6b7280', lineHeight:1.5, marginBottom:8 }}>{l.desc}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:4, background:cor+'12', color:cor, border:`1px solid ${cor}22` }}>{l.cat}</span>
                  <span style={{ fontSize:12, color:'#9ca3af' }}>↗</span>
                </div>
              </div>
            </a>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding:'60px', textAlign:'center', color:'#9ca3af' }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🔍</div>
          <div style={{ fontSize:13, fontWeight:600 }}>Nenhum link encontrado</div>
          <div style={{ fontSize:12, marginTop:4 }}>Tente outra busca ou categoria</div>
        </div>
      )}
    </div>
  )
}
