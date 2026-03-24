'use client'
export default function LinksPage() {
  const links = [
    {ico:'🏛',nm:'Portal BCB',desc:'Banco Central do Brasil — portal oficial',url:'https://www.bcb.gov.br',cat:'Regulador'},
    {ico:'📜',nm:'Busca de Normas BCB',desc:'Sistema oficial de normativos e resoluções',url:'https://www.bcb.gov.br/estabilidadefinanceira/buscanormas',cat:'Regulador'},
    {ico:'📋',nm:'Leiaute CADOC/CRD',desc:'Documentação e leiautes dos CADOCs',url:'https://www.bcb.gov.br/estabilidadefinanceira/leiautedocumentoscrd',cat:'CADOCs'},
    {ico:'📊',nm:'Dados Abertos BCB',desc:'API pública e datasets do BCB',url:'https://dadosabertos.bcb.gov.br',cat:'Dados'},
    {ico:'📰',nm:'Diário Oficial — DOU',desc:'Publicações oficiais da União',url:'https://www.in.gov.br/consulta/',cat:'Legislação'},
    {ico:'💳',nm:'Open Finance BR',desc:'Portal e documentação Open Finance',url:'https://openfinancebrasil.org.br',cat:'Pagamentos'},
    {ico:'⚡',nm:'Regulação Pix',desc:'Normas, documentação e regulamento Pix',url:'https://www.bcb.gov.br/estabilidadefinanceira/pix',cat:'Pagamentos'},
    {ico:'🔐',nm:'PSAVs — Marco Regulatório',desc:'Res. BCB 519/520/521 — Ativos Virtuais',url:'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20BCB&numero=519',cat:'Regulador'},
    {ico:'📝',nm:'SCR — CADOC 3044',desc:'Instrução de Preenchimento Doc 3044',url:'https://www.bcb.gov.br/content/estabilidadefinanceira/Leiaute_de_documentos/scrdoc3040/SCR_InstrucoesDePreenchimento_Doc3044.pdf',cat:'CADOCs'},
    {ico:'🌐',nm:'BIS / Basileia',desc:'Comitê de Basileia — padrões internacionais',url:'https://www.bis.org/bcbs/',cat:'Internacional'},
    {ico:'📱',nm:'STA — Sistema de Transferência',desc:'Documentação do sistema de envio BCB',url:'https://www.bcb.gov.br/estabilidadefinanceira/sta',cat:'Infraestrutura'},
    {ico:'🔍',nm:'COSIF',desc:'Plano Contábil das Instituições do SFN',url:'https://www3.bcb.gov.br/aplica/cosif',cat:'Contabilidade'},
    {ico:'📈',nm:'Resolução CMN 4.966/2021',desc:'Instrumentos financeiros e crédito',url:'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20CMN&numero=4966',cat:'Crédito'},
    {ico:'🏪',nm:'Arranjos de Pagamento BCB',desc:'Regulação e cadastro de arranjos',url:'https://www.bcb.gov.br/estabilidadefinanceira/arranjos_pagamento',cat:'Pagamentos'},
  ]

  const cats = ['Todos',...[...new Set(links.map(l=>l.cat))]]
  const C = { txt:'#0d1117',txt2:'#1e3a5f',txt3:'#5a6e8a',bg:'#f5f6f8',brd:'#dde1e9',grn:'#0a7c5c',grnb:'rgba(10,124,92,.08)',grnbrd:'rgba(10,124,92,.2)',blu:'#1d5fcc' }

  return (
    <div style={{ padding:'24px 28px', overflowY:'auto', height:'100%', background:C.bg }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:18, fontWeight:800, color:C.txt, marginBottom:4 }}>🔗 Links Úteis</h1>
        <p style={{ fontSize:12, color:C.txt3 }}>Portais regulatórios, documentação BCB e referências normativas do SFN.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
        {links.map(l=>(
          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" style={{
            display:'flex', gap:12, padding:'14px 16px',
            background:'#fff', border:`1px solid ${C.brd}`, borderRadius:10,
            textDecoration:'none', transition:'border-color .15s, box-shadow .15s',
            cursor:'pointer', outline:'none'
          }}
>
            <div style={{ width:36, height:36, borderRadius:8, background:C.grnb, border:`1px solid ${C.grnbrd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{l.ico}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:C.txt, marginBottom:2 }}>{l.nm}</div>
              <div style={{ fontSize:10.5, color:C.txt3, lineHeight:1.5, marginBottom:4 }}>{l.desc}</div>
              <span style={{ fontSize:9, fontFamily:'monospace', background:C.grnb, color:C.grn, padding:'1px 6px', borderRadius:3, border:`1px solid ${C.grnbrd}` }}>{l.cat}</span>
            </div>
            <div style={{ marginLeft:'auto', fontSize:12, color:C.txt3, flexShrink:0, alignSelf:'flex-start' }}>↗</div>
          </a>
        ))}
      </div>
    </div>
  )
}
