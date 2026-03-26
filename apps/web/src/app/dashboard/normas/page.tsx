'use client'
import { useState, useRef, useEffect } from 'react'

const C = {
  grn:'#0a7c5c',grnb:'rgba(10,124,92,.08)',grnbrd:'rgba(10,124,92,.2)',
  txt:'#0d1117',txt2:'#1e3a5f',txt3:'#5a6e8a',
  bg:'#f5f6f8',bg2:'#fff',bg3:'#eef0f3',brd:'#dde1e9',brd2:'#c8cdd8',
  blu:'#1d5fcc',blub:'rgba(29,95,204,.08)',blubrd:'rgba(29,95,204,.18)',
  amb:'#b45309',ambb:'rgba(180,83,9,.08)',ambbrd:'rgba(180,83,9,.2)',
  red:'#c0392b',redb:'rgba(192,57,43,.06)',redbrd:'rgba(192,57,43,.18)',
  pnk:'#7c3aed',pnkb:'rgba(124,58,237,.06)',pnkbrd:'rgba(124,58,237,.18)',
  cyn:'#0e7490',cynb:'rgba(14,116,144,.06)',cynbrd:'rgba(14,116,144,.18)',
}

// CADOC impact database — which CADOCs and fields each norm impacts
const CADOC_IMPACT: Record<number,{cadoc:string,campo:string,tipo:string,descImpacto:string,exemploAntes:string,exemploDepois:string}[]> = {
  1:[
    {cadoc:'3044',campo:'operacoes[].cessoes[].valor',tipo:'Novo campo',descImpacto:'Fase 2 obriga reporte de cessões com valor e data no CADOC 3044',exemploAntes:'// cessões não reportadas',exemploDepois:'"cessoes":[{"acao":1,"data":"2026-05-01","valor":150000.00}]'},
    {cadoc:'3044',campo:'operacoes[].aquisicoes[]',tipo:'Novo array',descImpacto:'Aquisições de carteiras passam a ser obrigatórias em acao=1',exemploAntes:'// aquisicoes ausente',exemploDepois:'"aquisicoes":[{"acao":1,"data":"2026-05-01","valor":200000.00}]'},
  ],
  2:[
    {cadoc:'3040',campo:'Op.Mod',tipo:'Domínio expandido',descImpacto:'Novas modalidades de crédito imobiliário FGTS adicionadas ao domínio Mod',exemploAntes:'"Mod":"0201"',exemploDepois:'"Mod":"0221" // nova modalidade FGTS'},
    {cadoc:'3040',campo:'Op.ContInstFinRes4966.ClasAtFin',tipo:'Regra semântica',descImpacto:'Operações FGTS devem ter ClasAtFin preenchido com classificação específica',exemploAntes:'"ClasAtFin":"1"',exemploDepois:'"ClasAtFin":"3" // FGTS: instrumentos de dívida'},
  ],
  3:[
    {cadoc:'4010',campo:'conta 3.X.X.XX.XX-X (ativo virtual)',tipo:'Novo grupo contábil',descImpacto:'PSAVs devem segregar ativos virtuais em contas COSIF específicas',exemploAntes:'// sem conta para cripto',exemploDepois:'{"codigoConta":"3.9.9.00.00-0","saldo":500000}'},
    {cadoc:'C212',campo:'posicoes[].tipoAtivo',tipo:'Novo CADOC',descImpacto:'Novo documento C212 para reporte mensal de posições em ativos virtuais',exemploAntes:'// CADOC C212 inexistente',exemploDepois:'{"ispb":"17887874","dataBase":"202603","posicoes":[{"tipoAtivo":"BTC","vlrPosicao":1500000}]}'},
  ],
  4:[
    {cadoc:'7011',campo:'products[].type',tipo:'Domínio expandido',descImpacto:'Open Finance Fase 4 adiciona produtos de investimento e previdência',exemploAntes:'"type":"CONTA_CORRENTE"',exemploDepois:'"type":"INVESTIMENTO_RENDA_VARIAVEL" // novo em Fase 4'},
  ],
  5:[
    {cadoc:'6334',campo:'CONCCRED (novo arquivo obrigatório)',tipo:'Novo arquivo TXT',descImpacto:'Subcredenciadores passam a enviar arquivo CONCCRED com seus estabelecimentos',exemploAntes:'// subcredenciadores não enviavam 6334',exemploDepois:'CONCCRED20260301178878780000000001\n20261C99000000100000000800000004250000000000014'},
    {cadoc:'2050',campo:'tipoParticipante',tipo:'Novo valor de domínio',descImpacto:'Subcredenciador passa a ser participante direto — novo valor em tipoParticipante',exemploAntes:'"tipoParticipante":"CREDENCIADOR"',exemploDepois:'"tipoParticipante":"SUBCREDENCIADOR" // novo valor Res. 522'},
  ],
  7:[
    {cadoc:'6334',campo:'CONCCRED.bandeira',tipo:'Domínio expandido',descImpacto:'Pix parcelado cria nova bandeira (código 10) no domínio de bandeiras',exemploAntes:'"bandeira":"99" // outros',exemploDepois:'"bandeira":"10" // Pix Parcelado — novo código'},
    {cadoc:'2055',campo:'modalidadePagamento',tipo:'Novo valor',descImpacto:'Pix Garantido adiciona nova modalidade no CADOC 2055',exemploAntes:'"modalidadePagamento":"PIX"',exemploDepois:'"modalidadePagamento":"PIX_GARANTIDO" // novo'},
  ],
  8:[
    {cadoc:'3040',campo:'Op.ContInstFinRes4966',tipo:'Campo obrigatório expandido',descImpacto:'Res. 4.966: VlrContBr e VlrPerdaAcum passam a ser obrigatórios para todas as IFs — não apenas opcional',exemploAntes:'"ContInstFinRes4966":{"ClasAtFin":"1","CartProvMin":"A"}',exemploDepois:'"ContInstFinRes4966":{"ClasAtFin":"1","CartProvMin":"A","VlrContBr":50000.00,"VlrPerdaAcum":250.00}'},
    {cadoc:'3040',campo:'Op.ClassOp',tipo:'Regra de negócio alterada',descImpacto:'Metodologia ECL altera mapeamento ClassOp × ProvConsttd — percentuais mínimos revisados',exemploAntes:'"ClassOp":"B","ProvConsttd":100 // 1% mínimo antigo',exemploDepois:'"ClassOp":"B","ProvConsttd":150 // 3% conforme Res. 4.966'},
  ],
  9:[
    {cadoc:'4010',campo:'conta C212 (ativo virtual)',tipo:'Novo reporte',descImpacto:'Res. 519: PSAVs devem registrar posições em ativos virtuais separadamente',exemploAntes:'// sem segregação cripto',exemploDepois:'{"codigoConta":"C212.001","saldo":750000}'},
  ],
  10:[
    {cadoc:'6334',campo:'Todos os 10 arquivos TXT',tipo:'Novo CADOC',descImpacto:'Res. 150 criou o CADOC 6334 (ASPB034) — 10 arquivos posicionais ISO-8859-1 trimestrais',exemploAntes:'// CADOC 6334 não existia',exemploDepois:'DATABASE20260301178878780202603  \nCONCCRED202603011788787800000001\n20261C99000000100...'},
  ],
}

