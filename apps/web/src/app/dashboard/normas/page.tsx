'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

interface RssItem { titulo:string; link:string; descricao:string; data:string; guid:string }
interface Norma { id:number; _rawId:string; tipo:string; numero:string; titulo:string; resumo:string; data_pub:string; area:string; urgencia:string; url:string; tags:string[]; _feedId:string }
interface CardState { open:boolean; tab:string; analise?:string; loading?:boolean }

const BCB_BASE = 'https://www.bcb.gov.br/api/feed/app'
const BCB_NORMA_FEEDS = [
  { id:'normativos',       url:BCB_BASE+'/normativos/normativos',       supAno:true },
  { id:'demaisnormativos', url:BCB_BASE+'/normativos/demaisnormativos', supAno:true },
  { id:'cartascirculares', url:BCB_BASE+'/normativos/cartascirculares', supAno:true },
]
const AREAS = [
  {id:'all',label:'Todas Vigentes',ico:'◈'},
  {id:'pagamentos',label:'Pagamentos',ico:'💳'},
  {id:'crédito',label:'Crédito / SCR',ico:'📊'},
  {id:'tecnologia',label:'Tecnologia',ico:'⚡'},
  {id:'câmbio',label:'Câmbio / PSAV',ico:'🔄'},
  {id:'capital',label:'Capital',ico:'🏛'},
]
const TIPO_CFG: Record<string,{color:string,bg:string}> = {
  'Resolução BCB':{color:'#0a7c5c',bg:'rgba(10,124,92,.10)'},
  'Instrução Normativa BCB':{color:'#1d5fcc',bg:'rgba(29,95,204,.10)'},
  'Resolução CMN':{color:'#c0392b',bg:'rgba(192,57,43,.10)'},
  'Resolução Conjunta':{color:'#7c3aed',bg:'rgba(124,58,237,.10)'},
  'Circular BCB':{color:'#b45309',bg:'rgba(180,83,9,.10)'},
  'Carta Circular BCB':{color:'#b45309',bg:'rgba(180,83,9,.10)'},
  'Comunicado BCB':{color:'#b45309',bg:'rgba(180,83,9,.08)'},
}
const SUGESTOES = [
  'Quais CADOCs são obrigatórios para credenciadores?',
  'O que muda para subcredenciadores com a Res. 522?',
  'CADOC 3044 substitui o 3040?',
  'Capital mínimo para SCD com conta Pix?',
  'Quais os prazos críticos de 2026 para IPs?',
]

function parseRSSXml(xmlStr: string): RssItem[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlStr, 'text/xml')
  function cleanText(el: Element|null, maxLen?: number) {
    if (!el) return ''
    let raw = el.textContent || ''
    if (raw.includes('<')) {
      try { const tmp = new DOMParser().parseFromString(raw,'text/html'); raw = tmp.body.textContent||'' }
      catch { raw = raw.replace(/<[^>]+>/g,'') }
    }
    const clean = raw.replace(/\s+/g,' ').trim()
    return maxLen ? clean.substring(0,maxLen) : clean
  }
  const items: RssItem[] = []
  doc.querySelectorAll('entry').forEach(el => {
    const linkEl = el.querySelector("link[rel='alternate'], link")
    items.push({ titulo:cleanText(el.querySelector('title')), link:linkEl?.getAttribute('href')||linkEl?.textContent?.trim()||'', descricao:cleanText(el.querySelector('content, summary'),250), data:el.querySelector('updated, published')?.textContent?.trim()||'', guid:el.querySelector('id')?.textContent?.trim()||'' })
  })
  if (!items.length) {
    doc.querySelectorAll('item').forEach(el => {
      items.push({ titulo:cleanText(el.querySelector('title')), link:el.querySelector('link')?.textContent?.trim()||'', descricao:cleanText(el.querySelector('description'),250), data:el.querySelector('pubDate')?.textContent?.trim()||'', guid:el.querySelector('guid')?.textContent?.trim()||'' })
    })
  }
  return items
}

