'use client'
import { useState, useEffect } from 'react'

// CADOCs com prazo calculado dinamicamente
const CADOC_CAL = [
  { cod:'3040', nome:'SCR — Dados de Crédito',           per:'Mensal',      duMes:18, area:'crédito'       },
  { cod:'3044', nome:'SCR — Eventos de Crédito',         per:'Por evento',  duMes:5,  area:'crédito'       },
  { cod:'4010', nome:'Balancete COSIF',                  per:'Mensal',      duMes:9,  area:'contabilidade' },
  { cod:'2055', nome:'Pix — Informações Operacionais',   per:'Mensal',      duMes:10, area:'pagamentos'    },
  { cod:'6334', nome:'Cartões Credenciadores (ASPB034)', per:'Trimestral',  duMes:90, area:'pagamentos'    },
  { cod:'2010', nome:'Patrimônio de Referência',         per:'Mensal',      duMes:9,  area:'capital'       },
  { cod:'3060', nome:'SCR — Taxas de Juros',             per:'Semanal',     duMes:5,  area:'crédito'       },
]

const NORMAS_CRITICAS = [
  { titulo:'Res. BCB 403/2025 — CADOC 3044 Fase 2: Cessões',   prazo:'Mai/2026', urg:'critica', area:'SCR'       },
  { titulo:'Res. BCB 522/2025 — Subcredenciadores: Liquidação', prazo:'Mai/2026', urg:'critica', area:'SPB'       },
  { titulo:'Res. BCB 411/2025 — Pix Parcelado e Garantido',    prazo:'Fev/2026', urg:'alta',    area:'Pix'       },
  { titulo:'Res. BCB 396/2025 — Requisitos PSAVs',             prazo:'Set/2025', urg:'alta',    area:'Cripto'    },
]

function getDias(duMes: number) {
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + 1, duMes)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

function statusDias(d: number): { cor: string; bg: string; brd: string; txt: string } {
  if (d < 0)  return { cor:'#dc2626', bg:'#fef2f2', brd:'#fecaca', txt:`${Math.abs(d)}d atraso` }
  if (d <= 7) return { cor:'#d97706', bg:'#fffbeb', brd:'#fde68a', txt:`+${d}d`                 }
  if (d <= 21) return { cor:'#0891b2', bg:'#ecfeff', brd:'#a5f3fc', txt:`+${d}d`                }
  return { cor:'#16a34a', bg:'#f0fdf4', brd:'#bbf7d0', txt:`+${d}d` }
}

