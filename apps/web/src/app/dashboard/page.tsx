'use client'
import { useState, useEffect } from 'react'

// ── Todos os CADOCs possíveis com prazo ───────────────────────────────────────
const ALL_CADOCS: Record<string,{nome:string;per:string;duMes:number;area:string}> = {
  '4010': { nome:'Balancete COSIF',           per:'Mensal',     duMes:9,  area:'contabilidade' },
  '4016': { nome:'Balanço Semestral',          per:'Semestral',  duMes:180, area:'contabilidade' },
  '4111': { nome:'DLO — Posição Financeira',   per:'Diária',     duMes:1,  area:'liquidez'      },
  '2020': { nome:'Capital / PR',               per:'Mensal',     duMes:9,  area:'capital'       },
  '2045': { nome:'RWA — Parcelas de Capital',  per:'Mensal',     duMes:9,  area:'capital'       },
  '2025': { nome:'LCR — Liquidity Coverage',   per:'Mensal',     duMes:9,  area:'capital'       },
  '2030': { nome:'NSFR — Stable Funding',      per:'Mensal',     duMes:9,  area:'capital'       },
  '3040': { nome:'SCR — Dados de Crédito',     per:'Mensal',     duMes:18, area:'crédito'       },
  '3044': { nome:'SCR — Eventos de Crédito',   per:'Por evento', duMes:5,  area:'crédito'       },
  '3060': { nome:'SCR — Taxas de Juros',       per:'Semanal',    duMes:5,  area:'crédito'       },
  '2055': { nome:'Pix — Info Operacionais',    per:'Mensal',     duMes:10, area:'pagamentos'    },
  '6334': { nome:'Cartões Credenciadores',     per:'Trimestral', duMes:90, area:'pagamentos'    },
  '6308': { nome:'Cartões Emissores',          per:'Trimestral', duMes:90, area:'pagamentos'    },
  '2050': { nome:'Arranjos de Pagamento',      per:'Trimestral', duMes:90, area:'pagamentos'    },
  'C212': { nome:'Ativos Virtuais — Câmbio',   per:'Mensal',     duMes:5,  area:'câmbio'        },
}

// Matriz compacta: tipo → CADOCs obrigatórios (SIM)
const OBRIG_BY_TIPO: Record<string,string[]> = {
  s1:           ['4010','4016','4111','2020','2045','2025','2030','3040','3044','2055'],
  s2:           ['4010','4016','4111','2020','2045','2025','2030','3040','3044','2055'],
  s3:           ['4010','4016','4111','2020','2045','3040','3044'],
  s4:           ['4010','4016','2020'],
  s5:           ['4010','4016','2020'],
  adquirente:   ['4010','4016','6334'],
  subadquirente:['4010','4016'],
  emissor_pre:  ['4010','4016','4111','2055'],
  emissor_pos:  ['4010','4016','4111','3040','3044','6308'],
  itp:          ['4010','4016'],
  scd:          ['4010','4016','4111','3040','3044'],
  psav:         ['4010','4016','C212'],
}

const TIPO_LABELS: Record<string,string> = {
  s1:'Banco S1 — Sistêmico', s2:'Banco S2 — Médio Int.', s3:'IF S3 — Médio Porte',
  s4:'IF S4 — Menor Porte',  s5:'IF S5 — Micro',
  adquirente:'Adquirente',   subadquirente:'Subadquirente',
  emissor_pre:'Emissor Pré', emissor_pos:'Emissor Pós',
  itp:'ITP', scd:'SCD', psav:'PSAV',
}

const NORMAS_CRITICAS = [
  { titulo:'Res. BCB 522/2025 — Subcredenciadores: Liquidação Centralizada', prazo:'09/05/2026', urg:'critica', area:'SPB' },
  { titulo:'IN BCB 530/2025 — CADOC 3044 Fase 2: Cessões e Portabilidade',   prazo:'Mai/2026',   urg:'critica', area:'SCR' },
  { titulo:'Res. BCB 411/2025 — Pix Parcelado e Garantido',                  prazo:'Fev/2026',   urg:'alta',    area:'Pix' },
  { titulo:'IN BCB 693/2025 — CADOC C212: PSAVs e Câmbio',                   prazo:'Mai/2026',   urg:'alta',    area:'Cripto' },
]

