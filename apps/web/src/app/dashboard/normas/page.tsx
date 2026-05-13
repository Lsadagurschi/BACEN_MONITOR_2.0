'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

// ─── tipos ───────────────────────────────────────────────────────────────────
interface RssItem { titulo:string; link:string; descricao:string; data:string; guid:string }
interface Norma { id:number; tipo:string; numero:string; titulo:string; resumo:string; data_pub:string; area:string; urgencia:string; url:string; fonte:string }
interface CardSt { open:boolean; tab:'analise'|'resumo'; analise?:string; loading?:boolean }

// ─── feeds BCB ───────────────────────────────────────────────────────────────
// Fonte: BCB (3 feeds), DOU seção 1, CVM, SUSEP, Congresso, CMN
const FEEDS = [
  { id:'bcb_normativos',   url:'https://www.bcb.gov.br/api/feed/app/normativos/normativos',       supAno:true,  fonte:'BCB',    label:'Normativos BCB'   },
  { id:'bcb_demais',       url:'https://www.bcb.gov.br/api/feed/app/normativos/demaisnormativos', supAno:true,  fonte:'BCB',    label:'Demais Normativos' },
  { id:'bcb_cartas',       url:'https://www.bcb.gov.br/api/feed/app/normativos/cartascirculares', supAno:true,  fonte:'BCB',    label:'Cartas Circulares' },
  { id:'dou_s1',           url:'https://www.in.gov.br/servicos/dou-consumidor/filtrar?termo=banco+central&secao=DO1&edicaoPadrao=false&tipoAto=RESOLUCAO,INSTRUCAO_NORMATIVA,CIRCULAR&formato=JSON', supAno:false, fonte:'DOU',    label:'Diário Oficial'   },
  { id:'cvm',              url:'https://www.gov.br/cvm/pt-br/assuntos/noticias/RSS',               supAno:false, fonte:'CVM',    label:'CVM'              },
  { id:'susep',            url:'https://www.gov.br/susep/pt-br/assuntos/noticias/RSS',             supAno:false, fonte:'SUSEP',  label:'SUSEP'            },
  { id:'senado',           url:'https://www25.senado.leg.br/web/atividade/materias/-/materia/rss/atualNormas',   supAno:false, fonte:'Senado', label:'Senado Federal'   },
  { id:'planalto',         url:'https://legislacao.planalto.gov.br/legislacao.nsf/Viw_Identificacao/lei%2014.478-2022?OpenDocument', supAno:false, fonte:'Planalto', label:'Planalto' },
]

const FONTES_COR: Record<string,string> = {
  'BCB':'#0d6e52', 'DOU':'#1648A0', 'CVM':'#7c3aed',
  'SUSEP':'#b45309', 'Senado':'#c0392b', 'Planalto':'#374151',
}

const AREAS = [
  { id:'all',       l:'Todas',            ico:'◈' },
  { id:'pagamentos', l:'Pagamentos',       ico:'💳' },
  { id:'crédito',   l:'Crédito / SCR',    ico:'📊' },
  { id:'câmbio',    l:'Câmbio / PSAV',    ico:'🔄' },
  { id:'capital',   l:'Capital',          ico:'🏛' },
]

const TIPO_COR: Record<string,string> = {
  'Resolução BCB':'#0d6e52', 'Instrução Normativa BCB':'#1d5fcc',
  'Resolução CMN':'#c0392b', 'Resolução Conjunta':'#7c3aed',
  'Circular BCB':'#b45309',  'Carta Circular BCB':'#b45309', 'Comunicado BCB':'#6b7280',
}

// ─── parser RSS/Atom ──────────────────────────────────────────────────────────
function parseXML(xml: string): RssItem[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  function txt(el: Element | null, max = 0) {
    if (!el) return ''
    let s = el.textContent || ''
    if (s.includes('<')) { try { s = new DOMParser().parseFromString(s,'text/html').body.textContent||'' } catch { s = s.replace(/<[^>]+>/g,'') } }
    s = s.replace(/\s+/g,' ').trim()
    return max ? s.slice(0,max) : s
  }
  const out: RssItem[] = []
  doc.querySelectorAll('entry').forEach(e => {
    const lk = e.querySelector("link[rel='alternate'], link")
    out.push({ titulo:txt(e.querySelector('title')), link:lk?.getAttribute('href')||lk?.textContent?.trim()||'', descricao:txt(e.querySelector('content,summary'),240), data:e.querySelector('updated,published')?.textContent?.trim()||'', guid:e.querySelector('id')?.textContent?.trim()||'' })
  })
  if (!out.length) doc.querySelectorAll('item').forEach(e => {
    out.push({ titulo:txt(e.querySelector('title')), link:e.querySelector('link')?.textContent?.trim()||'', descricao:txt(e.querySelector('description'),240), data:e.querySelector('pubDate')?.textContent?.trim()||'', guid:e.querySelector('guid')?.textContent?.trim()||'' })
  })
  return out
}

