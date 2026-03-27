'use client'
import { useState } from 'react'

const CADOCS = [
  { cod:'3040', nome:'SCR — Dados Individualizados de Crédito',  per:'Mensal',     prazoDesc:'D+18 do mês seguinte',      duMes:18, area:'crédito',       quem:'IFs com carteira de crédito',   arq:'XML via STA'        },
  { cod:'3044', nome:'SCR — Eventos de Crédito',                per:'Por evento', prazoDesc:'D+5 dias úteis do evento',  duMes:5,  area:'crédito',       quem:'IFs com carteira de crédito',   arq:'JSON via STA'       },
  { cod:'3060', nome:'SCR — Taxas de Juros',                    per:'Semanal',    prazoDesc:'D+5 dias úteis da semana',  duMes:5,  area:'crédito',       quem:'IFs com carteira de crédito',   arq:'XML via STA'        },
  { cod:'4010', nome:'Balancete Patrimonial — COSIF',           per:'Mensal',     prazoDesc:'9º dia útil do mês seguinte', duMes:9, area:'contabilidade', quem:'Todas as IFs autorizadas',      arq:'XML via STA'        },
  { cod:'2055', nome:'Pix — Informações Operacionais',          per:'Mensal',     prazoDesc:'Dia 10 do mês seguinte',    duMes:10, area:'pagamentos',    quem:'Participantes diretos do Pix',  arq:'TXT via STA'        },
  { cod:'2010', nome:'Patrimônio de Referência — PR/RWA',       per:'Mensal',     prazoDesc:'9º dia útil do mês seguinte', duMes:9, area:'capital',     quem:'Bancos S1-S3 e SCDs',           arq:'XML via STA'        },
  { cod:'6334', nome:'Cartões — Credenciadores (ASPB034)',       per:'Trimestral', prazoDesc:'Último DU do mês seguinte ao trim.', duMes:90, area:'pagamentos', quem:'Credenciadores/Adquirentes', arq:'10 TXTs — BACEN.ZIP' },
  { cod:'2050', nome:'Arranjos de Pagamento',                   per:'Trimestral', prazoDesc:'Último DU do mês seguinte ao trim.', duMes:90, area:'pagamentos', quem:'Instituidores de arranjo',  arq:'XML via STA'        },
  { cod:'7011', nome:'Open Finance — Dados Cadastrais',         per:'Mensal',     prazoDesc:'Dia 5 do mês seguinte',     duMes:5,  area:'tecnologia',    quem:'IFs participantes Open Finance', arq:'API REST'           },
  { cod:'C212', nome:'Serviços de Ativos Virtuais',             per:'Mensal',     prazoDesc:'A partir de mai/2026',      duMes:30, area:'câmbio',        quem:'PSAVs autorizadas',             arq:'XML via STA'        },
]

const AREAS_CAL = ['todos','crédito','contabilidade','pagamentos','capital','tecnologia','câmbio']

function getDias(duMes: number) {
  const now = new Date()
  const alvo = new Date(now.getFullYear(), now.getMonth() + 1, duMes)
  return Math.ceil((alvo.getTime() - now.getTime()) / 86400000)
}

function prazoLabel(d: number) {
  const alvo = new Date()
  alvo.setDate(alvo.getDate() + Math.max(d, 0))
  return alvo.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })
}

function statusSt(d: number) {
  if (d < 0)   return { cor:'#dc2626', bg:'#fef2f2', brd:'#fecaca', txt:Math.abs(d)+'d atraso', leftC:'#dc2626' }
  if (d <= 7)  return { cor:'#d97706', bg:'#fffbeb', brd:'#fde68a', txt:'+'+d+'d',              leftC:'#d97706' }
  if (d <= 30) return { cor:'#0891b2', bg:'#ecfeff', brd:'#a5f3fc', txt:'+'+d+'d',              leftC:'#0891b2' }
  return               { cor:'#16a34a', bg:'#f0fdf4', brd:'#bbf7d0', txt:'+'+d+'d',             leftC:'#16a34a' }
}

