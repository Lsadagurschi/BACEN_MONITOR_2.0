'use client'
import { useState, useEffect, useRef } from 'react'

const C = { grn:'#0a7c5c',grnb:'rgba(10,124,92,.08)',grnbrd:'rgba(10,124,92,.2)',txt:'#0d1117',txt2:'#1e3a5f',txt3:'#5a6e8a',bg:'#f5f6f8',bg2:'#fff',bg3:'#eef0f3',brd:'#dde1e9',brd2:'#c8cdd8',blu:'#1d5fcc',blub:'rgba(29,95,204,.08)',blubrd:'rgba(29,95,204,.18)',amb:'#b45309',ambb:'rgba(180,83,9,.08)',ambbrd:'rgba(180,83,9,.2)',red:'#c0392b',redb:'rgba(192,57,43,.06)',redbrd:'rgba(192,57,43,.18)',pnk:'#7c3aed',pnkb:'rgba(124,58,237,.06)',pnkbrd:'rgba(124,58,237,.18)',cyn:'#0e7490' }

// Normas estáticas — feed ao vivo via RSS BCB (requer backend proxy em prod)
const NORMAS_STATIC = [
  {id:1,titulo:'Resolução BCB nº 403/2025 — CADOC 3044 Fase 2: Cessões e Aquisições',tipo:'Resolução BCB',area:'crédito',urgencia:'critica',data_pub:'2025-11-10',numero:'403',resumo:'Estabelece a segunda fase de implementação do CADOC 3044, incluindo obrigatoriedade do reporte de cessões de crédito e aquisições de carteiras. Vigência: maio/2026 para IFs com patrimônio > R$1 bi.',url:'https://www.bcb.gov.br',vigencia:'novembro/2025',tags:['CADOC 3044','SCR','Cessões','Aquisições']},
  {id:2,titulo:'Resolução CMN nº 5.088/2024 — Crédito Imobiliário FGTS',tipo:'Resolução CMN',area:'crédito',urgencia:'alta',data_pub:'2024-12-02',numero:'5088',resumo:'Altera regras do crédito habitacional com recursos do FGTS, impactando modalidades de financiamento e obrigatoriedades de reporte no SCR (CADOC 3040).',url:'https://www.bcb.gov.br',vigencia:'dezembro/2024',tags:['CADOC 3040','SCR','Crédito Imobiliário']},
  {id:3,titulo:'Resolução BCB nº 396/2025 — Requisitos Prudenciais para PSAVs',tipo:'Resolução BCB',area:'câmbio',urgencia:'critica',data_pub:'2025-09-15',numero:'396',resumo:'Define capital mínimo, governança e requisitos operacionais para prestadores de serviços em ativos virtuais. Complementa a Res. BCB 519-521. Exige CADOC 4010 e C212.',url:'https://www.bcb.gov.br',vigencia:'setembro/2025',tags:['PSAV','C212','CADOC 4010','Cripto']},
  {id:4,titulo:'Instrução Normativa BCB nº 510/2025 — Open Finance Fase 4',tipo:'Instrução Normativa BCB',area:'tecnologia',urgencia:'alta',data_pub:'2025-07-20',numero:'510',resumo:'Regulamenta a quarta fase do Open Finance, incluindo serviços de investimento e previdência. IFs participantes devem atualizar reporte no CADOC 7011.',url:'https://www.bcb.gov.br',vigencia:'julho/2025',tags:['Open Finance','CADOC 7011','API','Dados']},
  {id:5,titulo:'Resolução BCB nº 522/2025 — Subcredenciadores: Liquidação Obrigatória',tipo:'Resolução BCB',area:'pagamentos',urgencia:'critica',data_pub:'2025-06-01',numero:'522',resumo:'Obriga subcredenciadores a participar diretamente da liquidação financeira em arranjos de pagamento. Prazo de adequação: 18 meses a partir da publicação.',url:'https://www.bcb.gov.br',vigencia:'junho/2025',tags:['Subcredenciador','Liquidação','SPB','Res. 522']},
  {id:6,titulo:'Circular BCB nº 4.019/2025 — SCR Taxas de Juros CADOC 3060',tipo:'Circular BCB',area:'crédito',urgencia:'normal',data_pub:'2025-04-10',numero:'4019',resumo:'Atualiza metodologia de cálculo dos percentis de taxas de juros e expande modalidades obrigatórias no CADOC 3060. Novo prazo de envio: semanal D+5.',url:'https://www.bcb.gov.br',vigencia:'abril/2025',tags:['CADOC 3060','SCR','Taxas']},
  {id:7,titulo:'Resolução BCB nº 411/2025 — Pix Parcelado e Garantido',tipo:'Resolução BCB',area:'pagamentos',urgencia:'alta',data_pub:'2025-10-05',numero:'411',resumo:'Regulamenta modalidades de Pix parcelado e Pix garantido, estabelecendo regras para IPs emissores e adquirentes. Impacta CADOC 2055 e 6334.',url:'https://www.bcb.gov.br',vigencia:'outubro/2025',tags:['Pix','CADOC 2055','CADOC 6334','Inovação']},
  {id:8,titulo:'Resolução CMN nº 4.966/2021 — Instrumentos Financeiros e PCLD',tipo:'Resolução CMN',area:'crédito',urgencia:'normal',data_pub:'2021-11-25',numero:'4966',resumo:'Altera critérios de classificação e mensuração de instrumentos financeiros. Define nova metodologia de PCLD (ECL) em substituição ao modelo de perda incorrida. Impacta CADOC 3040 — campos ContInstFinRes4966.',url:'https://www.bcb.gov.br',vigencia:'janeiro/2025',tags:['CADOC 3040','PCLD','ECL','Res. 4.966']},
  {id:9,titulo:'Resolução BCB nº 519/2023 — Autorização e Funcionamento PSAVs',tipo:'Resolução BCB',area:'câmbio',urgencia:'normal',data_pub:'2023-11-24',numero:'519',resumo:'Dispõe sobre a autorização para funcionamento de prestadores de serviços de ativos virtuais no Brasil. Exige comunicação ao BCB e reporte via CADOC C212.',url:'https://www.bcb.gov.br',vigencia:'novembro/2023',tags:['PSAV','Cripto','C212','Marco Regulatório']},
  {id:10,titulo:'Resolução BCB nº 150/2021 — CADOC 6334 Cartões Credenciadores',tipo:'Resolução BCB',area:'pagamentos',urgencia:'normal',data_pub:'2021-06-30',numero:'150',resumo:'Estabelece o CADOC 6334 (ASPB034) para reporte trimestral de dados de credenciamento, transações e infraestrutura. 10 arquivos TXT posicionais em ISO-8859-1.',url:'https://www.bcb.gov.br',vigencia:'junho/2021',tags:['CADOC 6334','Credenciadores','ASPB034','Trimestral']},
]