function getDias(duMes: number) {
  const now = new Date()
  const alvo = new Date(now.getFullYear(), now.getMonth() + 1, duMes)
  return Math.ceil((alvo.getTime() - now.getTime()) / 86400000)
}

function statusDias(d: number) {
  if (d < 0)   return { cor:'#dc2626', bg:'#fef2f2', brd:'#fecaca', txt:`${Math.abs(d)}d atraso` }
  if (d <= 7)  return { cor:'#d97706', bg:'#fffbeb', brd:'#fde68a', txt:`+${d}d` }
  if (d <= 21) return { cor:'#0891b2', bg:'#ecfeff', brd:'#a5f3fc', txt:`+${d}d` }
  return               { cor:'#16a34a', bg:'#f0fdf4', brd:'#bbf7d0', txt:`+${d}d` }
}

export default function DashboardPage() {
  const [nome,   setNome]   = useState('Sua Instituição')
  const [tipo,   setTipo]   = useState('')
  const [seg,    setSeg]    = useState('')
  const [hora,   setHora]   = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNome(localStorage.getItem('bm_nome')     || 'Sua Instituição')
      setTipo(localStorage.getItem('bm_tipo')     || '')
      setSeg(localStorage.getItem('bm_segmento') || '')
    }
    setHora(new Date().getHours())
  }, [])

  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const now      = new Date()
  const dataStr  = now.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })

  // CADOCs da IF configurada ou fallback genérico
  const codObrig = tipo ? (OBRIG_BY_TIPO[tipo] || []) : Object.keys(ALL_CADOCS).slice(0,5)
  const cadocsIF = codObrig
    .map(cod => ({ cod, ...ALL_CADOCS[cod], dias: getDias(ALL_CADOCS[cod]?.duMes || 18) }))
    .filter(c => c.nome)
    .sort((a,b) => a.dias - b.dias)

  const vencidos = cadocsIF.filter(c => c.dias < 0)
  const urgentes = cadocsIF.filter(c => c.dias >= 0 && c.dias <= 7)
  const total    = cadocsIF.length
  const score    = total > 0 ? Math.round(((total - vencidos.length) / total) * 100) : 100
  const scoreCor = vencidos.length > 0 ? '#dc2626' : urgentes.length > 0 ? '#d97706' : '#16a34a'

  const Card = ({ children, style }: any) => (
    <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', boxShadow:'0 1px 4px rgba(0,0,0,.05)', ...style }}>
      {children}
    </div>
  )

  return (
    <div style={{ padding:'24px 28px', minHeight:'100%', background:'#f1f3f7', fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ── Cabeçalho ── */}
      <div style={{ marginBottom:22, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#111827', margin:'0 0 4px', letterSpacing:'-.5px' }}>
            {saudacao}, {nome.split(' ')[0]}
          </h1>
          <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>
            {dataStr.charAt(0).toUpperCase() + dataStr.slice(1)}
            {tipo && (
              <span style={{ marginLeft:10, fontSize:10.5, fontFamily:'monospace', color:'#0d9166', background:'#f0fdf4', border:'1px solid #bbf7d0', padding:'2px 9px', borderRadius:4 }}>
                {TIPO_LABELS[tipo] || tipo}{seg ? ` · ${seg}` : ''}
              </span>
            )}
            {!tipo && (
              <a href="/dashboard/settings" style={{ marginLeft:10, fontSize:11, color:'#d97706', textDecoration:'none', fontWeight:600 }}>
                ⚠ Configure sua instituição →
              </a>
            )}
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <a href="/dashboard/cadocs" style={{ padding:'9px 18px', borderRadius:9, textDecoration:'none', background:'linear-gradient(135deg,#0d6e52,#1248a0)', color:'#fff', fontSize:12.5, fontWeight:700, boxShadow:'0 4px 14px rgba(13,110,82,.3)' }}>
            Gerar CADOC
          </a>
          <a href="/dashboard/normas" style={{ padding:'9px 18px', borderRadius:9, textDecoration:'none', background:'#fff', border:'1px solid #e5e7eb', color:'#374151', fontSize:12.5, fontWeight:600 }}>
            Ver Normas
          </a>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Score Compliance', value:score+'%',            cor:scoreCor   },
          { label:'CADOCs da IF',     value:String(total),        cor:'#1d4ed8'  },
          { label:'Vencidos',         value:String(vencidos.length), cor:vencidos.length>0?'#dc2626':'#16a34a' },
          { label:'Urgentes ≤7d',     value:String(urgentes.length), cor:urgentes.length>0?'#d97706':'#16a34a' },
          { label:'Normas Críticas',  value:'2',                  cor:'#dc2626'  },
        ].map(k => (
          <div key={k.label} style={{ background:'#fff', borderRadius:12, padding:'16px 18px', border:'1px solid #e5e7eb', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize:9.5, fontWeight:600, color:'#9ca3af', letterSpacing:'.5px', textTransform:'uppercase', marginBottom:8 }}>{k.label}</div>
            <div style={{ fontSize:26, fontWeight:900, color:k.cor, fontFamily:'monospace', letterSpacing:'-1px', lineHeight:1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Linha 2 ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Vencimentos da IF */}
        <Card>
          <div style={{ padding:'13px 18px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Próximos Vencimentos</div>
              <div style={{ fontSize:10.5, color:'#9ca3af', marginTop:1 }}>
                {tipo ? `CADOCs obrigatórios — ${TIPO_LABELS[tipo]||tipo}` : 'Configure sua IF em Configurações'}
              </div>
            </div>
            <a href="/dashboard/entregas" style={{ fontSize:11.5, color:'#0d9166', textDecoration:'none', fontWeight:600 }}>Calendário →</a>
          </div>
          <div>
            {cadocsIF.slice(0,6).map((c,i) => {
              const st = statusDias(c.dias)
              return (
                <div key={c.cod} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 18px', borderBottom:i<5?'1px solid #f9fafb':'none', borderLeft:`3px solid ${st.cor}` }}>
                  <div style={{ width:38, height:38, borderRadius:8, background:st.bg, border:`1px solid ${st.brd}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:9.5, fontWeight:800, color:st.cor, fontFamily:'monospace' }}>{c.cod}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nome}</div>
                    <div style={{ fontSize:10, color:'#9ca3af', marginTop:1, fontFamily:'monospace' }}>{c.per}</div>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:st.bg, color:st.cor, border:`1px solid ${st.brd}`, fontFamily:'monospace', whiteSpace:'nowrap' }}>{st.txt}</span>
                </div>
              )
            })}
            {cadocsIF.length === 0 && (
              <div style={{ padding:'24px', textAlign:'center', color:'#9ca3af', fontSize:12 }}>
                <a href="/dashboard/settings" style={{ color:'#0d9166', fontWeight:600, textDecoration:'none' }}>Configure o tipo de IF em Configurações</a>
                {' '}para ver os vencimentos personalizados.
              </div>
            )}
          </div>
        </Card>

        {/* Normas Críticas */}
        <Card>
          <div style={{ padding:'13px 18px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Normas com Prazo Crítico</div>
              <div style={{ fontSize:10.5, color:'#9ca3af', marginTop:1 }}>BCB/CMN — ações obrigatórias em 2026</div>
            </div>
            <a href="/dashboard/normas" style={{ fontSize:11.5, color:'#0d9166', textDecoration:'none', fontWeight:600 }}>Feed →</a>
          </div>
          <div>
            {NORMAS_CRITICAS.map((n,i) => {
              const uc = n.urg === 'critica' ? '#dc2626' : '#d97706'
              return (
                <div key={i} style={{ padding:'11px 18px', borderBottom:i<NORMAS_CRITICAS.length-1?'1px solid #f9fafb':'none', borderLeft:`3px solid ${uc}` }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#111827', lineHeight:1.4, marginBottom:6 }}>{n.titulo}</div>
                  <div style={{ display:'flex', gap:7, alignItems:'center' }}>
                    <span style={{ fontSize:9.5, fontWeight:700, padding:'2px 8px', borderRadius:4, background:uc+'12', color:uc, fontFamily:'monospace' }}>{n.urg==='critica'?'CRITICA':'ALTA'}</span>
                    <span style={{ fontSize:9.5, padding:'2px 8px', borderRadius:4, background:'#f3f4f6', color:'#6b7280' }}>{n.area}</span>
                    <span style={{ marginLeft:'auto', fontSize:9.5, color:'#9ca3af', fontFamily:'monospace' }}>{n.prazo}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* ── Linha 3 ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>

        {/* Score */}
        <Card>
          <div style={{ padding:'18px 20px 16px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#111827', marginBottom:16 }}>Score de Compliance</div>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
              <div style={{ width:68, height:68, borderRadius:'50%', background:`conic-gradient(${scoreCor} ${score*3.6}deg,#f3f4f6 0deg)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:14, fontWeight:900, color:scoreCor, fontFamily:'monospace' }}>{score}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize:22, fontWeight:900, color:scoreCor, fontFamily:'monospace', letterSpacing:'-1px' }}>{score}%</div>
                <div style={{ fontSize:11, fontWeight:700, color:scoreCor }}>
                  {vencidos.length>0?'CRITICO':urgentes.length>0?'ATENCAO':'CONFORME'}
                </div>
                <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>{total-vencidos.length}/{total} em dia</div>
              </div>
            </div>
            <div style={{ height:6, background:'#f3f4f6', borderRadius:6, overflow:'hidden' }}>
              <div style={{ height:'100%', width:score+'%', background:`linear-gradient(90deg,${scoreCor},${scoreCor}90)`, borderRadius:6 }}/>
            </div>
          </div>
        </Card>

        {/* Acesso rápido */}
        <Card>
          <div style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#111827', marginBottom:12 }}>Acesso Rápido</div>
            {[
              { label:'Gerar CADOC 3044 — SCR Eventos', href:'/dashboard/cadocs', cor:'#7c3aed' },
              { label:'Gerar CADOC 4010 — COSIF',       href:'/dashboard/cadocs', cor:'#1d4ed8' },
              { label:'Feed de Normas BCB ao vivo',     href:'/dashboard/normas', cor:'#0d6e52' },
              { label:'Calendário de Entregas',         href:'/dashboard/entregas', cor:'#0891b2' },
              { label:'Matriz CADOCs por tipo de IF',   href:'/dashboard/pagamentos', cor:'#d97706' },
              { label:'Configurar Instituição',         href:'/dashboard/settings', cor:'#6b7280' },
            ].map(item => (
              <a key={item.label} href={item.href} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 8px', borderRadius:7, textDecoration:'none', color:'#374151', marginBottom:2 }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f9fafb'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:item.cor, flexShrink:0 }}/>
                <span style={{ fontSize:12 }}>{item.label}</span>
                <span style={{ marginLeft:'auto', fontSize:11, color:'#d1d5db' }}>→</span>
              </a>
            ))}
          </div>
        </Card>

        {/* CADOCs da IF — resumo */}
        <Card>
          <div style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#111827', marginBottom:12 }}>
              {tipo ? `CADOCs — ${TIPO_LABELS[tipo]||tipo}` : 'Minha IF — Configure'}
            </div>
            {tipo ? (
              codObrig.map((cod,i) => {
                const info = ALL_CADOCS[cod]; if (!info) return null
                const d = getDias(info.duMes); const st = statusDias(d)
                return (
                  <div key={cod} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:i<codObrig.length-1?'1px solid #f9fafb':'none' }}>
                    <span style={{ fontSize:10.5, fontWeight:800, fontFamily:'monospace', color:st.cor, minWidth:36 }}>{cod}</span>
                    <span style={{ fontSize:11, color:'#374151', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{info.nome}</span>
                    <span style={{ fontSize:10, fontFamily:'monospace', color:st.cor, fontWeight:700, whiteSpace:'nowrap' }}>{st.txt}</span>
                  </div>
                )
              })
            ) : (
              <div style={{ fontSize:12, color:'#9ca3af', textAlign:'center', padding:'16px 0' }}>
                <a href="/dashboard/settings" style={{ color:'#0d9166', fontWeight:600, textDecoration:'none' }}>Configurar IF →</a>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