export default function EntregasPage() {
  const [view, setView]   = useState<'dash'|'cal'>('dash')
  const [filtro, setFiltro] = useState('todos')

  const withDias = CADOCS.map(c => ({ ...c, dias:getDias(c.duMes), prazoLabel:prazoLabel(getDias(c.duMes)) }))
    .sort((a,b) => a.dias - b.dias)

  const vencidos  = withDias.filter(c => c.dias < 0)
  const urgentes  = withDias.filter(c => c.dias >= 0 && c.dias <= 7)
  const proximos  = withDias.filter(c => c.dias > 7 && c.dias <= 30)
  const emDia     = withDias.filter(c => c.dias > 30)
  const score     = Math.round(((CADOCS.length - vencidos.length) / CADOCS.length) * 100)
  const scoreCor  = vencidos.length > 0 ? '#dc2626' : urgentes.length > 0 ? '#d97706' : '#16a34a'
  const filtrado  = filtro === 'todos' ? withDias : withDias.filter(c => c.area === filtro)

  const tabSt = (t: string): React.CSSProperties => ({
    padding:'8px 18px', cursor:'pointer', border:'none', outline:'none', background:'transparent',
    fontSize:12.5, fontWeight:600, color:view===t?'#0d6e52':'#6b7280',
    borderBottom:view===t?'2px solid #0d6e52':'2px solid transparent',
  })

  return (
    <div style={{ padding:'24px 28px', minHeight:'100%', background:'#f1f3f7' }}>
      <div style={{ marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'#111827', margin:'0 0 4px', letterSpacing:'-.4px' }}>⊡ Entregas Regulatórias</h1>
          <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>Calendário BCB — prazos calculados dinamicamente</p>
        </div>
        <a href="/dashboard/cadocs" style={{ padding:'9px 18px', borderRadius:9, textDecoration:'none', background:'linear-gradient(135deg,#0d6e52,#1248a0)', color:'#fff', fontSize:12.5, fontWeight:700 }}>+ Gerar CADOC</a>
      </div>

      {/* Abas */}
      <div style={{ background:'#fff', borderRadius:'12px 12px 0 0', border:'1px solid #e5e7eb', borderBottom:'none', display:'flex', marginBottom:0 }}>
        <button onClick={() => setView('dash')} style={tabSt('dash')}>📊 Dashboard Executivo</button>
        <button onClick={() => setView('cal')}  style={tabSt('cal')}>📅 Calendário de Prazos</button>
      </div>
      <div style={{ background:'#fff', borderRadius:'0 0 12px 12px', border:'1px solid #e5e7eb', padding:22 }}>

        {view === 'dash' && (
          <div>
            {/* KPIs */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
              {[
                {l:'Score',         v:score+'%',                   c:scoreCor },
                {l:'Total CADOCs',  v:String(CADOCS.length),       c:'#1d4ed8'},
                {l:'Vencidos',      v:String(vencidos.length),     c:vencidos.length>0?'#dc2626':'#16a34a'},
                {l:'Urgentes ≤7d',  v:String(urgentes.length),     c:urgentes.length>0?'#d97706':'#16a34a'},
                {l:'Em dia >30d',   v:String(emDia.length),        c:'#16a34a'},
              ].map(k => (
                <div key={k.l} style={{ padding:'14px 16px', borderRadius:10, background:k.c+'0e', border:`1px solid ${k.c}22`, textAlign:'center' }}>
                  <div style={{ fontSize:24, fontWeight:900, color:k.c, fontFamily:'monospace', letterSpacing:'-1px' }}>{k.v}</div>
                  <div style={{ fontSize:10, color:'#6b7280', marginTop:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'.3px' }}>{k.l}</div>
                </div>
              ))}
            </div>

            {/* Barra de score */}
            <div style={{ padding:'14px 18px', background:'#f9fafb', borderRadius:10, border:'1px solid #f3f4f6', marginBottom:20, display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ fontSize:30, fontWeight:900, color:scoreCor, fontFamily:'monospace', minWidth:68, letterSpacing:'-2px' }}>{score}%</div>
              <div style={{ flex:1 }}>
                <div style={{ height:8, background:'#e5e7eb', borderRadius:8, overflow:'hidden', marginBottom:6 }}>
                  <div style={{ height:'100%', width:score+'%', background:`linear-gradient(90deg,${scoreCor},${scoreCor}90)`, borderRadius:8, transition:'width .5s' }}/>
                </div>
                <div style={{ fontSize:11.5, color:'#6b7280' }}>{CADOCS.length - vencidos.length} de {CADOCS.length} CADOCs dentro do prazo regulatório</div>
              </div>
            </div>

            {/* Quatro grupos */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[
                {title:'🔴 Vencidos', items:vencidos, cor:'#dc2626', bg:'#fef2f2'},
                {title:'🟡 Urgentes (≤7 dias)', items:urgentes, cor:'#d97706', bg:'#fffbeb'},
                {title:'🔵 Próximos 30 dias', items:proximos, cor:'#0891b2', bg:'#ecfeff'},
                {title:'🟢 Em dia (>30 dias)', items:emDia, cor:'#16a34a', bg:'#f0fdf4'},
              ].map(g => (
                <div key={g.title} style={{ borderRadius:10, border:`1px solid ${g.cor}28`, overflow:'hidden' }}>
                  <div style={{ padding:'9px 14px', background:g.bg, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12.5, fontWeight:700, color:g.cor }}>{g.title}</span>
                    <span style={{ fontSize:10, fontFamily:'monospace', fontWeight:700, color:g.cor }}>{g.items.length}</span>
                  </div>
                  <div>
                    {g.items.length === 0 ? (
                      <div style={{ padding:'12px 14px', fontSize:12, color:'#9ca3af', textAlign:'center' }}>Nenhum</div>
                    ) : g.items.map((c,i) => (
                      <div key={c.cod} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderTop:i>0?'1px solid #f9fafb':'none' }}>
                        <span style={{ fontFamily:'monospace', fontSize:11.5, fontWeight:800, color:g.cor, minWidth:38 }}>{c.cod}</span>
                        <span style={{ fontSize:12, color:'#374151', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nome}</span>
                        <span style={{ fontSize:10, color:g.cor, fontFamily:'monospace', fontWeight:700, whiteSpace:'nowrap' }}>{c.prazoLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'cal' && (
          <div>
            {/* Filtro área */}
            <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
              {AREAS_CAL.map(a => (
                <button key={a} onClick={() => setFiltro(a)} style={{ padding:'4px 13px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', outline:'none', border:`1px solid ${filtro===a?'#0d6e52':'#e5e7eb'}`, background:filtro===a?'#0d6e52':'#fff', color:filtro===a?'#fff':'#6b7280', textTransform:'capitalize' }}>{a}</button>
              ))}
            </div>

            <div style={{ borderRadius:10, border:'1px solid #e5e7eb', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                <thead>
                  <tr style={{ background:'#f9fafb' }}>
                    {['CADOC','Documento','Responsável','Periodicidade','Arquivo','Prazo','Status'].map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#6b7280', letterSpacing:'.5px', textTransform:'uppercase', borderBottom:'1px solid #e5e7eb', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrado.map((c,i) => {
                    const st = statusSt(c.dias)
                    return (
                      <tr key={c.cod} style={{ borderTop:i>0?'1px solid #f9fafb':'none', borderLeft:`3px solid ${st.leftC}` }}>
                        <td style={{ padding:'11px 14px', fontFamily:'monospace', fontWeight:800, fontSize:12, color:st.cor }}>{c.cod}</td>
                        <td style={{ padding:'11px 14px', fontSize:12.5, fontWeight:600, color:'#111827' }}>{c.nome}</td>
                        <td style={{ padding:'11px 14px', fontSize:11, color:'#6b7280' }}>{c.quem}</td>
                        <td style={{ padding:'11px 14px', fontSize:11, fontFamily:'monospace', color:'#6b7280', textTransform:'capitalize' }}>{c.per}</td>
                        <td style={{ padding:'11px 14px', fontSize:11, fontFamily:'monospace', color:'#6b7280' }}>{c.arq}</td>
                        <td style={{ padding:'11px 14px', fontSize:11, fontFamily:'monospace', color:'#374151', whiteSpace:'nowrap' }}>{c.prazoLabel}</td>
                        <td style={{ padding:'11px 14px' }}>
                          <span style={{ fontSize:10.5, fontWeight:700, padding:'3px 10px', borderRadius:20, background:st.bg, color:st.cor, border:`1px solid ${st.brd}`, fontFamily:'monospace', whiteSpace:'nowrap' }}>{st.txt}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