type NormaId = number
interface CardState { open:boolean; ctab:'analise'|'resumo'|'cadoc'; analise?:string; loadingAnalise?:boolean }

export default function NormasPage() {
  const [q, setQ] = useState('')
  const [area, setArea] = useState('all')
  const [urg, setUrg] = useState('')
  const [tipos, setTipos] = useState<string[]>([])
  const [cards, setCards] = useState<Record<NormaId, CardState>>({})
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsgs, setChatMsgs] = useState<{role:'user'|'assistant', content:string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const getApiKey = () => typeof window !== 'undefined' ? (localStorage.getItem('bm_api_key') || '') : ''

  const AREAS = [{id:'all',l:'Todas',ico:'◈'},{id:'pagamentos',l:'Pagamentos',ico:'💳'},{id:'crédito',l:'Crédito/SCR',ico:'📊'},{id:'tecnologia',l:'Tecnologia',ico:'⚡'},{id:'câmbio',l:'Câmbio/PSAV',ico:'🔄'},{id:'capital',l:'Capital',ico:'🏛'}]
  const TIPO_COLOR: Record<string,{bg:string,color:string,brd:string}> = {
    'Resolução BCB':           {bg:C.redb,color:C.red,brd:C.redbrd},
    'Resolução CMN':           {bg:C.blub,color:C.blu,brd:C.blubrd},
    'Instrução Normativa BCB': {bg:C.pnkb,color:C.pnk,brd:C.pnkbrd},
    'Circular BCB':            {bg:C.grnb,color:C.grn,brd:C.grnbrd},
    'Carta Circular BCB':      {bg:C.ambb,color:C.amb,brd:C.ambbrd},
  }

  let normas = NORMAS_STATIC.filter(n => {
    if (area !== 'all' && n.area !== area) return false
    if (urg && n.urgencia !== urg) return false
    if (tipos.length && !tipos.includes(n.tipo)) return false
    if (q) { const qL = q.toLowerCase(); return n.titulo.toLowerCase().includes(qL) || n.resumo.toLowerCase().includes(qL) || (n.tags||[]).some(t=>t.toLowerCase().includes(qL)) }
    return true
  })

  const tiposAll = [...new Set(NORMAS_STATIC.map(n=>n.tipo))]
  const urgCnt = NORMAS_STATIC.reduce((a,n)=>{ a[n.urgencia]=(a[n.urgencia]||0)+1; return a },{} as Record<string,number>)
  const criticas = NORMAS_STATIC.filter(n=>n.urgencia==='critica').length

  const toggleCard = (id: NormaId) => setCards(prev => ({ ...prev, [id]: { open:!prev[id]?.open, ctab:'analise', ...prev[id], open:!prev[id]?.open } }))
  const setCtab = (id: NormaId, ctab: 'analise'|'resumo'|'cadoc') => setCards(prev => ({ ...prev, [id]: { ...prev[id], ctab, open:true } }))

  const gerarAnalise = async (n: typeof NORMAS_STATIC[0]) => {
    const apiKey = getApiKey()
    if (!apiKey) { alert('Configure sua API key em Configurações para usar análise IA'); return }
    setCards(prev => ({ ...prev, [n.id]: { ...prev[n.id], open:true, ctab:'analise', loadingAnalise:true } }))
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:600,
          system:'Você é um especialista em regulação do Banco Central do Brasil. Analise normas de forma objetiva e prática para compliance de IFs.',
          messages:[{role:'user',content:`Analise esta norma BCB em 4 tópicos curtos (máx 120 palavras cada):\n1. O que muda\n2. Quem é afetado\n3. CADOCs impactados\n4. Prazo e ação necessária\n\nNorma: ${n.titulo}\nResumo: ${n.resumo}`}]
        })
      })
      const data = await r.json()
      const txt = data.content?.[0]?.text || 'Análise não disponível'
      setCards(prev => ({ ...prev, [n.id]: { ...prev[n.id], loadingAnalise:false, analise:txt } }))
    } catch(e:any) {
      setCards(prev => ({ ...prev, [n.id]: { ...prev[n.id], loadingAnalise:false, analise:'Erro: '+e.message } }))
    }
  }

  const sendChat = async () => {
    const apiKey = getApiKey()
    if (!chatInput.trim() || chatBusy) return
    if (!apiKey) { alert('Configure sua API key em Configurações'); return }
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMsgs(prev => [...prev, {role:'user',content:userMsg}])
    setChatBusy(true)
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:800,
          system:'Você é o Assistente Regulatório BACEN Monitor. Responda perguntas sobre normas BCB/CMN, CADOCs, SCR, SPB e compliance de IFs brasileiras de forma objetiva e prática. Quando citar normas, inclua o número.',
          messages:[...chatMsgs.map(m=>({role:m.role,content:m.content})),{role:'user',content:userMsg}]
        })
      })
      const data = await r.json()
      const txt = data.content?.[0]?.text || 'Sem resposta'
      setChatMsgs(prev => [...prev, {role:'assistant',content:txt}])
    } catch(e:any) { setChatMsgs(prev => [...prev, {role:'assistant',content:'Erro: '+e.message}]) }
    setChatBusy(false)
    setTimeout(()=>{ if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 100)
  }

  const fmt = (d:string) => { try { return new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}) } catch { return d } }

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden', background:C.bg }}>
      {/* Left sidebar */}
      <div style={{ width:190, flexShrink:0, borderRight:`1px solid ${C.brd}`, background:'#f9fafb', overflowY:'auto', padding:'12px 0' }}>
        <div style={{ padding:'4px 14px 4px', fontSize:8.5, letterSpacing:2, textTransform:'uppercase', color:C.txt3, fontFamily:'monospace', fontWeight:600 }}>ÁREA</div>
        {AREAS.map(a=>{
          const cnt = a.id==='all' ? NORMAS_STATIC.length : NORMAS_STATIC.filter(n=>n.area===a.id).length
          return (
            <div key={a.id} onClick={()=>setArea(a.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', cursor:'pointer', fontSize:12, color:area===a.id?C.grn:C.txt3, borderLeft:`2px solid ${area===a.id?C.grn:'transparent'}`, background:area===a.id?C.grnb:'transparent', fontWeight:area===a.id?600:400 }}>
              <span style={{ fontSize:11 }}>{a.ico}</span>{a.l}{cnt>0&&<span style={{ marginLeft:'auto', fontSize:9, fontFamily:'monospace', background:area===a.id?C.grnb:'#f0f2f5', color:area===a.id?C.grn:C.txt3, padding:'1px 5px', borderRadius:8 }}>{cnt}</span>}
            </div>
          )
        })}
        <div style={{ padding:'10px 14px 4px', fontSize:8.5, letterSpacing:2, textTransform:'uppercase', color:C.txt3, fontFamily:'monospace', fontWeight:600, marginTop:8 }}>URGÊNCIA</div>
        {[{id:'critica',l:'Crítica',c:C.red},{id:'alta',l:'Alta relevância',c:C.amb},{id:'normal',l:'Normal',c:C.grn}].map(u=>(
          <div key={u.id} onClick={()=>setUrg(urg===u.id?'':u.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', cursor:'pointer', fontSize:12, color:urg===u.id?u.c:C.txt3, borderLeft:`2px solid ${urg===u.id?u.c:'transparent'}`, background:urg===u.id?u.c+'12':'transparent' }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:u.c, flexShrink:0 }}/>
            {u.l}{urgCnt[u.id]&&<span style={{ marginLeft:'auto', fontSize:9, fontFamily:'monospace' }}>{urgCnt[u.id]}</span>}
          </div>
        ))}
        <div style={{ padding:'10px 14px 4px', fontSize:8.5, letterSpacing:2, textTransform:'uppercase', color:C.txt3, fontFamily:'monospace', fontWeight:600, marginTop:8 }}>ACESSO RÁPIDO</div>
        <div onClick={()=>setChatOpen(!chatOpen)} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', cursor:'pointer', fontSize:12, color:C.txt3 }}>
          <span>🤖</span>Assistente IA<span style={{ marginLeft:'auto', fontSize:8, fontFamily:'monospace', background:C.grn, color:'#000', padding:'1px 4px', borderRadius:2, fontWeight:700 }}>IA</span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Toolbar */}
        <div style={{ padding:'8px 14px', borderBottom:`1px solid ${C.brd}`, background:'#fff', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:7, background:'#fff', border:`1px solid ${C.brd}`, borderRadius:6, padding:'6px 10px' }}>
            <span style={{ color:C.txt3, fontSize:14 }}>⌕</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar normas vigentes, CADOCs, temas…" style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:12, color:C.txt }} />
            {q && <span onClick={()=>setQ('')} style={{ cursor:'pointer', color:C.txt3, fontSize:11 }}>✕</span>}
          </div>
          {urg && <button onClick={()=>setUrg('')} style={{ fontSize:10, padding:'4px 10px', borderRadius:5, border:`1px solid ${C.redbrd}`, background:C.redb, color:C.red, cursor:'pointer', outline:'none' }}>✕ {urg}</button>}
        </div>
        {/* Pills */}
        <div style={{ padding:'7px 14px', borderBottom:`1px solid ${C.brd}`, background:'#fff', display:'flex', gap:5, flexWrap:'wrap' }}>
          {tiposAll.map(t=>(
            <button key={t} onClick={()=>setTipos(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t])} style={{ padding:'3px 9px', borderRadius:20, fontSize:10, fontWeight:500, border:`1px solid ${tipos.includes(t)?C.grn:C.brd}`, cursor:'pointer', background:tipos.includes(t)?C.grn:'#fff', color:tipos.includes(t)?'#fff':C.txt2, outline:'none' }}>{t}</button>
          ))}
          {tipos.length>0 && <button onClick={()=>setTipos([])} style={{ padding:'3px 9px', borderRadius:20, fontSize:10, fontWeight:700, border:'1px solid '+C.red, cursor:'pointer', background:C.red, color:'#fff', outline:'none' }}>✕ Limpar</button>}
        </div>
        {/* Feed */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 16px' }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <h1 style={{ fontSize:16, fontWeight:700, color:C.txt, letterSpacing:'-.4px', marginBottom:2 }}>Normas BCB/CMN Vigentes</h1>
              <span style={{ fontSize:10, color:C.txt3, fontFamily:'monospace' }}>{normas.length} normas · {criticas} críticas · Feed regulatório BCB</span>
            </div>
          </div>
          {normas.map(n=>{
            const cs = cards[n.id] || { open:false, ctab:'analise' as const }
            const cfg = TIPO_COLOR[n.tipo] || {bg:C.pnkb,color:C.pnk,brd:C.pnkbrd}
            const urgEl = n.urgencia==='critica' ? <span style={{ fontSize:8.5, fontWeight:700, fontFamily:'monospace', padding:'2px 6px', borderRadius:3, border:`1px solid ${C.redbrd}`, background:C.redb, color:C.red }}>⚠ Crítica</span>
              : n.urgencia==='alta' ? <span style={{ fontSize:8.5, fontWeight:700, fontFamily:'monospace', padding:'2px 6px', borderRadius:3, border:`1px solid ${C.ambbrd}`, background:C.ambb, color:C.amb }}>↑ Alta</span> : null

            return (
              <div key={n.id} style={{ background:'#fff', border:`1px solid ${cs.open?C.brd2:C.brd}`, borderRadius:10, marginBottom:6, boxShadow:cs.open?'0 4px 16px rgba(0,0,0,.08)':'0 1px 4px rgba(0,0,0,.05)', overflow:'hidden', position:'relative' }}>
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:cfg.color, opacity:cs.open?1:0, transition:'opacity .15s' }}/>
                <div onClick={()=>toggleCard(n.id)} style={{ padding:'11px 14px', cursor:'pointer' }}>
                  <div style={{ fontSize:12.5, fontWeight:600, color:C.txt, lineHeight:1.5, marginBottom:6 }}>{n.titulo}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                    <span style={{ padding:'2px 6px', borderRadius:3, fontSize:8.5, fontWeight:700, letterSpacing:'.3px', fontFamily:'monospace', border:`1px solid ${cfg.brd}`, background:cfg.bg, color:cfg.color }}>{n.tipo}</span>
                    <span style={{ fontSize:8, padding:'1px 5px', border:`1px solid ${C.grnbrd}`, borderRadius:2, background:C.grnb, color:C.grn, fontFamily:'monospace' }}>✓ Vigente</span>
                    <span style={{ fontSize:9.5, color:C.txt3, fontFamily:'monospace' }}>📅 {fmt(n.data_pub)}</span>
                    {n.numero && <span style={{ fontSize:9.5, color:C.txt3, fontFamily:'monospace' }}>#{n.numero}</span>}
                    <span style={{ fontSize:9.5, color:C.txt3, textTransform:'capitalize' }}>{n.area}</span>
                    {urgEl}
                  </div>
                </div>
                {cs.open && (
                  <div style={{ borderTop:`1px solid ${C.brd}` }}>
                    <div style={{ display:'flex', background:C.bg3, borderBottom:`1px solid ${C.brd}` }}>
                      {([['analise','🤖 Análise IA'],['resumo','📄 Resumo'],['cadoc','⚙ CADOCs']] as [string,string][]).map(([t,l])=>(
                        <div key={t} onClick={()=>setCtab(n.id, t as any)} style={{ flex:1, padding:'8px 4px', textAlign:'center', fontSize:9.5, fontWeight:600, color:cs.ctab===t?C.grn:C.txt3, cursor:'pointer', borderBottom:cs.ctab===t?`2px solid ${C.grn}`:'2px solid transparent', marginBottom:-1, letterSpacing:'.4px', textTransform:'uppercase' }}>{l}</div>
                      ))}
                    </div>
                    <div style={{ padding:'13px 14px' }}>
                      {cs.ctab === 'analise' && (
                        <div>
                          <div style={{ background:C.bg3, border:`1px solid ${C.brd}`, borderRadius:6, padding:12, marginBottom:10 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                              <span style={{ fontSize:8, letterSpacing:1.5, textTransform:'uppercase', fontFamily:'monospace', fontWeight:700, color:C.grn, background:C.grnb, padding:'2px 7px', borderRadius:3, border:`1px solid ${C.grnbrd}` }}>Análise IA</span>
                              <span style={{ fontSize:9.5, color:C.txt3, fontFamily:'monospace' }}>Anthropic · Claude Sonnet</span>
                              <a href={n.url} target="_blank" style={{ marginLeft:'auto', fontSize:9.5, color:C.blu, fontFamily:'monospace', display:'flex', alignItems:'center', gap:4, padding:'3px 8px', border:`1px solid ${C.blubrd}`, borderRadius:4, background:C.blub, textDecoration:'none' }}>📎 Norma Oficial BCB</a>
                            </div>
                            {cs.loadingAnalise ? (
                              <div style={{ display:'flex', gap:5, alignItems:'center', padding:'4px 0' }}>
                                {[0,1,2].map(i=><div key={i} style={{ width:5, height:5, borderRadius:'50%', background:C.grn, animation:`ald 1.2s ${i*.2}s infinite` }}/>)}
                              </div>
                            ) : cs.analise ? (
                              <div style={{ fontSize:12, color:C.txt, lineHeight:1.8, whiteSpace:'pre-wrap' }} dangerouslySetInnerHTML={{ __html:(cs.analise||'').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>') }}/>
                            ) : (
                              <div style={{ fontSize:10.5, color:C.txt3 }}>Clique em Gerar para análise com IA.</div>
                            )}
                          </div>
                          {!cs.loadingAnalise && !cs.analise && (
                            <button onClick={()=>gerarAnalise(n)} style={{ padding:'6px 13px', background:C.grn, color:'#000', border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer', outline:'none' }}>✦ Gerar Análise IA</button>
                          )}
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginTop:10, paddingTop:10, borderTop:`1px solid ${C.brd}` }}>
                            {n.vigencia && <span style={{ fontSize:8, fontFamily:'monospace', color:C.grn, background:C.grnb, border:`1px solid ${C.grnbrd}`, padding:'1px 5px', borderRadius:2 }}>✓ Vigente desde {n.vigencia}</span>}
                            {(n.tags||[]).slice(0,4).map(t=><span key={t} style={{ padding:'2px 8px', borderRadius:4, fontSize:9.5, background:C.bg3, color:C.txt2, fontWeight:500 }}>{t}</span>)}
                            <a href={n.url} target="_blank" style={{ marginLeft:'auto', fontSize:10, color:C.blu, fontFamily:'monospace', textDecoration:'none' }}>↗ Referência BCB</a>
                          </div>
                        </div>
                      )}
                      {cs.ctab === 'resumo' && (
                        <div>
                          <p style={{ fontSize:12, color:C.txt, lineHeight:1.75, marginBottom:12 }}>{n.resumo}</p>
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', paddingTop:10, borderTop:`1px solid ${C.brd}` }}>
                            {n.vigencia && <span style={{ fontSize:8, fontFamily:'monospace', color:C.grn, background:C.grnb, border:`1px solid ${C.grnbrd}`, padding:'1px 5px', borderRadius:2 }}>✓ Vigente desde {n.vigencia}</span>}
                            {(n.tags||[]).slice(0,4).map(t=><span key={t} style={{ padding:'2px 8px', borderRadius:4, fontSize:9.5, background:C.bg3, color:C.txt2, fontWeight:500 }}>{t}</span>)}
                            <a href={n.url} target="_blank" style={{ marginLeft:'auto', fontSize:10, color:C.blu, fontFamily:'monospace', textDecoration:'none' }}>↗ Referência BCB</a>
                          </div>
                        </div>
                      )}
                      {cs.ctab === 'cadoc' && (
                        <div style={{ fontSize:11, color:C.txt3 }}>
                          <p style={{ marginBottom:8 }}>CADOCs identificados para esta norma:</p>
                          {(n.tags||[]).filter(t=>t.startsWith('CADOC')).map(t=>(
                            <div key={t} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:C.bg3, border:`1px solid ${C.brd}`, borderRadius:6, marginBottom:4 }}>
                              <span style={{ fontFamily:'monospace', fontSize:10, fontWeight:700, color:C.cyn }}>{t}</span>
                              <a href="/dashboard/cadocs" style={{ marginLeft:'auto', fontSize:10, color:C.blu, textDecoration:'none' }}>Gerar →</a>
                            </div>
                          ))}
                          {!(n.tags||[]).some(t=>t.startsWith('CADOC')) && <span>Nenhum CADOC específico identificado.</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: IA Chat */}
      {chatOpen && (
        <div style={{ width:280, flexShrink:0, borderLeft:`1px solid ${C.brd}`, background:'#fff', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.txt }}>🤖 Assistente IA</span>
            <button onClick={()=>setChatOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:C.txt3, fontSize:14, outline:'none' }}>✕</button>
          </div>
          {chatMsgs.length === 0 && (
            <div style={{ padding:'12px 14px' }}>
              <div style={{ fontSize:10, color:C.txt3, marginBottom:10 }}>Perguntas sugeridas:</div>
              {['Quais CADOCs são obrigatórios para credenciadores?','Quais são os prazos críticos de 2026?','O que muda para subcredenciadores com a Res. 522?','CADOC 3044 substitui o 3040?'].map(s=>(
                <div key={s} onClick={()=>{setChatInput(s)}} style={{ padding:'6px 10px', fontSize:10, color:C.txt2, background:C.bg3, border:`1px solid ${C.brd}`, borderRadius:6, marginBottom:4, cursor:'pointer' }}>{s}</div>
              ))}
            </div>
          )}
          <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:'12px 14px' }}>
            {chatMsgs.map((m,i)=>(
              <div key={i} style={{ marginBottom:10, display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
                <div style={{ maxWidth:'85%', padding:'8px 11px', borderRadius:m.role==='user'?'10px 10px 2px 10px':'10px 10px 10px 2px', background:m.role==='user'?C.grn:'#f0f2f5', color:m.role==='user'?'#fff':C.txt, fontSize:11, lineHeight:1.6 }}
                  dangerouslySetInnerHTML={{__html:m.content.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}}/> 
              </div>
            ))}
            {chatBusy && <div style={{ display:'flex', gap:5, padding:'4px 0' }}>{[0,1,2].map(i=><div key={i} style={{ width:5, height:5, borderRadius:'50%', background:C.grn, animation:`ald 1.2s ${i*.2}s infinite` }}/>)}</div>}
          </div>
          <div style={{ padding:'10px 12px', borderTop:`1px solid ${C.brd}`, display:'flex', gap:6 }}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Pergunte sobre normas BCB…" style={{ flex:1, padding:'7px 10px', border:`1px solid ${C.brd}`, borderRadius:7, fontSize:11, outline:'none', fontFamily:'inherit' }}/>
            <button onClick={sendChat} disabled={chatBusy||!chatInput.trim()} style={{ padding:'7px 12px', background:C.grn, color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:700, outline:'none' }}>→</button>
          </div>
        </div>
      )}
      <style>{`@keyframes ald{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  )
}