const _reg: Record<string,number> = {}
function rssToNorma(item: RssItem, feedId: string): Norma {
  const t = item.titulo||''
  let tipo = 'Normativo BCB'
  if (/Resolu[çc][ãa]o CMN/i.test(t)) tipo='Resolução CMN'
  else if (/Resolu[çc][ãa]o Conjunta/i.test(t)) tipo='Resolução Conjunta'
  else if (/Resolu[çc][ãa]o BCB/i.test(t)) tipo='Resolução BCB'
  else if (/Instru[çc][ãa]o Normativa/i.test(t)) tipo='Instrução Normativa BCB'
  else if (/Circular/i.test(t)&&!/Carta/i.test(t)) tipo='Circular BCB'
  else if (/Carta Circular/i.test(t)) tipo='Carta Circular BCB'
  else if (/Comunicado/i.test(t)) tipo='Comunicado BCB'
  const txt=(t+' '+(item.descricao||'')).toLowerCase()
  let urgencia='normal'
  if (/pix|subcredenci|autoriza[çc][ãa]o|psav|liquidação centralizada|baas/i.test(txt)) urgencia='critica'
  else if (/câmbio|cambio|cripto|ativo virtual|capital m[ií]nimo|credenciador|emissor/i.test(txt)) urgencia='alta'
  let area='outros'
  if (/pix|pagamento|credenciador|emissor|arranjo|subcredenci|baas/i.test(txt)) area='pagamentos'
  else if (/cambio|câmbio|moeda estrangeira/i.test(txt)) area='câmbio'
  else if (/cr[eé]dito|scr|cadoc 30/i.test(txt)) area='crédito'
  else if (/capital|basileia|pr\b|rwa/i.test(txt)) area='capital'
  else if (/ativo virtual|cripto|psav/i.test(txt)) area='tecnologia'
  const rawId=item.guid||item.link||item.titulo||Math.random().toString()
  if (!_reg[rawId]) _reg[rawId]=Object.keys(_reg).length+1000
  const numMatch=t.match(/[Nn][ºo°]?\s*(\d+)/)
  return { id:_reg[rawId], _rawId:rawId, tipo, numero:numMatch?.[1]||'', titulo:t.replace(/^BC\s*-\s*/,'').trim(), resumo:item.descricao||'', data_pub:(item.data||'').substring(0,10), area, urgencia, url:item.link||'', tags:[tipo], _feedId:feedId }
}

