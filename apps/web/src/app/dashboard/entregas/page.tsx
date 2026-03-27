'use client'
import { useState } from 'react'

const CAL = [
  {cod:'3040',nome:'SCR Dados de Crédito',per:'mensal',dias:5,area:'crédito',quem:'IF com carteira de crédito',arq:'XML'},
  {cod:'3044',nome:'SCR Eventos de Crédito',per:'por evento',dias:2,area:'crédito',quem:'IF com carteira de crédito',arq:'JSON'},
  {cod:'3060',nome:'SCR Taxas de Juros',per:'semanal',dias:5,area:'crédito',quem:'IF com carteira de crédito',arq:'XML'},
  {cod:'4010',nome:'Balancete COSIF',per:'mensal',dias:9,area:'contabilidade',quem:'Todas as IFs',arq:'XML'},
  {cod:'6334',nome:'Cartões Credenciadores',per:'trimestral',dias:67,area:'pagamentos',quem:'Credenciadores',arq:'10 TXTs'},
  {cod:'2055',nome:'Contas de Pagamento',per:'trimestral',dias:67,area:'pagamentos',quem:'Emissores EME',arq:'XML'},
  {cod:'2010',nome:'Patrimônio de Referência',per:'mensal',dias:9,area:'capital',quem:'Bancos e SCDs',arq:'XML'},
  {cod:'2020',nome:'Adequação do Capital RWA',per:'mensal',dias:9,area:'capital',quem:'Bancos — Basileia III',arq:'XML'},
  {cod:'7011',nome:'Open Finance — Cadastrais',per:'mensal',dias:5,area:'tecnologia',quem:'IFs Open Finance',arq:'JSON API'},
  {cod:'2050',nome:'Arranjos de Pagamento',per:'trimestral',dias:67,area:'pagamentos',quem:'IPs e Arranjos',arq:'XML'},
]