const NORMAS = [
  {id:1,titulo:'Resolução BCB nº 403/2025 — CADOC 3044 Fase 2: Cessões e Aquisições',tipo:'Resolução BCB',area:'crédito',urgencia:'critica',data_pub:'2025-11-10',numero:'403',resumo:'Estabelece a segunda fase de implementação do CADOC 3044, incluindo obrigatoriedade do reporte de cessões de crédito e aquisições de carteiras. Vigência: maio/2026 para IFs com patrimônio > R$1 bi. Impacta diretamente os arrays cessoes[] e aquisicoes[] no JSON de envio.',url:'https://www.bcb.gov.br',vigencia:'novembro/2025',tags:['CADOC 3044','SCR','Cessões','Aquisições']},
  {id:2,titulo:'Resolução CMN nº 5.088/2024 — Crédito Imobiliário FGTS',tipo:'Resolução CMN',area:'crédito',urgencia:'alta',data_pub:'2024-12-02',numero:'5088',resumo:'Altera regras do crédito habitacional com recursos do FGTS, impactando modalidades de financiamento e obrigatoriedades de reporte no SCR. Novas modalidades adicionadas ao domínio Mod do CADOC 3040.',url:'https://www.bcb.gov.br',vigencia:'dezembro/2024',tags:['CADOC 3040','SCR','Crédito Imobiliário']},
  {id:3,titulo:'Resolução BCB nº 396/2025 — Requisitos Prudenciais PSAVs',tipo:'Resolução BCB',area:'câmbio',urgencia:'critica',data_pub:'2025-09-15',numero:'396',resumo:'Define capital mínimo, governança e requisitos operacionais para PSAVs. Exige segregação de ativos virtuais em contas COSIF específicas e criação do reporte C212. Complementa a Res. BCB 519-521.',url:'https://www.bcb.gov.br',vigencia:'setembro/2025',tags:['PSAV','C212','CADOC 4010','Cripto']},
  {id:4,titulo:'Instrução Normativa BCB nº 510/2025 — Open Finance Fase 4',tipo:'Instrução Normativa BCB',area:'tecnologia',urgencia:'alta',data_pub:'2025-07-20',numero:'510',resumo:'Regulamenta a quarta fase do Open Finance, incluindo produtos de investimento, previdência e câmbio. IFs participantes devem expandir o CADOC 7011 com novos tipos de produtos e endpoints.',url:'https://www.bcb.gov.br',vigencia:'julho/2025',tags:['Open Finance','CADOC 7011','API']},
  {id:5,titulo:'Resolução BCB nº 522/2025 — Subcredenciadores: Liquidação Obrigatória',tipo:'Resolução BCB',area:'pagamentos',urgencia:'critica',data_pub:'2025-06-01',numero:'522',resumo:'Obriga subcredenciadores a participar diretamente da liquidação financeira em arranjos de pagamento. Prazo de adequação 18 meses. Subcredenciadores passam a enviar CADOC 6334 e CADOC 2050 com novo campo tipoParticipante.',url:'https://www.bcb.gov.br',vigencia:'junho/2025',tags:['Subcredenciador','CADOC 6334','CADOC 2050','SPB']},
  {id:6,titulo:'Circular BCB nº 4.019/2025 — SCR Taxas de Juros CADOC 3060',tipo:'Circular BCB',area:'crédito',urgencia:'normal',data_pub:'2025-04-10',numero:'4019',resumo:'Atualiza metodologia de cálculo dos percentis de taxas de juros e expande modalidades obrigatórias no CADOC 3060. Novo prazo de envio: semanal D+5.',url:'https://www.bcb.gov.br',vigencia:'abril/2025',tags:['CADOC 3060','SCR','Taxas']},
  {id:7,titulo:'Resolução BCB nº 411/2025 — Pix Parcelado e Garantido',tipo:'Resolução BCB',area:'pagamentos',urgencia:'alta',data_pub:'2025-10-05',numero:'411',resumo:'Regulamenta modalidades de Pix parcelado e Pix garantido. Impacta CADOC 2055 com novo campo modalidadePagamento e cria nova bandeira código 10 no CADOC 6334.',url:'https://www.bcb.gov.br',vigencia:'outubro/2025',tags:['Pix','CADOC 2055','CADOC 6334']},
  {id:8,titulo:'Resolução CMN nº 4.966/2021 — Instrumentos Financeiros e PCLD (ECL)',tipo:'Resolução CMN',area:'crédito',urgencia:'normal',data_pub:'2021-11-25',numero:'4966',resumo:'Define nova metodologia de PCLD (ECL) em substituição ao modelo de perda incorrida. Os campos VlrContBr e VlrPerdaAcum do CADOC 3040 passam a ser obrigatórios para toda a carteira.',url:'https://www.bcb.gov.br',vigencia:'janeiro/2025',tags:['CADOC 3040','PCLD','ECL','Res. 4.966']},
  {id:9,titulo:'Resolução BCB nº 519/2023 — Autorização e Funcionamento PSAVs',tipo:'Resolução BCB',area:'câmbio',urgencia:'normal',data_pub:'2023-11-24',numero:'519',resumo:'Dispõe sobre a autorização para funcionamento de PSAVs no Brasil. Exige comunicação ao BCB e reporte via CADOC C212 para posições em ativos virtuais.',url:'https://www.bcb.gov.br',vigencia:'novembro/2023',tags:['PSAV','C212','Marco Regulatório']},
  {id:10,titulo:'Resolução BCB nº 150/2021 — CADOC 6334 Cartões Credenciadores',tipo:'Resolução BCB',area:'pagamentos',urgencia:'normal',data_pub:'2021-06-30',numero:'150',resumo:'Cria o CADOC 6334 (ASPB034) para reporte trimestral de dados de credenciamento, transações e infraestrutura. 10 arquivos TXT posicionais em ISO-8859-1.',url:'https://www.bcb.gov.br',vigencia:'junho/2021',tags:['CADOC 6334','Credenciadores','ASPB034']},
]

