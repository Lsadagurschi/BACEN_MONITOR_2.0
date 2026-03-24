'use client'
import { useState, useMemo } from 'react'

const C = { grn:'#0a7c5c',grnb:'rgba(10,124,92,.08)',grnbrd:'rgba(10,124,92,.2)',txt:'#0d1117',txt2:'#1e3a5f',txt3:'#5a6e8a',bg:'#f5f6f8',bg2:'#fff',bg3:'#eef0f3',brd:'#dde1e9',brd2:'#c8cdd8',blu:'#1d5fcc',blub:'rgba(29,95,204,.08)',blubrd:'rgba(29,95,204,.18)',amb:'#b45309',ambb:'rgba(180,83,9,.08)',ambbrd:'rgba(180,83,9,.2)',red:'#c0392b',redb:'rgba(192,57,43,.06)',redbrd:'rgba(192,57,43,.18)',cyn:'#0e7490',cynb:'rgba(14,116,144,.06)',cynbrd:'rgba(14,116,144,.18)' }

// Calendário de CADOCs — baseado no HTML original
const CADOC_CALENDAR = [
  {cod:'6334',nome:'Cartões Credenciadores (ASPB034)',per:'trimestral',quem:'Credenciadores',arq:'BACEN.ZIP (10 TXTs)',area:'pagamentos'},
  {cod:'2050',nome:'Arranjos de Pagamento',per:'trimestral',quem:'IPs e Arranjos',arq:'XML',area:'pagamentos'},
  {cod:'2055',nome:'Contas de Pagamento',per:'trimestral',quem:'IPs com contas',arq:'XML',area:'pagamentos'},
  {cod:'3040',nome:'SCR Dados Individualizados de Crédito',per:'mensal',quem:'IF com carteira de crédito',arq:'XML',area:'crédito'},
  {cod:'3044',nome:'SCR Eventos de Crédito',per:'por evento',quem:'IF com carteira de crédito',arq:'JSON',area:'crédito'},
  {cod:'3060',nome:'SCR Taxas de Juros',per:'semanal',quem:'IF com carteira de crédito',arq:'XML',area:'crédito'},
  {cod:'4010',nome:'Balancete COSIF',per:'mensal',quem:'Todas as IFs',arq:'XML',area:'contabilidade'},
  {cod:'2010',nome:'Patrimônio de Referência',per:'mensal',quem:'Bancos e IFs sujeitas ao PR',arq:'XML',area:'capital'},
  {cod:'2020',nome:'Adequação do Capital — RWA',per:'mensal',quem:'IF sujeitas a Basileia',arq:'XML',area:'capital'},
  {cod:'7011',nome:'Open Finance — Dados Cadastrais',per:'mensal',quem:'IFs participantes Open Finance',arq:'JSON API',area:'tecnologia'},
]

