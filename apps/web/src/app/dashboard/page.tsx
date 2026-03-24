'use client'
import { useState, useEffect } from 'react'

const C = { grn:'#0a7c5c',grnb:'rgba(10,124,92,.08)',grnbrd:'rgba(10,124,92,.2)',txt:'#0d1117',txt2:'#1e3a5f',txt3:'#5a6e8a',bg:'#f5f6f8',bg2:'#fff',bg3:'#eef0f3',brd:'#dde1e9',blu:'#1d5fcc',blub:'rgba(29,95,204,.08)',blubrd:'rgba(29,95,204,.18)',amb:'#b45309',ambb:'rgba(180,83,9,.08)',ambbrd:'rgba(180,83,9,.2)',red:'#c0392b',redb:'rgba(192,57,43,.06)',redbrd:'rgba(192,57,43,.18)',cyn:'#0e7490',pnk:'#7c3aed' }

const CADOC_CALENDAR = [
  {cod:'3040',nome:'SCR Dados de Crédito',per:'mensal',dias:5},
  {cod:'3044',nome:'SCR Eventos de Crédito',per:'por evento',dias:2},
  {cod:'3060',nome:'SCR Taxas de Juros',per:'semanal',dias:5},
  {cod:'4010',nome:'Balancete COSIF',per:'mensal',dias:9},
  {cod:'6334',nome:'Cartões Credenciadores',per:'trimestral',dias:67},
  {cod:'2055',nome:'Contas de Pagamento',per:'trimestral',dias:67},
]

const NORMAS_URGENTES = [
  {titulo:'Res. BCB 403/2025 — CADOC 3044 Fase 2',urgencia:'critica',tags:['CADOC 3044'],prazo:'Mai/2026'},
  {titulo:'Res. BCB 522/2025 — Subcredenciadores Liquidação',urgencia:'critica',tags:['SPB'],prazo:'Dez/2026'},
  {titulo:'Res. BCB 411/2025 — Pix Parcelado e Garantido',urgencia:'alta',tags:['Pix'],prazo:'Out/2026'},
  {titulo:'IN BCB 510/2025 — Open Finance Fase 4',urgencia:'alta',tags:['Open Finance'],prazo:'Jan/2026'},
]