// ─── mapeador RSS → Norma ─────────────────────────────────────────────────────
let _nextId = 1000
const _ids: Record<string,number> = {}
function toNorma(it: RssItem, fonte = 'BCB'): Norma {
  const t = it.titulo
  let tipo = 'Normativo BCB'
  if (/Resolu[çc][ãa]o CMN/i.test(t))       tipo = 'Resolução CMN'
  else if (/Resolu[çc][ãa]o Conjunta/i.test(t)) tipo = 'Resolução Conjunta'
  else if (/Resolu[çc][ãa]o BCB/i.test(t))  tipo = 'Resolução BCB'
  else if (/Instru[çc][ãa]o Normativa/i.test(t)) tipo = 'Instrução Normativa BCB'
  else if (/Carta Circular/i.test(t))        tipo = 'Carta Circular BCB'
  else if (/Circular/i.test(t))              tipo = 'Circular BCB'
  else if (/Comunicado/i.test(t))            tipo = 'Comunicado BCB'
  const txt = (t + ' ' + it.descricao).toLowerCase()
  let urgencia = 'normal'
  if (/pix|subcredenci|psav|liquidação centralizada|baas/i.test(txt)) urgencia = 'critica'
  else if (/câmbio|cripto|ativo virtual|capital m[ií]nimo|credenciador|emissor/i.test(txt)) urgencia = 'alta'
  let area = 'outros'
  if (/pix|pagamento|credenciador|emissor|arranjo|subcredenci/i.test(txt)) area = 'pagamentos'
  else if (/cambio|câmbio|moeda estrangeira/i.test(txt)) area = 'câmbio'
  else if (/cr[eé]dito|scr|cadoc 30/i.test(txt)) area = 'crédito'
  else if (/capital|basileia|rwa/i.test(txt)) area = 'capital'
  else if (/ativo virtual|cripto|psav/i.test(txt)) area = 'câmbio'
  const rawId = it.guid || it.link
  if (!_ids[rawId]) _ids[rawId] = _nextId++
  const num = t.match(/[Nn][ºo°]?\s*(\d+)/)?.[1] || ''
  return { id:_ids[rawId], tipo, numero:num, titulo:t.replace(/^BC\s*-\s*/,'').trim(), resumo:it.descricao, data_pub:(it.data||'').slice(0,10), area, urgencia, url:it.link, fonte }
}

function fmtData(d: string) {
  try { return new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}) } catch { return d }
}