export default function EntregasPage() {
  const [tab, setTab] = useState<'dashboard'|'calendario'>('dashboard')
  const [filtro, setFiltro] = useState('todos')
  const now = new Date()

  const calcDias = (d: number) => {
    const prazo = new Date(now.getFullYear(), now.getMonth() + 1, d)
    return Math.ceil((prazo.getTime() - now.getTime()) / 86400000)
  }
  const calcLabel = (d: number) => {
    const prazo = new Date(now.getFullYear(), now.getMonth() + 1, d)
    return prazo.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'})
  }

  const cal = CAL.map(c => ({ ...c, diasRestantes: calcDias(c.dias), prazoLabel: calcLabel(c.dias) }))
    .sort((a,b) => a.diasRestantes - b.diasRestantes)

  const vencidos = cal.filter(c => c.diasRestantes < 0)
  const urgentes = cal.filter(c => c.diasRestantes >= 0 && c.diasRestantes <= 7)
  const proximos = cal.filter(c => c.diasRestantes > 7 && c.diasRestantes <= 30)
  const noPrazo  = cal.filter(c => c.diasRestantes > 30)
  const score = Math.round(((CAL.length - vencidos.length) / CAL.length) * 100)
  const stC = vencidos.length > 0 ? '#dc2626' : urgentes.length > 0 ? '#d97706' : '#16a34a'

  const areas = ['todos', ...new Set(CAL.map(c => c.area))]
  const filtrado = filtro === 'todos' ? cal : cal.filter(c => c.area === filtro)

  const statusInfo = (dias: number) => {
    if (dias < 0) return { bg:'#fef2f2', color:'#dc2626', border:'#fecaca', label: Math.abs(dias)+'d atraso', leftC:'#dc2626' }
    if (dias <= 7) return { bg:'#fffbeb', color:'#d97706', border:'#fde68a', label: '+'+dias+'d', leftC:'#d97706' }
    if (dias <= 30) return { bg:'#ecfeff', color:'#0891b2', border:'#a5f3fc', label: '+'+dias+'d', leftC:'#0891b2' }
    return { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0', label: '+'+dias+'d', leftC:'#16a34a' }
  }

  const tabSt = (t: string): React.CSSProperties => ({
    padding: '8px 18px', cursor: 'pointer', border: 'none', outline: 'none',
    background: 'transparent', fontSize: 12, fontWeight: 600,
    color: tab === t ? '#1a6b52' : '#6b7280',
    borderBottom: tab === t ? '2px solid #1a6b52' : '2px solid transparent',
  })

  return (
    <div style={{ padding: '24px 28px', minHeight: '100%', background: '#f0f2f7' }}>
      
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-.4px' }}>📅 Entregas Regulatórias</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Calendário de vencimentos e dashboard de conformidade BCB</p>
        </div>
        <a href="/dashboard/cadocs" style={{ padding: '8px 16px', borderRadius: 8, textDecoration: 'none', background: 'linear-gradient(135deg,#1a6b52,#0d4c8f)', color: '#fff', fontSize: 12, fontWeight: 700 }}>+ Gerar CADOC</a>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderRadius: '12px 12px 0 0', border: '1px solid rgba(0,0,0,.07)', borderBottom: 'none', display: 'flex', marginBottom: 0 }}>
        <button onClick={() => setTab('dashboard')} style={tabSt('dashboard')}>📊 Dashboard Executivo</button>
        <button onClick={() => setTab('calendario')} style={tabSt('calendario')}>📅 Calendário de Prazos</button>
      </div>

      <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', border: '1px solid rgba(0,0,0,.07)', padding: 20 }}>

        {tab === 'dashboard' && (
          <div>
            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                {l:'Status',v:vencidos.length>0?'CRÍTICO':urgentes.length>0?'ATENÇÃO':'CONFORME',c:stC},
                {l:'Score',v:score+'%',c:score>=90?'#16a34a':score>=70?'#d97706':'#dc2626'},
                {l:'Vencidos',v:String(vencidos.length),c:vencidos.length>0?'#dc2626':'#16a34a'},
                {l:'Urgentes ≤7d',v:String(urgentes.length),c:urgentes.length>0?'#d97706':'#16a34a'},
                {l:'Total CADOCs',v:String(CAL.length),c:'#1d4ed8'},
              ].map(k=>(
                <div key={k.l} style={{ padding: '14px 16px', borderRadius: 10, background: k.c+'0d', border: `1px solid ${k.c}22`, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: k.c, fontFamily: 'monospace' }}>{k.v}</div>
                  <div style={{ fontSize: 9.5, color: '#6b7280', marginTop: 3, fontWeight: 600, letterSpacing: '.3px', textTransform: 'uppercase' }}>{k.l}</div>
                </div>
              ))}
            </div>

            {/* Score bar */}
            <div style={{ padding: '14px 18px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: stC, fontFamily: 'monospace', minWidth: 64 }}>{score}%</div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 8, background: '#e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: score+'%', background: `linear-gradient(90deg,${stC},${stC}99)`, borderRadius: 8, transition: 'width .5s' }}/>
                </div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{CAL.length - vencidos.length} de {CAL.length} CADOCs em conformidade regulatória</div>
              </div>
            </div>

            {/* 4 groups */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                {title:'🔴 Vencidos',items:vencidos,color:'#dc2626',bg:'#fef2f2'},
                {title:'🟡 Urgentes (≤7 dias)',items:urgentes,color:'#d97706',bg:'#fffbeb'},
                {title:'🔵 Próximos 30 dias',items:proximos,color:'#0891b2',bg:'#ecfeff'},
                {title:'🟢 Em dia (>30 dias)',items:noPrazo,color:'#16a34a',bg:'#f0fdf4'},
              ].map(group=>(
                <div key={group.title} style={{ borderRadius: 10, border: `1px solid ${group.color}22`, overflow: 'hidden' }}>
                  <div style={{ padding: '9px 14px', background: group.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: group.color }}>{group.title}</span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: group.color }}>{group.items.length}</span>
                  </div>
                  <div>
                    {group.items.length === 0 ? (
                      <div style={{ padding: '12px 14px', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>Nenhum</div>
                    ) : group.items.map((c,i) => (
                      <div key={c.cod+i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderTop: i>0?'1px solid #f9fafb':'none' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 800, color: group.color, minWidth: 36 }}>{c.cod}</span>
                        <span style={{ fontSize: 11, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</span>
                        <span style={{ fontSize: 10, color: group.color, fontFamily: 'monospace', fontWeight: 700, whiteSpace: 'nowrap' }}>{c.prazoLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'calendario' && (
          <div>
            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {areas.map(a => (
                <button key={a} onClick={() => setFiltro(a)} style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 10.5, fontWeight: 600,
                  cursor: 'pointer', outline: 'none', border: `1px solid ${filtro===a?'#1a6b52':'#e5e7eb'}`,
                  background: filtro===a?'#1a6b52':'#fff', color: filtro===a?'#fff':'#6b7280',
                  textTransform: 'capitalize',
                }}>{a}</button>
              ))}
            </div>

            <div style={{ borderRadius: 10, border: '1px solid rgba(0,0,0,.07)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['CADOC','Documento','Responsável','Periodicidade','Arquivo','Prazo','Status'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 9.5, fontWeight: 700, color: '#6b7280', letterSpacing: '.5px', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrado.map((c, i) => {
                    const st = statusInfo(c.diasRestantes)
                    return (
                      <tr key={c.cod+i} style={{ borderTop: '1px solid #f9fafb', borderLeft: `3px solid ${st.leftC}` }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 800, fontSize: 12, color: st.leftC }}>{c.cod}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#111827' }}>{c.nome}</td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: '#6b7280' }}>{c.quem}</td>
                        <td style={{ padding: '10px 14px', fontSize: 10.5, fontFamily: 'monospace', color: '#6b7280', textTransform: 'capitalize' }}>{c.per}</td>
                        <td style={{ padding: '10px 14px', fontSize: 10.5, fontFamily: 'monospace', color: '#6b7280' }}>{c.arq}</td>
                        <td style={{ padding: '10px 14px', fontSize: 10.5, fontFamily: 'monospace', color: '#374151', whiteSpace: 'nowrap' }}>{c.prazoLabel}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {st.label}
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
      </div>
    </div>
  )
}