export default function DashboardPage() {
  const [nome, setNome] = useState('Sua Instituição')
  const [tipo, setTipo] = useState('')
  const now = new Date()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNome(localStorage.getItem('bm_nome') || 'Sua Instituição')
      setTipo(localStorage.getItem('bm_tipo') || '')
    }
  }, [])

  const calcPrazo = (diasApos: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, diasApos)
    const dias = Math.ceil((d.getTime() - now.getTime()) / (1000*60*60*24))
    return { label: d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}), dias }
  }

  const vencidos = CADOC_CALENDAR.filter(c => calcPrazo(c.dias).dias < 0).length
  const urgentes = CADOC_CALENDAR.filter(c => { const {dias}=calcPrazo(c.dias); return dias>=0&&dias<=7 }).length
  const semaforo = vencidos>0?'critico':urgentes>0?'atencao':'ok'
  const stC = semaforo==='critico'?C.red:semaforo==='atencao'?C.amb:C.grn
  const stL = semaforo==='critico'?'🔴 CRÍTICO':semaforo==='atencao'?'🟡 ATENÇÃO':'🟢 OK'

  const kpis = [
    {l:'Status Geral',v:stL,c:stC,href:'/dashboard/entregas'},
    {l:'CADOCs Monitorados',v:String(CADOC_CALENDAR.length),c:C.blu,href:'/dashboard/entregas'},
    {l:'Vencidos',v:String(vencidos),c:vencidos>0?C.red:C.grn,href:'/dashboard/entregas'},
    {l:'Urgentes ≤7d',v:String(urgentes),c:urgentes>0?C.amb:C.grn,href:'/dashboard/entregas'},
    {l:'Normas Críticas',v:'2',c:C.red,href:'/dashboard/normas'},
  ]

  const shortcuts = [
    {ico:'⚙️',l:'Gerar CADOC',desc:'Geração & Validação',href:'/dashboard/cadocs',c:C.pnk},
    {ico:'📅',l:'Entregas',desc:'Calendário regulatório',href:'/dashboard/entregas',c:C.cyn},
    {ico:'📋',l:'Normas BCB',desc:'Feed + Análise IA',href:'/dashboard/normas',c:C.grn},
    {ico:'💳',l:'Meios de Pagamento',desc:'CADOC matrix por IF',href:'/dashboard/pagamentos',c:C.amb},
    {ico:'🔗',l:'Links Úteis',desc:'Portais regulatórios',href:'/dashboard/links',c:C.blu},
    {ico:'🔧',l:'Configurações',desc:'API key e dados da IF',href:'/dashboard/settings',c:C.txt3},
  ]

  return (
    <div style={{ padding:'24px 28px', overflowY:'auto', height:'100%', background:C.bg }}>
      {/* Header */}
      <div style={{ marginBottom:20, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:C.txt, marginBottom:3, letterSpacing:'-.4px' }}>
            Dashboard Executivo
          </h1>
          <p style={{ fontSize:12, color:C.txt3 }}>
            {nome}{tipo && <> · <span style={{ color:C.txt2 }}>{tipo}</span></>} · {now.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:stC+'12', border:`1px solid ${stC}40`, borderRadius:8 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:stC, animation:'pulse 2.5s infinite' }}/>
          <span style={{ fontSize:11, fontWeight:700, color:stC, fontFamily:'monospace' }}>{stL}</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:20 }}>
        {kpis.map(k=>(
          <a key={k.l} href={k.href} style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, padding:'14px 16px', borderTop:`3px solid ${k.c}`, textDecoration:'none', display:'block', transition:'all .15s' }}
>
            <div style={{ fontSize:20, fontWeight:900, color:k.c, fontFamily:'monospace', marginBottom:4 }}>{k.v}</div>
            <div style={{ fontSize:10, color:C.txt3 }}>{k.l}</div>
          </a>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {/* Próximos vencimentos */}
        <div style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.txt }}>⏰ Próximos Vencimentos</span>
            <a href="/dashboard/entregas" style={{ fontSize:10, color:C.blu, textDecoration:'none', fontWeight:600 }}>Ver todos →</a>
          </div>
          <div>
            {CADOC_CALENDAR.map((c,i)=>{
              const {label,dias} = calcPrazo(c.dias)
              const col = dias<0?C.red:dias<=7?C.amb:dias<=30?C.cyn:C.grn
              return (
                <div key={c.cod+i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 16px', borderBottom:i<CADOC_CALENDAR.length-1?`1px solid #f5f5f5`:'none', borderLeft:`3px solid ${col}` }}>
                  <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:C.txt, minWidth:40 }}>{c.cod}</span>
                  <span style={{ fontSize:10.5, color:C.txt2, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nome}</span>
                  <span style={{ fontSize:9, fontFamily:'monospace', color:col, fontWeight:700, whiteSpace:'nowrap' }}>{label} ({dias>0?'+':''}{dias}d)</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Normas urgentes */}
        <div style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.txt }}>⚠️ Normas com Impacto Imediato</span>
            <a href="/dashboard/normas" style={{ fontSize:10, color:C.blu, textDecoration:'none', fontWeight:600 }}>Ver feed →</a>
          </div>
          <div>
            {NORMAS_URGENTES.map((n,i)=>{
              const uc = n.urgencia==='critica'?C.red:C.amb
              return (
                <div key={i} style={{ padding:'9px 16px', borderBottom:i<NORMAS_URGENTES.length-1?`1px solid #f5f5f5`:'none', borderLeft:`3px solid ${uc}` }}>
                  <div style={{ fontSize:11, fontWeight:600, color:C.txt, marginBottom:3, lineHeight:1.4 }}>{n.titulo}</div>
                  <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontSize:8.5, fontWeight:700, padding:'1px 5px', borderRadius:3, background:uc+'15', color:uc, fontFamily:'monospace' }}>{n.urgencia.toUpperCase()}</span>
                    {n.tags.map(t=><span key={t} style={{ fontSize:9, padding:'1px 5px', borderRadius:3, background:C.bg3, color:C.txt2 }}>{t}</span>)}
                    <span style={{ fontSize:9, color:C.txt3, fontFamily:'monospace', marginLeft:'auto' }}>⏱ {n.prazo}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick access */}
      <div style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, overflow:'hidden', marginBottom:16 }}>
        <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.brd}`, fontSize:12, fontWeight:700, color:C.txt }}>🚀 Acesso Rápido</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:0 }}>
          {shortcuts.map((s,i)=>(
            <a key={s.l} href={s.href} style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'16px 12px', textDecoration:'none', borderRight:i<shortcuts.length-1?`1px solid ${C.brd}`:'none', transition:'background .15s', background:'transparent', textAlign:'center' }}
>
              <div style={{ fontSize:22, marginBottom:6 }}>{s.ico}</div>
              <div style={{ fontSize:11, fontWeight:700, color:C.txt, marginBottom:2 }}>{s.l}</div>
              <div style={{ fontSize:9.5, color:C.txt3, lineHeight:1.4 }}>{s.desc}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Coverage score */}
      <div style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, padding:'16px 20px', display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:28, fontWeight:900, color:stC, fontFamily:'monospace' }}>{Math.round(((CADOC_CALENDAR.length-vencidos)/CADOC_CALENDAR.length)*100)}%</div>
          <div style={{ fontSize:9, color:C.txt3 }}>Score de Cobertura</div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ height:8, background:C.bg3, borderRadius:4, overflow:'hidden', marginBottom:6 }}>
            <div style={{ height:'100%', width:`${Math.round(((CADOC_CALENDAR.length-vencidos)/CADOC_CALENDAR.length)*100)}%`, background:stC, borderRadius:4, transition:'width .5s' }}/>
          </div>
          <div style={{ fontSize:10, color:C.txt3 }}>{CADOC_CALENDAR.length-vencidos} de {CADOC_CALENDAR.length} CADOCs monitorados em conformidade</div>
        </div>
        <a href="/dashboard/settings" style={{ padding:'8px 16px', borderRadius:7, border:`1px solid ${C.brd}`, background:'transparent', color:C.txt2, fontSize:11, fontWeight:600, textDecoration:'none', whiteSpace:'nowrap' }}>
          {!tipo ? '⚙ Configurar IF →' : '⚙ Configurações'}
        </a>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.7)}}`}</style>
    </div>
  )
}