// ─── componente ───────────────────────────────────────────────────────────────
export default function NormasPage() {
  const [feeds, setFeeds]   = useState<Record<string,{items:RssItem[];loading:boolean;error:string}>>({})
  const [area, setArea]     = useState('all')
  const [urgFilt, setUrgF]  = useState('')
  const [q, setQ]           = useState('')
  const [tipos, setTipos]   = useState<string[]>([])
  const [cards, setCards]   = useState<Record<number,CardSt>>({})
  const [ano, setAno]       = useState(new Date().getFullYear())
  const [chat, setChat]     = useState(false)
  const [msgs, setMsgs]     = useState<{r:string;c:string}[]>([])
  const [inp, setInp]       = useState('')
  const [busy, setBusy]     = useState(false)
  const [pagina, setPagina] = useState(1)
  const [historico, setHistorico] = useState<Norma[]>([])
  const chatEl              = useRef<HTMLDivElement>(null)
  const POR_PAGINA = 10

  const getKey = () => typeof window !== 'undefined' ? (localStorage.getItem('bm_api_key')||'') : ''

  // Carrega histórico persistido do localStorage na montagem
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bm_normas_historico')
      if (saved) setHistorico(JSON.parse(saved))
    } catch {}
  }, [])

  // Persiste histórico sempre que novas normas chegarem dos feeds
  const mergeHistorico = useCallback((novas: Norma[]) => {
    setHistorico(prev => {
      const idsSeen = new Set(prev.map(n => n.id))
      const adicionais = novas.filter(n => !idsSeen.has(n.id))
      if (!adicionais.length) return prev
      const merged = [...adicionais, ...prev].sort((a,b) => (b.data_pub||'').localeCompare(a.data_pub||''))
      try { localStorage.setItem('bm_normas_historico', JSON.stringify(merged)) } catch {}
      return merged
    })
  }, [])

  // Busca um feed via API Route server-side — sem bloqueio CORS
  const fetchFeedAno = useCallback(async (feed: typeof FEEDS[0], yr: number): Promise<RssItem[]> => {
    const params = new URLSearchParams({ feed: feed.id, ano: String(yr) })
    const ctrl  = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 20000)
    try {
      const r = await fetch(`/api/normas?${params}`, { signal: ctrl.signal })
      clearTimeout(timer)
      if (!r.ok) return []
      const body = await r.text()
      const ct   = r.headers.get('content-type') || ''
      if (ct.includes('json') || body.trimStart().startsWith('{') || body.trimStart().startsWith('[')) {
        try {
          const json = JSON.parse(body)
          const items = json?.items || json?.resultados || json?.hits?.hits?.map((h:any) => h._source) || []
          return items.map((it:any) => ({
            titulo:    it.titulo || it.title || it.identifica || '',
            link:      it.urlTitle ? `https://www.in.gov.br/en/web/dou/-/${it.urlTitle}` : (it.url || it.link || ''),
            descricao: (it.ementa || it.subTitulo || it.description || '').slice(0, 300),
            data:      it.pubDate || it.data || it.dataPublicacao || '',
            guid:      it.id || it.urlTitle || it.link || String(Math.random()),
          }))
        } catch { return [] }
      }
      return parseXML(body)
    } catch { clearTimeout(timer); return [] }
  }, [])

  // Busca todos os anos de um feed em paralelo e consolida
  const fetchFeed = useCallback(async (feed: typeof FEEDS[0], anoRef: number) => {
    setFeeds(prev => ({...prev, [feed.id]:{items:[],loading:true,error:''}}))
    // BCB retorna ~10 por ano → buscamos os últimos 5 anos em paralelo
    const anos = feed.supAno
      ? [anoRef, anoRef-1, anoRef-2, anoRef-3, anoRef-4]
      : [anoRef]

    try {
      const resultados = await Promise.allSettled(anos.map(yr => fetchFeedAno(feed, yr)))
      const seen = new Set<string>()
      const allItems: RssItem[] = []
      resultados.forEach(res => {
        if (res.status === 'fulfilled') res.value.forEach(item => {
          if (!item.titulo) return
          const k = item.guid || item.link
          if (k && !seen.has(k)) { seen.add(k); allItems.push(item) }
        })
      })
      allItems.sort((a,b) => (b.data||'').localeCompare(a.data||''))
      setFeeds(prev => ({...prev,[feed.id]:{items:allItems,loading:false,error:allItems.length?'':'Feed indisponível'}}))
    } catch(e:any) {
      setFeeds(prev => ({...prev,[feed.id]:{items:[],loading:false,error:'Erro: '+e.message}}))
    }
  }, [fetchFeedAno])

  // Busca todos os feeds passando o ano explicitamente (evita closure stale)
  const fetchAll = useCallback((anoRef: number) => {
    FEEDS.forEach(f => fetchFeed(f, anoRef))
  }, [fetchFeed])

  // Busca inicial
  useEffect(() => { fetchAll(ano) }, [])

  // Rebusca quando o ano muda
  useEffect(() => { fetchAll(ano) }, [ano])

  // monta normas a partir dos feeds + histórico persistido
  const allNormas: Norma[] = (() => {
    const seen = new Set<string>(); const out: Norma[] = []
    FEEDS.forEach(f => { feeds[f.id]?.items?.forEach(it => { const g=it.guid||it.link; if(!seen.has(g)){seen.add(g);out.push(toNorma(it, f.fonte))} }) })
    return out.sort((a,b) => (b.data_pub||'').localeCompare(a.data_pub||''))
  })()

  // Quando novas normas chegam dos feeds, persiste no histórico
  useEffect(() => {
    if (allNormas.length) mergeHistorico(allNormas)
  }, [allNormas.length])

  // Fonte final: histórico (inclui feed atual + sessões anteriores)
  const fonteNormas: Norma[] = historico.length ? historico : allNormas

  const isLoading = FEEDS.some(f => feeds[f.id]?.loading)
  const hasErr    = !isLoading && FEEDS.every(f => !feeds[f.id]?.items?.length)

  let normas = [...fonteNormas]
  if (area !== 'all') normas = normas.filter(n => n.area === area)
  if (urgFilt)        normas = normas.filter(n => n.urgencia === urgFilt)
  if (tipos.length)   normas = normas.filter(n => tipos.includes(n.tipo))
  if (q) { const ql = q.toLowerCase(); normas = normas.filter(n => n.titulo.toLowerCase().includes(ql)||n.resumo.toLowerCase().includes(ql)) }

  const totalPaginas = Math.ceil(normas.length / POR_PAGINA)
  const paginaAtual  = Math.min(pagina, totalPaginas || 1)
  const normasPagina = normas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA)

  // Reset para pag 1 quando filtros mudam
  useEffect(() => { setPagina(1) }, [area, urgFilt, q, tipos.length])

  const urgCnt = fonteNormas.reduce((a,n) => ({...a,[n.urgencia]:(a[n.urgencia]||0)+1}), {} as Record<string,number>)
  const tiposAll = [...new Set(fonteNormas.map(n=>n.tipo))]

  const toggleCard = (id: number) => setCards(p => ({...p,[id]:{...p[id],tab:'analise',open:!p[id]?.open}}))
  const setTab = (id: number, tab: 'analise'|'resumo') => setCards(p => ({...p,[id]:{...p[id],open:true,tab}}))

  const analise = async (n: Norma) => {
    const k = getKey()
    if (!k) { alert('Configure sua API key em Configurações para usar a análise por IA.'); return }
    setCards(p => ({...p,[n.id]:{...p[n.id],open:true,tab:'analise',loading:true}}))
    try {
      // Busca o conteúdo real usando web_search como tool e processa a resposta corretamente
      let conteudoDoc = ''
      if (n.url) {
        try {
          const r1 = await fetch('https://api.anthropic.com/v1/messages', {
            method:'POST',
            headers:{'Content-Type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
            body: JSON.stringify({
              model:'claude-sonnet-4-6', max_tokens:1000,
              system:'Acesse a URL e extraia o texto do ato normativo. Retorne APENAS o texto extraído, em português.',
              messages:[{role:'user',content:`Acesse este link e retorne o texto do ato normativo (ementa e artigos principais, máx 1200 chars):\n${n.url}`}],
              tools:[{type:'web_search_20250305', name:'web_search'}],
              tool_choice:{type:'auto'},
            })
          })
          const d1 = await r1.json()
          // Processa todos os blocos — pode vir text, tool_use ou tool_result
          const blocos = d1.content || []
          // Se stop_reason=tool_use, precisa de mais uma rodada
          if (d1.stop_reason === 'tool_use') {
            const toolResults = blocos
              .filter((b:any) => b.type === 'tool_use')
              .map((b:any) => ({ type:'tool_result', tool_use_id: b.id, content: '' }))
            const r2 = await fetch('https://api.anthropic.com/v1/messages', {
              method:'POST',
              headers:{'Content-Type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
              body: JSON.stringify({
                model:'claude-sonnet-4-6', max_tokens:1000,
                system:'Acesse a URL e extraia o texto do ato normativo. Retorne APENAS o texto extraído.',
                messages:[
                  {role:'user',content:`Acesse este link e retorne o texto do ato normativo:\n${n.url}`},
                  {role:'assistant',content: blocos},
                  {role:'user', content: toolResults},
                ],
                tools:[{type:'web_search_20250305', name:'web_search'}],
              })
            })
            const d2 = await r2.json()
            conteudoDoc = (d2.content||[]).filter((b:any)=>b.type==='text').map((b:any)=>b.text).join('\n').slice(0,1500)
          } else {
            conteudoDoc = blocos.filter((b:any)=>b.type==='text').map((b:any)=>b.text).join('\n').slice(0,1500)
          }
        } catch { /* ignora — analisa só com os metadados */ }
      }

      const contextoDoc = conteudoDoc && conteudoDoc.length > 80
        ? `\n\n📄 CONTEÚDO EXTRAÍDO DA FONTE (${n.fonte}):\n${conteudoDoc}`
        : `\n\nLink da norma: ${n.url || 'não disponível'}`

      const r = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({
          model:'claude-sonnet-4-6', max_tokens:1600,
          system:'Você é especialista sênior em regulação financeira BCB/CMN e no Sistema de Informações de Crédito (SCR). Conhece profundamente os leiautes XML dos CADOCs (3040, 4010, 3060, 6334 etc), campos obrigatórios, tamanhos e regras de validação BCB. Forneça análises objetivas e práticas para compliance de IFs brasileiras.',
          messages:[{role:'user',content:`Analise o ato normativo abaixo em 5 tópicos:

**1. O que muda**
Impacto operacional concreto para IFs (máx 80 palavras).

**2. Quem é afetado**
Tipos de IF, segmentos S1–S5 e áreas impactadas (máx 60 palavras).

**3. CADOCs e Campos Impactados**
Liste cada CADOC afetado com:
- CADOC e nome completo
- Campos: nome | tipo | tamanho | obrigatório
Exemplo: ClassOp | string | 2 | obrigatório

**4. Exemplo XML ANTES/DEPOIS**
Trecho representativo no formato real do BCB:
\`\`\`xml
<!-- ANTES -->
<Op Mod="..." ClassOp="A" VlrContr="1000.00"/>

<!-- DEPOIS -->
<Op Mod="..." ClassOp="A" VlrContr="1000.00" NovoCampo="X"/>
\`\`\`

**5. Prazo e Ação**
Vigência, prazo e próximos passos prioritários (máx 60 palavras).

---
Fonte: ${n.fonte} | Tipo: ${n.tipo} | Data: ${n.data_pub}
Norma: ${n.titulo}
Resumo: ${n.resumo}${contextoDoc}`}]
        })
      })
      const d = await r.json()
      const texto = (d.content||[]).filter((b:any)=>b.type==='text').map((b:any)=>b.text).join('\n')
      setCards(p => ({...p,[n.id]:{...p[n.id],loading:false,analise:texto || `⚠️ API retornou: ${d.error?.message||d.stop_reason||JSON.stringify(d).slice(0,120)}`}}))
    } catch(e:any) {
      setCards(p => ({...p,[n.id]:{...p[n.id],loading:false,analise:'❌ Erro: '+e.message}}))
    }
  }

  const send = async () => {
    const k = getKey()
    if (!inp.trim()||busy) return
    if (!k) { alert('Configure sua API key em Configurações para usar o assistente.'); return }
    const m = inp.trim(); setInp(''); setMsgs(p => [...p,{r:'user',c:m}]); setBusy(true)
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST', headers:{'Content-Type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:600,system:'Assistente regulatório BACEN Monitor. Responda sobre normas BCB/CMN, CADOCs, SCR e compliance de IFs brasileiras. Cite sempre o número da norma e CADOC impactado quando relevante.',messages:[...msgs.map(m=>({role:m.r,content:m.c})),{role:'user',content:m}]})
      })
      const d = await r.json()
      setMsgs(p => [...p,{r:'assistant',c:d.content?.[0]?.text||'Sem resposta'}])
    } catch(e:any) { setMsgs(p => [...p,{r:'assistant',c:'Erro: '+e.message}]) }
    setBusy(false)
    setTimeout(() => { if(chatEl.current) chatEl.current.scrollTop=chatEl.current.scrollHeight }, 100)
  }

  const G = '#0d6e52'

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden', background:'#f1f3f7', fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ── Sidebar esquerda ─────────────────────────────────────── */}
      <div style={{ width:192, flexShrink:0, background:'#fff', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Ano */}
        <div style={{ padding:'12px 14px', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'#9ca3af', marginBottom:6 }}>ANO DO FEED</div>
          <div style={{ display:'flex', gap:4 }}>
            {[2026,2025,2024].map(a => (
              <button key={a} onClick={() => { setAno(a); FEEDS.forEach(f => fetchFeed(f,a)) }}
                style={{ flex:1, padding:'4px 2px', borderRadius:5, border:`1px solid ${ano===a?G:'#e5e7eb'}`, background:ano===a?G:'#fff', color:ano===a?'#fff':'#6b7280', fontSize:11, fontWeight:600, cursor:'pointer', outline:'none' }}>{a}</button>
            ))}
          </div>
        </div>

        {/* Área */}
        <div style={{ padding:'6px 0', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'#9ca3af', padding:'4px 14px 5px' }}>ÁREA</div>
          {AREAS.map(a => {
            const cnt = a.id==='all' ? allNormas.length : allNormas.filter(n=>n.area===a.id).length
            return (
              <div key={a.id} onClick={() => setArea(a.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 14px', cursor:'pointer', color:area===a.id?G:'#6b7280', borderLeft:`2px solid ${area===a.id?G:'transparent'}`, background:area===a.id?'#f0fdf4':'transparent', fontSize:12.5, fontWeight:area===a.id?600:400, transition:'all .1s' }}>
                <span style={{ fontSize:11 }}>{a.ico}</span>
                <span style={{ flex:1 }}>{a.l}</span>
                {cnt > 0 && <span style={{ fontSize:9, fontFamily:'monospace', background:area===a.id?G:'#f3f4f6', color:area===a.id?'#fff':'#9ca3af', padding:'1px 5px', borderRadius:8 }}>{cnt}</span>}
              </div>
            )
          })}
        </div>

        {/* Urgência */}
        <div style={{ padding:'6px 0', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'#9ca3af', padding:'4px 14px 5px' }}>URGÊNCIA</div>
          {[{id:'critica',l:'Crítica',c:'#dc2626'},{id:'alta',l:'Alta',c:'#d97706'},{id:'normal',l:'Normal',c:G}].map(u => (
            <div key={u.id} onClick={() => setUrgF(urgFilt===u.id?'':u.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 14px', cursor:'pointer', color:urgFilt===u.id?u.c:'#6b7280', borderLeft:`2px solid ${urgFilt===u.id?u.c:'transparent'}`, background:urgFilt===u.id?u.c+'14':'transparent', fontSize:12.5, transition:'all .1s' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:u.c, flexShrink:0 }}/>
              <span style={{ flex:1 }}>{u.l}</span>
              {urgCnt[u.id] && <span style={{ fontSize:9, fontFamily:'monospace' }}>{urgCnt[u.id]}</span>}
            </div>
          ))}
        </div>

        {/* Assistente */}
        <div style={{ padding:'6px 0', flex:1 }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'#9ca3af', padding:'4px 14px 5px' }}>FERRAMENTAS</div>
          <div onClick={() => setChat(!chat)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 14px', cursor:'pointer', color:chat?G:'#6b7280', borderLeft:`2px solid ${chat?G:'transparent'}`, background:chat?'#f0fdf4':'transparent', fontSize:12.5, transition:'all .1s' }}>
            <span>🤖</span><span style={{ flex:1 }}>Assistente IA</span>
            <span style={{ fontSize:8, fontWeight:800, background:G, color:'#fff', padding:'1px 4px', borderRadius:2 }}>IA</span>
          </div>
        </div>

        {/* Status feed */}
        <div style={{ padding:'10px 14px', borderTop:'1px solid #f3f4f6', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:isLoading?'#d97706':hasErr?'#dc2626':G, flexShrink:0 }}/>
            <span style={{ fontSize:9.5, color:'#9ca3af', fontFamily:'monospace' }}>{isLoading?'Carregando…':hasErr?'Indisponível':`${fonteNormas.length} normas · ${ano}`}</span>
          </div>
        </div>
      </div>

      {/* ── Feed principal ───────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Barra de busca e filtros */}
        <div style={{ padding:'10px 16px', background:'#fff', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', gap:8, flexShrink:0, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:'7px 11px', flex:1, minWidth:180, boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
            <span style={{ color:'#9ca3af', fontSize:14 }}>⌕</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar normas, CADOCs, temas regulatórios…" style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:13, color:'#111827', fontFamily:'inherit' }}/>
            {q && <span onClick={()=>setQ('')} style={{ cursor:'pointer', color:'#9ca3af', fontSize:12 }}>✕</span>}
          </div>
          <button onClick={() => fetchAll(ano)} disabled={isLoading} style={{ padding:'8px 14px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:isLoading?'default':'pointer', fontSize:12, fontWeight:600, color:'#374151', outline:'none', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
            {isLoading ? <>⏳ Carregando…</> : <>↻ Atualizar Feed</>}
          </button>
        </div>

        {/* Pills de tipo */}
        <div style={{ padding:'7px 16px', background:'#fff', borderBottom:'1px solid #e5e7eb', display:'flex', gap:5, flexWrap:'wrap', flexShrink:0 }}>
          {tiposAll.map(t => {
            const cor = TIPO_COR[t]||'#6b7280'
            return (
              <button key={t} onClick={() => setTipos(p => p.includes(t)?p.filter(x=>x!==t):[...p,t])} style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:500, cursor:'pointer', outline:'none', border:`1px solid ${tipos.includes(t)?cor:'#e5e7eb'}`, background:tipos.includes(t)?cor:'#fff', color:tipos.includes(t)?'#fff':'#374151', transition:'all .12s' }}>{t}</button>
            )
          })}
          {tipos.length > 0 && <button onClick={()=>setTipos([])} style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, border:'1px solid #dc2626', cursor:'pointer', background:'#dc2626', color:'#fff', outline:'none' }}>✕ Limpar</button>}
        </div>

        {/* Feed */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
            <div>
              <h1 style={{ fontSize:17, fontWeight:800, color:'#111827', margin:'0 0 3px', letterSpacing:'-.4px' }}>
                {area==='all' ? 'Normas BCB/CMN Vigentes' : AREAS.find(a=>a.id===area)?.l}
              </h1>
              <span style={{ fontSize:11, color:'#9ca3af', fontFamily:'monospace' }}>
                {isLoading ? 'Buscando feeds ao vivo em bcb.gov.br…' : `${normas.length} normas no histórico · página ${paginaAtual}/${totalPaginas||1}`}
              </span>
            </div>
          </div>

          {/* Loading */}
          {isLoading && !allNormas.length && (
            <div style={{ padding:'60px', textAlign:'center', color:'#9ca3af' }}>
              <div style={{ width:32, height:32, border:`3px solid ${G}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 12px' }}/>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Buscando normas do BCB…</div>
              <div style={{ fontSize:11, fontFamily:'monospace' }}>bcb.gov.br/api/feed/app/normativos · {ano}</div>
            </div>
          )}

          {/* Erro */}
          {!isLoading && hasErr && (
            <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:'32px', textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>Feed BCB indisponível</div>
              <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.7, marginBottom:16, maxWidth:380, margin:'0 auto 16px' }}>
                As requisições ao BCB podem estar bloqueadas pelo sandbox.<br/>
                Abra o HTML original localmente para acesso direto ao RSS.<br/>
                O BCB serve com CORS aberto — funciona fora do sandbox.
              </div>
              <button onClick={() => fetchAll(ano)} style={{ padding:'9px 20px', borderRadius:8, border:'none', background:G, color:'#fff', fontSize:12.5, fontWeight:700, cursor:'pointer' }}>↻ Tentar novamente</button>
            </div>
          )}

          {/* Vazio */}
          {!isLoading && !hasErr && normas.length === 0 && (
            <div style={{ padding:'60px', textAlign:'center', color:'#9ca3af' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📄</div>
              <div style={{ fontSize:13, fontWeight:600 }}>Nenhuma norma encontrada</div>
              <div style={{ fontSize:12, marginTop:4 }}>Ajuste os filtros ou aguarde o carregamento.</div>
            </div>
          )}

          {/* Barra de paginação topo */}
          {normas.length > POR_PAGINA && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, padding:'6px 0' }}>
              <span style={{ fontSize:11, color:'#9ca3af' }}>
                Exibindo {(paginaAtual-1)*POR_PAGINA+1}–{Math.min(paginaAtual*POR_PAGINA,normas.length)} de {normas.length} normas
              </span>
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={()=>setPagina(1)} disabled={paginaAtual===1} style={{ padding:'3px 8px', borderRadius:5, border:'1px solid #e5e7eb', background:paginaAtual===1?'#f9fafb':'#fff', cursor:paginaAtual===1?'default':'pointer', fontSize:11, color:'#374151', outline:'none' }}>«</button>
                <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={paginaAtual===1} style={{ padding:'3px 10px', borderRadius:5, border:'1px solid #e5e7eb', background:paginaAtual===1?'#f9fafb':'#fff', cursor:paginaAtual===1?'default':'pointer', fontSize:11, color:'#374151', outline:'none' }}>‹ Anterior</button>
                {Array.from({length:Math.min(totalPaginas,7)},(_,i)=>{
                  let pg = i+1
                  if (totalPaginas > 7) {
                    if (paginaAtual <= 4) pg = i+1
                    else if (paginaAtual >= totalPaginas-3) pg = totalPaginas-6+i
                    else pg = paginaAtual-3+i
                  }
                  return (
                    <button key={pg} onClick={()=>setPagina(pg)} style={{ padding:'3px 9px', borderRadius:5, border:`1px solid ${pg===paginaAtual?G:'#e5e7eb'}`, background:pg===paginaAtual?G:'#fff', cursor:'pointer', fontSize:11, color:pg===paginaAtual?'#fff':'#374151', fontWeight:pg===paginaAtual?700:400, outline:'none' }}>{pg}</button>
                  )
                })}
                <button onClick={()=>setPagina(p=>Math.min(totalPaginas,p+1))} disabled={paginaAtual===totalPaginas} style={{ padding:'3px 10px', borderRadius:5, border:'1px solid #e5e7eb', background:paginaAtual===totalPaginas?'#f9fafb':'#fff', cursor:paginaAtual===totalPaginas?'default':'pointer', fontSize:11, color:'#374151', outline:'none' }}>Próxima ›</button>
                <button onClick={()=>setPagina(totalPaginas)} disabled={paginaAtual===totalPaginas} style={{ padding:'3px 8px', borderRadius:5, border:'1px solid #e5e7eb', background:paginaAtual===totalPaginas?'#f9fafb':'#fff', cursor:paginaAtual===totalPaginas?'default':'pointer', fontSize:11, color:'#374151', outline:'none' }}>»</button>
              </div>
              <button onClick={()=>{ if(confirm('Limpar todo o histórico de normas?')){ localStorage.removeItem('bm_normas_historico'); setHistorico([]) }}} style={{ fontSize:10, padding:'3px 9px', borderRadius:5, border:'1px solid #fee2e2', background:'#fff', color:'#dc2626', cursor:'pointer', outline:'none' }}>🗑 Limpar histórico</button>
            </div>
          )}

          {/* Cards de normas — página atual */}
          {normasPagina.map(n => {
            const cs = cards[n.id] || { open:false, tab:'analise' as const }
            const cor = TIPO_COR[n.tipo] || '#6b7280'
            const urgCor = n.urgencia==='critica'?'#dc2626':n.urgencia==='alta'?'#d97706':G
            return (
              <div key={n.id} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, marginBottom:8, overflow:'hidden', boxShadow:cs.open?'0 4px 16px rgba(0,0,0,.08)':'0 1px 3px rgba(0,0,0,.04)', borderLeft:`3px solid ${cs.open?cor:'transparent'}`, transition:'border-color .15s' }}>

                {/* Cabeçalho do card */}
                <div onClick={() => toggleCard(n.id)} style={{ padding:'12px 16px', cursor:'pointer', userSelect:'none' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#111827', lineHeight:1.5, marginBottom:7 }}>{n.titulo}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    <span style={{ padding:'2px 8px', borderRadius:4, fontSize:9.5, fontWeight:700, background:cor+'15', color:cor, border:`1px solid ${cor}35` }}>{n.tipo}</span>
                    {n.data_pub && <span style={{ fontSize:10, color:'#9ca3af', fontFamily:'monospace' }}>📅 {fmtData(n.data_pub)}</span>}
                    {n.numero && <span style={{ fontSize:10, color:'#9ca3af', fontFamily:'monospace' }}>#{n.numero}</span>}
                    {n.fonte && n.fonte !== 'BCB' && (
                      <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:3,
                        background: (FONTES_COR as any)[n.fonte]+'15',
                        color: (FONTES_COR as any)[n.fonte] || '#6b7280',
                        border:`1px solid ${(FONTES_COR as any)[n.fonte] || '#6b7280'}30` }}>
                        {n.fonte}
                      </span>
                    )}
                    <span style={{ fontSize:9.5, fontWeight:700, padding:'2px 8px', borderRadius:4, color:urgCor, background:urgCor+'12', border:`1px solid ${urgCor}30`, fontFamily:'monospace' }}>
                      {n.urgencia==='critica'?'⚠ CRÍTICA':n.urgencia==='alta'?'↑ ALTA':'● NORMAL'}
                    </span>
                    <span style={{ marginLeft:'auto', fontSize:12, color:'#d1d5db' }}>{cs.open ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Conteúdo expandido */}
                {cs.open && (
                  <div style={{ borderTop:'1px solid #f3f4f6' }}>
                    <div style={{ display:'flex', background:'#f9fafb', borderBottom:'1px solid #f3f4f6' }}>
                      {([['analise','🤖 Análise IA'],['resumo','📄 Resumo']] as [string,string][]).map(([t,l]) => (
                        <div key={t} onClick={() => setTab(n.id, t as any)} style={{ flex:1, padding:'9px 4px', textAlign:'center', fontSize:10.5, fontWeight:600, color:cs.tab===t?G:'#9ca3af', cursor:'pointer', borderBottom:cs.tab===t?`2px solid ${G}`:'2px solid transparent', marginBottom:-1, letterSpacing:'.4px', textTransform:'uppercase', userSelect:'none' }}>{l}</div>
                      ))}
                    </div>
                    <div style={{ padding:'14px 16px' }}>

                      {cs.tab === 'analise' && (
                        <div>
                          <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:12, marginBottom:10 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                              <span style={{ fontSize:9, letterSpacing:1, textTransform:'uppercase', fontFamily:'monospace', fontWeight:700, color:G, background:'#f0fdf4', padding:'2px 7px', borderRadius:3, border:'1px solid #bbf7d0' }}>Análise IA</span>
                              <span style={{ fontSize:10, color:'#9ca3af', fontFamily:'monospace' }}>Claude Sonnet 4.6</span>
                              {n.url && <a href={n.url} target="_blank" rel="noreferrer" style={{ marginLeft:'auto', fontSize:10.5, color:'#1d5fcc', textDecoration:'none', padding:'2px 8px', border:'1px solid #bfdbfe', borderRadius:4, background:'#eff6ff' }}>↗ Norma oficial BCB</a>}
                            </div>
                            {cs.loading ? (
                              <div style={{ display:'flex', gap:5, alignItems:'center', padding:'8px 0' }}>
                                {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:G, animation:`ald 1.2s ${i*.22}s infinite` }}/>)}
                                <span style={{ fontSize:11, color:'#9ca3af', marginLeft:6 }}>Analisando norma com IA…</span>
                              </div>
                            ) : cs.analise ? (
                              <div style={{ fontSize:12.5, color:'#111827', lineHeight:1.85, whiteSpace:'pre-wrap' }} dangerouslySetInnerHTML={{ __html: cs.analise.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>') }}/>
                            ) : (
                              <div style={{ fontSize:12, color:'#9ca3af' }}>Clique em "Gerar Análise" para uma análise contextualizada com IA.</div>
                            )}
                          </div>
                          {!cs.loading && !cs.analise && <button onClick={()=>analise(n)} style={{ padding:'8px 16px', background:G, color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:12.5, cursor:'pointer', outline:'none' }}>✦ Gerar Análise IA</button>}
                          {!cs.loading && cs.analise && <button onClick={()=>{setCards(p=>({...p,[n.id]:{...p[n.id],analise:undefined}}));analise(n)}} style={{ padding:'6px 12px', background:'none', color:G, border:`1px solid #bbf7d0`, borderRadius:6, fontSize:11, cursor:'pointer', outline:'none' }}>↻ Regenerar</button>}
                        </div>
                      )}

                      {cs.tab === 'resumo' && (
                        <div>
                          {n.resumo ? <p style={{ fontSize:12.5, color:'#374151', lineHeight:1.75, marginBottom:12 }}>{n.resumo}</p> : <p style={{ fontSize:12, color:'#9ca3af' }}>Resumo não disponível neste feed.</p>}
                          <div style={{ display:'flex', alignItems:'center', gap:7, paddingTop:10, borderTop:'1px solid #f3f4f6', flexWrap:'wrap' }}>
                            {n.data_pub && <span style={{ fontSize:10, fontFamily:'monospace', color:G, background:'#f0fdf4', border:'1px solid #bbf7d0', padding:'2px 7px', borderRadius:4 }}>✓ {fmtData(n.data_pub)}</span>}
                            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, background:'#f3f4f6', color:'#6b7280' }}>{n.tipo}</span>
                            {n.url && <a href={n.url} target="_blank" rel="noreferrer" style={{ marginLeft:'auto', fontSize:11, color:'#1d5fcc', textDecoration:'none' }}>↗ Ver no BCB</a>}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Paginação rodapé */}
          {normas.length > POR_PAGINA && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'16px 0 8px' }}>
              <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={paginaAtual===1} style={{ padding:'5px 14px', borderRadius:7, border:'1px solid #e5e7eb', background:paginaAtual===1?'#f9fafb':'#fff', cursor:paginaAtual===1?'default':'pointer', fontSize:12, color:'#374151', outline:'none' }}>‹ Anterior</button>
              <span style={{ fontSize:12, color:'#6b7280' }}>Página {paginaAtual} de {totalPaginas}</span>
              <button onClick={()=>setPagina(p=>Math.min(totalPaginas,p+1))} disabled={paginaAtual===totalPaginas} style={{ padding:'5px 14px', borderRadius:7, border:'1px solid #e5e7eb', background:paginaAtual===totalPaginas?'#f9fafb':'#fff', cursor:paginaAtual===totalPaginas?'default':'pointer', fontSize:12, color:'#374151', outline:'none' }}>Próxima ›</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat lateral ────────────────────────────────────────── */}
      {chat && (
        <div style={{ width:288, flexShrink:0, borderLeft:'1px solid #e5e7eb', background:'#fff', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>🤖 Assistente Regulatório</div>
              <div style={{ fontSize:10, color:'#9ca3af', marginTop:1 }}>Claude Sonnet 4.6 · BCB/CMN</div>
            </div>
            <button onClick={() => setChat(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:16, outline:'none' }}>✕</button>
          </div>
          {msgs.length === 0 && (
            <div style={{ padding:'12px 14px', flexShrink:0 }}>
              <div style={{ fontSize:10, color:'#9ca3af', marginBottom:8 }}>Perguntas sugeridas:</div>
              {['Quais CADOCs são obrigatórios para credenciadores?','O que muda com a Res. 522 para subcredenciadores?','CADOC 3044 substitui o 3040?','Capital mínimo para SCD com conta Pix?'].map(s => (
                <div key={s} onClick={() => setInp(s)} style={{ padding:'6px 10px', fontSize:11, color:'#374151', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:7, marginBottom:5, cursor:'pointer', lineHeight:1.5 }}>{s}</div>
              ))}
            </div>
          )}
          <div ref={chatEl} style={{ flex:1, overflowY:'auto', padding:'12px 14px' }}>
            {msgs.map((m,i) => (
              <div key={i} style={{ marginBottom:10, display:'flex', justifyContent:m.r==='user'?'flex-end':'flex-start' }}>
                <div style={{ maxWidth:'87%', padding:'9px 12px', borderRadius:m.r==='user'?'12px 12px 3px 12px':'12px 12px 12px 3px', background:m.r==='user'?G:'#f3f4f6', color:m.r==='user'?'#fff':'#111827', fontSize:12, lineHeight:1.65 }}
                  dangerouslySetInnerHTML={{ __html: m.c.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>') }}/>
              </div>
            ))}
            {busy && <div style={{ display:'flex', gap:4, padding:'6px 0' }}>{[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:G, animation:`ald 1.2s ${i*.2}s infinite` }}/>)}</div>}
          </div>
          <div style={{ padding:'10px 14px', borderTop:'1px solid #f3f4f6', display:'flex', gap:7, flexShrink:0 }}>
            <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Pergunte sobre normas BCB…" style={{ flex:1, padding:'8px 11px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:12, outline:'none', fontFamily:'inherit' }}/>
            <button onClick={send} disabled={busy||!inp.trim()} style={{ padding:'8px 13px', background:G, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, outline:'none', opacity:busy||!inp.trim()?.5:1 }}>→</button>
          </div>
        </div>
      )}

      <style>{`@keyframes ald{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.2)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