export default function NormasPage() {
  const [rssData, setRssData] = useState<Record<string,{items:RssItem[];loading:boolean;error:string|null}>>({})
  const [area, setArea] = useState('all')
  const [urgFilt, setUrgFilt] = useState('')
  const [tipos, setTipos] = useState<string[]>([])
  const [q, setQ] = useState('')
  const [cards, setCards] = useState<Record<number,CardState>>({})
  const [chatMsgs, setChatMsgs] = useState<{role:string;content:string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [rssAno, setRssAno] = useState(new Date().getFullYear())
  const chatRef = useRef<HTMLDivElement>(null)
  const G = '#0a7c5c'
  const getKey = () => typeof window!=='undefined'?(localStorage.getItem('bm_api_key')||''):''

  const fetchFeed = useCallback(async (feed: typeof BCB_NORMA_FEEDS[0], ano?: number) => {
    setRssData(prev=>({...prev,[feed.id]:{items:[],loading:true,error:null}}))
    const url = feed.supAno ? `${feed.url}?ano=${ano||rssAno}` : feed.url
    const ctrl=new AbortController(); const timer=setTimeout(()=>ctrl.abort(),12000)
    try {
      const r=await fetch(url,{signal:ctrl.signal,headers:{Accept:'application/atom+xml,*/*'}})
      clearTimeout(timer)
      if (r.ok) { const txt=await r.text(); const items=parseRSSXml(txt); setRssData(prev=>({...prev,[feed.id]:{items,loading:false,error:items.length?null:'Sem itens'}})) }
      else setRssData(prev=>({...prev,[feed.id]:{items:[],loading:false,error:`HTTP ${r.status}`}}))
    } catch(e:any) {
      clearTimeout(timer)
      const msg=e.name==='AbortError'?'Timeout':e.message?.includes('fetch')?'Bloqueado pelo sandbox — abra localmente para feeds ao vivo':e.message
      setRssData(prev=>({...prev,[feed.id]:{items:[],loading:false,error:msg}}))
    }
  },[rssAno])

  const fetchAll=useCallback(()=>{ BCB_NORMA_FEEDS.forEach(f=>fetchFeed(f)) },[fetchFeed])
  useEffect(()=>{ fetchAll() },[])

  const allNormas: Norma[] = (()=>{
    const seen=new Set<string>(); const items: Norma[]=[]
    BCB_NORMA_FEEDS.forEach(feed=>{ const d=rssData[feed.id]; if(d?.items?.length){ d.items.forEach(it=>{ const g=it.guid||it.link||it.titulo; if(!seen.has(g)){ seen.add(g); items.push(rssToNorma(it,feed.id)) } }) } })
    return items.sort((a,b)=>(b.data_pub||'').localeCompare(a.data_pub||''))
  })()

  const isLoading=BCB_NORMA_FEEDS.some(f=>rssData[f.id]?.loading)
  const hasError=!isLoading&&BCB_NORMA_FEEDS.every(f=>!rssData[f.id]?.items?.length)
  let normas=allNormas
  if(area!=='all') normas=normas.filter(n=>n.area===area)
  if(urgFilt) normas=normas.filter(n=>n.urgencia===urgFilt)
  if(tipos.length) normas=normas.filter(n=>tipos.includes(n.tipo))
  if(q){const ql=q.toLowerCase();normas=normas.filter(n=>n.titulo.toLowerCase().includes(ql)||n.resumo.toLowerCase().includes(ql))}
  const urgCnt=allNormas.reduce((a,n)=>{a[n.urgencia]=(a[n.urgencia]||0)+1;return a},{} as Record<string,number>)
  const tiposAll=[...new Set(allNormas.map(n=>n.tipo))]
  const fmt=(d:string)=>{try{return new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}catch{return d}}

  const toggleCard=(id:number)=>setCards(prev=>({...prev,[id]:{...prev[id],tab:'analise',open:!prev[id]?.open}}))
  const setTab=(id:number,tab:string)=>setCards(prev=>({...prev,[id]:{...prev[id],open:true,tab}}))

  const gerarAnalise=async(n:Norma)=>{
    const k=getKey(); if(!k){alert('Configure sua API key em Configurações');return}
    setCards(prev=>({...prev,[n.id]:{...prev[n.id],open:true,tab:'analise',loading:true}}))
    try {
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:900,system:'Você é especialista sênior em regulação financeira brasileira (BCB/CMN). Análises objetivas e práticas para IFs.',messages:[{role:'user',content:`Analise esta norma BCB em 4 tópicos (máx 90 palavras cada):\n**1. O que muda** — impacto prático e operacional\n**2. Quem é afetado** — tipos de IF, segmentos prudenciais\n**3. CADOCs impactados** — documentos BCB afetados, campos específicos, exemplo de mudança\n**4. Prazo e ação** — datas-limite e o que fazer\n\nNorma: ${n.titulo}\nTipo: ${n.tipo} | Data: ${n.data_pub}\nResumo: ${n.resumo}`}]})})
      const d=await r.json()
      setCards(prev=>({...prev,[n.id]:{...prev[n.id],loading:false,analise:d.content?.[0]?.text||'Análise não disponível'}}))
    } catch(e:any){setCards(prev=>({...prev,[n.id]:{...prev[n.id],loading:false,analise:'Erro: '+e.message}}))}
  }

  const sendChat=async()=>{
    const k=getKey(); if(!chatInput.trim()||chatBusy)return; if(!k){alert('Configure API key');return}
    const msg=chatInput.trim(); setChatInput(''); setChatMsgs(prev=>[...prev,{role:'user',content:msg}]); setChatBusy(true)
    try {
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:700,system:'Você é o Assistente Regulatório BACEN Monitor. Responda sobre normas BCB/CMN, CADOCs, SCR, SPB e compliance de IFs brasileiras. Cite sempre o número da norma e o CADOC impactado quando relevante.',messages:[...chatMsgs.map(m=>({role:m.role,content:m.content})),{role:'user',content:msg}]})})
      const d=await r.json(); setChatMsgs(prev=>[...prev,{role:'assistant',content:d.content?.[0]?.text||'Sem resposta'}])
    } catch(e:any){setChatMsgs(prev=>[...prev,{role:'assistant',content:'Erro: '+e.message}])}
    setChatBusy(false)
    setTimeout(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight},100)
  }

  const B='#e5e7eb',BG='#f9fafb',T='#111827',T3='#6b7280'

  return (
    <div style={{display:'flex',height:'100%',overflow:'hidden',background:'#f0f2f7',fontFamily:"'Inter',system-ui,sans-serif"}}>
      {/* Sidebar */}
      <div style={{width:188,flexShrink:0,background:'#fff',borderRight:`1px solid ${B}`,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Year */}
        <div style={{padding:'12px 14px',borderBottom:`1px solid ${B}`,flexShrink:0}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:T3,marginBottom:6}}>ANO DO FEED</div>
          <div style={{display:'flex',gap:4}}>
            {[2026,2025,2024].map(a=>(
              <button key={a} onClick={()=>{setRssAno(a);BCB_NORMA_FEEDS.forEach(f=>fetchFeed(f,a))}} style={{flex:1,padding:'4px',borderRadius:5,border:`1px solid ${rssAno===a?G:B}`,background:rssAno===a?G:'#fff',color:rssAno===a?'#fff':T3,fontSize:11,fontWeight:600,cursor:'pointer',outline:'none'}}>{a}</button>
            ))}
          </div>
        </div>
        {/* Areas */}
        <div style={{padding:'6px 0',borderBottom:`1px solid ${B}`,flexShrink:0}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:T3,padding:'4px 14px 5px'}}>ÁREA</div>
          {AREAS.map(a=>{
            const cnt=a.id==='all'?allNormas.length:allNormas.filter(n=>n.area===a.id).length
            return(<div key={a.id} onClick={()=>setArea(a.id)} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 14px',cursor:'pointer',color:area===a.id?G:T3,borderLeft:`2px solid ${area===a.id?G:'transparent'}`,background:area===a.id?'rgba(10,124,92,.07)':'transparent',fontSize:12,fontWeight:area===a.id?600:400}}>
              <span style={{fontSize:11}}>{a.ico}</span><span style={{flex:1}}>{a.label}</span>
              {cnt>0&&<span style={{fontSize:9,fontFamily:'monospace',background:area===a.id?G:BG,color:area===a.id?'#fff':T3,padding:'1px 5px',borderRadius:8}}>{cnt}</span>}
            </div>)
          })}
        </div>
        {/* Urgência */}
        <div style={{padding:'6px 0',borderBottom:`1px solid ${B}`,flexShrink:0}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:T3,padding:'4px 14px 5px'}}>URGÊNCIA</div>
          {[{id:'critica',l:'Crítica',c:'#dc2626'},{id:'alta',l:'Alta',c:'#d97706'},{id:'normal',l:'Normal',c:G}].map(u=>(
            <div key={u.id} onClick={()=>setUrgFilt(urgFilt===u.id?'':u.id)} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 14px',cursor:'pointer',color:urgFilt===u.id?u.c:T3,borderLeft:`2px solid ${urgFilt===u.id?u.c:'transparent'}`,background:urgFilt===u.id?u.c+'12':'transparent',fontSize:12}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:u.c,flexShrink:0}}/><span style={{flex:1}}>{u.l}</span>
              {urgCnt[u.id]&&<span style={{fontSize:9,fontFamily:'monospace'}}>{urgCnt[u.id]}</span>}
            </div>
          ))}
        </div>
        {/* Chat */}
        <div style={{padding:'6px 0',flex:1}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:T3,padding:'4px 14px 5px'}}>FERRAMENTAS</div>
          <div onClick={()=>setChatOpen(!chatOpen)} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 14px',cursor:'pointer',color:chatOpen?G:T3,borderLeft:`2px solid ${chatOpen?G:'transparent'}`,background:chatOpen?'rgba(10,124,92,.07)':'transparent',fontSize:12}}>
            <span>🤖</span><span style={{flex:1}}>Assistente IA</span>
            <span style={{fontSize:8,fontWeight:800,background:G,color:'#fff',padding:'1px 4px',borderRadius:2}}>IA</span>
          </div>
        </div>
        {/* Status */}
        <div style={{padding:'10px 14px',borderTop:`1px solid ${B}`,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:isLoading?'#d97706':hasError?'#dc2626':G,boxShadow:isLoading?'none':`0 0 5px ${hasError?'#dc2626':G}`}}/>
            <span style={{fontSize:9.5,color:T3,fontFamily:'monospace'}}>{isLoading?'Carregando…':hasError?'Feeds indisponíveis':`${allNormas.length} normas · ${rssAno}`}</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {/* Toolbar */}
        <div style={{padding:'8px 16px',background:'#fff',borderBottom:`1px solid ${B}`,display:'flex',alignItems:'center',gap:8,flexShrink:0,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:7,background:'#fff',border:`1px solid ${B}`,borderRadius:8,padding:'6px 10px',flex:1,minWidth:200,boxShadow:'0 1px 3px rgba(0,0,0,.04)'}}>
            <span style={{color:T3,fontSize:14}}>⌕</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar normas, CADOCs, temas…" style={{flex:1,border:'none',outline:'none',background:'transparent',fontSize:12.5,color:T,fontFamily:'inherit'}}/>
            {q&&<span onClick={()=>setQ('')} style={{cursor:'pointer',color:T3,fontSize:11}}>✕</span>}
          </div>
          <button onClick={fetchAll} disabled={isLoading} style={{padding:'7px 14px',borderRadius:7,border:`1px solid ${B}`,background:'#fff',cursor:isLoading?'wait':'pointer',fontSize:11,fontWeight:600,color:'#374151',outline:'none',display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap'}}>
            {isLoading?<><span style={{display:'inline-block',width:11,height:11,border:'2px solid',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>Carregando…</>:<>↻ Atualizar Feed BCB</>}
          </button>
          {urgFilt&&<button onClick={()=>setUrgFilt('')} style={{fontSize:10.5,padding:'4px 10px',borderRadius:5,border:'1px solid rgba(220,38,38,.2)',background:'rgba(220,38,38,.08)',color:'#dc2626',cursor:'pointer',outline:'none'}}>✕ {urgFilt}</button>}
        </div>
        {/* Tipo pills */}
        <div style={{padding:'6px 16px',background:'#fff',borderBottom:`1px solid ${B}`,display:'flex',gap:5,flexWrap:'wrap',flexShrink:0}}>
          {tiposAll.map(t=>{
            const cfg=TIPO_CFG[t]||{color:T3,bg:BG}
            return(<button key={t} onClick={()=>setTipos(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t])} style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:500,cursor:'pointer',outline:'none',border:`1px solid ${tipos.includes(t)?cfg.color:B}`,background:tipos.includes(t)?cfg.color:'#fff',color:tipos.includes(t)?'#fff':'#374151',transition:'all .12s'}}>{t}</button>)
          })}
          {tipos.length>0&&<button onClick={()=>setTipos([])} style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:700,border:'1px solid #dc2626',cursor:'pointer',background:'#dc2626',color:'#fff',outline:'none'}}>✕ Limpar</button>}
        </div>

        {/* Feed */}
        <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
            <div>
              <h1 style={{fontSize:17,fontWeight:800,color:T,margin:'0 0 2px',letterSpacing:'-.4px'}}>{area==='all'?'Normas BCB/CMN Vigentes':AREAS.find(a=>a.id===area)?.label}</h1>
              <span style={{fontSize:11,color:T3,fontFamily:'monospace'}}>{isLoading?'Buscando feeds ao vivo em bcb.gov.br…':`${normas.length} normas · feed ao vivo bcb.gov.br · ${rssAno}`}</span>
            </div>
          </div>

          {isLoading&&!allNormas.length&&(
            <div style={{padding:'48px',textAlign:'center',color:T3}}>
              <div style={{width:32,height:32,border:`3px solid ${G}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',margin:'0 auto 12px'}}/>
              <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Carregando normas do BCB…</div>
              <div style={{fontSize:11,fontFamily:'monospace'}}>bcb.gov.br/api/feed/app/normativos · {rssAno}</div>
            </div>
          )}

          {!isLoading&&hasError&&(
            <div style={{padding:'32px',textAlign:'center',background:'#fff',borderRadius:12,border:`1px solid ${B}`}}>
              <div style={{fontSize:32,marginBottom:8}}>⚠️</div>
              <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Feeds BCB indisponíveis</div>
              <div style={{fontSize:11,color:T3,marginBottom:14,lineHeight:1.6,maxWidth:400,margin:'0 auto 14px'}}>Pode ser bloqueio CORS do sandbox. <strong>Abra o BACEN Monitor Original localmente</strong> para feeds ao vivo.<br/>O BCB serve com CORS aberto — funciona normalmente fora do sandbox.</div>
              <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
                <button onClick={fetchAll} style={{padding:'8px 18px',borderRadius:8,border:'none',background:G,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',outline:'none'}}>↻ Tentar novamente</button>
                <a href="/dashboard/cadocs" style={{padding:'8px 18px',borderRadius:8,border:`1px solid ${B}`,background:'#fff',color:'#374151',fontSize:12,fontWeight:600,textDecoration:'none'}}>📋 Ir para CADOC Original</a>
              </div>
            </div>
          )}

          {!isLoading&&!hasError&&normas.length===0&&(
            <div style={{padding:'48px',textAlign:'center',color:T3}}>
              <div style={{fontSize:28,marginBottom:8}}>📄</div>
              <div style={{fontSize:13,fontWeight:600}}>Nenhuma norma encontrada</div>
              <div style={{fontSize:11,marginTop:4}}>Ajuste os filtros ou aguarde o carregamento.</div>
            </div>
          )}

          {normas.map(n=>{
            const cs=cards[n.id]||{open:false,tab:'analise'}
            const cfg=TIPO_CFG[n.tipo]||{color:T3,bg:BG}
            const urgC=n.urgencia==='critica'?'#dc2626':n.urgencia==='alta'?'#d97706':G
            const urgBg=n.urgencia==='critica'?'rgba(220,38,38,.08)':n.urgencia==='alta'?'rgba(217,119,6,.08)':'rgba(10,124,92,.06)'
            const urgBrd=n.urgencia==='critica'?'rgba(220,38,38,.2)':n.urgencia==='alta'?'rgba(217,119,6,.2)':'rgba(10,124,92,.2)'
            return(
              <div key={n.id} style={{background:'#fff',border:`1px solid ${B}`,borderRadius:10,marginBottom:6,boxShadow:cs.open?'0 4px 16px rgba(0,0,0,.08)':'0 1px 3px rgba(0,0,0,.04)',overflow:'hidden',position:'relative',borderLeft:`3px solid ${cs.open?cfg.color:'transparent'}`,transition:'border-color .15s'}}>
                <div onClick={()=>toggleCard(n.id)} style={{padding:'11px 14px',cursor:'pointer',userSelect:'none'}}>
                  <div style={{fontSize:13,fontWeight:600,color:T,lineHeight:1.5,marginBottom:6}}>{n.titulo}</div>
                  <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                    <span style={{padding:'2px 7px',borderRadius:4,fontSize:9,fontWeight:700,letterSpacing:'.3px',border:`1px solid ${cfg.color}40`,background:cfg.bg,color:cfg.color}}>{n.tipo}</span>
                    {n.data_pub&&<span style={{fontSize:9.5,color:T3,fontFamily:'monospace'}}>📅 {fmt(n.data_pub)}</span>}
                    {n.numero&&<span style={{fontSize:9.5,color:T3,fontFamily:'monospace'}}>#{n.numero}</span>}
                    <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:3,border:`1px solid ${urgBrd}`,background:urgBg,color:urgC,fontFamily:'monospace'}}>{n.urgencia==='critica'?'⚠ CRÍTICA':n.urgencia==='alta'?'↑ ALTA':'● NORMAL'}</span>
                    <span style={{marginLeft:'auto',fontSize:11,color:T3}}>{cs.open?'▲':'▼'}</span>
                  </div>
                </div>

                {cs.open&&(
                  <div style={{borderTop:`1px solid ${B}`}}>
                    <div style={{display:'flex',background:'#f3f4f6',borderBottom:`1px solid ${B}`}}>
                      {([['analise','🤖 Análise IA'],['resumo','📄 Resumo']] as [string,string][]).map(([t,l])=>(
                        <div key={t} onClick={()=>setTab(n.id,t)} style={{flex:1,padding:'8px 4px',textAlign:'center',fontSize:10,fontWeight:600,color:cs.tab===t?G:T3,cursor:'pointer',borderBottom:cs.tab===t?`2px solid ${G}`:'2px solid transparent',marginBottom:-1,letterSpacing:'.4px',textTransform:'uppercase',userSelect:'none'}}>{l}</div>
                      ))}
                    </div>
                    <div style={{padding:'12px 14px'}}>
                      {cs.tab==='analise'&&(
                        <div>
                          <div style={{background:'#f9fafb',border:`1px solid ${B}`,borderRadius:8,padding:10,marginBottom:8}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
                              <span style={{fontSize:8.5,letterSpacing:1,textTransform:'uppercase',fontFamily:'monospace',fontWeight:700,color:G,background:'rgba(10,124,92,.08)',padding:'2px 7px',borderRadius:3,border:'1px solid rgba(10,124,92,.2)'}}>Análise IA</span>
                              <span style={{fontSize:9.5,color:T3,fontFamily:'monospace'}}>Claude Sonnet 4.6</span>
                              <a href={n.url} target="_blank" rel="noreferrer" style={{marginLeft:'auto',fontSize:9.5,color:'#1d5fcc',fontFamily:'monospace',padding:'2px 8px',border:'1px solid rgba(29,95,204,.3)',borderRadius:4,background:'rgba(29,95,204,.06)',textDecoration:'none'}}>↗ Norma BCB</a>
                            </div>
                            {cs.loading?(
                              <div style={{display:'flex',gap:5,alignItems:'center',padding:'8px 0'}}>
                                {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:'50%',background:G,animation:`ald 1.2s ${i*.2}s infinite`}}/>)}
                                <span style={{fontSize:10,color:T3,marginLeft:4}}>Analisando norma…</span>
                              </div>
                            ):cs.analise?(
                              <div style={{fontSize:12,color:T,lineHeight:1.8,whiteSpace:'pre-wrap'}} dangerouslySetInnerHTML={{__html:(cs.analise||'').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}}/>
                            ):(
                              <div style={{fontSize:11,color:T3}}>Clique em "Gerar Análise" para análise contextualizada desta norma com Claude.</div>
                            )}
                          </div>
                          {!cs.loading&&!cs.analise&&<button onClick={()=>gerarAnalise(n)} style={{padding:'7px 14px',background:G,color:'#fff',border:'none',borderRadius:7,fontWeight:700,fontSize:12,cursor:'pointer',outline:'none'}}>✦ Gerar Análise IA</button>}
                          {cs.analise&&!cs.loading&&<button onClick={()=>{setCards(prev=>({...prev,[n.id]:{...prev[n.id],analise:undefined}}));gerarAnalise(n)}} style={{padding:'5px 10px',background:'none',color:G,border:'1px solid rgba(10,124,92,.2)',borderRadius:5,fontSize:10,cursor:'pointer',outline:'none'}}>↻ Regenerar</button>}
                        </div>
                      )}
                      {cs.tab==='resumo'&&(
                        <div>
                          {n.resumo?<p style={{fontSize:12,color:T,lineHeight:1.75,marginBottom:10}}>{n.resumo}</p>:<p style={{fontSize:11,color:T3}}>Resumo não disponível neste feed.</p>}
                          <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',paddingTop:8,borderTop:`1px solid ${B}`}}>
                            {n.data_pub&&<span style={{fontSize:9.5,fontFamily:'monospace',color:G,background:'rgba(10,124,92,.08)',border:'1px solid rgba(10,124,92,.2)',padding:'1px 6px',borderRadius:3}}>✓ {fmt(n.data_pub)}</span>}
                            <span style={{fontSize:10,padding:'2px 8px',borderRadius:4,background:'#f3f4f6',color:'#374151'}}>{n.tipo}</span>
                            {n.url&&<a href={n.url} target="_blank" rel="noreferrer" style={{marginLeft:'auto',fontSize:10,color:'#1d5fcc',textDecoration:'none'}}>↗ Referência BCB</a>}
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
        <div style={{width:275,flexShrink:0,borderLeft:`1px solid ${B}`,background:'#fff',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'11px 14px',borderBottom:`1px solid ${B}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <span style={{fontSize:12,fontWeight:700,color:T}}>🤖 Assistente Regulatório</span>
            <button onClick={()=>setChatOpen(false)} style={{background:'none',border:'none',cursor:'pointer',color:T3,fontSize:14,outline:'none'}}>✕</button>
          </div>
          {chatMsgs.length===0&&<div style={{padding:'10px 12px',flexShrink:0}}>
            <div style={{fontSize:10,color:T3,marginBottom:6}}>Sugestões:</div>
            {SUGESTOES.map(s=><div key={s} onClick={()=>setChatInput(s)} style={{padding:'5px 9px',fontSize:10,color:'#374151',background:'#f3f4f6',border:`1px solid ${B}`,borderRadius:6,marginBottom:4,cursor:'pointer',lineHeight:1.4}}>{s}</div>)}
          </div>}
          <div ref={chatRef} style={{flex:1,overflowY:'auto',padding:'10px 12px'}}>
            {chatMsgs.map((m,i)=>(
              <div key={i} style={{marginBottom:10,display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                <div style={{maxWidth:'88%',padding:'8px 11px',borderRadius:m.role==='user'?'10px 10px 2px 10px':'10px 10px 10px 2px',background:m.role==='user'?G:'#f0f2f5',color:m.role==='user'?'#fff':T,fontSize:11,lineHeight:1.6}} dangerouslySetInnerHTML={{__html:m.content.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}}/>
              </div>
            ))}
            {chatBusy&&<div style={{display:'flex',gap:4,padding:'4px 0'}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:'50%',background:G,animation:`ald 1.2s ${i*.2}s infinite`}}/>)}</div>}
          </div>
          <div style={{padding:'10px 12px',borderTop:`1px solid ${B}`,display:'flex',gap:6,flexShrink:0}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Pergunte sobre normas BCB…" style={{flex:1,padding:'7px 10px',border:`1px solid ${B}`,borderRadius:7,fontSize:11,outline:'none',fontFamily:'inherit'}}/>
            <button onClick={sendChat} disabled={chatBusy||!chatInput.trim()} style={{padding:'7px 12px',background:G,color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700,outline:'none'}}>→</button>
          </div>
        </div>
      )}
      <style>{`@keyframes ald{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.2)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
