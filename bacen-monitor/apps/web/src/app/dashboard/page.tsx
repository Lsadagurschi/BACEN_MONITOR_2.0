export default function DashboardPage() {
  return (
    <div style={{ padding:'32px 36px' }}>
      <h1 style={{ fontSize:24, fontWeight:800, color:'#0a0f1e', marginBottom:8 }}>
        Dashboard Executivo
      </h1>
      <p style={{ fontSize:14, color:'#6b7280', marginBottom:32 }}>
        Visão geral da conformidade regulatória
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:32 }}>
        {[
          { label:'Status',        value:'🟢 OK',    color:'#22c55e' },
          { label:'Vencidos',      value:'0',        color:'#22c55e' },
          { label:'Urgentes ≤7d',  value:'0',        color:'#22c55e' },
          { label:'Jobs este mês', value:'0',        color:'#0891b2' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background:'#fff', border:'1px solid #d1c9b8', borderRadius:12, padding:20, borderTop:`3px solid ${kpi.color}` }}>
            <div style={{ fontSize:22, fontWeight:900, color:kpi.color, fontFamily:'Courier New' }}>{kpi.value}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'#fff', border:'1px solid #d1c9b8', borderRadius:12, padding:32, textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:12 }}>🏦</div>
        <div style={{ fontSize:16, fontWeight:700, color:'#0a0f1e', marginBottom:8 }}>BACEN Monitor está no ar!</div>
        <div style={{ fontSize:14, color:'#6b7280', lineHeight:1.7, maxWidth:480, margin:'0 auto' }}>
          Plataforma RegTech para geração e validação de CADOCs regulatórios.<br/>
          Configure sua instituição em <strong>Configurações</strong> para começar.
        </div>
      </div>
    </div>
  )
}