function calcPrazo(cod: string, per: string): { prazo: Date; label: string } {
  const now = new Date()
  let prazo = new Date()
  if (per === 'mensal') { prazo = new Date(now.getFullYear(), now.getMonth() + 1, cod === '4010' ? 9 : 5) }
  else if (per === 'trimestral') { const q = Math.ceil((now.getMonth()+1)/3); prazo = new Date(now.getFullYear(), q*3, 30) }
  else if (per === 'semanal') { prazo = new Date(now); prazo.setDate(prazo.getDate() + (5 - prazo.getDay() + 7) % 7 + 5) }
  else { prazo = new Date(now); prazo.setDate(prazo.getDate() + 2) }
  const dias = Math.ceil((prazo.getTime() - now.getTime()) / (1000*60*60*24))
  return { prazo, label: prazo.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'}) + ` (${dias > 0 ? '+' + dias : dias}d)` }
}

export default function EntregasPage() {
  const [tab, setTab] = useState<'dashboard'|'calendario'|'historico'>('dashboard')
  const [filtroArea, setFiltroArea] = useState('todos')

  const now = new Date()
  const cadocsComPrazo = CADOC_CALENDAR.map(c => {
    const { prazo, label } = calcPrazo(c.cod, c.per)
    const dias = Math.ceil((prazo.getTime() - now.getTime()) / (1000*60*60*24))
    return { ...c, prazo, prazolabel: label, dias }
  }).sort((a,b) => a.prazo.getTime() - b.prazo.getTime())

  const vencidos  = cadocsComPrazo.filter(c => c.dias < 0)
  const urgentes  = cadocsComPrazo.filter(c => c.dias >= 0 && c.dias <= 7)
  const proximos  = cadocsComPrazo.filter(c => c.dias > 7 && c.dias <= 30)
  const noPrazo   = cadocsComPrazo.filter(c => c.dias > 30)

  const semaforo = vencidos.length > 0 ? 'critico' : urgentes.length > 0 ? 'atencao' : 'ok'
  const stC = semaforo === 'critico' ? C.red : semaforo === 'atencao' ? C.amb : C.grn
  const stL = semaforo === 'critico' ? '🔴 CRÍTICO' : semaforo === 'atencao' ? '🟡 ATENÇÃO' : '🟢 OK'

  const areas = ['todos', ...new Set(CADOC_CALENDAR.map(c => c.area))]
  const filtrado = filtroArea === 'todos' ? cadocsComPrazo : cadocsComPrazo.filter(c => c.area === filtroArea)

  const tabStyle = (t: string) => ({
    padding:'7px 14px', cursor:'pointer', border:'none', background:'transparent',
    fontSize:11, fontWeight:600, letterSpacing:'.3px', textTransform:'uppercase' as const,
    color: tab === t ? C.grn : C.txt3,
    borderBottom: tab === t ? `2px solid ${C.grn}` : '2px solid transparent',
    outline:'none'
  })

  const rowStatus = (dias: number) => {
    if (dias < 0) return { bg:'rgba(192,57,43,.04)', left:C.red, badge:{bg:'#fef2f2',color:C.red,txt:`${Math.abs(dias)}d atraso`} }
    if (dias <= 7) return { bg:'rgba(180,83,9,.04)', left:C.amb, badge:{bg:'#fffbeb',color:C.amb,txt:`${dias}d`} }
    if (dias <= 30) return { bg:'rgba(14,116,144,.04)', left:C.cyn, badge:{bg:'#ecfeff',color:C.cyn,txt:`${dias}d`} }
    return { bg:'transparent', left:'transparent', badge:{bg:'#f0fdf4',color:C.grn,txt:`${dias}d`} }
  }

  return (
    <div style={{ padding:'20px 24px', height:'100%', overflowY:'auto', background:C.bg }}>
      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontSize:18, fontWeight:800, color:C.txt, marginBottom:4 }}>📅 Entregas Regulatórias</h1>
        <p style={{ fontSize:12, color:C.txt3 }}>Calendário de vencimentos, status de entregas e dashboard executivo.</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', background:C.bg2, borderRadius:10, overflow:'hidden', marginBottom:16, border:`1px solid ${C.brd}` }}>
        <div style={{ display:'flex', borderBottom:`1px solid ${C.brd}`, width:'100%' }}>
          {(['dashboard','calendario','historico'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={tabStyle(t)}>
              {t === 'dashboard' ? '📊 Dashboard' : t === 'calendario' ? '📅 Calendário' : '📋 Histórico'}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD */}
      {tab === 'dashboard' && (
        <div>
          {/* KPI row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
            {([
              { l:'Status Geral', v:stL, c:stC },
              { l:'Vencidos', v:String(vencidos.length), c:vencidos.length>0?C.red:C.grn },
              { l:'Urgentes ≤7d', v:String(urgentes.length), c:urgentes.length>0?C.amb:C.grn },
              { l:'Próximos 30d', v:String(proximos.length), c:C.cyn },
              { l:'Total CADOCs', v:String(CADOC_CALENDAR.length), c:C.blu },
            ] as {l:string,v:string,c:string}[]).map(k=>(
              <div key={k.l} style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, padding:'14px 16px', borderTop:`3px solid ${k.c}` }}>
                <div style={{ fontSize:18, fontWeight:900, color:k.c, fontFamily:'monospace', marginBottom:3 }}>{k.v}</div>
                <div style={{ fontSize:10, color:C.txt3 }}>{k.l}</div>
              </div>
            ))}
          </div>

          {/* Cobertura */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            {/* Próximos vencimentos */}
            <div style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.brd}`, fontSize:11, fontWeight:700, color:C.txt }}>⏰ Próximos Vencimentos (30d)</div>
              <div>
                {[...vencidos, ...urgentes, ...proximos].slice(0,6).map((c,i)=>{
                  const st = rowStatus(c.dias)
                  return (
                    <div key={c.cod+i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderBottom:`1px solid #f5f5f5`, borderLeft:`3px solid ${st.left}` }}>
                      <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:C.txt, minWidth:42 }}>{c.cod}</span>
                      <span style={{ fontSize:10.5, color:C.txt2, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nome}</span>
                      <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:3, background:st.badge.bg, color:st.badge.color, fontFamily:'monospace', whiteSpace:'nowrap' }}>{st.badge.txt}</span>
                    </div>
                  )
                })}
                {vencidos.length === 0 && urgentes.length === 0 && proximos.length === 0 && (
                  <div style={{ padding:'20px', textAlign:'center', fontSize:11, color:C.txt3 }}>✓ Nenhum vencimento crítico nos próximos 30 dias</div>
                )}
              </div>
            </div>

            {/* Por periodicidade */}
            <div style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.brd}`, fontSize:11, fontWeight:700, color:C.txt }}>📋 CADOCs por Periodicidade</div>
              <div style={{ padding:'12px 14px' }}>
                {[['mensal','Mensais',C.blu],['trimestral','Trimestrais',C.cyn],['semanal','Semanais',C.grn],['por evento','Por Evento',C.amb]].map(([per,label,color])=>{
                  const cnt = CADOC_CALENDAR.filter(c=>c.per===per).length
                  if (!cnt) return null
                  return (
                    <div key={per as string} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <div style={{ width:32, height:32, borderRadius:7, background:color+'18', border:`1px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, color:color as string, fontFamily:'monospace' }}>{cnt}</div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:C.txt }}>{label as string}</div>
                        <div style={{ fontSize:10, color:C.txt3 }}>{CADOC_CALENDAR.filter(c=>c.per===per).map(c=>c.cod).join(' · ')}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Score */}
          <div style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, padding:'16px 20px', display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:32, fontWeight:900, color:stC, fontFamily:'monospace' }}>{Math.round(((CADOC_CALENDAR.length - vencidos.length) / CADOC_CALENDAR.length) * 100)}%</div>
              <div style={{ fontSize:10, color:C.txt3 }}>Score de Cobertura</div>
            </div>
            <div style={{ flex:1, height:8, background:C.bg3, borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.round(((CADOC_CALENDAR.length - vencidos.length) / CADOC_CALENDAR.length) * 100)}%`, background:stC, borderRadius:4, transition:'width .5s' }}/>
            </div>
            <div style={{ fontSize:11, color:C.txt3 }}>{CADOC_CALENDAR.length - vencidos.length} de {CADOC_CALENDAR.length} CADOCs em dia</div>
          </div>
        </div>
      )}

      {/* CALENDÁRIO */}
      {tab === 'calendario' && (
        <div>
          {/* Filtro área */}
          <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
            {areas.map(a=>(
              <button key={a} onClick={()=>setFiltroArea(a)} style={{
                padding:'4px 12px', borderRadius:20, fontSize:10, fontWeight:600, cursor:'pointer',
                border:`1px solid ${filtroArea===a?C.grn:C.brd}`,
                background: filtroArea===a?C.grn:'#fff',
                color: filtroArea===a?'#fff':C.txt2, outline:'none',
                textTransform:'capitalize'
              }}>{a}</button>
            ))}
          </div>

          <div style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#f9fafb' }}>
                  {['CADOC','Documento','Responsável','Periodicidade','Arquivo','Prazo','Dias'].map(h=>(
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:9, fontWeight:600, color:C.txt3, letterSpacing:'.5px', textTransform:'uppercase', borderBottom:`1px solid ${C.brd}`, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrado.map((c,i)=>{
                  const st = rowStatus(c.dias)
                  return (
                    <tr key={c.cod+i} style={{ borderTop:`1px solid #f5f5f5`, borderLeft:`3px solid ${st.left}`, background:st.bg }}>
                      <td style={{ padding:'9px 12px', fontFamily:'monospace', fontWeight:700, fontSize:12, color:C.txt }}>{c.cod}</td>
                      <td style={{ padding:'9px 12px', color:C.txt2, fontSize:11 }}>{c.nome}</td>
                      <td style={{ padding:'9px 12px', fontSize:10, color:C.txt3 }}>{c.quem}</td>
                      <td style={{ padding:'9px 12px', fontSize:10, fontFamily:'monospace', color:C.txt3, textTransform:'capitalize' }}>{c.per}</td>
                      <td style={{ padding:'9px 12px', fontSize:10, fontFamily:'monospace', color:C.txt3 }}>{c.arq}</td>
                      <td style={{ padding:'9px 12px', fontSize:10, fontFamily:'monospace', color:C.txt3, whiteSpace:'nowrap' }}>{c.prazolabel.split(' ')[0]}</td>
                      <td style={{ padding:'9px 12px' }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4, fontFamily:'monospace', background:st.badge.bg, color:st.badge.color, border:`1px solid ${st.badge.color}40` }}>
                          {c.dias < 0 ? `${Math.abs(c.dias)}d atraso` : `+${c.dias}d`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HISTÓRICO */}
      {tab === 'historico' && (
        <div style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, padding:'32px', textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:14, fontWeight:700, color:C.txt, marginBottom:6 }}>Histórico de Entregas</div>
          <div style={{ fontSize:12, color:C.txt3, lineHeight:1.7, maxWidth:420, margin:'0 auto' }}>
            O histórico de entregas registra automaticamente cada arquivo gerado e validado na aba CADOCs.<br/>
            Gere seu primeiro arquivo para ver o registro aqui.
          </div>
          <a href="/dashboard/cadocs" style={{ display:'inline-block', marginTop:16, padding:'9px 20px', background:C.grn, color:'#fff', borderRadius:8, textDecoration:'none', fontSize:12, fontWeight:700 }}>
            Ir para CADOCs →
          </a>
        </div>
      )}
    </div>
  )
}