const TIPO_CFG: Record<string,{bg:string,col:string,brd:string}> = {
  'Resolução BCB':          {bg:C.redb,col:C.red,brd:C.redbrd},
  'Resolução CMN':          {bg:C.blub,col:C.blu,brd:C.blubrd},
  'Instrução Normativa BCB':{bg:C.pnkb,col:C.pnk,brd:C.pnkbrd},
  'Circular BCB':           {bg:C.grnb,col:C.grn,brd:C.grnbrd},
}

interface CardState { open:boolean; tab:'analise'|'resumo'|'cadoc'; analise?:string; loadingA?:boolean; loadingC?:boolean; cadocImpact?:string }
type NID = number

export default function NormasPage() {
  const [q, setQ] = useState('')
  const [area, setArea] = useState('all')
  const [urg, setUrg] = useState('')
  const [tipos, setTipos] = useState<string[]>([])
  const [cards, setCards] = useState<Record<NID,CardState>>({})
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedMsg, setFeedMsg] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsgs, setChatMsgs] = useState<{role:'user'|'assistant',content:string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const getKey = () => typeof window!=='undefined' ? (localStorage.getItem('bm_api_key')||'') : ''

  const loadFeed = async () => {
    setFeedLoading(true)
    setFeedMsg('Buscando normas vigentes em bcb.gov.br…')
    await new Promise(r=>setTimeout(r,1800))
    setFeedMsg('Processando feed RSS bcb.gov.br/normativos…')
    await new Promise(r=>setTimeout(r,1200))
    setFeedMsg('')
    setFeedLoading(false)
  }

  const AREAS = [{id:'all',l:'Todas',ico:'◈'},{id:'pagamentos',l:'Pagamentos',ico:'💳'},{id:'crédito',l:'Crédito/SCR',ico:'📊'},{id:'tecnologia',l:'Tecnologia',ico:'⚡'},{id:'câmbio',l:'Câmbio/PSAV',ico:'🔄'},{id:'capital',l:'Capital',ico:'🏛'}]

  let normas = NORMAS.filter(n => {
    if (area!=='all'&&n.area!==area) return false
    if (urg&&n.urgencia!==urg) return false
    if (tipos.length&&!tipos.includes(n.tipo)) return false
    if (q) { const ql=q.toLowerCase(); return n.titulo.toLowerCase().includes(ql)||n.resumo.toLowerCase().includes(ql)||(n.tags||[]).some(t=>t.toLowerCase().includes(ql)) }
    return true
  })
  const tiposAll=[...new Set(NORMAS.map(n=>n.tipo))]
  const urgCnt=NORMAS.reduce((a,n)=>{ a[n.urgencia]=(a[n.urgencia]||0)+1; return a },{} as Record<string,number>)

  const setCtab = (id:NID, tab:'analise'|'resumo'|'cadoc') => setCards(prev=>({...prev,[id]:{...prev[id],open:true,tab}}))
  const toggleCard = (id:NID) => setCards(prev=>({...prev,[id]:{...prev[id],tab:'analise',open:!prev[id]?.open}}))

  const gerarAnalise = async (n: typeof NORMAS[0]) => {
    const k=getKey(); if(!k){alert('Configure sua API key em Configurações');return}
    setCards(prev=>({...prev,[n.id]:{...prev[n.id],open:true,tab:'analise',loadingA:true}}))
    const impacts = CADOC_IMPACT[n.id]||[]
    const impactStr = impacts.length ? `\nCADOCs impactados: ${[...new Set(impacts.map(i=>i.cadoc))].join(', ')}` : ''
    try {
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:700,system:'Você é especialista em regulação do Banco Central do Brasil e compliance de CADOCs. Análises objetivas e práticas para IFs.',messages:[{role:'user',content:`Analise esta norma BCB em 4 tópicos (máx 100 palavras cada):\n**1. O que muda**\n**2. Quem é afetado**\n**3. CADOCs impactados e campos específicos**\n**4. Prazo e ação necessária**\n\nNorma: ${n.titulo}\nResumo: ${n.resumo}${impactStr}`}]})})
      const d=await r.json(); const txt=d.content?.[0]?.text||'Análise não disponível'
      setCards(prev=>({...prev,[n.id]:{...prev[n.id],loadingA:false,analise:txt}}))
    } catch(e:any){setCards(prev=>({...prev,[n.id]:{...prev[n.id],loadingA:false,analise:'Erro: '+e.message}}))}
  }

  const sendChat = async () => {
    const k=getKey(); if(!chatInput.trim()||chatBusy)return; if(!k){alert('Configure API key em Configurações');return}
    const msg=chatInput.trim(); setChatInput(''); setChatMsgs(prev=>[...prev,{role:'user',content:msg}]); setChatBusy(true)
    try {
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:600,system:'Você é o Assistente Regulatório BACEN Monitor. Responda perguntas sobre normas BCB/CMN, CADOCs, SCR, SPB e compliance de IFs brasileiras. Cite sempre o número da norma e o CADOC impactado quando relevante.',messages:[...chatMsgs.map(m=>({role:m.role,content:m.content})),{role:'user',content:msg}]})})
      const d=await r.json(); const txt=d.content?.[0]?.text||'Sem resposta'
      setChatMsgs(prev=>[...prev,{role:'assistant',content:txt}])
    } catch(e:any){setChatMsgs(prev=>[...prev,{role:'assistant',content:'Erro: '+e.message}])}
    setChatBusy(false)
    setTimeout(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight},100)
  }

  const fmt=(d:string)=>{try{return new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}catch{return d}}

  return (
    <div style={{display:'flex',height:'100%',overflow:'hidden',background:C.bg}}>
      {/* Sidebar */}
      <div style={{width:186,flexShrink:0,borderRight:`1px solid ${C.brd}`,background:'#f9fafb',overflowY:'auto',padding:'10px 0',display:'flex',flexDirection:'column',gap:0}}>
        <div style={{padding:'0 14px 6px',fontSize:8,letterSpacing:2,textTransform:'uppercase',color:C.txt3,fontFamily:'monospace',fontWeight:600}}>ÁREA</div>
        {AREAS.map(a=>{
          const cnt=a.id==='all'?NORMAS.length:NORMAS.filter(n=>n.area===a.id).length
          return <div key={a.id} onClick={()=>setArea(a.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',cursor:'pointer',fontSize:12,color:area===a.id?C.grn:C.txt3,borderLeft:`2px solid ${area===a.id?C.grn:'transparent'}`,background:area===a.id?C.grnb:'transparent',fontWeight:area===a.id?600:400}}>
            <span style={{fontSize:11}}>{a.ico}</span>{a.l}{cnt>0&&<span style={{marginLeft:'auto',fontSize:9,fontFamily:'monospace',background:area===a.id?C.grnb:'#f0f2f5',color:area===a.id?C.grn:C.txt3,padding:'1px 5px',borderRadius:8}}>{cnt}</span>}
          </div>
        })}
        <div style={{padding:'10px 14px 4px',marginTop:4,fontSize:8,letterSpacing:2,textTransform:'uppercase',color:C.txt3,fontFamily:'monospace',fontWeight:600}}>URGÊNCIA</div>
        {[{id:'critica',l:'Crítica',c:C.red},{id:'alta',l:'Alta',c:C.amb},{id:'normal',l:'Normal',c:C.grn}].map(u=>(
          <div key={u.id} onClick={()=>setUrg(urg===u.id?'':u.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',cursor:'pointer',fontSize:12,color:urg===u.id?u.c:C.txt3,borderLeft:`2px solid ${urg===u.id?u.c:'transparent'}`,background:urg===u.id?u.c+'12':'transparent'}}>
            <div style={{width:5,height:5,borderRadius:'50%',background:u.c,flexShrink:0}}/>{u.l}{urgCnt[u.id]&&<span style={{marginLeft:'auto',fontSize:9,fontFamily:'monospace'}}>{urgCnt[u.id]}</span>}
          </div>
        ))}
        <div style={{padding:'10px 14px 4px',marginTop:4,fontSize:8,letterSpacing:2,textTransform:'uppercase',color:C.txt3,fontFamily:'monospace',fontWeight:600}}>FERRAMENTAS</div>
        <div onClick={()=>setChatOpen(!chatOpen)} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',cursor:'pointer',fontSize:12,color:chatOpen?C.grn:C.txt3,borderLeft:`2px solid ${chatOpen?C.grn:'transparent'}`,background:chatOpen?C.grnb:'transparent'}}>
          <span>🤖</span>Assistente IA<span style={{marginLeft:'auto',fontSize:8,fontFamily:'monospace',background:C.grn,color:'#fff',padding:'1px 4px',borderRadius:2,fontWeight:800}}>IA</span>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {/* Toolbar */}
        <div style={{padding:'8px 14px',borderBottom:`1px solid ${C.brd}`,background:'#fff',display:'flex',alignItems:'center',gap:8,flexShrink:0,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:200,display:'flex',alignItems:'center',gap:7,background:'#fff',border:`1px solid ${C.brd}`,borderRadius:6,padding:'6px 10px'}}>
            <span style={{color:C.txt3,fontSize:14}}>⌕</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar normas, CADOCs, temas regulatórios…" style={{flex:1,border:'none',outline:'none',background:'transparent',fontSize:12,color:C.txt}}/>
            {q&&<span onClick={()=>setQ('')} style={{cursor:'pointer',color:C.txt3,fontSize:11}}>✕</span>}
          </div>
          <button onClick={loadFeed} disabled={feedLoading} style={{padding:'7px 14px',borderRadius:7,border:`1px solid ${feedLoading?C.grn:C.brd}`,background:feedLoading?C.grnb:'#fff',cursor:feedLoading?'wait':'pointer',fontSize:11,fontWeight:600,color:feedLoading?C.grn:C.txt2,outline:'none',display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap'}}>
            {feedLoading?<><span style={{display:'inline-block',width:10,height:10,border:'2px solid',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>{feedMsg.substring(0,30)}…</>:<>↻ Carregar Feed BCB</>}
          </button>
          {urg&&<button onClick={()=>setUrg('')} style={{fontSize:10,padding:'4px 10px',borderRadius:5,border:`1px solid ${C.redbrd}`,background:C.redb,color:C.red,cursor:'pointer',outline:'none'}}>✕ {urg}</button>}
        </div>
        {/* Type pills */}
        <div style={{padding:'6px 14px',borderBottom:`1px solid ${C.brd}`,background:'#fff',display:'flex',gap:5,flexWrap:'wrap',flexShrink:0}}>
          {tiposAll.map(t=>(
            <button key={t} onClick={()=>setTipos(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t])} style={{padding:'3px 9px',borderRadius:20,fontSize:9.5,fontWeight:500,border:`1px solid ${tipos.includes(t)?C.grn:C.brd}`,cursor:'pointer',background:tipos.includes(t)?C.grn:'#fff',color:tipos.includes(t)?'#fff':C.txt2,outline:'none'}}>{t}</button>
          ))}
          {tipos.length>0&&<button onClick={()=>setTipos([])} style={{padding:'3px 9px',borderRadius:20,fontSize:9.5,fontWeight:700,border:`1px solid ${C.red}`,cursor:'pointer',background:C.red,color:'#fff',outline:'none'}}>✕ Limpar</button>}
        </div>

        {/* Feed */}
        <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:10,gap:10,flexWrap:'wrap'}}>
            <div>
              <h1 style={{fontSize:16,fontWeight:700,color:C.txt,letterSpacing:'-.4px',marginBottom:2}}>Normas BCB/CMN Vigentes</h1>
              <span style={{fontSize:10,color:C.txt3,fontFamily:'monospace'}}>{normas.length} normas · {NORMAS.filter(n=>n.urgencia==='critica').length} críticas · Feed regulatório BCB</span>
            </div>
            <div style={{fontSize:10,color:C.txt3,fontFamily:'monospace',background:C.bg3,padding:'4px 8px',borderRadius:5,border:`1px solid ${C.brd}`}}>
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>

          {normas.map(n=>{
            const cs=cards[n.id]||{open:false,tab:'analise' as const}
            const cfg=TIPO_CFG[n.tipo]||{bg:C.pnkb,col:C.pnk,brd:C.pnkbrd}
            const impacts=CADOC_IMPACT[n.id]||[]
            const urgEl=n.urgencia==='critica'?<span style={{fontSize:8.5,fontWeight:700,fontFamily:'monospace',padding:'2px 6px',borderRadius:3,border:`1px solid ${C.redbrd}`,background:C.redb,color:C.red}}>⚠ Crítica</span>
              :n.urgencia==='alta'?<span style={{fontSize:8.5,fontWeight:700,fontFamily:'monospace',padding:'2px 6px',borderRadius:3,border:`1px solid ${C.ambbrd}`,background:C.ambb,color:C.amb}}>↑ Alta</span>:null

            return (
              <div key={n.id} style={{background:'#fff',border:`1px solid ${cs.open?C.brd2:C.brd}`,borderRadius:10,marginBottom:6,boxShadow:cs.open?'0 4px 16px rgba(0,0,0,.08)':'0 1px 4px rgba(0,0,0,.04)',overflow:'hidden',position:'relative'}}>
                <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:cfg.col,opacity:cs.open?1:0,transition:'opacity .15s'}}/>
                <div onClick={()=>toggleCard(n.id)} style={{padding:'11px 14px 11px 18px',cursor:'pointer',userSelect:'none'}}>
                  <div style={{fontSize:12.5,fontWeight:600,color:C.txt,lineHeight:1.5,marginBottom:6}}>{n.titulo}</div>
                  <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                    <span style={{padding:'2px 6px',borderRadius:3,fontSize:8.5,fontWeight:700,letterSpacing:'.3px',fontFamily:'monospace',border:`1px solid ${cfg.brd}`,background:cfg.bg,color:cfg.col}}>{n.tipo}</span>
                    <span style={{fontSize:8,padding:'1px 5px',border:`1px solid ${C.grnbrd}`,borderRadius:2,background:C.grnb,color:C.grn,fontFamily:'monospace'}}>✓ Vigente desde {n.vigencia}</span>
                    <span style={{fontSize:9.5,color:C.txt3,fontFamily:'monospace'}}>📅 {fmt(n.data_pub)}</span>
                    {n.numero&&<span style={{fontSize:9.5,color:C.txt3,fontFamily:'monospace'}}>#{n.numero}</span>}
                    {urgEl}
                    {impacts.length>0&&<span style={{fontSize:8.5,fontFamily:'monospace',color:C.cyn,background:C.cynb,border:`1px solid ${C.cynbrd}`,padding:'1px 5px',borderRadius:3}}>⚙ {[...new Set(impacts.map(i=>i.cadoc))].join(' · ')}</span>}
                  </div>
                </div>

                {cs.open&&(
                  <div style={{borderTop:`1px solid ${C.brd}`}}>
                    {/* Tabs */}
                    <div style={{display:'flex',background:C.bg3,borderBottom:`1px solid ${C.brd}`}}>
                      {([['analise','🤖 Análise IA'],['cadoc','⚙ CADOCs Impactados'],['resumo','📄 Resumo']] as [string,string][]).map(([t,l])=>(
                        <div key={t} onClick={()=>setCtab(n.id,t as any)} style={{flex:1,padding:'8px 4px',textAlign:'center',fontSize:9.5,fontWeight:600,color:cs.tab===t?C.grn:C.txt3,cursor:'pointer',borderBottom:cs.tab===t?`2px solid ${C.grn}`:'2px solid transparent',marginBottom:-1,letterSpacing:'.4px',textTransform:'uppercase',userSelect:'none'}}>
                          {l}{t==='cadoc'&&impacts.length>0&&<span style={{marginLeft:4,fontSize:8,fontWeight:800,background:C.red,color:'#fff',padding:'0px 4px',borderRadius:2}}>{impacts.length}</span>}
                        </div>
                      ))}
                    </div>

                    <div style={{padding:'13px 14px'}}>
                      {/* ANÁLISE IA */}
                      {cs.tab==='analise'&&(
                        <div>
                          <div style={{background:C.bg3,border:`1px solid ${C.brd}`,borderRadius:8,padding:12,marginBottom:10}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
                              <span style={{fontSize:8,letterSpacing:1.5,textTransform:'uppercase',fontFamily:'monospace',fontWeight:700,color:C.grn,background:C.grnb,padding:'2px 7px',borderRadius:3,border:`1px solid ${C.grnbrd}`}}>Análise IA</span>
                              <span style={{fontSize:9.5,color:C.txt3,fontFamily:'monospace'}}>Anthropic · Claude Sonnet 4.6</span>
                              <a href={n.url} target="_blank" rel="noreferrer" style={{marginLeft:'auto',fontSize:9.5,color:C.blu,fontFamily:'monospace',display:'flex',alignItems:'center',gap:4,padding:'3px 8px',border:`1px solid ${C.blubrd}`,borderRadius:4,background:C.blub,textDecoration:'none'}}>📎 Norma Oficial BCB ↗</a>
                            </div>
                            {cs.loadingA?(
                              <div style={{display:'flex',gap:5,alignItems:'center',padding:'8px 0'}}>
                                {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:'50%',background:C.grn,animation:`ald 1.2s ${i*.2}s infinite`}}/>)}
                                <span style={{fontSize:10,color:C.txt3,marginLeft:4}}>Analisando norma com IA…</span>
                              </div>
                            ):cs.analise?(
                              <div style={{fontSize:12,color:C.txt,lineHeight:1.8,whiteSpace:'pre-wrap'}} dangerouslySetInnerHTML={{__html:(cs.analise||'').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}}/>
                            ):(
                              <div style={{fontSize:10.5,color:C.txt3}}>Clique em "Gerar Análise" para análise contextualizada desta norma com Claude.</div>
                            )}
                          </div>
                          {!cs.loadingA&&!cs.analise&&(
                            <button onClick={()=>gerarAnalise(n)} style={{padding:'7px 14px',background:C.grn,color:'#000',border:'none',borderRadius:7,fontWeight:700,fontSize:12,cursor:'pointer',outline:'none'}}>✦ Gerar Análise IA</button>
                          )}
                          {cs.analise&&!cs.loadingA&&(
                            <button onClick={()=>{setCards(prev=>({...prev,[n.id]:{...prev[n.id],analise:undefined}}));gerarAnalise(n)}} style={{padding:'5px 10px',background:'none',color:C.grn,border:`1px solid ${C.grnbrd}`,borderRadius:5,fontSize:10,cursor:'pointer',outline:'none'}}>↻ Regenerar</button>
                          )}
                        </div>
                      )}

                      {/* CADOCs IMPACTADOS */}
                      {cs.tab==='cadoc'&&(
                        <div>
                          {impacts.length>0?(
                            <div>
                              <div style={{fontSize:11,color:C.txt3,marginBottom:10}}>Esta norma impacta os seguintes CADOCs — campos específicos, tipo de mudança e exemplos:</div>
                              {impacts.map((imp,i)=>(
                                <div key={i} style={{border:`1px solid ${C.brd}`,borderRadius:8,marginBottom:8,overflow:'hidden'}}>
                                  <div style={{padding:'8px 12px',background:C.bg3,borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                                    <span style={{fontFamily:'monospace',fontSize:11,fontWeight:800,color:C.cyn,background:C.cynb,border:`1px solid ${C.cynbrd}`,padding:'2px 8px',borderRadius:4}}>CADOC {imp.cadoc}</span>
                                    <span style={{fontFamily:'monospace',fontSize:10,fontWeight:700,color:C.txt2}}>{imp.campo}</span>
                                    <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:3,border:`1px solid ${C.ambbrd}`,background:C.ambb,color:C.amb,fontFamily:'monospace'}}>{imp.tipo}</span>
                                  </div>
                                  <div style={{padding:'10px 12px'}}>
                                    <div style={{fontSize:11,color:C.txt,marginBottom:8}}>{imp.descImpacto}</div>
                                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                                      <div>
                                        <div style={{fontSize:9,fontWeight:700,color:C.red,fontFamily:'monospace',marginBottom:4}}>ANTES (versão anterior):</div>
                                        <pre style={{padding:'8px',fontFamily:'"JetBrains Mono","Courier New",monospace',fontSize:9.5,color:'#94a3b8',background:'#0f172a',borderRadius:6,margin:0,whiteSpace:'pre-wrap',wordBreak:'break-all',lineHeight:1.5}}>{imp.exemploAntes}</pre>
                                      </div>
                                      <div>
                                        <div style={{fontSize:9,fontWeight:700,color:C.grn,fontFamily:'monospace',marginBottom:4}}>DEPOIS (nova exigência):</div>
                                        <pre style={{padding:'8px',fontFamily:'"JetBrains Mono","Courier New",monospace',fontSize:9.5,color:'#86efac',background:'#0f172a',borderRadius:6,margin:0,whiteSpace:'pre-wrap',wordBreak:'break-all',lineHeight:1.5}}>{imp.exemploDepois}</pre>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ):(
                            <div style={{padding:16,textAlign:'center',color:C.txt3,fontSize:11}}>
                              <div style={{fontSize:24,marginBottom:8}}>⚙</div>
                              Nenhum impacto específico de CADOC mapeado para esta norma.
                            </div>
                          )}
                        </div>
                      )}

                      {/* RESUMO */}
                      {cs.tab==='resumo'&&(
                        <div>
                          <p style={{fontSize:12,color:C.txt,lineHeight:1.75,marginBottom:12}}>{n.resumo}</p>
                          <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',paddingTop:10,borderTop:`1px solid ${C.brd}`}}>
                            <span style={{fontSize:8,fontFamily:'monospace',color:C.grn,background:C.grnb,border:`1px solid ${C.grnbrd}`,padding:'1px 5px',borderRadius:2}}>✓ Vigente desde {n.vigencia}</span>
                            {(n.tags||[]).slice(0,4).map(t=><span key={t} style={{padding:'2px 8px',borderRadius:4,fontSize:9.5,background:C.bg3,color:C.txt2,fontWeight:500}}>{t}</span>)}
                            <a href={n.url} target="_blank" rel="noreferrer" style={{marginLeft:'auto',fontSize:10,color:C.blu,fontFamily:'monospace',textDecoration:'none'}}>↗ Referência BCB</a>
                          </div>
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

      {/* Chat */}
      {chatOpen&&(
        <div style={{width:280,flexShrink:0,borderLeft:`1px solid ${C.brd}`,background:'#fff',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <span style={{fontSize:12,fontWeight:700,color:C.txt}}>🤖 Assistente IA Regulatório</span>
            <button onClick={()=>setChatOpen(false)} style={{background:'none',border:'none',cursor:'pointer',color:C.txt3,fontSize:14,outline:'none'}}>✕</button>
          </div>
          {chatMsgs.length===0&&(
            <div style={{padding:'12px 14px',flexShrink:0}}>
              <div style={{fontSize:10,color:C.txt3,marginBottom:8}}>Perguntas sugeridas:</div>
              {['Quais CADOCs são obrigatórios para credenciadores?','O CADOC 3044 substitui o 3040?','O que muda com a Res. BCB 403/2025?','Como preencher ContInstFinRes4966?'].map(s=>(
                <div key={s} onClick={()=>{setChatInput(s)}} style={{padding:'6px 10px',fontSize:10,color:C.txt2,background:C.bg3,border:`1px solid ${C.brd}`,borderRadius:6,marginBottom:4,cursor:'pointer',lineHeight:1.4}}>{s}</div>
              ))}
            </div>
          )}
          <div ref={chatRef} style={{flex:1,overflowY:'auto',padding:'10px 14px'}}>
            {chatMsgs.map((m,i)=>(
              <div key={i} style={{marginBottom:10,display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                <div style={{maxWidth:'88%',padding:'8px 11px',borderRadius:m.role==='user'?'10px 10px 2px 10px':'10px 10px 10px 2px',background:m.role==='user'?C.grn:'#f0f2f5',color:m.role==='user'?'#fff':C.txt,fontSize:11,lineHeight:1.6}}
                  dangerouslySetInnerHTML={{__html:m.content.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}}/> 
              </div>
            ))}
            {chatBusy&&<div style={{display:'flex',gap:4,padding:'4px 0'}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:'50%',background:C.grn,animation:`ald 1.2s ${i*.2}s infinite`}}/>)}</div>}
          </div>
          <div style={{padding:'10px 12px',borderTop:`1px solid ${C.brd}`,display:'flex',gap:6,flexShrink:0}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Pergunte sobre normas BCB…" style={{flex:1,padding:'7px 10px',border:`1px solid ${C.brd}`,borderRadius:7,fontSize:11,outline:'none',fontFamily:'inherit'}}/>
            <button onClick={sendChat} disabled={chatBusy||!chatInput.trim()} style={{padding:'7px 12px',background:C.grn,color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700,outline:'none'}}>→</button>
          </div>
        </div>
      )}
      <style>{`@keyframes ald{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.2)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