export default function DashboardPage() {
  const [nome, setNome]     = useState('Sua Instituição')
  const [tipo, setTipo]     = useState('')
  const [segmento, setSeg]  = useState('')
  const [hora, setHora]     = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNome(localStorage.getItem('bm_nome') || 'Sua Instituição')
      setTipo(localStorage.getItem('bm_tipo') || '')
      setSeg(localStorage.getItem('bm_segmento') || '')
    }
    setHora(new Date().getHours())
  }, [])

  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const cadocsComDias = CADOC_CAL.map(c => ({ ...c, dias: getDias(c.duMes) }))
  const vencidos   = cadocsComDias.filter(c => c.dias < 0)
  const urgentes   = cadocsComDias.filter(c => c.dias >= 0 && c.dias <= 7)
  const ok         = cadocsComDias.filter(c => c.dias > 7)
  const score      = Math.round(((CADOC_CAL.length - vencidos.length) / CADOC_CAL.length) * 100)
  const scoreCor   = vencidos.length > 0 ? '#dc2626' : urgentes.length > 0 ? '#d97706' : '#16a34a'
  const now        = new Date()
  const dataStr    = now.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })
  const TIPO_LABELS: Record<string,string> = {
    s1:'Banco S1', s2:'Banco S2', s3:'Banco S3', s4:'IF S4', s5:'IF S5',
    adquirente:'Adquirente', subadquirente:'Subadquirente', emissor_pre:'Emissor Pré-pago',
    emissor_pos:'Emissor Pós-pago', itp:'ITP', scd:'SCD', psav:'PSAV',
  }

  const Card = ({ children, style }: any) => (
    <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', boxShadow:'0 1px 4px rgba(0,0,0,.05)', ...style }}>
      {children}
    </div>
  )

  const Hdr = ({ title, sub, action }: { title:string; sub?:string; action?:React.ReactNode }) => (
    <div style={{ padding:'13px 18px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{title}</div>
        {sub && <div style={{ fontSize:10.5, color:'#9ca3af', marginTop:1 }}>{sub}</div>}
      </div>
      {action}
    </div>
  )

  return (
    <div style={{ padding:'24px 28px', minHeight:'100%', background:'#f1f3f7' }}>

      {/* ── Cabeçalho ─────────────────────────────────────────────── */}
      <div style={{ marginBottom:24, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#111827', margin:'0 0 4px', letterSpacing:'-.5px' }}>
            {saudacao}, {nome.split(' ')[0]}
          </h1>
          <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>
            {dataStr.charAt(0).toUpperCase() + dataStr.slice(1)}
            {tipo && <span style={{ marginLeft:10, fontSize:10.5, fontFamily:'monospace', color:'#0d9166', background:'#f0fdf4', border:'1px solid #bbf7d0', padding:'1px 8px', borderRadius:4 }}>{TIPO_LABELS[tipo] || tipo}{segmento && ` · ${segmento.toUpperCase()}`}</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <a href="/dashboard/cadocs" style={{ padding:'9px 18px', borderRadius:9, textDecoration:'none', background:'linear-gradient(135deg,#0d6e52,#1248a0)', color:'#fff', fontSize:12.5, fontWeight:700, boxShadow:'0 4px 14px rgba(13,110,82,.3)', display:'flex', alignItems:'center', gap:7 }}>
            ⊠ Gerar CADOC
          </a>
          <a href="/dashboard/normas" style={{ padding:'9px 18px', borderRadius:9, textDecoration:'none', background:'#fff', border:'1px solid #e5e7eb', color:'#374151', fontSize:12.5, fontWeight:600, display:'flex', alignItems:'center', gap:7 }}>
            ⊞ Ver Normas
          </a>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Score Compliance',  value: score+'%',                      cor: scoreCor,  sub:'Índice regulatório'   },
          { label:'CADOCs Monitorados',value: CADOC_CAL.length.toString(),    cor:'#1d4ed8',  sub:'Documentos ativos'    },
          { label:'Vencidos',          value: vencidos.length.toString(),     cor: vencidos.length>0?'#dc2626':'#16a34a', sub:'Prazo ultrapassado' },
          { label:'Urgentes ≤7d',      value: urgentes.length.toString(),     cor: urgentes.length>0?'#d97706':'#16a34a', sub:'Ação imediata'      },
          { label:'Normas Críticas',   value:'2',                             cor:'#dc2626',  sub:'Vigência 2026'        },
        ].map(k => (
          <div key={k.label} style={{ background:'#fff', borderRadius:12, padding:'16px 18px', border:'1px solid #e5e7eb', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize:9.5, fontWeight:600, color:'#9ca3af', letterSpacing:'.5px', textTransform:'uppercase', marginBottom:8 }}>{k.label}</div>
            <div style={{ fontSize:26, fontWeight:900, color:k.cor, fontFamily:'monospace', letterSpacing:'-1px', lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:10, color:'#9ca3af', marginTop:6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Linha 2 ──────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Vencimentos */}
        <Card>
          <Hdr title="⏰ Próximos Vencimentos" sub="Calendário BCB — prazos regulatórios" action={<a href="/dashboard/entregas" style={{ fontSize:11.5, color:'#0d9166', textDecoration:'none', fontWeight:600 }}>Ver todos →</a>}/>
          <div>
            {cadocsComDias.sort((a,b) => a.dias - b.dias).slice(0,6).map((c,i) => {
              const st = statusDias(c.dias)
              return (
                <div key={c.cod} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 18px', borderBottom: i < 5 ? '1px solid #f9fafb' : 'none', borderLeft:`3px solid ${st.cor}` }}>
                  <div style={{ width:38, height:38, borderRadius:8, background:st.bg, border:`1px solid ${st.brd}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:10, fontWeight:800, color:st.cor, fontFamily:'monospace' }}>{c.cod.slice(0,4)}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nome}</div>
                    <div style={{ fontSize:10, color:'#9ca3af', marginTop:1, fontFamily:'monospace' }}>{c.per}</div>
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:st.bg, color:st.cor, border:`1px solid ${st.brd}`, fontFamily:'monospace', whiteSpace:'nowrap' }}>
                    {st.txt}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Normas Críticas */}
        <Card>
          <Hdr title="⚠ Normas com Prazo Crítico" sub="BCB/CMN — ações obrigatórias em 2026" action={<a href="/dashboard/normas" style={{ fontSize:11.5, color:'#0d9166', textDecoration:'none', fontWeight:600 }}>Feed →</a>}/>
          <div>
            {NORMAS_CRITICAS.map((n,i) => {
              const urgCor = n.urg === 'critica' ? '#dc2626' : '#d97706'
              const urgBg  = n.urg === 'critica' ? '#fef2f2' : '#fffbeb'
              return (
                <div key={i} style={{ padding:'12px 18px', borderBottom: i < NORMAS_CRITICAS.length-1 ? '1px solid #f9fafb' : 'none', borderLeft:`3px solid ${urgCor}` }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#111827', lineHeight:1.4, marginBottom:7 }}>{n.titulo}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                    <span style={{ fontSize:9.5, fontWeight:700, padding:'2px 8px', borderRadius:4, background:urgBg, color:urgCor, fontFamily:'monospace', border:`1px solid ${urgCor}30` }}>
                      {n.urg === 'critica' ? '⚠ CRÍTICA' : '↑ ALTA'}
                    </span>
                    <span style={{ fontSize:9.5, padding:'2px 8px', borderRadius:4, background:'#f3f4f6', color:'#6b7280' }}>{n.area}</span>
                    <span style={{ marginLeft:'auto', fontSize:9.5, color:'#9ca3af', fontFamily:'monospace' }}>⏱ {n.prazo}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* ── Linha 3 ──────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>

        {/* Score gauge */}
        <Card>
          <div style={{ padding:'20px 20px 16px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#111827', marginBottom:16 }}>📊 Score de Compliance</div>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
              <div style={{ width:72, height:72, flexShrink:0, borderRadius:'50%', background:`conic-gradient(${scoreCor} ${score*3.6}deg, #f3f4f6 0deg)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:54, height:54, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:15, fontWeight:900, color:scoreCor, fontFamily:'monospace' }}>{score}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize:22, fontWeight:900, color:scoreCor, fontFamily:'monospace', letterSpacing:'-1px' }}>{score}%</div>
                <div style={{ fontSize:11, fontWeight:700, color:scoreCor, marginTop:3 }}>{vencidos.length > 0 ? 'CRÍTICO' : urgentes.length > 0 ? 'ATENÇÃO' : 'CONFORME'}</div>
                <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>{ok.length}/{CADOC_CAL.length} em dia</div>
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
            <div style={{ fontSize:12, fontWeight:700, color:'#111827', marginBottom:12 }}>⚡ Acesso Rápido</div>
            {[
              { label:'Gerar CADOC 3044 — SCR Eventos', href:'/dashboard/cadocs', cor:'#7c3aed' },
              { label:'Gerar CADOC 4010 — COSIF',       href:'/dashboard/cadocs', cor:'#1d4ed8' },
              { label:'Feed de Normas BCB ao vivo',     href:'/dashboard/normas', cor:'#0d6e52' },
              { label:'Calendário de Entregas',         href:'/dashboard/entregas', cor:'#0891b2' },
              { label:'Matriz CADOCs por tipo de IF',   href:'/dashboard/pagamentos', cor:'#d97706' },
              { label:'Configurar Instituição',         href:'/dashboard/settings', cor:'#6b7280' },
            ].map(item => (
              <a key={item.label} href={item.href} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 8px', borderRadius:7, textDecoration:'none', color:'#374151', marginBottom:2, transition:'background .12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f9fafb'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:item.cor, flexShrink:0 }}/>
                <span style={{ fontSize:12 }}>{item.label}</span>
                <span style={{ marginLeft:'auto', fontSize:11, color:'#d1d5db' }}>→</span>
              </a>
            ))}
          </div>
        </Card>

        {/* Arquitetura RegTech */}
        <Card>
          <div style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#111827', marginBottom:12 }}>🏗 Camadas RegTech</div>
            {[
              { label:'Interface',    items:['Dashboard','Relatórios','Auditoria'],           cor:'#b91c1c' },
              { label:'Orquestração', items:['Workflow','Prazos','Notificações'],             cor:'#7f1d1d' },
              { label:'Validação',    items:['XML BCB (315 regras)','Reconciliação'],         cor:'#1e3a8a' },
              { label:'Integração',   items:['STA BCB','SCR JSON','Core Banking'],            cor:'#111827' },
            ].map((layer,i) => (
              <div key={layer.label} style={{ marginBottom: i < 3 ? 10 : 0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:layer.cor, flexShrink:0 }}/>
                  <span style={{ fontSize:10, fontWeight:700, color:layer.cor, letterSpacing:'.5px', textTransform:'uppercase' }}>{layer.label}</span>
                </div>
                <div style={{ display:'flex', gap:4, paddingLeft:15, flexWrap:'wrap' }}>
                  {layer.items.map(it => (
                    <span key={it} style={{ fontSize:9.5, padding:'2px 7px', borderRadius:4, background:layer.cor+'12', color:layer.cor, border:`1px solid ${layer.cor}22` }}>{it}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
